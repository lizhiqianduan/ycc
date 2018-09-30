/**
 * @file    Ycc.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description  Ycc.class文件
 *
 */




(function (win) {
	
	/**
	 * 应用启动入口类，每个实例都与一个canvas绑定。
	 * 该canvas元素会被添加至HTML结构中，作为应用的显示舞台。
	 * @param config {Object} 整个ycc的配置项
	 * @param config.debug.drawContainer {Boolean} 是否显示所有UI的容纳区域
	 * @constructor
	 */
	win.Ycc = function Ycc(config){
		
		/**
		 * canvas的Dom对象
		 */
		this.canvasDom = null;
		
		/**
		 * 绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = null;
		
		/**
		 * Layer对象数组。包含所有的图层
		 * @type {Array}
		 */
		this.layerList = [];

		/**
		 * 实例的快照管理模块
		 * @type {Ycc.PhotoManager}
		 */
		this.photoManager = null;
		
		/**
		 * ycc的图层管理器
		 * @type {null}
		 */
		this.layerManager = null;
		
		/**
		 * 系统心跳管理器
		 */
		this.ticker = null;
		
		/**
		 * 资源加载器
		 * @type {Ycc.Loader}
		 */
		this.loader = new Ycc.Loader();
		
		/**
		 * 基础绘图UI。这些绘图操作会直接作用于舞台。
		 * @type {Ycc.UI}
		 */
		this.baseUI = null;
		
		/**
		 * 整个ycc的配置项
		 * @type {*|{}}
		 */
		this.config = config || {
			debug:{
				drawContainer:false
			}
		};
		
		/**
		 * 是否移动端
		 * @type {boolean}
		 */
		this.isMobile = Ycc.utils.isMobile();
	};
	
	/**
	 * 获取舞台的宽
	 */
	win.Ycc.prototype.getStageWidth = function () {
		return this.ctx.canvas.width;
	};
	
	/**
	 * 获取舞台的高
	 */
	win.Ycc.prototype.getStageHeight = function () {
		return this.ctx.canvas.height;
	};
	
	/**
	 * 绑定canvas元素，一个canvas绑定一个ycc实例
	 * @param canvasDom		canvas的HTML元素。即，显示舞台
	 */
	win.Ycc.prototype.bindCanvas = function (canvasDom) {
		canvasDom._ycc = this;
		
		this.canvasDom = canvasDom;
		
		this.ctx = this.canvasDom.getContext("2d");
		
		this.layerList = [];
		
		this.photoManager = new Ycc.PhotoManager(this);
		
		this.layerManager = new Ycc.LayerManager(this);
		
		this.ticker = new Ycc.Ticker(this);
		
		this.baseUI = new Ycc.UI(this.ctx.canvas);
		
		this.init();
		
		return this;
	};
	
	/**
	 * 类初始化
	 */
	win.Ycc.prototype.init = function () {
		
		this._initStageGestureEvent();
	};
	
	/**
	 *
	 * 需求实现：初始化舞台的手势事件监听器
	 * 1、事件传递给所有图层
	 * 2、事件传递给最上层UI
	 * 3、pc端和移动端统一，pc端视为一个触摸点，而移动端可以存在多个触摸点
	 * 4、dragging、dragend事件，的最上层UI为dragstart时所指的UI
	 * 5、所有鼠标事件均由舞台转发，转发的坐标均为绝对坐标。
	 * 	`layer`和`ui`可以调用各自的`transformToLocal`方法，将绝对坐标转换为自己的相对坐标。
	 *
	 * @private
	 */
	win.Ycc.prototype._initStageGestureEvent = function () {
		var self = this;
		// 鼠标/触摸点开始拖拽时，所指向的UI对象，只用于单个触摸点的情况
		var dragstartUI = null;
		var gesture = new Ycc.Gesture({target:this.ctx.canvas});
		gesture.addListener('tap',gestureListener);
		gesture.addListener('longtap',gestureListener);
		gesture.addListener('doubletap',gestureListener);
		gesture.addListener('swipeleft',gestureListener);
		gesture.addListener('swiperight',gestureListener);
		gesture.addListener('swipeup',gestureListener);
		gesture.addListener('swipedown',gestureListener);
		gesture.addListener('dragstart',dragstartListener);
		gesture.addListener('dragging',draggingListener);
		gesture.addListener('dragend',dragendListener);
		
		
		function dragstartListener(e) {
			// 在canvas中的绝对位置
			var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
				y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
			
			dragstartUI = self.getUIFromPointer(new Ycc.Math.Dot(x,y));
			triggerLayerEvent(e.type,x,y);
			dragstartUI&&dragstartUI.belongTo.enableEventManager&&triggerUIEvent(e.type,x,y,dragstartUI);
		}
		function draggingListener(e) {
			// 在canvas中的绝对位置
			var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
				y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
			
			triggerLayerEvent(e.type,x,y);
			dragstartUI&&dragstartUI.belongTo.enableEventManager&&triggerUIEvent(e.type,x,y,dragstartUI);
		}
		function dragendListener(e) {
			// 在canvas中的绝对位置
			var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
				y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
			
			triggerLayerEvent(e.type,x,y);
			dragstartUI&&dragstartUI.belongTo.enableEventManager&&triggerUIEvent(e.type,x,y,dragstartUI);
			dragstartUI = null;
		}
		
		// 通用监听
		function gestureListener(e) {
			// console.log(e);
			// 在canvas中的绝对位置
			var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
				y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
			
			var ui = self.getUIFromPointer(new Ycc.Math.Dot(x,y));
			triggerLayerEvent(e.type,x,y);
			ui&&ui.belongTo.enableEventManager&&triggerUIEvent(e.type,x,y,ui);
		}
		
		function triggerLayerEvent(type,x,y){
			for(var i=self.layerList.length-1;i>=0;i--){
				var layer = self.layerList[i];
				if(!layer.enableEventManager) continue;
				layer.enableEventManager&&layer.triggerListener(type,new Ycc.Event({
					type:type,
					x:x,
					y:y
				}));
			}
		}
		
		function triggerUIEvent(type,x,y,ui){
			ui.triggerListener(type,new Ycc.Event({
				x:x,
				y:y,
				type:type,
				target:ui
			}));
		}
		
	};
	
	
	/**
	 * 清除
	 */
	win.Ycc.prototype.clearStage = function () {
		this.ctx.clearRect(0,0,this.getStageWidth(),this.getStageHeight());
	};
	
	
	/**
	 * 根据id查找图层
	 * @param id 图层id
	 * @return {Ycc.Layer}
	 */
	win.Ycc.prototype.findLayerById = function (id) {
		for(var i =0;i<this.layerList.length;i++){
			var layer = this.layerList[i];
			if(layer.id===id)
				return layer;
		}
		return null;
	};
	
	/**
	 * 根据id查找UI
	 * @param id UI的id
	 * @return {Ycc.UI}
	 */
	win.Ycc.prototype.findUiById = function (id) {
		for(var i =0;i<this.layerList.length;i++){
			var layer = this.layerList[i];
			for(var j=0;j<layer.uiList.length;j++){
				var ui = layer.uiList[j];
				if(ui.id===id)
					return ui;
			}
		}
		return null;
	};
	
	/**
	 * 获取舞台中某个点所对应的最上层UI。
	 * @param dot {Ycc.Math.Dot}	点坐标，为舞台的绝对坐标
	 * @param uiIsShow {Boolean}	是否只获取显示在舞台上的UI，默认为true
	 * @return {UI}
	 */
	win.Ycc.prototype.getUIFromPointer = function (dot,uiIsShow) {
		var self = this;
		uiIsShow = Ycc.utils.isBoolean(uiIsShow)?uiIsShow:true;
		// 从最末一个图层开始寻找
		for(var j=self.layerList.length-1;j>=0;j--){
			var layer = self.layerList[j];
			if(uiIsShow&&!layer.show) continue;
			var ui = layer.getUIFromPointer(dot,uiIsShow);
			if(ui)
				return ui;
		}
		return null;
	};
})(window);