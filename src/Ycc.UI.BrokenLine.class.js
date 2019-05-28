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
	 * @param option.smooth=false	{boolean}	线条是否平滑
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.BrokenLine = function BrokenLine(option) {
		Ycc.UI.Polygon.call(this,option);

		this.yccClass = Ycc.UI.BrokenLine;
		
		this.pointList = [];
		this.width = 1;
		this.color = "black";
		this.smooth = false;
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.BrokenLine.prototype,Ycc.UI.Polygon.prototype);
	
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
		
		// 计算容纳区的顶点坐标
		this.coordinates=this.rect.getVertices();
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
		// var pointList = pa?pa.transformToAbsolute(this.pointList):this.pointList;
		var pointList = this.transformByRotate(this.pointList);
		
		if(this.smooth)
			this._smoothLineRender(pointList);
		else
			this._normalRender(pointList);
		this.ctx.closePath();
		this.ctx.restore();
	};
	
	/**
	 * 普通绘制
	 * @param pointList
	 * @private
	 */
	Ycc.UI.BrokenLine.prototype._normalRender = function (pointList) {
		this.ctx.moveTo(pointList[0].x, pointList[0].y);
		for(var i =1;i<pointList.length;i++){
			this.ctx.lineTo(pointList[i].x, pointList[i].y);
		}
		this.ctx.stroke();
	};
	
	/**
	 * 绘制平滑的曲线
	 * 方案一：使用三次贝塞尔曲线
	 * 原理：
	 * 1、任意顶点的两个控制点连线始终平行于x轴
	 * 2、它们的连线始终经过顶点
	 * 3、两个控制点距离顶点的长度，根据顶点的相邻顶点在x轴方向上的距离乘以某个系数来确定
	 * 4、这两个控制点分属于不同的两条曲线，分别是起点的控制点和终点的控制点
	 * 5、第一个顶点和最后一个顶点只有一个控制点
	 * @param pointList	{Ycc.Math.Dot[]}	经过转换后的舞台绝对坐标点列表
	 */
	Ycc.UI.BrokenLine.prototype._smoothLineRender = function (pointList) {
		// 获取生成曲线的两个控制点和两个顶点，N个顶点可以得到N-1条曲线
		var list = getCurveList(pointList);
		// 调用canvas三次贝塞尔方法bezierCurveTo逐一绘制
		this.ctx.beginPath();
		for(var i=0;i<list.length;i++){
			this.ctx.moveTo(list[i].start.x,list[i].start.y);
			this.ctx.bezierCurveTo(list[i].dot1.x,list[i].dot1.y,list[i].dot2.x,list[i].dot2.y,list[i].end.x,list[i].end.y);
		}
		this.ctx.stroke();
		
		
		/**
		 * 获取曲线的绘制列表，N个顶点可以得到N-1条曲线
		 * @return {Array}
		 */
		function getCurveList(pointList) {
			// 长度比例系数
			var lenParam = 1/3;
			// 存储曲线列表
			var curveList = [];
			// 第一段曲线控制点1为其本身
			curveList.push({
				start:pointList[0],
				end:pointList[1],
				dot1:pointList[0],
				dot2:null
			});
			for(var i=1;i<pointList.length-1;i++){
				var cur = pointList[i];
				var next = pointList[i+1];
				var pre = pointList[i-1];
				// 上一段曲线的控制点2
				var p1 = new Ycc.Math.Dot(cur.x-lenParam*(Math.abs(cur.x-pre.x)),cur.y);
				// 当前曲线的控制点1
				var p2 = new Ycc.Math.Dot(cur.x+lenParam*(Math.abs(cur.x-next.x)),cur.y);
				// 上一段曲线的控制点2
				curveList[i-1].dot2 = p1;
				curveList.push({
					start:cur,
					end:next,
					dot1:p2,
					dot2:null
				});
			}
			// 最后一段曲线的控制点2为其本身
			curveList[curveList.length-1].dot2=pointList[pointList.length-1];
			return curveList;
		}
	};
	
	/**
	 * 绘制平滑的曲线
	 * 方案二：使用三次贝塞尔曲线
	 * 原理：
	 * 1、顶点两端的控制点连线始终经过顶点
	 * 2、控制点连线始终垂直于两向量的夹角平分线
	 * 3、两个控制点距离顶点的长度，根据顶点的相邻顶点在x轴方向上的距离乘以某个系数来确定
	 * 4、这两个控制点分属于不同的两条曲线，分别是起点的控制点和终点的控制点
	 * 5、第一个顶点和最后一个顶点只有一个控制点
	 * @param pointList	{Ycc.Math.Dot[]}	经过转换后的舞台绝对坐标点列表
	 */
	Ycc.UI.BrokenLine.prototype._smoothLineRender02 = function (pointList) {
		
		
		
		
		
		/**
		 * 获取曲线的绘制列表，N个顶点可以得到N-1条曲线
		 * @return {Array}
		 */
		function getCurveList() {
			var lenParam = 1/3;
			var curveList = [];
			// 第一段曲线控制点1为其本身
			curveList.push({
				start:pointList[0],
				end:pointList[1],
				dot1:pointList[0],
				dot2:null
			});
			for(var i=1;i<pointList.length-1;i++){
				var cur = pointList[i];
				var next = pointList[i+1];
				var pre = pointList[i-1];
				// 上一段曲线的控制点2
				var p1 = new Ycc.Math.Dot(cur.x-lenParam*(Math.abs(cur.x-pre.x)),cur.y);
				// 当前曲线的控制点1
				var p2 = new Ycc.Math.Dot(cur.x+lenParam*(Math.abs(cur.x-next.x)),cur.y);
				// 上一段曲线的控制点2
				curveList[i-1].dot2 = p1;
				curveList.push({
					start:cur,
					end:next,
					dot1:p2,
					dot2:null
				});
			}
			// 最后一段曲线的控制点2为其本身
			curveList[curveList.length-1].dot2=pointList[pointList.length-1];
			return curveList;
		}
	};
	
	
	
	
	
})(Ycc);