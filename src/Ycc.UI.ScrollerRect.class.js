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
	
		/**
		 * 滚动区的UI容纳区，此区域用于容纳区域内的UI，不可编辑修改属性
		 * @type {Ycc.UI.Rect}
		 * @private
		 */
		this._wrapper = null;
	
		/**
		 * 滚动区的事件容纳区，此区域用于接收舞台的事件
		 * @type {Ycc.UI.Rect}
		 * @private
		 */
		this._eventWrapper = null;
	
		/**
		 * 初始化完成的回调
		 * @override
		 * @private
		 */
		this._afterInit = function () {
			this._initWrapperRect();
			this._initEvent();
		}
		
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
	 * 重载基类方法
	 * @param ui
	 */
	Ycc.UI.ScrollerRect.prototype.addChild = function (ui) {
		if(this.belongTo) ui.init(this.belongTo);

		// 将子UI加到容器中
		if(ui===this._wrapper||ui===this._eventWrapper)
			this.addChildTree(ui);
		else
			this._wrapper.addChildTree(ui);

		return this;
	};
	
	
	
	/**
     * 初始化
	 * @private
	 */
	Ycc.UI.ScrollerRect.prototype._initEvent = function () {
		
	    //拖动开始时的状态
	    var startStatus = {
	        rect:null,
            startEvent:null,
			// 子元素顶点
			childrenPoints:[]
        };
	    console.log('init event',this);
        this.addListener('dragstart',function (e) {
           console.log(e);
           startStatus.startEvent = e;
           startStatus.rect = new Ycc.Math.Rect(this.rect);
		});
        
        this.addListener('dragging',function (e) {
			var deltaX = e.x-startStatus.startEvent.x;
			var deltaY = e.y-startStatus.startEvent.y;
			
			// this.children.
			
			
            // this.rect.y = startStatus.rect.y+deltaY;
            this._wrapper.rect.y = startStatus.rect.y+deltaY;
            if(this.selfRender)
                this.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
		});
	};
	
	/**
	 * 创建一个容器方块
	 * @private
	 */
	Ycc.UI.ScrollerRect.prototype._initWrapperRect = function () {
		this._wrapper = new Ycc.UI.Rect({name:'滚动区UI容器',rect:new Ycc.Math.Rect(0,0,this.rect.width,this.rect.height),ghost:true});
		this._eventWrapper = new Ycc.UI.Rect({name:'滚动区事件容器',rect:new Ycc.Math.Rect(0,0,this.rect.width,this.rect.height),ghost:false,stopEventBubbleUp:false});
		this._wrapper.ontap = console.log;
		this._eventWrapper.ontap = console.log;
		this.addChild(this._wrapper);
		this.addChild(this._eventWrapper);
	};
	
})(Ycc);