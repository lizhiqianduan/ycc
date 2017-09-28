/**
 * Created by xiaohei on 2016/4/1.
 * 功能说明：
 * 	控制所有的绘图基本操作，保存所有的绘图步骤
 * 	并提供回退、前进、清空、快照等方法
 *
 * 依赖：
 * 	Ycc.init
 * 	Ycc.utils
 */

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
	/**
	 * UI类的构造函数
	 * @param yccInstance	{Ycc}	ycc的初始化实例，在init中初始化
	 * @constructor
	 */
	Ycc.UI = function(yccInstance){
		var self = this;

		// 当前绘图环境
		self.ctx = yccInstance.ctx;
		// 当前ycc实例
		self.yccInstance = yccInstance;
		// 使用UIStep类记录如下UI方法，用于回退
		var publicMethods = [stroke_font,fill_font,stroke_line,stroke_circle,fill_circle,stroke_rect,fill_rect,draw_image];
		for(var i = 0;i<publicMethods.length;i++){
			var fn = publicMethods[i];
			self[fn.name] = function(f){
				return function () {
					self._steps.push(new UIStep(f.name,arguments));
					f.apply(self,arguments);
				}
			}(fn);
		}

		
		self.clear = clear;						// 清空画布
		self.goBack = goBack;					// 回退
		
		// 私有属性和方法
		self._steps = [];						//UI绘图的步骤队列
		self._renderByStep = renderByStep;		//根据步骤绘制canvas
	};
	
	
	/**
	 * UI绘图的步骤类
	 * @param stepName	{String}	步骤名称，即UI类的方法名
	 * @param params	{Array}		调用方法时所传递的参数
	 * @constructor
	 */
	function UIStep(stepName, params) {
		this.stepName = stepName;
		this.params = params;
	}
	
	


 
	
	/*
	 *文字描边
	 @param con : string you want to draw
	 @param settings : obj { 		//文字样式设置
	 strokeStyle:xx
	 font : css string
	 startDot : array [x,y]       	//文字的左下角为[0,0],并不是左上角
	 }
	 */
	function stroke_font(con, settings) {
		
		if (!isString(con) && !isNum(con)) {
			console.log('%cFunction drawFont need param 1 to be string or number', 'color:red');
			return false;
		}
		
		this.ctx.save();
		var defaultSet = {
			//文字的起点，默认left=0 top=0
			x: 0,
			y:0,
			//水平0点靠左
			textAlign: "left",
			//竖直0点从bottom开始
			textBaseline: "top",
			//文字大小和字体
			fontSize: 16,
			
			fontFamily:"Arial",
			//绘制路径的线宽
			lineWidth: 1,
			//描边颜色
			strokeStyle: "#000"
		};
		settings = (settings && isObj(settings)) ? extend( defaultSet, settings) : defaultSet;
		var afterTransDot = [settings.x,settings.y];
		this.ctx.textAlign = settings.textAlign;
		this.ctx.textBaseline = settings.textBaseline;
		this.ctx.font = settings.fontSize+"px "+settings.fontFamily;
		this.ctx.strokeStyle = settings.strokeStyle;
		this.ctx.strokeText(con, afterTransDot[0], afterTransDot[1]);
		this.ctx.restore();
		return this;
	}
	
	/*
	 *文字填充
	 @param con : string you want to draw
	 @param settings : obj { 		//文字样式设置
	 fillStyle:xx
	 font : css string
	 startDot : array [x,y]       	//文字的左下角为[0,0],并不是左上角
	 }
	 */
	function fill_font(con, settings) {
		if (!isString(con) && !isNum(con)) {
			console.log('%cFunction drawFont need param 1 to be string or number', 'color:red');
			return false;
		}
		
		this.ctx.save();
		var defaultSet = {
			//文字的起点，默认left=0 top=0
			x:0,
			y:0,
			//水平0点靠左
			textAlign: "left",
			//竖直0点从bottom开始
			textBaseline: "top",
			//文字大小和字体
			fontSize: 16,
			
			fontFamily:"Arial",
			//绘制路径的线宽
			lineWidth: 1,
			//描边颜色
			strokeStyle: "#000",
			fillStyle : "#000"
		};
		settings = (settings && isObj(settings)) ? extend( defaultSet, settings) : defaultSet;
		var afterTransDot = [settings.x,settings.y];
		this.ctx.textAlign = settings.textAlign;
		this.ctx.textBaseline = settings.textBaseline;
		this.ctx.font = settings.fontSize+"px "+settings.fontFamily;
		this.ctx.fillStyle = settings.fillStyle;
		this.ctx.fillText(con, afterTransDot[0], afterTransDot[1]);
		this.ctx.restore();
		return this;
	};
	
	/*
	 画直线
	 @param dot1 : array [x,y]
	 @lineSettingsObj : obj {strokeStyle:xx,lineWidth:xx}
	 */
	function stroke_line(dot1, dot2, lineSettingsObj){
		this.ctx.save();
		var defaultSet = {
			//线条颜色
			strokeStyle:"#000",
			
			//线条宽度
			lineWidth:1
		};
		lineSettingsObj = extend(defaultSet,lineSettingsObj);
		//变换坐标
		var tpdot1 = (dot1);
		var tpdot2 = (dot2);
		
		this.ctx.beginPath();
		this.ctx.moveTo(tpdot1[0], tpdot1[1]);
		this.ctx.lineTo(tpdot2[0], tpdot2[1]);
		this.ctx.strokeStyle = lineSettingsObj.strokeStyle;
		this.ctx.lineWidth = lineSettingsObj.lineWidth;
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
		return this;
	};
	
	/*
	 * 画一个空心圆
	 * */
	function stroke_circle(options){
		var defaultSet = {
			x:10,
			y:10,
			startAngle:0,
			endAngle:360,
			// 顺时针还是逆时针
			direction:true,
			//半径
			radius:10,
			//边框颜色
			strokeStyle:"#000",
			// 起始点是否封闭
			close:false
		};
		var settings = extend(defaultSet, options);
		this.ctx.strokeStyle = settings.strokeStyle;
		this.ctx.save();
		this.ctx.beginPath();
		if(settings.close)
			this.ctx.moveTo(settings.x,settings.y);
		this.ctx.arc(
			settings.x,
			settings.y,
			settings.radius,
			settings.startAngle/180*Math.PI,
			settings.endAngle/180*Math.PI,
			settings.direction
		);
		if(settings.close)
			this.ctx.lineTo(settings.x,settings.y);
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
	}
	
	/*
	 * 填充一个圆
	 * */
	function fill_circle(options){
		var defaultSet = {
			x:10,
			y:10,
			startAngle:0,
			endAngle:360,
			// 顺时针还是逆时针
			direction:true,
			//半径
			radius:10,
			//填充颜色
			fillStyle:"#000",
			// 起始点是否封闭
			close:false
		};
		var settings = extend(defaultSet, options);
		this.ctx.strokeStyle = settings.strokeStyle;
		this.ctx.save();
		this.ctx.beginPath();
		if(!settings.close)
			this.ctx.moveTo(settings.x,settings.y);
		this.ctx.arc(
			settings.x,
			settings.y,
			settings.radius,
			settings.startAngle/180*Math.PI,
			settings.endAngle/180*Math.PI,
			settings.direction
		);
		this.ctx.fill();
		this.ctx.closePath();
		this.ctx.restore();
	}
	
	/*
	 * 矩形描边
	 * */
	function stroke_rect(left_top_dot,right_bottom_dot,options){
		var defaultSet = {
			//填充颜色
			strokeStyle:"#000",
			lineWidth:1
		};
		var settings = extend(defaultSet, options);
		this.ctx.strokeStyle = settings.strokeStyle;
		this.ctx.lineWidth = settings.lineWidth;
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.rect(left_top_dot[0],left_top_dot[1],right_bottom_dot[0]-left_top_dot[0],right_bottom_dot[1]-left_top_dot[1]);
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
	}
	
	/*
	 * 矩形描边
	 * */
	function fill_rect(left_top_dot,right_bottom_dot,options){
		var defaultSet = {
			//填充颜色
			fillStyle:"#000"
		};
		var settings = extend(defaultSet, options);
		this.ctx.fillStyle = settings.fillStyle;
		
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.rect(left_top_dot[0],left_top_dot[1],right_bottom_dot[0]-left_top_dot[0],right_bottom_dot[1]-left_top_dot[1]);
		this.ctx.fill();
		this.ctx.closePath();
		this.ctx.restore();
	}
	
	/**
	 * 加载图片至画布
	 * @param imagesrc			{String}	图片路径
	 * @param left_top_dot		{Array}		左上角坐标
	 * @param options			{Object}	设置回调和图片高宽
	 */
	function draw_image(imagesrc,left_top_dot,options){
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
		}
	}
	
	
	/**
	 * 根据步骤绘制canvas
	 */
	function renderByStep(){
		var stepsTmp = this._steps.slice(0);
		this._steps = [];
		for(var i = 0;i<stepsTmp.length;i++){
			this[stepsTmp[i].stepName].apply(this,stepsTmp[i].params);
		}
	}
	
	/**
	 * 清除画布
	 */
	function clear() {
		var defaultSet = {
			//填充颜色
			fillStyle:"#fff"
		};
		this.ctx.fillStyle = defaultSet.fillStyle;
		
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.rect(0,0,this.yccInstance.ctx_width,this.yccInstance.ctx_height);
		this.ctx.fill();
		this.ctx.closePath();
		this.ctx.restore();
	}
	
	/**
	 * 回退
	 * @param stepNumber	{Number}	回退的步数，默认为1
	 * 		如果stepNumber大于总步数，则清空画布
	 */
	function goBack(stepNumber) {
		if(!isNum(stepNumber)){
			stepNumber = 1;
		}
		this.clear();
		if(stepNumber>=this._steps.length){
			this._steps = [];
		}else{
			this._steps = this._steps.slice(0,this._steps.length-stepNumber);
		}
		this._renderByStep();
	}



















})(window.Ycc);