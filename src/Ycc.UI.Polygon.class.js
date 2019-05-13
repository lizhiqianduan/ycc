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
	 * @param option.coordinates  	{Ycc.Math.Dot[]}    多边形点坐标的数组，为保证图形能够闭合，起点和终点必须相等。注意：点列表的坐标为相对坐标
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
		 * 颜色
		 * @type {string}
		 */
		this.fillStyle = "blue";
		
		/**
		 * 光线投射模式 1-升级模式 2-普通模式
		 * @type {number}
		 */
		this.noneZeroMode = 1;
		
		/**
		 * 是否绘制点的下标
		 * @type {boolean}
		 */
		this.isDrawIndex = false;
		
		/**
		 * 是否显示旋转缩放之前的位置
		 * @type {boolean}
		 */
		this.isShowScaleRotateBeforeUI = false;
		
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
		var start = this.transformByScaleRotate(coordinates[0]);
		
		// console.log('render');
		
		// 绘制旋转缩放之前的UI
		if(this.isShowScaleRotateBeforeUI) this.__renderBeforeUI(ctx);

		ctx.save();
		
		ctx.fillStyle = this.fillStyle;
		ctx.strokeStyle = this.strokeStyle;
		
		ctx.beginPath();
		ctx.moveTo(start.x,start.y);
		for(var i=0;i<this.coordinates.length-1;i++){
			var dot = this.transformByScaleRotate(this.coordinates[i]);
			if(this.isDrawIndex) ctx.fillText(i+'',dot.x-10,dot.y+10);
			ctx.lineTo(dot.x,dot.y);
		}
		ctx.closePath();
		this.fill?ctx.fill():ctx.stroke();
		ctx.restore();
	
	
	
		
	};
	
	
	/**
	 * 获取UI的绝对坐标，只计算图层坐标和UI的位置坐标x、y
	 * 不考虑UI的缩放和旋转，缩放旋转可通过其他方法转换
	 * @param [pos] {Ycc.Math.Dot}	获取到的位置对象，非必传
	 * @return {Ycc.Math.Dot}
	 * @override
	 */
	Ycc.UI.Polygon.prototype.getAbsolutePosition = function(pos){
		pos = pos || new Ycc.Math.Dot(this.x,this.y);
		var pa = this.getParent();
		
		if(!pa){
			// 最顶层的UI需要加上图层的坐标
			pos.x = this.x+this.belongTo.x;
			pos.y = this.y+this.belongTo.y;
		}else{
			var paPos = pa.getAbsolutePosition();
			pos.x += paPos.x;
			pos.y += paPos.y;
		}
		return pos;
	};
	
	/**
	 * 绘制旋转缩放之前的UI
	 * @private
	 */
	Ycc.UI.Polygon.prototype.__renderBeforeUI = function (ctx) {
		var self = this;
		var pa = this.getParent();
		var paPos =pa? pa.getAbsolutePosition():new Ycc.Math.Dot();
		var start = new Ycc.Math.Dot(this.coordinates[0].x+paPos.x,this.coordinates[0].y+paPos.y);
		
		ctx.save();
		// 虚线
		ctx.setLineDash([10]);
		ctx.beginPath();
		ctx.moveTo(start.x,start.y);
		for(var i=0;i<self.coordinates.length-1;i++){
			var dot = self.coordinates[i];
			ctx.lineTo(dot.x+paPos.x,dot.y+paPos.y);
		}
		ctx.closePath();
		ctx.stroke();
		ctx.restore();
	};

	
	/**
	 * 重载基类的包含某个点的函数，用于点击事件等的响应
	 * 两种方法：
	 * 方法一：经过该点的水平射线与多边形的焦点数，即Ray-casting Algorithm
	 * 方法二：某个点始终位于多边形逆时针向量的左侧、或者顺时针方向的右侧即可判断，算法名忘记了
	 * 此方法采用方法一，并假设该射线平行于x轴，方向为x轴正方向
	 * @param dot {Ycc.Math.Dot} 需要判断的点
	 * @param noneZeroMode {Number} 是否noneZeroMode 1--启用 2--关闭 默认启用
	 * 		从这个点引出一根“射线”，与多边形的任意若干条边相交，计数初始化为0，若相交处被多边形的边从左到右切过，计数+1，若相交处被多边形的边从右到左切过，计数-1，最后检查计数，如果是0，点在多边形外，如果非0，点在多边形内
	 * @return {boolean}
	 */
	Ycc.UI.Polygon.prototype.containDot = function (dot,noneZeroMode) {
		// 默认启动none zero mode
		noneZeroMode=noneZeroMode||this.noneZeroMode;
		// 由于coordinates为相对坐标，此处将dot转化为相对坐标
		var _dot = this.transformToLocal(dot);
		
		var x = _dot.x,y=_dot.y;
		var crossNum = 0;
		// 点在线段的左侧数目
		var leftCount = 0;
		// 点在线段的右侧数目
		var rightCount = 0;
		for(var i=0;i<this.coordinates.length-1;i++){
			var start = this.transformByScaleRotate(this.coordinates[i]);
			var end = this.transformByScaleRotate(this.coordinates[i+1]);
			
			// 起点、终点斜率不存在的情况
			if(start.x===end.x) {
				// 因为射线向右水平，此处说明不相交
				if(x>start.x) continue;
				
				// 从左侧贯穿
				if((end.y>start.y&&y>=start.y && y<=end.y)){
					leftCount++;
					// console.log('++1');
					crossNum++;
				}
				// 从右侧贯穿
				if((end.y<start.y&&y>=end.y && y<=start.y)) {
					rightCount++;
					// console.log('++1');
					crossNum++;
				}
				continue;
			}
			// 斜率存在的情况，计算斜率
			var k=(end.y-start.y)/(end.x-start.x);
			// 交点的x坐标
			var x0 = (y-start.y)/k+start.x;
			// 因为射线向右水平，此处说明不相交
			if(x>x0) continue;
			
			if((end.x>start.x&&x0>=start.x && x0<=end.x)){
				// console.log('++2');
				crossNum++;
				if(k>=0) leftCount++;
				else rightCount++;
			}
			if((end.x<start.x&&x0>=end.x && x0<=start.x)) {
				// console.log('++2');
				crossNum++;
				if(k>=0) rightCount++;
				else leftCount++;
			}
		}
		
		// console.log('polygon',dot,noneZeroMode,crossNum,crossNum%2,leftCount,rightCount);
		return noneZeroMode===1?leftCount-rightCount!==0:crossNum%2===1;
	};
	
	
	
	
})(Ycc);