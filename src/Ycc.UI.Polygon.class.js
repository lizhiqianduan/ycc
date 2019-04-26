/**
 * @file    Ycc.UI.Polygon.class.js
 * @author  xiaohei
 * @date    2019/4/26
 * @description  Ycc.UI.Polygon.class文件
 */

(function (Ycc) {
	
	/**
	 * 多行文本UI
	 * @constructor
	 * @extends Ycc.UI.Base
	 * @param option    			{object}        	所有可配置的配置项
	 * @param option.fill 			{boolean}			是否填充绘制，false表示描边绘制
	 * @param option.coordinates  	{Ycc.Math.Dot[]}    多边形点坐标的数组，为保证图形能够闭合，起点和终点必须相等
	 */
	Ycc.UI.Polygon = function Polygon(option) {
		Ycc.UI.Base.call(this, option);
		this.yccClass = Ycc.UI.Polygon;
		
		/**
		 * 是否填充
		 * @type {boolean}
		 */
		this.fill = true;
		
		/**
		 * 多边形点坐标的数组，为保证图形能够闭合，起点和终点必须相等
		 * @type {null}
		 */
		this.coordinates=option.coordinates||[];
		
		// 合并属性
		this.extend(option);
	};
	
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Polygon.prototype, Ycc.UI.Base.prototype);
	Ycc.UI.Polygon.prototype.constructor = Ycc.UI.Polygon;
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Polygon.prototype.computeUIProps = function () {
	
	};
	
	/**
	 * 渲染至ctx
	 * @param ctx
	 */
	Ycc.UI.Polygon.prototype.render = function (ctx) {
		var self = this;
		ctx = ctx || self.ctx;
		if(!self.ctx){
			console.error("[Ycc error]:","ctx is null !");
			return;
		}
		var coordinates = this.coordinates;
		var start = coordinates[0];
		
		console.log('render');
		
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(start.x,start.y);
		for(var i=0;i<this.coordinates.length-1;i++){
			var dot = this.coordinates[i];
			ctx.lineTo(dot.x,dot.y);
		}
		ctx.closePath();
		ctx.fill();
		ctx.restore();
		
	};
	
	/**
	 * 重载基类的包含某个点的函数，用于点击事件等的响应
	 * 两种方法：
	 * 方法一：经过该点的水平射线与多边形的焦点数，即Ray-casting Algorithm
	 * 方法二：某个点始终位于多边形逆时针向量的左侧、或者顺时针方向的右侧即可判断，算法名忘记了
	 * 此方法采用方法一，并假设该射线平行于x轴，方向为x轴正方向
	 * @param dot {Ycc.Math.Dot} 需要判断的点
	 * @return {boolean}
	 */
	Ycc.UI.Polygon.prototype.containDot = function (dot) {
		var x = dot.x,y=dot.y;
		var crossNum = 0;
		for(var i=0;i<this.coordinates.length-1;i++){
			var start = this.coordinates[i];
			var end = this.coordinates[i+1];
			if(start.x===end.x) {
				// 因为射线向右水平，此处说明不相交
				if(x>start.x) continue;
				
				// console.log('竖线直接比较y');
				if((end.y>start.y&&y>=start.y && y<=end.y)  || (end.y<start.y&&y>=end.y && y<=start.y)) {
					// console.log('++1');
					crossNum++;
				}
				continue;
			}
			var k=(end.y-start.y)/(end.x-start.x);
			// 交点的x坐标
			var x0 = (y-start.y)/k+start.x;
			// 因为射线向右水平，此处说明不相交
			if(x>x0) continue;
			
			if((end.x>start.x&&x0>=start.x && x0<=end.x) || (end.x<start.x&&x0>=end.x && x0<=start.x)) {
				// console.log('++2');
				crossNum++;
			}
		}
		// console.log('polygon',dot,crossNum,crossNum%2);
		return crossNum%2===1;
	};
	
	
	
	
})(Ycc);