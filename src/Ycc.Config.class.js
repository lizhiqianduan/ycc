/**
 * @file    Ycc.Config.class.js
 * @author  xiaohei
 * @date    2017/10/9
 * @description  Ycc.Config.class文件。
 * 	Ycc实例的配置类
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
		 * 键为画布的属性名；值为画布属性值
		 * @type {Object}
		 */
		this.ctxProps = new Object({
			lineWidth:1,
			strokeStyle:"#000",
			fillStyle:"#000"
		});
		
		/**
		 * 项目所需要的图片资源路径。
		 * 键为图片名；值为图片路径，绝对路径、相对路径均可
		 * @type {Object}
		 */
		this.imagesResource = new Object({});
	};
	
	/**
	 * 设置线条样式
	 * @param val
	 */
	Ycc.Config.prototype.strokeStyle = function (val) {
		this.ctxProps.strokeStyle = val;
	};
	
	/**
	 * 设置填充样式
	 * @param val
	 */
	Ycc.Config.prototype.fillStyle = function (val) {
		this.ctxProps.fillStyle = val;
	};
	
	/**
	 * 设置线条宽度
	 * @param val
	 */
	Ycc.Config.prototype.lineWidth = function (val) {
		this.ctxProps.lineWidth = val;
	}
	
	
})(window.Ycc);