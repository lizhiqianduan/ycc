/**
 * @file    Ycc.Gesture.class.js
 * @author  xiaohei
 * @date    2018/6/19
 * @description  Ycc.Gesture.class文件
 * 移动端的手势类，封装简单的手势操作，操作只对target元素生效，若需要转发给Ycc.UI，则需要自己处理
 * @requires Ycc.TouchLifeTracer
 */


(function (Ycc) {
	
	/**
	 *
	 * @param option
	 * @param option.target 手势触发的HTML对象
	 * @extends Ycc.Listener
	 * @constructor
	 */
	Ycc.Gesture = function (option) {
		Ycc.Listener.call(this);
		this.yccClass = Ycc.Gesture;
		
		this.option = option;
		
		
	};
	Ycc.Gesture.prototype = new Ycc.Listener();
	
	/**
	 *
	 * @private
	 * @TODO 触点个数判断
	 */
	Ycc.Gesture.prototype._init = function () {
		var tracer = new Ycc.TouchLifeTracer({target:this.option.target});
		tracer.onlifestart = function (life) {
		
		};
		tracer.onlifechange = function (life) {
		
		};
		tracer.onlifeend = function (life) {
		
		};
	};


})(window.Ycc);
