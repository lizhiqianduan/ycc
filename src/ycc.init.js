/**
 * @file 		ycc.init.js
 * @author		xiaohei
 * @date		2017/9/29
 * @desc
 * 	初始化Ycc构造函数，保存初始化信息
 */
(function (win) {
	
	/**
	 * 应用启动入口类
	 * @param canvasDom
	 * @param options				{Object}	启动配置项
	 * @param options.canvasBg		{String}	背景色
	 *
	 * @constructor
	 */
	win.Ycc = function(canvasDom,options){
		/**
		 * 绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = canvasDom.getContext("2d");
		/**
		 * 可绘图区的宽
		 */
		this.ctx_width = canvasDom.width;
		/**
		 * 可绘图区的高
		 */
		this.ctx_height = canvasDom.height;
		/**
		 * 配置对象
		 * @default {}
		 */
		this.options = options || {};
		/**
		 * UI操作实例的引用
		 * @type {Ycc.UI}
		 */
		this.ui = null;
		
		this.init();
	};
	
	/**
	 * 类初始化
	 */
	win.Ycc.prototype.init = function () {
		// 填充背景
		this.ctx.fillStyle = this.options.canvasBg||"#fff";
		this.ctx.fillRect(0,0,this.ctx_width,this.ctx_height);
		
		if(Ycc.UI){
			this.ui = new Ycc.UI(this);
		}
		
	};
	
	
	/**
	 * 项目初始化的设置
	 * @type {{settings: {canvasBg: string, font: string, lineWidth: number, strokeStyle: string, fillStyle: string}}}
	 * @static
	 */
	win.Ycc.init = {
		// 初始化默认配置
		settings:{
			canvasBg: "#fff",			// 画布背景色
			font: "12px Arial",			// 画布字体
			lineWidth: 1,				// 线框
			strokeStyle: "#CC0000",		// 线条颜色
			fillStyle: "#CC0000"		// 填充颜色
		}
	};
	

})(window);
