/**
 * @file    Ycc.UIGroup.class.js.js
 * @author  xiaohei
 * @date    2017/12/8
 * @description  Ycc.UIGroup.class.js文件
 */



(function (Ycc) {
	
	/**
	 * UI分组。一个UI只能隶属于一个组。
	 * @param option	{object}		所有可配置的配置项
	 * @constructor
	 * @extends Ycc.Listener
	 */
	Ycc.UIGroup = function UIGroup(option) {
		Ycc.Listener.call(this);
		
		/**
		 * UI组内的UI列表
		 * @type {Ycc.UI[]}
		 */
		this.uiList = [];
		
		/**
		 * 组的x坐标
		 * @type {number}
		 */
		this.x = 0;
		/**
		 * 组的y坐标
		 * @type {number}
		 */
		this.y = 0;
		
		Ycc.utils.mergeObject(this,option);
	};
	Ycc.UIGroup.prototype = new Ycc.UI.Listener();
	Ycc.UIGroup.prototype.constructor = Ycc.UIGroup;
	
	
	
	
	
	
	
	
})(window.Ycc);