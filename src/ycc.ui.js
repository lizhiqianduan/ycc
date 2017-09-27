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
	
	if(!Ycc.init || !Ycc.utils){
		return console.error("Error: Ycc.ui needs module Ycc.init and Ycc.utils!");
	}
	
    Ycc.ui = function(){};
	
    
	
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
		
		ctx.save();
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
		ctx.textAlign = settings.textAlign;
		ctx.textBaseline = settings.textBaseline;
		ctx.font = settings.fontSize+"px "+settings.fontFamily;
		ctx.strokeStyle = settings.strokeStyle;
		ctx.strokeText(con, afterTransDot[0], afterTransDot[1]);
		ctx.restore();
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
		
		ctx.save();
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
		ctx.textAlign = settings.textAlign;
		ctx.textBaseline = settings.textBaseline;
		ctx.font = settings.fontSize+"px "+settings.fontFamily;
		ctx.fillStyle = settings.fillStyle;
		ctx.fillText(con, afterTransDot[0], afterTransDot[1]);
		ctx.restore();
		return this;
	};
	
	/*
	 画直线
	 @param dot1 : array [x,y]
	 @lineSettingsObj : obj {strokeStyle:xx,lineWidth:xx}
	 */
	function stroke_line(dot1, dot2, lineSettingsObj){
		ctx.save();
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
		
		ctx.beginPath();
		ctx.moveTo(tpdot1[0], tpdot1[1]);
		ctx.lineTo(tpdot2[0], tpdot2[1]);
		ctx.strokeStyle = lineSettingsObj.strokeStyle;
		ctx.lineWidth = lineSettingsObj.lineWidth;
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
		return this;
	};
	
	/*
	* 画横线/竖线
	* direction : true 横线   false 竖线
	* */
	function stroke_vh_line(startDot, length, direction,options){
		ctx.save();
		var defaultSet = {
			//线条颜色
			strokeStyle:"#000",
			
			//线条宽度
			lineWidth:0
		};
		options = extend(defaultSet,options);
		if(options.lineWidth==0){
			return this;
		}
		ctx.beginPath();
		ctx.moveTo(startDot[0], startDot[1]);
		if(direction)
			ctx.lineTo(startDot[0]+length, startDot[1]);
		else
			ctx.lineTo(startDot[0], startDot[1]+length);
		ctx.strokeStyle = options.strokeStyle;
		ctx.lineWidth = options.lineWidth;
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
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
		ctx.strokeStyle = settings.strokeStyle;
		ctx.save();
		ctx.beginPath();
		if(settings.close)
			ctx.moveTo(settings.x,settings.y);
		ctx.arc(
			settings.x,
			settings.y,
			settings.radius,
			settings.startAngle/180*Math.PI,
			settings.endAngle/180*Math.PI,
			settings.direction
		);
		if(settings.close)
			ctx.lineTo(settings.x,settings.y);
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
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
		ctx.strokeStyle = settings.strokeStyle;
		ctx.save();
		ctx.beginPath();
		if(!settings.close)
			ctx.moveTo(settings.x,settings.y);
		ctx.arc(
			settings.x,
			settings.y,
			settings.radius,
			settings.startAngle/180*Math.PI,
			settings.endAngle/180*Math.PI,
			settings.direction
		);
		ctx.fill();
		ctx.closePath();
		ctx.restore();
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
		ctx.strokeStyle = settings.strokeStyle;
		ctx.lineWidth = settings.lineWidth;
		ctx.save();
		ctx.beginPath();
		ctx.rect(left_top_dot[0],left_top_dot[1],right_bottom_dot[0]-left_top_dot[0],right_bottom_dot[1]-left_top_dot[1]);
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
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
		ctx.fillStyle = settings.fillStyle;
		
		ctx.save();
		ctx.beginPath();
		ctx.rect(left_top_dot[0],left_top_dot[1],right_bottom_dot[0]-left_top_dot[0],right_bottom_dot[1]-left_top_dot[1]);
		ctx.fill();
		ctx.closePath();
		ctx.restore();
	}
	
	/*
	 * 将图片加入画布
	 * */
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
			ctx.save();
			ctx.scale(scaleX,scaleY);
			ctx.beginPath();
			ctx.drawImage(img, left_top_dot[0]/scaleX, left_top_dot[1]/scaleY); // 设置对应的图像对象，以及它在画布上的位置
			ctx.closePath();
			ctx.restore();
			settings.onDrawed(img);
		}
	}
	
	/**
     * 清除画布
	 */
	function clear(){
		ctx.save();
		ctx.fillStyle = Ycc.settings.canvasBg;
		ctx.fillRect(0, 0, ctx_width, ctx_height);
		ctx.restore();
	}




















})(Ycc);