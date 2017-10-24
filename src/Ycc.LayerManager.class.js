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
	 */
	function Layer(yccInstance,config){
		var defaultConfig = {
			name:"",
			width:yccInstance.ctxWidth,
			height:yccInstance.ctxHeight,
			bgColor:"transparent",
			show:true
		};
		// 浅拷贝
		config = Ycc.utils.extend(defaultConfig,config);
		
		var canvasDom = document.createElement("canvas");
		canvasDom.width = config.width;
		canvasDom.height = config.height;
		
		
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
	
	// todo
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
	 *
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
	 * 删除图层。删除图层时，自动重洗渲染所有图层
	 * @param layer
	 */
	Ycc.LayerManager.prototype.deleteLayer = function (layer) {
		var layerList = this.yccInstance.layerList;
		for(var i = 0;i<layerList.length;i++){
			if(layerList[i].id === layer.id){
				this.yccInstance.layerList.splice(i,1);
				this.renderAllLayerToStage();
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
	
	
	
})(window.Ycc);