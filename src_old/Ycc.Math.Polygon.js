/**
 * @file    Ycc.Math.Polygon.js
 * @author  xiaohei
 * @date    2019/4/26
 * @description  Ycc.Math.Polygon文件
 * @requires Ycc.Math
 * 数学图形中的多边形类
 */

(function(Ycc){
	
	/**
	 * 数学图形中的多边形类
	 * 此类全部采用点的绝对坐标，不涉及坐标系转换、偏移等操作
	 * @param option
	 * @param option.coordinates
	 * @constructor
	 */
	Ycc.Math.Polygon = function (option) {
		/**
		 * 多边形点坐标的数组，为保证图形能够闭合，起点和终点必须相等
		 * @type {Ycc.Math.Dot[]}
		 */
		this.coordinates=option.coordinates||[];
	};
	
	
	/**
	 * 判断多边形是否包含某个点
	 * 两种方法：
	 * 方法一：经过该点的水平射线与多边形的焦点数，即Ray-casting Algorithm
	 * 方法二：某个点始终位于多边形逆时针向量的左侧、或者顺时针方向的右侧即可判断，算法名忘记了
	 * 此方法采用方法一，并假设该射线平行于x轴，方向为x轴正方向
	 * @param dot {Ycc.Math.Dot} 需要判断的点
	 */
	Ycc.Math.Polygon.prototype.isContainDot = function (dot) {
		var x = dot.x,y=dot.y;
		var crossNum = 0;
		for(var i=0;i<this.coordinates.length-1;i++){
			var start = this.coordinates[i];
			var end = this.coordinates[i+1];
			if(start.y===end.y && x>=start.x && x<=end.x) {
				crossNum++;
				continue;
			}
			var k=(end.y-start.y)/(end.x-start.x);
			var x0 = (y-start.y)/k+start.x;
			if(x0>=start.x && x0<=end.x) crossNum++;
		}
		return crossNum/2===1;
	};
	
	
})(Ycc);