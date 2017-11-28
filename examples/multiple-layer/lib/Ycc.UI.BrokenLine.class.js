/**
 * @file    Ycc.UI.BrokenLine.class.js
 * @author  xiaohei
 * @date    2017/11/24
 * @description  Ycc.UI.BrokenLine.class文件
 */




(function (Ycc) {
	
	/**
	 * 线段。可设置属性如下
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.pointList		{Ycc.Math.Dot[]}		Dot数组
	 * @param option.width=1	{number}	线条宽度
	 * @param option.color="black"	{string}	线条颜色
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.BrokenLine = function BrokenLine(option) {
		Ycc.UI.Base.call(this,option);
		
		this.pointList = [];
		this.width = 1;
		this.color = "black";
		
		this.extend(option);
	};
	Ycc.UI.BrokenLine.prototype = new Ycc.UI.Base();
	Ycc.UI.BrokenLine.prototype.constructor = Ycc.UI.BrokenLine;
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.BrokenLine.prototype.computeUIProps = function () {
		if(this.pointList.length<2) return null;

		var minx=this.pointList[0].x,miny=this.pointList[0].y,maxx=this.pointList[0].x,maxy=this.pointList[0].y;
		for(var i =0;i<this.pointList.length;i++){
			var point = this.pointList[i];
			if(point.x<minx)
				minx = point.x;
			else
				maxx = point.x;
			
			if(point.y<miny)
				miny = point.y;
			else
				maxy = point.y;
		}
		
		this.rect.x = minx;
		this.rect.y = miny;
		this.rect.width = maxx-minx;
		this.rect.height = maxy-miny;
	};
	/**
	 * 绘制
	 */
	Ycc.UI.BrokenLine.prototype.render = function () {
		this.renderRectBgColor();
		
		this.ctx.save();
		this.ctx.strokeStyle = this.color;
		this.ctx.strokeWidth = this.width;
		this.ctx.beginPath();
		this.ctx.moveTo(this.pointList[0].x, this.pointList[0].y);
		for(var i =1;i<this.pointList.length;i++){
			this.ctx.lineTo(this.pointList[i].x, this.pointList[i].y);
		}
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
	};
	
	
	
	
	
	
})(window.Ycc);