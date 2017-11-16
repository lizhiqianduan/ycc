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
	 * @global
	 */
	function Layer(yccInstance,config){
		/**
		 * 存储图层中的所有UI
		 * @type {Ycc.UI[]}
		 * @private
		 */
		var uiList = [];
		
		var defaultConfig = {
			name:"",
			type:"ui",

			// 图层在舞台的渲染位置
			x:0,
			y:0,
			
			// 图层的高宽
			width:yccInstance.getStageWidth(),
			height:yccInstance.getStageHeight(),
			show:true,
			enableEventManager:false,
			enableFrameEvent:false,
			update:function () {},
			ctxConfig:{
				fontStyle:"normal",
				fontVariant:"normal",
				fontWeight:"normal",
				fontSize:"16px",
				fontFamily:"微软雅黑",
				font:"16px 微软雅黑",
				textBaseline:"top",
				fillStyle:"red",
				strokeStyle:"blue"
			}
		};
		// 深拷贝
		config = Ycc.utils.extend(defaultConfig,config,true);
		
		var canvasDom = document.createElement("canvas");
		canvasDom.width = config.width;
		canvasDom.height = config.height;
		/**
		 * 绘图环境的默认属性配置项
		 * @type {ctxConfig|{}}
		 */
		this.ctxConfig = config.ctxConfig;
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
		 * 画布属性的双向绑定
		 */
		this.canvasDom._props = {};
		
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
		 * 图层类型。
		 * `ui`表示用于绘图的图层。`tool`表示辅助的工具图层。`text`表示文字图层。
		 * 默认为`ui`。
		 */
		this.type = config.type;
		
		/**
		 * 图层中的文字。仅当图层type为text时有值。
		 * @type {string}
		 */
		this.textValue = "";

		/**
		 * 图层名称
		 * @type {string}
		 */
		this.name = config.name?config.name:"图层_"+this.type+"_"+this.id;
		
		/**
		 * 图层位置的x坐标。默认与舞台左上角重合
		 * @type {number}
		 */
		this.x = config.x;

		/**
		 * 图层位置的Y坐标。默认与舞台左上角重合
		 * @type {number}
		 */
		this.y = config.y;
		
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
		
		this.init();
	}
	
	/**
	 * 初始化
	 * @return {null}
	 */
	Layer.prototype.init = function () {
		var self = this;
		// 初始化画布的属性
		if(!this.ctxConfig || !Ycc.utils.isObj(this.ctxConfig))
			return null;
		// 设置画布的所有属性
		self._setCtxProps();
		
		var ctxConfig = this.ctxConfig;
		for(var key in ctxConfig){
			if(!ctxConfig.hasOwnProperty(key)) continue;
			Object.defineProperty(this.ctx.canvas._props,key,{
				enumerable : true,
				configurable : true,
				set : (function(k){
					return function (newValue) {
						// 修改_props的属性后自动设置画布的属性
						self.ctxConfig[k] = newValue;
						self._setCtxProps();
					};
				})(key),
				get:(function(k){
					return function () {
						return self.ctxConfig[k];
					};
				})(key)
			})
		}
		
		
	};
	
	/**
	 * 设置画布所有的属性
	 */
	Layer.prototype._setCtxProps = function () {
		var self = this;
		var ctxConfig = this.ctxConfig;
		ctxConfig["font"] = [ctxConfig.fontStyle,ctxConfig.fontVariant,ctxConfig.fontWeight,ctxConfig.fontSize,ctxConfig.fontFamily].join(" ");
		for(var key in self.ctxConfig){
			if(!self.ctxConfig.hasOwnProperty(key)) continue;
			self.ctx[key] = self.ctxConfig[key];
		}
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
	 * 添加一个UI图形至图层
	 * @param ui {Ycc.UI}	UI图形
	 */
	Layer.prototype.addUI = function (ui) {
		ui.init(this);
		ui.render();
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
				this.yccInstance.ctx.drawImage(layer.canvasDom,layer.x,layer.y,layer.width,layer.height);
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