/**
 * @file    Ycc.UI.ScrollerView.class.js
 * @author  xiaohei
 * @date    2019/11/28
 * @description  Ycc.UI.ScrollerView.class文件
 */


(function (Ycc) {
	
	/**
	 * 滚动区域UI
	 * 此UI只能为顶级UI
	 * ctx.clip()在微信小游戏有很严重的性能问题，此滚动区采用离屏canvas实现
	 * @param option                {object}        所有可配置的配置项
	 * @param option.rect            {Ycc.Math.Rect}    容纳区。
	 * @param option.selfRender        {Boolean}        是否自身实时渲染
	 * @param option.contentW        {number}        滚动内容的宽
	 * @param option.contentH        {number}        滚动内容的高
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.ScrollerView = function ScrollerView(option) {
		Ycc.UI.Polygon.call(this, option);
		this.yccClass = Ycc.UI.ScrollerView;
		
		/**
		 * 滚动内容的宽
		 * @type {number}
		 */
		this.contentW = 0;
		
		/**
		 * 滚动内容的高
		 * @type {number}
		 */
		this.contentH = 0;
		
		/**
		 * 是否启用swipe滑动事件
		 * @type {boolean}
		 */
		this.enableSwipe = true;
		/**
		 * 滑动事件持续的帧数
		 * @type {number}
		 */
		this.swipeFrameCount = 10;
		
		/**
		 * 滑动事件加速度
		 * @type {number}
		 */
		this.swipeAcceleration = 0.5;
		/**
		 * 滑动事件初始速度
		 * 满足公式 s = (swipeInitSpeed - swipeFrameCount)*swipeFrameCount
		 * @type {number}
		 */
		this.swipeInitSpeed = 20;
		/**
		 * 拖拽中是否重绘
		 * @type {boolean}
		 */
		this.selfRender = false;
		
		/**
		 * 离屏canvas缓存图层
		 * @type {null}
		 * @private
		 */
		this._cacheLayer = null;
		
		/**
		 * UI的容纳区
		 * @type {null}
		 * @private
		 */
		this._uiWrapper = null;
		
		/**
		 * 绝对位置
		 * @type {null}
		 * @private
		 */
		this._absolutePosition = null;
		
		/**
		 * 滚动的x,y坐标
		 * @type {Ycc.Math.Dot}
		 */
		this.scrollerPosition = new Ycc.Math.Dot(0,0);
		
		/**
		 * 加入舞台后的回调
		 * @override
		 * @private
		 */
		this._onAdded = function () {
			this.computeUIProps();
			this._initCacheLayer();
			this._initEvent();
			this._absolutePosition = this.getAbsolutePositionRect();
		};
		/**
		 * 所有子UI渲染完毕后，渲染一次当前滚动区
		 * @private
		 */
		this._onChildrenRendered = function () {
			this._cacheLayer.updateCache();
			this.render();
		};
		
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.ScrollerView.prototype,Ycc.UI.Polygon.prototype);
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.ScrollerView.prototype.computeUIProps = function () {
		// 计算多边形坐标
		this.coordinates = this.rect.getVertices();
		// 赋值位置信息
		this.x = this.rect.x,this.y=this.rect.y;
		
	};
	
	
	/**
	 * 绘制
	 */
	Ycc.UI.ScrollerView.prototype.render = function (ctx) {
		var self = this;
		ctx = ctx || self.ctxCache;
		
		
		ctx.save();
		// todo 这里的每次绘制都强制更新缓存画布，并绘制整张画布，存在一定优化空间
		// this._cacheLayer.updateCache();
		// var drawRect = this.getAbsolutePositionRect();
		var drawRect = this._absolutePosition;
		ctx.drawImage(this._cacheLayer.ctxCache.canvas,-this.scrollerPosition.x,-this.scrollerPosition.y,this.rect.width*this.dpi,this.rect.height*this.dpi,drawRect.x*this.dpi,drawRect.y*this.dpi,drawRect.width*this.dpi,drawRect.height*this.dpi);
		ctx.restore();
	};
	
	/**
	 * 重载基类方法
	 * @param ui
	 */
	Ycc.UI.ScrollerView.prototype.addChild = function (ui) {
		if(this.belongTo) ui.init(this.belongTo);
		return this._uiWrapper.addChild(ui);
	};
	
	/**
	 * 初始化离屏canvas
	 * @private
	 */
	Ycc.UI.ScrollerView.prototype._initCacheLayer = function () {
		// var cacheH = this.contentH;
		this._cacheLayer = this.belongTo.yccInstance.layerManager.newLayer({name:'滚动区缓存图层',ghost:true,show:false,enableEventManager:true,useCache:true,width:this.contentW,height:this.contentH});
		
		this._uiWrapper = this._cacheLayer.addUI(new Ycc.UI.Rect({rect:new Ycc.Math.Rect(0,0,1,1)}));
		
		// 添加一个与滚动区等大的矩形
		// this._eventWrapper = this.belongTo.addUI(new Ycc.UI.Rect({rect:new Ycc.Math.Rect(this.rect),color:'blue',name:'事件矩形容纳区'}));
		
		// debug
		// this._cacheLayer.addUI(new Ycc.UI.Rect({rect:new Ycc.Math.Rect(this.rect),color:'pink',name:'test'}));
		
	};
	
	
	/**
	 * 初始化滚动区的事件
	 * @private
	 */
	Ycc.UI.ScrollerView.prototype._initEvent = function () {
		var self = this;
		var ycc = self.belongTo.yccInstance;
		var ticker = self.belongTo.yccInstance.ticker;
		var dpi = ycc.dpi;
		
		//拖动开始时UI容纳区的状态
		var startStatus = {
			//拖拽开始时，scrollerPosition的位置
			position:new Ycc.Math.Dot(0,0),
			//拖拽开始时，cacheLayer的x，y位置
			cacheLayerPosition:new Ycc.Math.Dot(0,0),
			startEvent:null
		};
		// 拖拽结束时UI容纳区的状态
		var endStatus = {
			//拖拽结束时，scrollerPosition的位置
			position:null,
			endEvent:null
		};
		

			
		// 监听tap事件，向wrapper内部UI传递
		this.addListener('tap',function (e) {
			var dot = new Ycc.Math.Dot(e.x-this.scrollerPosition.x/dpi-this._absolutePosition.x,e.y-this.scrollerPosition.y/dpi-this._absolutePosition.y);
			var ui = self._cacheLayer.getUIFromPointer(dot);
			// console.log('ui',ui,dot);
			
			ui&&ui.triggerUIEventBubbleUp('tap',dot.x,dot.y);
		});
		
		this.addListener('dragstart',function (e) {
			// console.log(e.type);
			startStatus.startEvent = e;
			startStatus.position = new Ycc.Math.Dot(self.scrollerPosition.x,self.scrollerPosition.y);
			startStatus.cacheLayerPosition = new Ycc.Math.Dot(self._cacheLayer.x,self._cacheLayer.y);
			
			// 若没启用ticker则启用
			if(!ticker._isRunning) ticker.start();
			// 拖拽
			ticker.addFrameListener(draggingListen);
		});
		
		this.addListener('dragging',function (e) {
			var deltaX = e.x-startStatus.startEvent.x;
			var deltaY = e.y-startStatus.startEvent.y;
			deltaX*=dpi;
			deltaY*=dpi;
			self.scrollerPosition.x = startStatus.position.x+deltaX;
			self.scrollerPosition.y = startStatus.position.y+deltaY;
			self._checkRangeLimit();
			
			// console.log('dragging',self._cacheLayer.x,self._cacheLayer.y);
		});
		
		this.addListener('dragend',function (e) {
			endStatus.endEvent = e;
			endStatus.position = new Ycc.Math.Dot(self.scrollerPosition.x,self.scrollerPosition.y);
			// console.log('dragend',self.selfRender,startStatus);
			//移除监听
			ticker.removeFrameListener(draggingListen);
		});
		
		//拖拽的监听函数，拖拽开始时加入，结束时移除
		function draggingListen(){
			// self._cacheLayer.updateCache();
			if(self.selfRender) self.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
		}
		
		// 监听swipe 暂不监听
		this.addListener('swipe',function (e) {
			if(!self.enableSwipe) return console.log('滚动区禁用swipe');
			// console.log('swipe',e);
			var dir = e.originEvent.swipeDirection;
			var dirMap = {left:-1,right:1,up:-1,down:1};
			
			// 初速度
			var v0 = self.swipeInitSpeed;
			// 动画执行的最大帧数
			var tMax = self.swipeFrameCount;
			// 当前帧移动的距离
			var delta = 0;
			// 帧数差
			var t0=0;
			
			ticker.addFrameListener(onFrameComing);
			function onFrameComing(){
				// 帧数差
				t0++;
				// 距离差
				delta = t0*(v0 - self.swipeAcceleration*t0);
				// console.log(t0,delta);
				
				if(t0 >= tMax || delta<=0){
					// 去除监听
					ticker.removeFrameListener(onFrameComing);
					return;
				}
				if(dir==='left'||dir==='right') self.scrollerPosition.x = endStatus.position.x+(dirMap[dir])*delta;
				if(dir==='up'||dir==='down') self.scrollerPosition.y = endStatus.position.y+(dirMap[dir])*delta;
				self._checkRangeLimit();
				
				// console.log('onFrameComing',self._cacheLayer.x,self._cacheLayer.y);
				
				// self._cacheLayer.updateCache();
				if(self.selfRender) self.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
			}
		});
	};
	
	
	/**
	 * 拖拽滚动极限值的校正
	 * @private
	 */
	Ycc.UI.ScrollerView.prototype._checkRangeLimit = function(){
		var self = this;
		// x、y坐标的极限值
		var maxX = self.contentW-self.rect.width;
		var maxY = self.contentH-self.rect.height;
		maxX*=this.dpi;
		maxY*=this.dpi;
		// x、y坐标不能大于0
		self.scrollerPosition.x = self.scrollerPosition.x>=0?0:self.scrollerPosition.x;
		self.scrollerPosition.y = self.scrollerPosition.y>=0?0:self.scrollerPosition.y;
		
		// x、y坐标不能小于极限值
		self.scrollerPosition.x = self.scrollerPosition.x<-maxX?-maxX:self.scrollerPosition.x;
		self.scrollerPosition.y = self.scrollerPosition.y<-maxY?-maxY:self.scrollerPosition.y;
		
		// 若内容没达到滚动的高宽，不能滚动
		if(self.contentW<=self.rect.width) self.scrollerPosition.x = 0;
		if(self.contentH<=self.rect.height) self.scrollerPosition.y = 0;
	}
	
})(Ycc);