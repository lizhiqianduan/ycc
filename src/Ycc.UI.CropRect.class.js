/**
 * @file    Ycc.UI.CropRect.class.js
 * @author  xiaohei
 * @date    2017/11/29
 * @description  Ycc.UI.CropRect.class文件
 */



(function (Ycc) {
	
	/**
	 * 裁剪框
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.fill=true {boolean}	填充or描边
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.CropRect = function CropRect(option) {
		Ycc.UI.Base.call(this,option);
		
		/**
		 * 控制点的大小
		 * @type {number}
		 */
		this.ctrlSize = 6;
		
		this.fill = true;
		
		this.extend(option);
	};
	Ycc.UI.CropRect.prototype = new Ycc.UI.Base();
	Ycc.UI.CropRect.prototype.constructor = Ycc.UI.CropRect;
	
	/**
	 * 绘制
	 */
	Ycc.UI.CropRect.prototype.render = function () {
		this.renderRectBgColor();
		
		var rect = this.rect;
		
		this.ctx.save();
		this.ctx.fillStyle = this.fillStyle;
		this.ctx.strokeStyle = this.strokeStyle;
		
		this.ctx.beginPath();
		this.ctx.rect(rect.x,rect.y,rect.width,rect.height);
		this.ctx.closePath();
		if(!this.fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		
		
		this.ctx.beginPath();
		this.ctx.rect(rect.x,rect.y,this.ctrlSize,this.ctrlSize);
		this.ctx.rect(rect.x,rect.y+rect.height-this.ctrlSize,this.ctrlSize,this.ctrlSize);
		this.ctx.rect(rect.x+rect.width-this.ctrlSize,rect.y,this.ctrlSize,this.ctrlSize);
		this.ctx.rect(rect.x+rect.width-this.ctrlSize,rect.y+rect.height-this.ctrlSize,this.ctrlSize,this.ctrlSize);
		this.ctx.closePath();
		this.ctx.fill();
		this.ctx.restore();
	};
	
	
	
	
})(window.Ycc);