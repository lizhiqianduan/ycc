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
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。该坐标是相对于图层的坐标
	 * @param option.pointList		{Ycc.Math.Dot[]}		Dot数组。该坐标是相对于图层的坐标
	 * @param option.width=1	{number}	线条宽度
	 * @param option.color="black"	{string}	线条颜色
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.BrokenLine = function BrokenLine(option) {
		Ycc.UI.Base.call(this,option);

		this.yccClass = Ycc.UI.BrokenLine;
		
		this.pointList = [];
		this.width = 1;
		this.color = "black";
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.BrokenLine.prototype,Ycc.UI.Base.prototype);
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.BrokenLine.prototype.computeUIProps = function () {
		if(this.pointList.length===0) {
			this.rect.x = 0;
			this.rect.y = 0;
			this.rect.width = 0;
			this.rect.height = 0;
			return null;
		}

		var minx=this.pointList[0].x,miny=this.pointList[0].y,maxx=this.pointList[0].x,maxy=this.pointList[0].y;
		for(var i =0;i<this.pointList.length;i++){
			var point = this.pointList[i];
			if(point.x<minx)
				minx = point.x;
			else if(point.x>maxx)
				maxx = point.x;
			
			if(point.y<miny)
				miny = point.y;
			else if(point.y>maxy)
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
		if(this.pointList.length<2) return null;
		
		// 父级
		var pa = this.getParent();
		
		this.ctx.save();
		this.ctx.strokeStyle = this.color;
		this.ctx.strokeWidth = this.width;
		this.ctx.beginPath();
		// 因为直接操作舞台，所以绘制之前需要转换成舞台绝对坐标
		var pointList = pa?pa.transformToAbsolute(this.pointList):this.pointList;
		this.ctx.moveTo(pointList[0].x, pointList[0].y);
		for(var i =1;i<pointList.length;i++){
			this.ctx.lineTo(pointList[i].x, pointList[i].y);
		}
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
	};
	
	
	
	
	
	
})(window.Ycc);