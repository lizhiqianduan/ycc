/**
 * @file    Ycc.polyfill.wx.js
 * @author  xiaohei
 * @date    2018/11/19
 * @description  Ycc.polyfill.wx文件
 */


// 兼容微信
if("undefined"!== typeof wx){
	module.exports = Ycc;
	// Ycc.prototype.getStageWidth = function () {
	//
	// };
	
	/*Ycc.Gesture.prototype._init = function () {
		console.log('wx gesture init');
	};*/
	
	Ycc.utils.isMobile = function () {
		console.log('wx isMobile');
		return true;
	};
};