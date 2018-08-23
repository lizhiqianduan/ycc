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
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Ellipse = function Ellipse(option) {
		Ycc.UI.Base.call(this,option);
		this.yccClass = Ycc.UI.Ellipse;
		
		this.point = new Ycc.Math.Dot();
		this.width = 20;
		this.height = 10;
		this.angle = 0;
		
		// centrePoint,width,height,rotateAngle,fill
		
		this.color = "black";
		this.fill = false;
		
		this.extend(option);
	};
	Ycc.UI.Ellipse.prototype = new Ycc.UI.Base();
	Ycc.UI.Ellipse.prototype.constructor = Ycc.UI.Ellipse;
	
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 * @todo 计算容纳区域
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
	};
	
	
	
	/**
	 * 绘制
	 */
	Ycc.UI.Ellipse.prototype.render = function () {
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
	
	
	
	
	
})(window.Ycc);