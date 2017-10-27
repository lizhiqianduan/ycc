/**
 * @file    Ycc.Layer.class.js
 * @author  xiaohei
 * @date    2017/10/23
 * @description  Ycc.LayerManager.class文件
 */


(function (Ycc) {
	
	var layerIndex = 0;
	
	/**
	 * 图层类。
	 * 每新建一个图层，都会新建一个canvas元素。
	 * 每个图层都跟这个canvas元素绑定。
	 * @param yccInstance
	 * @param config
	 * @constructor
	 * @private
	 */
	function Layer(yccInstance,config){
		var defaultConfig = {
			name:"",
			type:"ui",
			width:yccInstance.ctxWidth,
			height:yccInstance.ctxHeight,
			show:true,
			enableEventManager:false,
			enableFrameEvent:false,
			update:function () {}
		};
		// 浅拷贝
		config = Ycc.utils.extend(defaultConfig,config);
		
		var canvasDom = document.createElement("canvas");
		canvasDom.width = config.width;
		canvasDom.height = config.height;
		
		/**
		 * 初始化配置项
		 */
		this.config = config;
		
		/**
		 * ycc实例的引用
		 */
		this.yccInstance = yccInstance;
		/**
		 * 虚拟canvas元素的引用
		 * @type {Element}
		 */
		this.canvasDom = canvasDom;
		
		/**
		 * 当前图层的绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = this.canvasDom.getContext('2d');
		
		/**
		 * 图层id
		 */
		this.id = layerIndex++;
		
		/**
		 * 图层类型。`ui`表示用于绘图的图层。`tool`表示辅助的工具图层。
		 * 默认为`ui`。
		 */
		this.type = config.type;

		/**
		 * 图层名称
		 * @type {string}
		 */
		this.name = config.name?config.name:"图层"+this.id;
		
		/**
		 * 图层宽
		 * @type {number}
		 */
		this.width = config.width;
		/**
		 * 图层高
		 * @type {number}
		 */
		this.height = config.height;
		/**
		 * 图层背景色
		 * @type {string}
		 */
		this.bgColor = config.bgColor;
		
		/**
		 * 图层是否显示
		 */
		this.show = config.show;
		
		/**
		 * 是否监听舞台的事件。用于控制舞台事件是否广播至图层。默认关闭
		 * @type {boolean}
		 */
		this.enableEventManager = config.enableEventManager;
		
		/**
		 * 是否接收每帧更新的通知
		 * @type {boolean}
		 */
		this.enableFrameEvent = config.enableFrameEvent;
		
		/**
		 * 若接收通知，此函数为接收通知的回调函数。当且仅当enableFrameEvent为true时生效
		 * @type {function}
		 */
		this.update = config.update;
		
		
		
		/**
		 * 实例的图形管理模块
		 * @type {Ycc.UI}
		 */
		this.ui = Ycc.UI?new Ycc.UI(this.canvasDom):null;
		
		/**
		 * 实例的事件管理模块
		 * @type {Ycc.EventManager}
		 */
		this.eventManager = Ycc.EventManager?new Ycc.EventManager(this.canvasDom):null;
		
	}
	
	Layer.prototype.init = function () {
	
	};
	
	/**
	 * 清除图层
	 */
	Layer.prototype.clear = function () {
		this.ctx.clearRect(0,0,this.width,this.height);
	};
	
	
	/**
	 * 渲染图层至舞台
	 */
	Layer.prototype.renderToStage = function () {
		if(this.show)
			this.yccInstance.ctx.drawImage(this.canvasDom,0,0,this.width,this.height);
	};
	
	
	
	
	
	/**
	 * Ycc的图层管理类。每个图层管理器都与一个canvas舞台绑定。
	 * @param yccInstance {Ycc}		ycc实例
	 * @constructor
	 */
	Ycc.LayerManager = function (yccInstance) {
		
		/**
		 * ycc实例
		 */
		this.yccInstance = yccInstance;
		
	};
	
	Ycc.LayerManager.prototype.init = function () {
	
	};
	
	
	/**
	 * 新建图层
	 * @param config
	 */
	Ycc.LayerManager.prototype.newLayer = function (config) {
		var layer = new Layer(this.yccInstance,config);
		this.yccInstance.layerList.push(layer);
		return layer;
	};
	
	/**
	 * 删除图层。
	 * @param layer
	 */
	Ycc.LayerManager.prototype.deleteLayer = function (layer) {
		var layerList = this.yccInstance.layerList;
		for(var i = 0;i<layerList.length;i++){
			if(layerList[i].id === layer.id){
				this.yccInstance.layerList.splice(i,1);
				return layer;
			}
		}
		return layer;
	};
	
	
	/**
	 * 将可显示的所有图层渲染至舞台。
	 */
	Ycc.LayerManager.prototype.renderAllLayerToStage = function () {
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			// 该图层是否可见
			if(layer.show)
				this.yccInstance.ctx.drawImage(layer.canvasDom,0,0,layer.width,layer.height);
		}
	};
	
	/**
	 * 依次合并图层。队列后面的图层将被绘制在前面图层之上。
	 * @param layerArray {Layer[]}	图层队列
	 * @return {*}
	 */
	Ycc.LayerManager.prototype.mergeLayers = function (layerArray) {
		var len = layerArray.length;
		if(len===0) return null;
		var resLayer = new Layer(this.yccInstance,{name:"合并图层"});
		for(var i = 0;i<len;i++){
			var layer = layerArray[i];
			resLayer.ctx.drawImage(layer.canvasDom,0,0,layer.width,layer.height);
			layer = null;
		}
		this.yccInstance.layerList = [];
		this.yccInstance.layerList.push(resLayer);
		return resLayer;
	};
	
	/**
	 * 只允许某一个图层接收舞台事件
	 * @param layer	{Layer}		允许接收事件的图层
	 */
	Ycc.LayerManager.prototype.enableEventManagerOnly = function (layer) {
		if(!layer) return false;
		for(var i=0;i<this.yccInstance.layerList.length;i++) {
			this.yccInstance.layerList[i].enableEventManager = false;
		}
		layer.enableEventManager = true;
	};
	
	
})(window.Ycc);