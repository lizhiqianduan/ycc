/**
 * @file    Ycc.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description  Ycc.class文件
 *
 */




(function (win) {
	
	/**
	 * 应用启动入口类，每个实例都与一个canvas绑定
	 * @param canvasDom
	 *
	 * @constructor
	 */
	win.Ycc = function Ycc(canvasDom){
		/**
		 * canvas的Dom对象
		 */
		this.canvasDom = canvasDom;
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
		 * 实例的图形管理模块
		 * @type {Ycc.UI}
		 */
		this.ui = Ycc.UI?new Ycc.UI(this):null;
		
		/**
		 * 实例的快照管理模块
		 * @type {Ycc.PhotoManager}
		 */
		this.photoManager = Ycc.PhotoManager?new Ycc.PhotoManager(this):null;
		
		/**
		 * 实例的事件管理模块
		 * @type {Ycc.EventManager}
		 */
		this.eventManager = Ycc.EventManager?new Ycc.EventManager(this):null;
		
		/**
		 * 实例的配置管理模块
		 * @type {Ycc.Config}
		 */
		this.config = new Ycc.Config(this);
		
		
		this.init();
	};
	
	/**
	 * 类初始化
	 */
	win.Ycc.prototype.init = function () {
		// 填充背景
		this.ctx.fillStyle = this.config.canvasBgColor;
		this.ctx.fillRect(0,0,this.ctxWidth,this.ctxHeight);
		
		// 使用ctxProps，初始化画布属性
		for(var key in this.config.ctxProps){
			this.ctx[key] = this.config.ctxProps[key];
		}
	};
	
	
	
})(window);