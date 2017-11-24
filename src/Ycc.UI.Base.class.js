/**
 * @file    Ycc.UI.Base.class.js
 * @author  xiaohei
 * @date    2017/11/15
 * @description  Ycc.UI.Base.class文件。
 * 所有容器UI的基础类
 * @requires Ycc.UI
 * @requires Ycc.utils
 */

(function (Ycc) {
	var uid = 0;
	
	/**
	 * 所有UI类的基类。
	 * <br> 所有UI都必须遵循先计算、后绘制的流程
	 * @constructor
	 * @extends Ycc.Listener
	 */
	Ycc.UI.Base = function (option) {
		Ycc.Listener.call(this);
		
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
		 * 区域的背景色
		 * @type {string}
		 */
		this.rectBgColor = "transparent";
		
		/**
		 * UI所属的图层
		 * @type {Ycc.Layer}
		 */
		this.belongTo = null;
		
		/**
		 * 基础绘图UI
		 * @type {Ycc.UI}
		 */
		this.baseUI = null;
		
		
		this.extend(option);
	};
	
	Ycc.UI.Base.prototype = new Ycc.Listener();
	Ycc.UI.Base.prototype.constructor = Ycc.UI.Base;
	
	
	/**
	 * 在某个图层中初始化UI
	 * @param layer	{Layer}		图层
	 */
	Ycc.UI.Base.prototype.init = function (layer) {
		this.belongTo = layer;
		this.ctx = layer.ctx;
		this.baseUI = new Ycc.UI(layer.canvasDom);

		// 初始化时计算一次属性
		this.computeUIProps();
	};
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Base.prototype.computeUIProps = function () {
	
	};
	

	/**
	 * 渲染至绘图环境
	 * @param [ctx]	绘图环境。可选
	 * @override
	 */
	Ycc.UI.Base.prototype.render = function (ctx) {
	
	};
	
	/**
	 * 给定宽度，获取能容纳的最长单行字符串
	 * @param content	{string} 文本内容
	 * @param width		{number} 指定宽度
	 * @return {string}
	 */
	Ycc.UI.Base.prototype.getMaxContentInWidth = function (content, width) {
		var out = content;
		var outW = 0;
		
		if(this.ctx.measureText(content).width<=width)
			return content;
		for(var i = 0;i<content.length;i++){
			out = content.slice(0,i);
			outW = this.ctx.measureText(out).width;
			if(outW>width){
				return content.slice(0,i-1);
			}
		}
	};
	
	
	/**
	 * 合并参数
	 * @param option
	 * @return {Ycc.UI}
	 */
	Ycc.UI.Base.prototype.extend = function (option) {
		option = option || {};
		for(var key in this){
			if(typeof option[key]!=="undefined"){
				this[key] = option[key];
			}
		}
		return this;
	}



})(window.Ycc);