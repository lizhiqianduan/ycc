/**
 * @file    Ycc.UI.Line.class.js
 * @author  xiaohei
 * @date    2017/11/17
 * @description  Ycc.UI.Line.class文件
 */


(function (Ycc) {
	
	/**
	 * 线段。可设置属性如下
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.start	{Ycc.Math.Dot}	起点
	 * @param option.end	{Ycc.Math.Dot}	终点
	 * @param option.width=1	{number}	线条宽度
	 * @param option.color="black"	{string}	线条颜色
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Line = function Line(option) {
		Ycc.UI.Base.call(this);
		
		/**
		 * 配置项
		 */
		this.option = Ycc.utils.extend({
			rect:null,
			start:null,
			end:null,
			width:1,
			color:"black"
		},option);
		
	};
	Ycc.UI.Line.prototype = new Ycc.UI.Base();
	Ycc.UI.Line.prototype.constructor = Ycc.UI.Line;
	
	/**
	 * 绘制
	 */
	Ycc.UI.Line.prototype.render = function () {
		this.option.rect = new Ycc.Math.Rect();
		this.option.rect.x = this.option.start.x<this.option.end.x?this.option.start.x:this.option.end.x;
		this.option.rect.y = this.option.start.y<this.option.end.y?this.option.start.y:this.option.end.y;
		this.option.width = Math.abs(this.option.start.x-this.option.end.x);
		this.option.height = Math.abs(this.option.start.y-this.option.end.y);
		
		this.ctx.save();
		this.ctx.strokeStyle = this.option.color;
		this.ctx.strokeWidth = this.option.width;
		
		this.ctx.beginPath();
		this.ctx.moveTo(this.option.start.x, this.option.start.y);
		this.ctx.lineTo(this.option.end.x, this.option.end.y);
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
	};
	
	
	
	
	
})(window.Ycc);