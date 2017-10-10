/**
 * @file    Ycc.Config.class.js
 * @author  xiaohei
 * @date    2017/10/9
 * @description  Ycc.Config.class文件。
 * 	Ycc实例的默认配置类。所有ycc实例都默认使用该配置类。
 *
 */



(function (Ycc) {
	
	/**
	 * Ycc的配置类
	 * @param yccInstance	{Ycc}	ycc的引用
	 * @constructor
	 */
	Ycc.Config = function (yccInstance) {
		/**
		 * ycc的引用
		 * @type {Ycc}
		 */
		this.yccInstance = yccInstance;

		/**
		 * 画布属性的配置项，包含所有的画布属性。
		 * 键为画布的属性名；值为画布属性值。供ycc.init()方法使用
		 * @type {Object}
		 */
		this.ctxProps = new Object({
			lineWidth:3,
			strokeStyle:"red",
			fillStyle:"red",
			font:"32px arial"
		});
		
		/**
		 * 初始时，canvas的背景色
		 * @type {String}
		 */
		this.canvasBgColor = "green";
	};
	
	
})(window.Ycc);