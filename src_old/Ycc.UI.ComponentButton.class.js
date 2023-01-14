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
	 * @param option.textColor			{String}			按钮内的文字的颜色
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
		
		/**
		 * 按钮文字颜色
		 * @type {string}
		 */
		this.textColor = "black";
		
		/**
		 * 背景
		 * @type {null}
		 * @private
		 */
		this.__bgUI = null;
		
		/**
		 * 文字
		 * @type {null}
		 * @private
		 */
		this.__textUI = null;
		
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
			this.__bgUI = new Ycc.UI.Image({
				rect:new Ycc.Math.Rect(0,0,this.rect.width,this.rect.height),
				fillMode:'scale',
				res:this.backgroundImageRes,
				stopEventBubbleUp:false
			});
			this.addChild(this.__bgUI);
		}
		if(this.text!==""){
			this.__textUI = new Ycc.UI.SingleLineText({
				rect:new Ycc.Math.Rect(0,0,this.rect.width,this.rect.height),
				content:this.text,
				color:this.textColor,
				xAlign:'center',
				stopEventBubbleUp:false
			});
			this.addChild(this.__textUI);
		}
	};
	
	
	/**
	 * 更新属性
	 */
	Ycc.UI.Base.prototype.computeUIProps = function () {
		if(this.__bgUI){
			this.__bgUI.rect.width = this.rect.width;
			this.__bgUI.rect.height = this.rect.height;
			this.__bgUI.res = this.backgroundImageRes;
		}
		if(this.__textUI){
			this.__textUI.rect.width = this.rect.width;
			this.__textUI.rect.height = this.rect.height;
			this.__textUI.content = this.text;
			this.__textUI.color = this.textColor;
		}
	};
})(Ycc);