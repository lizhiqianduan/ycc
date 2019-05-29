/**
 * @file    Ycc.UI.Ellipse.class.js
 * @author  xiaohei
 * @date    2017/11/24
 * @description  Ycc.UI.Ellipse.class文件
 */



(function (Ycc) {
	
	/**
	 * 椭圆
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.fill=false {boolean}	填充or描边
	 * @param option.color=black {string} 圆的颜色
	 * @param option.point {Ycc.Math.Dot} 圆心位置
	 * @param option.width=20 {number} 长轴
	 * @param option.height=10 {number} 短轴
	 * @param option.angle=0	{number} 椭圆绕其中心的自转角度
	 * 		注：通过rotation设置的旋转角度只会旋转椭圆的中心点，此处的angle是将椭圆本身围绕中心点旋转。
	 * 		此处的理解，可以结合地球绕太阳旋转，angle表示自转角度，rotation表示公转角度。
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.Ellipse = function Ellipse(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.Ellipse;
		
		this.point = new Ycc.Math.Dot();
		this.width = 20;
		this.height = 10;
		
		/**
		 * 椭圆自转角度
		 * @type {number}
		 */
		this.angle = 0;
		
		// centrePoint,width,height,rotateAngle,fill
		
		this.color = "black";
		this.fill = false;
		
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Ellipse.prototype,Ycc.UI.Polygon.prototype);
	Ycc.UI.Ellipse.prototype.constructor = Ycc.UI.Ellipse;
	
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Ellipse.prototype.computeUIProps = function () {
		var x=this.point.x,
			y=this.point.y,
			a=this.width/2,
			b=this.height/2,
			angle = this.angle/180*Math.PI;
		
		var yMax = Math.sqrt(Math.cos(angle)*Math.cos(angle)*b*b+Math.sin(angle)*Math.sin(angle)*a*a) + y;
		var yMin = -yMax+2*y;
		var xMax = Math.sqrt(Math.cos(angle)*Math.cos(angle)*a*a+Math.sin(angle)*Math.sin(angle)*b*b) + x;
		var xMin = -xMax+2*x;
		
		this.rect.x = xMin;
		this.rect.y = yMin;
		this.rect.width = xMax-xMin;
		this.rect.height = yMax-yMin;
		
		this.coordinates = this.rect.getVertices();
		this.x=this.point.x,this.y=this.point.y;
	};
	
	
	
	/**
	 * 绘制
	 */
	Ycc.UI.Ellipse.prototype.render = function () {
		var width = this.width,
			rotateAngle=this.angle,
			height=this.height;
		
		var point = this.transformByRotate(this.point);
		
		this.ctx.save();
		var r = (width > height) ? width : height;
		// 计算压缩比例
		var ratioX = width / r;
		var ratioY = height / r;
		// 默认旋转中心位于画布左上角，需要改变旋转中心点
		this.ctx.translate(point.x,point.y);
		this.ctx.rotate(parseInt(rotateAngle)*Math.PI/180);
		// 再变换回原来的旋转中心点
		this.ctx.translate(-point.x,-point.y);
		// this.ctx.scale(1, 1);
		this.ctx.scale(ratioX, ratioY);
		this.ctx.beginPath();
		this.ctx.arc(point.x / ratioX,  point.y/ ratioY, r/2, 0, 2 * Math.PI, false);
		this.ctx.closePath();
		
		this.ctx.fillStyle = this.ctx.strokeStyle = this.color;
		if(!this.fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
			
		this.ctx.restore();
	};
	
	
	/**
	 * 判断是否在椭圆内
	 * @param dot	绝对坐标
	 * @param noneZeroMode
	 * @override
	 */
	Ycc.UI.Ellipse.prototype.containDot = function (dot,noneZeroMode) {
		var point = this.transformByRotate(this.point);
		// 椭圆自转角度
		dot = new Ycc.Math.Dot(dot).rotate(-this.angle,point);
		return Math.pow((dot.x-point.x)/this.width*2,2)+Math.pow((dot.y-point.y)/this.height*2,2)<=1;
	};
	
	/**
	 * 渲染旋转平移之前的位置
	 * @param ctx
	 * @override
	 */
	Ycc.UI.Ellipse.prototype.renderDashBeforeUI=function (ctx) {
		if(!this.isShowRotateBeforeUI || this.coordinates.length===0) return;
		var width = this.width,
			rotateAngle=this.angle,
			height=this.height;
		
		var pa = this.getParent();
		var point = pa?pa.transformToAbsolute(this.point):this.point;
		
		this.ctx.save();
		var r = (width > height) ? width : height;
		// 计算压缩比例
		var ratioX = width / r;
		var ratioY = height / r;
		this.ctx.scale(ratioX, ratioY);
		this.ctx.beginPath();
		this.ctx.arc(point.x / ratioX,  point.y/ ratioY, r/2, 0, 2 * Math.PI, false);
		this.ctx.closePath();
		
		this.ctx.strokeStyle = this.color;
		this.ctx.setLineDash([10]);

		this.ctx.stroke();
		
		this.ctx.restore();
	}
	
})(Ycc);