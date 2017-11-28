/**
 * @file 	ycc.ui.js
 * @author	xiaohei
 * @date	2016/4/1
 *
 * @desc
 * 控制所有的绘图基本操作，保存所有的绘图步骤，并提供回退、前进、清空、快照等方法。
 * 不管理图形颜色、阴影、文字等内容。
 * 所有图形绘制都为同步操作
 *
 * @requires Ycc
 * @requires Ycc.utils
 * */

(function(Ycc){
	// 检查依赖项
	if(!Ycc || !Ycc.utils){
		return console.error("Error: Ycc.ui needs module `Ycc` and `Ycc.utils`!");
	}
	// 方法别名
	var isObj 		= Ycc.utils.isObj,
		isArr 		= Ycc.utils.isArray,
		isString	= Ycc.utils.isString,
		isNum 		= Ycc.utils.isNum,
		extend 		= Ycc.utils.extend;
	
	/*******************************************************************************
	 * 定义所需要的类
	 ******************************************************************************/

	/**
	 * UI类，提供绘图基本的原子图形和组合图形。
	 * 每个UI类的对象都跟一个canvas绑定。
	 *
	 * @param canvasDom	{HTMLElement}
	 * @constructor
	 */
	Ycc.UI = function(canvasDom){

		/**
		 * 保存的快照，每个元素都是`getImageData`的返回值
		 * @type {Array}
		 * @private
		 */
		this._photos = [];
		
		
		/**
		 * 当前绘图环境
		 */
		this.ctx = canvasDom.getContext('2d');
		
		/**
		 * 当前绘图环境的宽
		 */
		this.ctxWidth = canvasDom.width;

		/**
		 * 当前绘图环境的高
		 */
		this.ctxHeight = canvasDom.height;
		
	};

	
	
	
	
	/*******************************************************************************
	 * 定义UI类的基础图形，不带rect容器的图形
	 ******************************************************************************/
	/**
	 * 文字
	 * @param positionDot
	 * @param content
	 * @param [fill]
	 * @returns {Ycc.UI}
	 */
	Ycc.UI.prototype.text = function (positionDot,content,fill) {
		this.ctx.save();
		if(fill)
			this.ctx.fillText(content,positionDot[0],positionDot[1]);
		else
			this.ctx.strokeText(content,positionDot[0],positionDot[1]);
		this.ctx.restore();
		return this;
	};
	
	/**
	 * 画线
	 * @param dot1
	 * @param dot2
	 * @returns {Ycc.UI}
	 */
	Ycc.UI.prototype.line = function (dot1, dot2) {
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.moveTo(dot1[0], dot1[1]);
		this.ctx.lineTo(dot2[0], dot2[1]);
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
		return this;
	};
	
	
	/**
	 * 矩形
	 * @param left_top_dot
	 * @param right_bottom_dot
	 * @param fill
	 */
	Ycc.UI.prototype.rect=function (left_top_dot,right_bottom_dot,fill){
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.rect(left_top_dot[0],left_top_dot[1],right_bottom_dot[0]-left_top_dot[0],right_bottom_dot[1]-left_top_dot[1]);
		this.ctx.closePath();
		
		if(!fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		this.ctx.restore();
		return this;
	};
	
	/**
	 * 椭圆
	 * @param centrePoint	{Dot}		椭圆中心点
	 * @param width			{Number}	长半轴
	 * @param height		{Number}	短半轴
	 * @param rotateAngle	{Number}	旋转角
	 * @param fill			{Boolean}	是否填充
	 */
	Ycc.UI.prototype.ellipse = function(centrePoint,width,height,rotateAngle,fill) {
		
		this.ctx.save();
		var r = (width > height) ? width : height;
		// 计算压缩比例
		var ratioX = width / r;
		var ratioY = height / r;
		// 默认旋转中心位于画布左上角，需要改变旋转中心点
		this.ctx.translate(centrePoint[0],centrePoint[1]);
		this.ctx.rotate(parseInt(rotateAngle)*Math.PI/180);
		// 再变换回原来的旋转中心点
		this.ctx.translate(-centrePoint[0],-centrePoint[1]);
		this.ctx.scale(ratioX, ratioY);
		this.ctx.beginPath();
		this.ctx.arc(centrePoint[0] / ratioX,  centrePoint[1]/ ratioY, r, 0, 2 * Math.PI, false);
		this.ctx.closePath();
		
		if(!fill)
			this.ctx.stroke();
		else
			this.ctx.fill();

		this.ctx.restore();
		return this;
	};
	
	/**
	 * 圆弧
	 * @param centrePoint			圆心
	 * @param r						半径
	 * @param startAngle			起始角
	 * @param endAngle				结束角
	 * @param [counterclockwise]	方向
	 */
	Ycc.UI.prototype.circleArc = function (centrePoint, r,startAngle,endAngle,counterclockwise) {
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.arc(
			centrePoint[0],
			centrePoint[1],
			r,
			startAngle/180*Math.PI,
			endAngle/180*Math.PI,
			counterclockwise
		);
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
		return this;
		
	};
	
	/**
	 * 扇形
	 * @param centrePoint			圆心
	 * @param r						半径
	 * @param startAngle			起始角
	 * @param endAngle				结束角
	 * @param [fill]				是否填充
	 * @param [counterclockwise]	方向
	 */
	Ycc.UI.prototype.sector = function (centrePoint, r,startAngle,endAngle,fill,counterclockwise) {
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.lineTo(centrePoint[0],centrePoint[1]);
		this.ctx.arc(centrePoint[0],centrePoint[1],r,startAngle*Math.PI/180,endAngle*Math.PI/180,counterclockwise);
		this.ctx.lineTo(centrePoint[0],centrePoint[1]);
		this.ctx.closePath();
		if(!fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		this.ctx.restore();
		return this;
	};
	
	/**
	 * 根据多个点画折线，可以用此方法实现跟随鼠标
	 * @param pointList		{Array}		Dot数组，即二维数组
	 */
	Ycc.UI.prototype.foldLine = function (pointList) {
		if(pointList.length<2) return console.error("Error: 参数错误！");

		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.moveTo(pointList[0][0],pointList[0][1]);
		for(var i =0;i<pointList.length;i++){
			this.ctx.lineTo(pointList[i][0],pointList[i][1]);
		}
		this.ctx.stroke();
		this.ctx.restore();
		return this;
	};
	
	/**
	 * 圆
	 * @param centrePoint	圆心
	 * @param r				半径
	 * @param fill			是否填充
	 */
	Ycc.UI.prototype.circle = function(centrePoint, r, fill) {
		this.ellipse(centrePoint,r,r,0,fill);
		return this;
	};
	
	/**
	 * 绘制图片
	 * @param img				{Image}		图片路径
	 * @param left_top_dot		{Array}		左上角坐标
	 */
	Ycc.UI.prototype.image = function (img,left_top_dot){
		var self = this;
		left_top_dot = left_top_dot || [0,0];

		self.ctx.save();
		self.ctx.beginPath();
		self.ctx.drawImage(img, left_top_dot[0], left_top_dot[1]); // 设置对应的图像对象，以及它在画布上的位置
		self.ctx.closePath();
		self.ctx.restore();
		return this;
	};
	
	
	
	/**
	 * 给定宽度，获取能容纳的最长字符串
	 * @param content {string}
	 * @param width {number}
	 * @return {string}
	 * @private
	 */
	Ycc.UI.prototype._getMaxLenContent = function (content,width) {
		var out = content;
		var outW = 0;
		
		if(this.ctx.measureText(content).width<=width)
			return content;
		for(var i = 0;i<content.length;i++){
			out = content.slice(0,i);
			outW = this.ctx.measureText(out).width;
			if(outW>width){
				return content.slice(0,i-1);
			}
		}
	};
	
	
	
	
	
	/*******************************************************************************
	 * 定义UI类的控制方法
	 ******************************************************************************/
	/**
	 * 缩放绘图，对之后的所有操作都有效
	 * @param scaleX
	 * @param scaleY
	 * @returns {Ycc.UI}
	 */
	Ycc.UI.prototype.scale = function (scaleX, scaleY) {
		this.ctx.scale(scaleX,scaleY);
		return this;
	};

	/**
	 * 清除画布
	 */
	Ycc.UI.prototype.clear=function () {
		var defaultSet = {
			//默认填充颜色
			fillStyle:"#fff"
		};
		this.ctx.fillStyle = defaultSet.fillStyle;
		
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.rect(0,0,this.ctxWidth,this.ctxHeight);
		this.ctx.fill();
		this.ctx.closePath();
		this.ctx.restore();
		return this;
	};
	

	
	
	















})(window.Ycc);