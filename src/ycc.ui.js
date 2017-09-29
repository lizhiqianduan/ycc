/**
 * @file 	ycc.ui.js
 * @author	xiaohei
 * @date	2016/4/1
 *
 * @desc
 * 控制所有的绘图基本操作，保存所有的绘图步骤，并提供回退、前进、清空、快照等方法。
 * 不管理图形颜色、阴影、文字等内容。
 *
 * @requires Ycc.init
 * @requires Ycc.utils
 * */

(function(Ycc){
	// 检查依赖项
	if(!Ycc.init || !Ycc.utils){
		return console.error("Error: Ycc.ui needs module Ycc.init and Ycc.utils!");
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
	 * 每个原子图形都会使用UIStep进行记录，而组合图形不会被记录。
	 *
	 * @param yccInstance	{Ycc}	ycc的初始化实例，在init中初始化
	 * @constructor
	 */
	Ycc.UI = function(yccInstance){
		
		/**
		 * UI绘图的步骤队列
		 * @type {Array}
		 * @private
		 */
		this._steps = [];
		
		
		/**
		 * 当前绘图环境
		 */
		this.ctx = yccInstance.ctx;
		
		/**
		 * 当前UI所属的ycc实例
		 * @type {Ycc}
		 */
		this.yccInstance = yccInstance;
		
		
		
		// // 使用UIStep类记录如下UI方法，用于回退
		// var publicMethods = [stroke_font,fill_font,ellipse,circle,stroke_line,stroke_circle,fill_circle,rect,draw_image];
		// for(var i = 0;i<publicMethods.length;i++){
		// 	var fn = publicMethods[i];
		// 	/**
		// 	 * @member {Function}
		// 	 * @desc 	各个方法
		// 	 */
		// 	self[fn.name] = function(f){
		// 		return function () {
		// 			self._steps.push(new UIStep(f.name,arguments));
		// 			f.apply(self,arguments);
		// 		}
		// 	}(fn);
		// }
	};
	
	
	/**
	 * UI绘图的步骤类
	 * @param stepName	{String}	步骤名称，即UI类的方法名
	 * @param params	{Array}		调用方法时所传递的参数，用于传递给apply方法
	 * @constructor
	 */
	Ycc.UI.UIStep = UIStep;
	
	function UIStep(stepName, params) {
		this.stepName = stepName;
		this.params = params;
	}
	
	
	
	
	
	/*******************************************************************************
	 * 定义UI类的原子图形
	 ******************************************************************************/
	/**
	 * 文字，`原子图形`
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
		this._steps.push(new UIStep("text",arguments));
		return this;
	};
	
	/**
	 * 画线，`原子图形`
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
		this._steps.push(new UIStep("line",arguments));
		return this;
	};
	
	
	/**
	 * 矩形，`原子图形`
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
		this._steps.push(new UIStep("rect",arguments));
		return this;
	};
	
	/**
	 * 加载图片至画布，`原子图形`
	 * @param imagesrc			{String}	图片路径
	 * @param left_top_dot		{Array}		左上角坐标
	 * @param options			{Object}	设置回调和图片高宽
	 */
	Ycc.UI.prototype.image = function (imagesrc,left_top_dot,options){
		var defaultSet = {
			onDrawed:function(){},
			width:0,
			height:0
		};
		var settings = extend(defaultSet, options);
		var img = new Image();
		img.src = imagesrc;
		
		img.onload = function(){
			var scaleX = 1;
			var scaleY = 1;
			if(settings.width && settings.height){
				scaleX = settings.width/img.width;
				scaleY = settings.height/img.height;
			}else if(settings.width && !settings.height){
				scaleX = scaleY = settings.width/img.width;
			}else if(!settings.width && settings.height){
				scaleX = scaleY = settings.height/img.height;
			}
			this.ctx.save();
			this.ctx.scale(scaleX,scaleY);
			this.ctx.beginPath();
			this.ctx.drawImage(img, left_top_dot[0]/scaleX, left_top_dot[1]/scaleY); // 设置对应的图像对象，以及它在画布上的位置
			this.ctx.closePath();
			this.ctx.restore();
			settings.onDrawed(img);
		};
		this._steps.push(new UIStep("image",arguments));
		return this;
	};
	
	/**
	 * 椭圆，`原子图形`
	 *
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
		this._steps.push(new UIStep("ellipse",arguments));
		return this;
	};
	
	
	
	/**
	 * 圆弧，`原子图形`
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
		this._steps.push(new UIStep("circleArc",arguments));
		return this;
		
	};
	
	/**
	 * 扇形，`原子图形`
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
		this._steps.push(new UIStep("sector",arguments));
		return this;
	};


	/*******************************************************************************
	 * 定义UI类的组合图形
	 ******************************************************************************/
	/**
	 * 圆，`组合图形`
	 * @param centrePoint	圆心
	 * @param r				半径
	 * @param fill			是否填充
	 */
	Ycc.UI.prototype.circle = function(centrePoint, r, fill) {
		this.ellipse(centrePoint,r,r,0,fill);
		return this;
	};
	
	
	
	/**************************************************/
	
	/**
	 * 根据步骤绘制canvas
	 */
	Ycc.UI.prototype.renderByStep = function(){
		var stepsTmp = this._steps.slice(0);
		this._steps = [];
		for(var i = 0;i<stepsTmp.length;i++){
			this[stepsTmp[i].stepName].apply(this,stepsTmp[i].params);
		}
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
		this.ctx.rect(0,0,this.yccInstance.ctx_width,this.yccInstance.ctx_height);
		this.ctx.fill();
		this.ctx.closePath();
		this.ctx.restore();
		return this;
		
	};
	
	/**
	 * 回退
	 * @param stepNumber	{Number}	回退的步数，默认为1;如果stepNumber大于总步数，则清空画布
	 */
	Ycc.UI.prototype.goBack = function(stepNumber) {
		if(!isNum(stepNumber)){
			stepNumber = 1;
		}
		this.clear();
		if(stepNumber>=this._steps.length){
			this._steps = [];
		}else{
			this._steps = this._steps.slice(0,this._steps.length-stepNumber);
		}
		this.renderByStep();
		return this;
		
	}


















})(window.Ycc);