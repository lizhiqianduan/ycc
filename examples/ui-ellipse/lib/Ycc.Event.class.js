/**
 * @file    Ycc.Event.class.js
 * @author  xiaohei
 * @date    2017/11/20
 * @description  Ycc.Event.class文件
 */



(function (Ycc) {
	
	/**
	 * 事件的数据结构类
	 * @param type {String}	事件类型
	 * @constructor
	 */
	Ycc.Event = function (type) {
		/**
		 * 事件类型
		 * @type {string}
		 */
		this.type = type?type:"";
		/**
		 * 鼠标或点击位置
		 * @type {number}
		 */
		this.x=0;
		/**
		 * 鼠标或点击位置
		 * @type {number}
		 */
		this.y=0;
		/**
		 * ycc事件所对应的原始事件
		 */
		this.originEvent = null;
		
		/**
		 * 鼠标按下的ycc事件
		 * @type {Ycc.Event}
		 */
		this.mouseDownYccEvent = null;

		/**
		 * 鼠标抬起的ycc事件
		 * @type {Ycc.Event}
		 */
		this.mouseUpYccEvent = null;

		/**
		 * 是否阻止向下传递。默认为false，不阻止
		 * @type {boolean}
		 */
		this.stop = false;
		
		/**
		 * 事件触发的对象
		 * @type {Ycc.UI|null}
		 */
		this.target = null;
		
		/**
		 * 事件触发时，鼠标的坐标与UI的坐标差。即(e.x-target.x,e.y-target.y)
		 * @type {Ycc.Math.Dot|null}
		 */
		this.targetDeltaPosition = null;
		
	}
	
	
	
})(window.Ycc);