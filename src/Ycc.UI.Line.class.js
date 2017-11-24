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
		Ycc.UI.Base.call(this,option);
		
		/**
		 * 配置项
		 */
		// this.option = Ycc.utils.extend({
		// 	rect:null,
		// 	start:null,
		// 	end:null,
		// 	width:1,
		// 	color:"black"
		// },option);
		
		
		this.start = null;
		this.end = null;
		this.width = 1;
		this.color = "black";
		
		this.extend(option);
	};
	Ycc.UI.Line.prototype = new Ycc.UI.Base();
	Ycc.UI.Line.prototype.constructor = Ycc.UI.Line;
	
	/**
	 * 绘制
	 */
	Ycc.UI.Line.prototype.render = function () {
		this.rect.x = this.start.x<this.end.x?this.start.x:this.end.x;
		this.rect.y = this.start.y<this.end.y?this.start.y:this.end.y;
		this.rect.width = Math.abs(this.start.x-this.end.x);
		this.rect.height = Math.abs(this.start.y-this.end.y);
		
		this.ctx.save();
		this.ctx.strokeStyle = this.color;
		this.ctx.strokeWidth = this.width;
		
		this.ctx.beginPath();
		this.ctx.moveTo(this.start.x, this.start.y);
		this.ctx.lineTo(this.end.x, this.end.y);
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
	};
	
	
	
	
	
})(window.Ycc);