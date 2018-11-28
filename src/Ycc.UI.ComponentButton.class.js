/**
 * @file    Ycc.UI.ComponentButton.class.js
 * @author  xiaohei
 * @date    2018/11/27
 * @description  Ycc.UI.ComponentButton.class文件
 */

(function (Ycc) {
	
	/**
	 * 按钮组件
	 * 组件自身也是一个UI，所以option包含ui.base的所有属性
	 * @param option					{Object}
	 * @param option.rect				{Ycc.Math.Rect}		相对于父级按钮的位置，继承于base
	 * @param option.rectBgColor		{String}			按钮区域的背景色，继承于base
	 * @param option.rectBorderWidth	{Number}			按钮区域的边框宽度，继承于base
	 * @param option.rectBorderColor	{String}			按钮区域的边框颜色，继承于base
	 * @param option.backgroundImageRes	{String}			按钮区域的图片资源
	 * @param option.text				{String}			按钮内的文字
	 * @constructor
	 */
	Ycc.UI.ComponentButton = function ComponentButton(option) {
		Ycc.UI.Base.call(this,option);
		this.yccClass = Ycc.UI.ComponentButton;
		
		/**
		 * 容纳区的边框宽度
		 * @type {number}
		 */
		this.rectBorderWidth = 1;
		
		/**
		 * 容纳区边框颜色
		 * @type {string}
		 */
		this.rectBorderColor = "#000";
		
		/**
		 * 背景图资源
		 * @type {null}
		 */
		this.backgroundImageRes = null;
		
		/**
		 * 按钮内的文字
		 * @type {string}
		 */
		this.text = "";
		
		this.extend(option);
		
		this.__componentInit();
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.ComponentButton.prototype,Ycc.UI.Base.prototype);
	Ycc.UI.ComponentButton.prototype.constructor = Ycc.UI.ComponentButton;
	
	
	/**
	 * 组件初始化
	 * @private
	 */
	Ycc.UI.ComponentButton.prototype.__componentInit = function () {
		
		if(this.backgroundImageRes){
			this.addChild(new Ycc.UI.Image({
				rect:new Ycc.Math.Rect(0,0,this.rect.width,this.rect.height),
				fillMode:'scale',
				res:this.backgroundImageRes
			}));
		}
		if(this.text!==""){
			this.addChild(new Ycc.UI.SingleLineText({
				rect:new Ycc.Math.Rect(0,0,this.rect.width,this.rect.height),
				content:this.text,
				xAlign:'center',
				ontap:function (e) {
					console.log(e);
				}
			}));
		}
	};
})(Ycc);