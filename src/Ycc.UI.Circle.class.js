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
	 * @param option.point {Ycc.Math.Dot} 圆心位置，相对坐标
	 * @param option.lineWidth {Number} 非填充时的线宽
	 * @param option.r=10 {number} 圆的半径
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.Circle = function Circle(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.Circle;
		
		this.point = null;
		this.r = 10;
		this.color = "black";
		this.fill = true;
		this.lineWidth = 1;

		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Circle.prototype,Ycc.UI.Polygon.prototype);
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Circle.prototype.computeUIProps = function () {
		if(!this.point) return new Ycc.Debugger.Error('Circle need prop point');
		
		var x=this.point.x,
			y=this.point.y,
			r=this.r;
		this.rect = new Ycc.Math.Rect(x-r,y-r,2*r,2*r);
		// 计算多边形坐标
		this.coordinates= this.rect.getVertices();
		// 计算相对位置
		this.x=this.point.x,this.y=this.point.y;
		
	};
	
	
	/**
	 * 绘制
	 * @override
	 */
	Ycc.UI.Circle.prototype.render = function () {
		var ctx = this.ctxCache;
		
		var point = this.transformByRotate(this.point);
		
		
		ctx.save();
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.lineWidth;
		
		ctx.arc(
			point.x*this.dpi,
			point.y*this.dpi,
			this.r*this.dpi,
			0,
			2*Math.PI
		);
		
		ctx.closePath();
		if(!this.fill)
			ctx.stroke();
		else
			ctx.fill();
		ctx.restore();
	};
	
	/**
	 * 绘制旋转缩放之前的UI
	 * @override
	 */
	Ycc.UI.Circle.prototype.renderDashBeforeUI = function (ctx) {
		if(!this.isShowRotateBeforeUI || this.coordinates.length===0) return;
		var self = this;
		ctx = this.ctx;
		var pa = this.getParent();
		var point = pa?pa.transformToAbsolute(this.point):this.point;
		
		ctx.save();
		// 虚线
		ctx.setLineDash&&ctx.setLineDash([10]);
		ctx.beginPath();
		this.ctx.arc(
			point.x,
			point.y,
			this.r,
			0,
			2*Math.PI
		);
		ctx.closePath();
		ctx.strokeStyle = this.color;
		ctx.stroke();
		ctx.restore();
	};
	
	
	/**
	 * 判断是否在圆内
	 * @param dot	绝对坐标
	 * @param noneZeroMode
	 * @override
	 */
	Ycc.UI.Circle.prototype.containDot = function (dot,noneZeroMode) {
		var point = this.transformByRotate(this.point);
		return Math.pow(dot.x-point.x,2)+Math.pow(dot.y-point.y,2)<=Math.pow(this.r,2);
	};
	
	
})(Ycc);