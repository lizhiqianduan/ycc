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
	Ycc.UI.Circle = function Rect(option) {
		Ycc.UI.Base.call(this);
		
		/**
		 * 配置项
		 */
		this.option = Ycc.utils.extend({
			rect:null,
			fill:true,
			color:"black",
			point:null,
			r:10
		},option);
		
		// 重新计算rect
		this.option.rect = new Ycc.Math.Rect(this.option.point.x-this.option.r,this.option.point.y-this.option.r,2*this.option.r,2*this.option.r);
		
	};
	Ycc.UI.Circle.prototype = new Ycc.UI.Base();
	Ycc.UI.Circle.prototype.constructor = Ycc.UI.Circle;
	
	/**
	 * 绘制
	 */
	Ycc.UI.Circle.prototype.render = function () {
		
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.fillStyle = this.option.color;
		this.ctx.strokeStyle = this.option.color;
		
		this.ctx.arc(
			this.option.point.x,
			this.option.point.y,
			this.option.r,
			0,
			2*Math.PI
		);
		
		this.ctx.closePath();
		if(!this.option.fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		this.ctx.restore();
	};
	
	
	
	
	
})(window.Ycc);