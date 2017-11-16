/**
 * @file    Ycc.UI.Base.class.js
 * @author  xiaohei
 * @date    2017/11/15
 * @description  Ycc.UI.Base.class文件。
 * 所有容器UI的基础类
 * @requires Ycc.UI
 */

(function (Ycc) {
	var uid = 0;
	
	/**
	 * 所有UI类的基类
	 * @constructor
	 */
	Ycc.UI.Base = function () {
		
		/**
		 * UI的唯一ID
		 * @type {number}
		 */
		this.uid = uid++;
		/**
		 * 绘图环境
		 * @type {null}
		 */
		this.ctx = null;
		/**
		 * UI的绘图区域
		 * @type {Ycc.Math.Rect}
		 */
		this.rect = new Ycc.Math.Rect();
		
		/**
		 * 基础绘图UI
		 * @type {Ycc.UI}
		 */
		this.baseUI = null;
		
	};
	
	/**
	 * 在某个图层中初始化UI
	 * @param layer	{Layer}		图层
	 */
	Ycc.UI.Base.prototype.init = function (layer) {
		this.ctx = layer.ctx;
		this.baseUI = new Ycc.UI(layer.canvasDom);
	};
	

	/**
	 * 渲染至绘图环境
	 * @param [ctx]	绘图环境。可选
	 * @override
	 */
	Ycc.UI.Base.prototype.render = function (ctx) {
	
	};



})(window.Ycc);