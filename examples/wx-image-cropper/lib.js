/**
 * 裁剪类的封装
 * @requires {Ycc} 依赖Ycc库
 * @author xiaohei
 */
(function(Ycc){
    /**
     * 裁剪图片
     * @param {*} imageUrl 图片地址
     * @param {*} options 配置参数
     * @param {*} options.canvasDom canvas容器
     * @param {*} options.wrapW 可视区宽度
     * @param {*} options.wrapH 可视区高度
     * @param {*} options.cropW 裁剪区的高
     * @param {*} options.cropH 裁剪区高度
     * @param {*} options.callback 完成/取消裁剪的回调
     */
    function Cropper(imageUrl,options){
        // 默认参数
        options = Ycc.utils.extend({
            canvasDom:null,
            wrapW:800,
            wrapH:600,
            cropW:200,
            cropH:200,
            maskColor:'rgba(0,0,0,0.6)',
            callback: function(){}
        },options);

        this.options = options;
        this.imageUrl = imageUrl;
        this.ycc = new Ycc();
        this.ycc.bindCanvas(this.ycc.createCanvas({canvasDom:options.canvasDom,width:options.wrapW,height:options.wrapH,dpiAdaptation:true}));
        this.layer = this.ycc.layerManager.newLayer({enableEventManager:true});

        // 图片UI
        this.imageUI = null;


        this.init();
    }

    Cropper.prototype.init = function(){
        var that = this;
        this.ycc.loader.loadResOneByOne([{url:this.imageUrl}],function (resArr) {
            console.log("loaded!",this);
            that._onImageLoad(resArr[0]);
        },function (image,err,index) {
            console.log('progress',index,image);
        });

        this.ycc.ticker.addFrameListener(function(){
            that.ycc.layerManager.reRenderAllLayerToStage();
        })

        this.ycc.ticker.start(60);
    }

    Cropper.prototype._onImageLoad = function(image){
        this._addImage(image);
        this._addCrop();
    }

    Cropper.prototype._addCrop = function(){
        // var ycc = this.ycc;
        var layer = this.layer;
        layer.addUI(new Ycc.UI.Rect({
            rect:new Ycc.Math.Rect(0,0,this.options.wrapW,this.options.wrapH/2-this.options.cropH/2+1),
            color:this.options.maskColor,
            ghost:true,
        }));

        layer.addUI(new Ycc.UI.Rect({
            rect:new Ycc.Math.Rect(0,this.options.wrapH-(this.options.wrapH/2-this.options.cropH/2)-1,this.options.wrapW,this.options.wrapH/2-this.options.cropH/2),
            color:this.options.maskColor,
            ghost:true,
        }));

        layer.addUI(new Ycc.UI.Rect({
            rect:new Ycc.Math.Rect(0,this.options.wrapH/2-this.options.cropH/2,this.options.wrapW/2-this.options.cropW/2,this.options.cropH),
            color:this.options.maskColor,
            ghost:true,
        }));
        layer.addUI(new Ycc.UI.Rect({
            rect:new Ycc.Math.Rect(this.options.wrapW-(this.options.wrapW/2-this.options.cropW/2),this.options.wrapH/2-this.options.cropH/2,this.options.wrapW/2-this.options.cropW/2,this.options.cropH),
            color:this.options.maskColor,
            ghost:true,
        }));

        // 边框
        layer.addUI(new Ycc.UI.Rect({
            rect:new Ycc.Math.Rect((this.options.wrapW/2-this.options.cropW/2),this.options.wrapH/2-this.options.cropH/2,this.options.cropW,this.options.cropH),
            rectBorderWidth:4,
            rectBorderColor:'#ccc',
            color:'transparent',
            ghost:true,
        }));

        // layer.addUI(new Ycc.UI.Rect({
        //     rect:new Ycc.Math.Rect(0,0,100,100),
        //     color:'rgba(255,0,0,0.1)',
        //     ghost:true
        // }));
    }


    // 添加图片
    Cropper.prototype._addImage = function(image){
        var ycc = this.ycc;
        var cropper = this;


        var ratioW = image.res.width/this.options.wrapW;
        var ratioH = image.res.height/this.options.wrapH;

        var scaleRatio = 1;
        var imageRect = null;
        if(ratioW<ratioH){
            scaleRatio = ratioH;
            imageRect = new Ycc.Math.Rect((this.options.wrapW-image.res.width/scaleRatio)/2,0,image.res.width/scaleRatio,image.res.height/scaleRatio);
        }else{
            scaleRatio = ratioW;
            imageRect = new Ycc.Math.Rect(0,(this.options.wrapH-image.res.height/scaleRatio)/2,image.res.width/scaleRatio,image.res.height/scaleRatio);
        }

        console.log('scaleRatio',scaleRatio,ratioW<ratioH)
        this.imageUI = new Ycc.UI.Image({
            rect:imageRect,
            fillMode:'scale',
            res:image.res,
            ondragging:function(e) {
                if(this.belongTo.yccInstance.gesture.ismutiltouching) return;
                if(!this.userData) return;

                console.log("我是",this.yccClass.name,"我",e.type,e);
                var startPos = this.userData.startPos;
                var startRect = this.userData.startRect;
                let deltaX = (e.x-startPos.x);
                let deltaY = (e.y-startPos.y);
                this.rect.x = startRect.x+deltaX;
                this.rect.y = startRect.y+deltaY;
            },
            ondragstart:function(e) {
                this.userData = {
                    startPos:new Ycc.Math.Dot(e),
                    startRect:new Ycc.Math.Rect(this.rect)
                }
            }
        });
        // 添加图片至图层
        this.layer.addUI(this.imageUI);

        // 缩放前的临时区域
        var tempRect = null;
        this.ycc.gesture.onmultistart = function(e){
            // alert(11111);
            tempRect = new Ycc.Math.Rect(cropper.imageUI.rect); 
            // 将userdata设置成null 阻止缩放后立即响应拖拽
            cropper.imageUI.userData = null;
        };
        // 绑定缩放事件
        this.ycc.gesture.onzoom = function(e){
            // alert('zoom '+e.zoomRate);
            var rate = e.zoomRate;
            imageRect.width = tempRect.width*rate;
            imageRect.height =tempRect.height*rate;

            imageRect.x = tempRect.x-(imageRect.width-tempRect.width)/2;
            imageRect.y = tempRect.y-(imageRect.height-tempRect.height)/2;
        };
    
    }


    Cropper.prototype.getCropImage = function(){
        var ycc = this.ycc;
        return ycc.ctx.getImageData((this.options.wrapW/2-this.options.cropW/2),this.options.wrapH/2-this.options.cropH/2,this.options.cropW,this.options.cropH)
    }






    ;if(typeof exports==="object"&&typeof module!=="undefined"){
        module.exports=moduleRequire;
    }else if(typeof define==="function"){
        define("Cropper",moduleRequire)
    }else{
        var g;
        if(typeof window!=="undefined"){g=window}
        else if(typeof global!=="undefined"){g=global}
        else if(typeof self!=="undefined"){g=self}
        else{g=this}
        g.Cropper = moduleRequire;
    }

    // 依赖项函数
    function moduleRequire(_Ycc){
        Ycc = _Ycc;
        return Cropper;
    }
}())



