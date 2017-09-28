/**
 * Created by xiaohei on 2016/4/2.
 * 功能说明：
 * 	初始化Ycc构造函数，保存初始化信息
 *
 * 不依赖其他模块
 */
(function (win) {
	
	win.Ycc = Ycc;
	function Ycc(canvasDom){
		this.ctx = canvasDom.getContext("2d");
		this.ctx_width = canvasDom.width;
		this.ctx_height = canvasDom.height;
		

		// 初始化子模块
		if(Ycc.UI)
			this._ui = new Ycc.UI(this);
	};
	
	
	
	Ycc.init = {
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
