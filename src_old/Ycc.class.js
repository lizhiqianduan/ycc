/**
 * @file    Ycc.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description  Ycc.class文件
 *
 */

/**
 * 应用启动入口类，每个实例都与一个canvas绑定。
 * 该canvas元素会被添加至HTML结构中，作为应用的显示舞台。
 * @param config {Object} 整个ycc的配置项
 * @param config.appenv {String} 整个应用所运行的环境 默认：h5 <br> h5-普通web应用、wxapp-微信小程序、wxgame-微信小游戏
 * @param config.debugDrawContainer {Boolean} 是否显示所有UI的容纳区域
 * 若开启，所有UI都会创建一个属于自己的离屏canvas，大小与舞台一致
 * @constructor
 */
var Ycc = function Ycc(config){
	
	/**
	 * 绘图环境
	 * @type {CanvasRenderingContext2D}
	 */
	this.ctx = null;
	
	/**
	 * 与ycc绑定的canvas元素
	 * @type {null}
	 */
	this.canvasDom = null;
	
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
	 * 调试模块
	 * @type {null}
	 */
	this.debugger = null;
	
	/**
	 * 资源加载器
	 * @type {Ycc.Loader}
	 */
	this.loader = new Ycc.Loader(this);
	
	/**
	 * 异步请求的封装
	 * @type {Ycc.Ajax}
	 */
	this.ajax = new Ycc.Ajax();
	
	/**
	 * 基础绘图UI。这些绘图操作会直接作用于舞台。
	 * @type {Ycc.UI}
	 */
	this.baseUI = null;

	/**
	 * 系统的手势模块
	 * @type {null}
	 */
	this.gesture = null;

	/**
	 * 整个ycc的配置项
	 * @type {{debugDrawContainer:boolean}}
	 */
	this.config = Ycc.utils.extend({
		debugDrawContainer:false,
		appenv:'h5'
	},config||{});
	
	/**
	 * 是否移动端
	 * @type {boolean}
	 */
	this.isMobile = Ycc.utils.isMobile();
	
	this.stageW = 0;
	
	this.stageH = 0;
	
	/**
	 * dpi
	 * @type {number}
	 */
	this.dpi = this.getSystemInfo().devicePixelRatio;
};

/**
 * 获取舞台的宽
 */
Ycc.prototype.getStageWidth = function () {
	return this.canvasDom.width;
};

/**
 * 获取舞台的高
 */
Ycc.prototype.getStageHeight = function () {
	return this.canvasDom.height;
};

/**
 * 绑定canvas元素，一个canvas绑定一个ycc实例
 * @param canvas
 * @return {Ycc}
 */
Ycc.prototype.bindCanvas = function (canvas) {
	
	this.canvasDom = canvas;
	
	this.ctx = canvas.getContext('2d');
	// 适配wxapp 默认返回{left:0,top:0} @todo 待优化
	this.ctx.canvas.getBoundingClientRect = this.ctx.canvas.getBoundingClientRect?this.ctx.canvas.getBoundingClientRect:function(){return{left:0,top:0}};
	
	this.layerList = [];
	
	this.photoManager = new Ycc.PhotoManager(this);
	
	this.layerManager = new Ycc.LayerManager(this);
	
	this.ticker = new Ycc.Ticker(this);
	
	this.debugger = new Ycc.Debugger(this);
	
	this.baseUI = new Ycc.UI(this);

	this.init();
	
	return this;
};

/**
 * 类初始化
 */
Ycc.prototype.init = function () {
	//初始化手势库
	this._initStageGestureEvent();
	// 心跳模块初始化 ticker默认启动，10帧每刷新
	this.ticker.start(6);
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
Ycc.prototype._initStageGestureEvent = function () {
	var self = this;
	// 鼠标/触摸点开始拖拽时，所指向的UI对象，只用于单个触摸点的情况
	//var dragstartUI = null;
	// 鼠标/触摸点开始拖拽时，所指向的UI对象map，用于多个触摸点的情况
	var dragstartUIMap = {};
	// 拖拽时的上一个坐标，用于判断是否下发dragging事件
	var draggingLastXY = '';

	var gesture = new Ycc.Gesture({target:this.ctx.canvas});
	this.gesture = gesture;
	gesture.addListener('tap',gestureListener);
	gesture.addListener('longtap',gestureListener);
	gesture.addListener('doubletap',gestureListener);
	gesture.addListener('swipe',gestureListener);
	gesture.addListener('swipeleft',gestureListener);
	gesture.addListener('swiperight',gestureListener);
	gesture.addListener('swipeup',gestureListener);
	gesture.addListener('swipedown',gestureListener);
	gesture.addListener('dragstart',dragstartListener);
	gesture.addListener('dragging',draggingListener);
	gesture.addListener('dragend',dragendListener);
	
	// PC端专属事件
	gesture.addListener('mousemove',gestureListener);
	
	
	function dragstartListener(e) {
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		// 重置位置
		draggingLastXY = '';
		var dragstartUI = self.getUIFromPointer(new Ycc.Math.Dot(x,y));
		if(dragstartUI){
			dragstartUIMap[e.identifier]=dragstartUI;
			dragstartUI.triggerUIEventBubbleUp(e.type,x,y);
		}
		// dragstartUI&&dragstartUI.belongTo.enableEventManager&&triggerUIEvent(e.type,x,y,dragstartUI);
		triggerLayerEvent(e.type,x,y);
	}
	function draggingListener(e) {
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		// 位置在一个像素内，不下发dragging事件
		if(draggingLastXY===x+'_'+y) return;

		draggingLastXY = x+'_'+y;
		var dragstartUI = dragstartUIMap[e.identifier];
		if(dragstartUI){
			dragstartUIMap[e.identifier]=dragstartUI;
			dragstartUI.triggerUIEventBubbleUp(e.type,x,y);
		}
		triggerLayerEvent(e.type,x,y);
	}
	function dragendListener(e) {
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		
		var dragstartUI = dragstartUIMap[e.identifier];
		if(dragstartUI){
			dragstartUIMap[e.identifier]=dragstartUI;
			dragstartUI.triggerUIEventBubbleUp(e.type,x,y);
			dragstartUI = null;
			dragstartUIMap[e.identifier]=null;
		}
		triggerLayerEvent(e.type,x,y);
	}
	
	// 通用监听
	function gestureListener(e) {
		// console.log('通用监听',e);
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		
		var ui = self.getUIFromPointer(new Ycc.Math.Dot(x,y));
		// triggerLayerEvent(e.type,x,y);
		// ui&&ui.belongTo.enableEventManager&&triggerUIEvent(e.type,x,y,ui);
		if(ui){
			ui.triggerUIEventBubbleUp(e.type,x,y,e);
		}
		triggerLayerEvent(e.type,x,y);
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
	
	/**
	 * 冒泡触发UI的事件
	 * @param type
	 * @param x
	 * @param y
	 * @param ui
	 * @return {null}
	 */
	// function triggerUIEventBubbleUp(type,x,y,ui) {
	// 	if(ui && ui.belongTo && ui.belongTo.enableEventManager){
	// 		// 触发ui的事件
	// 		ui.triggerListener(type,new Ycc.Event({x:x,y:y,type:type,target:ui}));
	//
	// 		// 如果ui阻止了事件冒泡，则不触发其父级的事件
	// 		if(ui.stopEventBubbleUp) return;
	//
	// 		// 触发父级ui的事件
	// 		ui.getParentList().reverse().forEach(function (fa) {
	// 			fa.triggerListener(type,new Ycc.Event({x:x,y:y,type:type,target:fa}));
	// 		});
	// 	}
	// }
	
};


/**
 * 清除
 */
Ycc.prototype.clearStage = function () {
	this.ctx.clearRect(0,0,this.getStageWidth(),this.getStageHeight());
};


/**
 * 根据id查找图层
 * @param id 图层id
 * @return {Ycc.Layer}
 */
Ycc.prototype.findLayerById = function (id) {
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
Ycc.prototype.findUiById = function (id) {
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
Ycc.prototype.getUIFromPointer = function (dot,uiIsShow) {
	var self = this;
	uiIsShow = Ycc.utils.isBoolean(uiIsShow)?uiIsShow:true;
	// 从最末一个图层开始寻找
	for(var j=self.layerList.length-1;j>=0;j--){
		var layer = self.layerList[j];
		// 幽灵图层，直接跳过
		if(layer.ghost) continue;
		if(uiIsShow&&!layer.show) continue;
		var ui = layer.getUIFromPointer(dot,uiIsShow);
		if(ui)
			return ui;
	}
	return null;
};

/**
 * 获取舞台中某个点所对应的最上层UI，不遍历不可见图层
 * 默认取可见且不是幽灵的UI
 * @param dot 					{Ycc.Math.Dot}	点坐标，为舞台的绝对坐标
 * @param options 				{object}	点坐标，为舞台的绝对坐标
 * @param options.uiIsShow 		{boolean}	UI是否可见
 * @param options.uiIsGhost 	{boolean}	UI是否未幽灵
 * @return {Ycc.UI[]} 			返回找到的UI列表，图层越靠后图层内的UI越靠前
 */
Ycc.prototype.getUIListFromPointer = function (dot,options) {
	var self = this;
	options = options || {
		uiIsShow:true,
		uiIsGhost:false
	};
	var uiList = [];
	// 从最末一个图层开始寻找
	for(var j=self.layerList.length-1;j>=0;j--){
		var layer = self.layerList[j];
		//
		if(!layer.show) continue;
		var list = layer.getUIListFromPointer(dot);
		uiList = uiList.concat(list);
	}
	uiList = uiList.filter(function(item){return (item.show===options.uiIsShow)&&(item.ghost===options.uiIsGhost);});
	return uiList;

};

/**
 * 创建canvas，只针对H5端。微信小游戏的canvas为全局变量，直接使用即可
 * @example
 * var ycc = new Ycc();
 * var stage = canvas || ycc.createCanvas();
 * ycc.bindCanvas(stage);
 *
 * @param options
 * @param options.canvasDom 传入canvasDom
 * @param options.width
 * @param options.height
 * @param options.dpiAdaptation		是否根据dpi适配canvas大小
 * @return {*}	已创建的canvas元素
 */
Ycc.prototype.createCanvas = function (options) {
	options = options||{};
	var option = Ycc.utils.mergeObject({
		width:this.getSystemInfo().windowWidth,
		height:this.getSystemInfo().windowHeight,
		dpiAdaptation:false,
		canvasDom:null
	},options);
	var canvas = option.canvasDom || document.createElement("canvas");
	var dpi = this.getSystemInfo().devicePixelRatio;
	if(option.dpiAdaptation){
		canvas.width = option.width*dpi;
		canvas.height = option.height*dpi;
		if(canvas.style) canvas.style.width=option.width+'px';
	}else{
		canvas.width = option.width;
		canvas.height = option.height;
	}
	// 去除5px inline-block偏差
	if(canvas.style) canvas.style.display='block';
	return canvas;
};

/**
 * 获取系统信息
 * @return {{model: string, pixelRatio: number, windowWidth: number, windowHeight: number, system: string, language: string, version: string, screenWidth: number, screenHeight: number, SDKVersion: string, brand: string, fontSizeSetting: number, benchmarkLevel: number, batteryLevel: number, statusBarHeight: number, safeArea: {right: number, bottom: number, left: number, top: number, width: number, height: number}, platform: string, devicePixelRatio: number}}
 */
Ycc.prototype.getSystemInfo = function () {
	return {
		"model":"iPhone 5",
		"pixelRatio":window.devicePixelRatio||1,
		"windowWidth":window.innerWidth,
		"windowHeight":window.innerHeight,
		"screenWidth":320,
		"screenHeight":568,
		"devicePixelRatio":window.devicePixelRatio||1
	};
};

/**
 * 创建一个离屏的绘图空间，默认大小与舞台等同
 * @param options
 * @param options.width
 * @param options.height
 */
Ycc.prototype.createCacheCtx = function (options) {
	options = options || {
		width:this.getStageWidth(),
		height:this.getStageHeight()
	};
	var ctxCache = this.createCanvas({
		width:options.width,
		height:options.height
	}).getContext('2d');

	// debug
	// console.log('create cache ctx',options);
	document.body.appendChild(ctxCache.canvas);
	return ctxCache;
};