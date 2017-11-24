/**
 * @file    Ycc.UI.Circle.class.js
 * @author  xiaohei
 * @date    2017/11/23
 * @description  Ycc.UI.Circle.class文件
 */



(function (Ycc) {
	
	/**
	 * 圆
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.fill=true {boolean}	填充or描边
	 * @param option.color=black {string} 圆的颜色
	 * @param option.point {Ycc.Math.Dot} 圆心位置
	 * @param option.r=black {number} 圆的半径
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Circle = function Circle(option) {
		Ycc.UI.Base.call(this,option);
		
		this.point = null;
		this.r = 10;
		this.color = "black";
		this.fill = true;
		
		this.extend(option);
		// 重新计算rect
		this.rect = new Ycc.Math.Rect(this.point.x-this.r,this.point.y-this.r,2*this.r,2*this.r);
	};
	Ycc.UI.Circle.prototype = new Ycc.UI.Base();
	Ycc.UI.Circle.prototype.constructor = Ycc.UI.Circle;
	
	/**
	 * 绘制
	 */
	Ycc.UI.Circle.prototype.render = function () {
		
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.fillStyle = this.color;
		this.ctx.strokeStyle = this.color;
		
		this.ctx.arc(
			this.point.x,
			this.point.y,
			this.r,
			0,
			2*Math.PI
		);
		
		this.ctx.closePath();
		if(!this.fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		this.ctx.restore();
	};
	
	
	
	
	
})(window.Ycc);