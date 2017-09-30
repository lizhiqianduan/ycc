/**
 * @file 		Ycc.init.js
 * @author		xiaohei
 * @date		2017/9/29
 * @desc
 * 	初始化Ycc构造函数，保存初始化信息
 */
(function (win) {
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
