
/**
 * 裁剪图片
 * @param {*} imageUrl 图片地址
 * @param {*} options 配置参数
 * @param {*} options.wrapW 可视区宽度
 * @param {*} options.wrapH 可视区高度
 * @param {*} options.callback 完成/取消裁剪的回调
 */
function Cropper(imageUrl,options){
    // 默认参数
    options = Ycc.utils.extend({
        wrapW:800,
        wrapH:600,
        callback: function(){}
    },options);

    this.options = options;
    this.imageUrl = imageUrl;
    this.ycc = new Ycc();
    this.ycc.bindCanvas(this.ycc.createCanvas({width:options.wrapW,height:options.wrapH,dpiAdaptation:true}));
    this.layer = this.ycc.layerManager.newLayer({enableEventManager:true});

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
    var ycc = this.ycc;


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
    // scaleRatio = 5;
	// 添加图片至图层
    this.layer.addUI(new Ycc.UI.Image({
        rect:imageRect,
        fillMode:'scale',
        res:image.res,
        ondragging,
        ondragstart        
    }));

    this.ycc.gesture.onzoom = onzoom;
    
    var initRect = new Ycc.Math.Rect(imageRect); 
    function onzoom(e,rate){
        // console.log(e);
        if(rate<1) rate = 1;
        imageRect.width = initRect.width*rate;
        imageRect.height = initRect.height*rate;
    }
}





function ondragstart(e) {
    this.userData = {
        startPos:new Ycc.Math.Dot(e),
        startRect:new Ycc.Math.Rect(this.rect)
    }
};
function ondragging(e) {
    if(this.belongTo.yccInstance.gesture.ismutiltouching) return;
    console.log("我是",this.yccClass.name,"我",e.type,e);
    var startPos = this.userData.startPos;
    var startRect = this.userData.startRect;
    let deltaX = (e.x-startPos.x);
    let deltaY = (e.y-startPos.y);
    this.rect.x = startRect.x+deltaX;
    this.rect.y = startRect.y+deltaY;
};


window.onerror = function(e){
    alert('onerror',e.message);
}