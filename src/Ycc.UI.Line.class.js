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
		this.yccClass = Ycc.UI.Line;
		
		this.start = new Ycc.Math.Dot(0,0);
		this.end = new Ycc.Math.Dot(0,0);
		this.width = 1;
		this.color = "black";
		
		this.extend(option);
	};
	Ycc.UI.Line.prototype = new Ycc.UI.Base();
	Ycc.UI.Line.prototype.constructor = Ycc.UI.Line;

	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Line.prototype.computeUIProps = function () {
		this.rect.x = this.start.x<this.end.x?this.start.x:this.end.x;
		this.rect.y = this.start.y<this.end.y?this.start.y:this.end.y;
		this.rect.width = Math.abs(this.start.x-this.end.x);
		this.rect.height = Math.abs(this.start.y-this.end.y);
	};
	/**
	 * 绘制
	 */
	Ycc.UI.Line.prototype.render = function () {
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