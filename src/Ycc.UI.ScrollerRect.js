/**
 * @file    Ycc.UI.ScrollerRect.class.js
 * @author  xiaohei
 * @date    2019/11/19
 * @description  Ycc.UI.ScrollerRect.class文件
 * 滚动区域UI
 */



(function (Ycc) {

    /**
     * 滚动区域UI
     * @param option	            {object}		所有可配置的配置项
	 * @param option.rect	        {Ycc.Math.Rect}	容纳区。
	 * @param option.selfRender	    {Boolean}	    是否自身实时渲染
     * @constructor
     * @extends Ycc.UI.Polygon
     */
    Ycc.UI.ScrollerRect = function ScrollerRect(option) {
        Ycc.UI.Polygon.call(this,option);
        this.yccClass = Ycc.UI.ScrollerRect;
	
		/**
         * 是否自身实时渲染，启用后，会实时重绘整个画布
		 * @type {boolean}
		 */
		this.selfRender = false;
        
        this.extend(option);
        
        this._init();
    };
    // 继承prototype
    Ycc.utils.mergeObject(Ycc.UI.ScrollerRect.prototype,Ycc.UI.Polygon.prototype);


    /**
     * 计算UI的各种属性。此操作必须在绘制之前调用。
     * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
     * @override
     */
    Ycc.UI.ScrollerRect.prototype.computeUIProps = function () {
        // 计算多边形坐标
        this.coordinates = this.rect.getVertices();
        // 赋值位置信息
        this.x = this.rect.x,this.y=this.rect.y;

        // this._setCtxProps(this);
    };


    /**
     * 绘制
     */
    Ycc.UI.ScrollerRect.prototype.render = function (ctx) {
        var self = this;
        // ctx = ctx || self.ctxCache;
        // if(!ctx){
        //     console.error("[Ycc error]:","ctx is null !");
        //     return;
        // }

        console.log('不需要更新渲染');
        // ctx.save();
        // this.renderPath(ctx);
        // ctx.restore();
    };
	
	/**
     * 初始化
	 * @private
	 */
	Ycc.UI.ScrollerRect.prototype._init = function () {
	    
	    //拖动开始时的状态
	    var startStatus = {
	        rect:null,
            startEvent:null
        };
        this.addEventListener('dragstart',function (e) {
           console.log(e);
           startStatus.startEvent = e;
           startStatus.rect = new Ycc.Math.Rect(this.rect);
		});
        
        this.addListener('dragging',function (e) {
			var deltaX = e.x-startStatus.startEvent.x;
			var deltaY = e.y-startStatus.startEvent.y;
            this.rect.y = startStatus.rect.y+deltaY;
            if(this.selfRender)
                this.ycc.layerManager.reRenderAllLayerToStage();
		});
	};



})(Ycc);