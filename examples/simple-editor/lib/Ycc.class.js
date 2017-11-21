/**
 * @file    Ycc.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description  Ycc.class文件
 *
 */




(function (win) {
	
	/**
	 * 应用启动入口类，每个实例都与一个舞台绑定。
	 * 每个舞台都是一个canvas元素，该元素会被添加至HTML结构中。
	 *
	 * @param canvasDom		canvas的HTML元素。即，显示舞台
	 * @param [config]		canvas初始化的属性。字体大小、填充颜色、线条颜色、默认背景等。
	 * @constructor
	 */
	win.Ycc = function Ycc(canvasDom,config){
		/**
		 * canvas的Dom对象
		 */
		this.canvasDom = canvasDom;
		
		/**
		 * 显示舞台
		 */
		this.stage = canvasDom;
		/**
		 * 绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = this.canvasDom.getContext("2d");
		/**
		 * 可绘图区的宽
		 */
		this.ctxWidth = this.canvasDom.width;
		/**
		 * 可绘图区的高
		 */
		this.ctxHeight = this.canvasDom.height;
		
		/**
		 * Layer对象数组。包含所有的图层
		 * @type {Array}
		 */
		this.layerList = [];

		/**
		 * 实例的全局配置项
		 */
		this.config = config?config:{};
		
		/**
		 * 实例的快照管理模块
		 * @type {Ycc.PhotoManager}
		 */
		this.photoManager = Ycc.PhotoManager?new Ycc.PhotoManager(this):null;
		
		/**
		 * ycc的图层管理器
		 * @type {null}
		 */
		this.layerManager = Ycc.LayerManager?new Ycc.LayerManager(this):null;
		
		/**
		 * 系统心跳管理器
		 */
		this.ticker = Ycc.Ticker?new Ycc.Ticker(this):null;
		
		/**
		 * 基础绘图UI。这些绘图操作会直接作用于舞台。
		 * @type {Ycc.UI}
		 */
		this.baseUI = new Ycc.UI(this.stage);
		
		this.init();
	};
	
	/**
	 * 获取舞台的宽
	 */
	win.Ycc.prototype.getStageWidth = function () {
		return this.stage.width;
	};
	
	/**
	 * 获取舞台的高
	 */
	win.Ycc.prototype.getStageHeight = function () {
		return this.stage.height;
	};
	
	/**
	 * 类初始化
	 */
	win.Ycc.prototype.init = function () {
		var self = this;
		// 代理的原生鼠标事件，默认每个图层都触发
		var proxyEventTypes = ["mousemove","mousedown","mouseup","click","mouseenter","mouseout"];
		for(var i = 0;i<proxyEventTypes.length;i++){
			this.stage.addEventListener(proxyEventTypes[i],function (e) {
				var yccEvent = new Ycc.Event(e.type);
				yccEvent.originEvent = e;
				yccEvent.x = parseInt(e.clientX - self.stage.getBoundingClientRect().left);
				yccEvent.y = parseInt(e.clientY - self.stage.getBoundingClientRect().top);
				for(var i=self.layerList.length-1;i>=0;i--){
					var layer = self.layerList[i];
					if(!layer.enableEventManager) continue;
					layer.triggerListener(e.type,yccEvent);
				}
			})
		}
	};
	
	/**
	 * 清除
	 */
	win.Ycc.prototype.clearStage = function () {
		this.ctx.clearRect(0,0,this.getStageWidth(),this.getStageHeight());
	};
	
})(window);