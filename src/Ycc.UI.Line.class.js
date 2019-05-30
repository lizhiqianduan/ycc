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
	 * @param option.start	{Ycc.Math.Dot}	起点
	 * @param option.end	{Ycc.Math.Dot}	终点
	 * @param option.width=1	{number}	线条宽度
	 * @param option.color="black"	{string}	线条颜色
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.Line = function Line(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.Line;
		
		this.start = new Ycc.Math.Dot(0,0);
		this.end = new Ycc.Math.Dot(0,0);
		this.width = 1;
		this.color = "black";
		
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Line.prototype,Ycc.UI.Polygon.prototype);
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
		
		
		// 计算多边形坐标
		var x1=this.start.x,y1=this.start.y,x2=this.end.x,y2=this.end.y;
		// 垂直线段的斜率
		var k = -(x2-x1)/(y2-y1);
		if(y2-y1===0) {
			this.coordinates=[
				{x:this.start.x,y:this.start.y-this.width/2},
				{x:this.start.x,y:this.start.y+this.width/2},
				{x:this.end.x,y:this.end.y+this.width/2},
				{x:this.end.x,y:this.end.y-this.width/2},
				{x:this.start.x,y:this.start.y-this.width/2},
			];
		}else {
			var cx1 = x1-Math.pow(Math.pow(this.width/2,2)/(k*k+1),0.5);
			var cx2 = x1+Math.pow(Math.pow(this.width/2,2)/(k*k+1),0.5);
			var cx3 = x2+Math.pow(Math.pow(this.width/2,2)/(k*k+1),0.5);
			var cx4 = x2-Math.pow(Math.pow(this.width/2,2)/(k*k+1),0.5);
			
			var cy1 = k*(cx1-x1)+y1;
			var cy2 = k*(cx2-x1)+y1;
			var cy3 = k*(cx3-x2)+y2;
			var cy4 = k*(cx4-x2)+y2;
			
			
			// 计算多边形坐标
			// 计算多边形坐标
			this.coordinates=[
				{x:cx1,y:cy1},
				{x:cx2,y:cy2},
				{x:cx3,y:cy3},
				{x:cx4,y:cy4},
				{x:cx1,y:cy1},
			];
		}
		// 计算相对位置
		this.x=this.start.x,this.y=this.start.y;
	};
	/**
	 * 绘制函数与Polygon相同
	 */
	// Ycc.UI.Line.prototype.render = function () {
	//
	// 	var pa = this.getParent();
	// 	var start = pa?pa.transformToAbsolute(this.start):this.start;
	// 	var end = pa?pa.transformToAbsolute(this.end):this.end;
	// 	this.ctx.save();
	// 	this.ctx.strokeStyle = this.color;
	// 	this.ctx.lineWidth = this.width;
	//
	// 	this.ctx.beginPath();
	// 	this.ctx.moveTo(start.x, start.y);
	// 	this.ctx.lineTo(end.x, end.y);
	// 	this.ctx.stroke();
	// 	this.ctx.closePath();
	// 	this.ctx.restore();
	// };
	
	
	
	
	
})(Ycc);