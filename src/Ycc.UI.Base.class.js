/**
 * @file    Ycc.UI.Base.class.js
 * @author  xiaohei
 * @date    2017/11/15
 * @description  Ycc.UI.Base.class文件。
 * 所有容器UI的基础类
 * @requires Ycc.UI
 * @requires Ycc.utils
 */

(function (Ycc) {
	var uid = 0;
	
	/**
	 * 所有UI类的基类。
	 * <br> 所有UI都必须遵循先计算、后绘制的流程
	 * @constructor
	 * @extends Ycc.Listener
	 */
	Ycc.UI.Base = function (option) {
		Ycc.Listener.call(this);
		
		/**
		 * 构造器的引用，Ycc中的每个类都有此属性
		 */
		this.yccClass = Ycc.UI.Base;
		
		/**
		 * UI的唯一ID
		 * @type {number}
		 */
		this.id = uid++;
		
		/**
		 * UI实例的名字
		 * @type {string}
		 */
		this.name = "";
		
		/**
		 * 绘图环境
		 * @type {null}
		 */
		this.ctx = null;
		/**
		 * UI的绘图区域
		 * @type {Ycc.Math.Rect}
		 */
		this.rect = new Ycc.Math.Rect();
		
		/**
		 * UI对象的锚点坐标。相对坐标。相对于rect的x
		 * 锚点坐标主要用于图形的旋转、平移、缩放
		 * @type {number}
		 */
		this.anchorX = 0;

		/**
		 * UI对象的锚点坐标。相对坐标。相对于rect的y
		 * 锚点坐标主要用于图形的旋转、平移、缩放
		 * @type {number}
		 */
		this.anchorY = 0;
		
		/**
		 * x方向的缩放比例
		 * @type {number}
		 */
		this.scaleX = 1;

		/**
		 * y方向的缩放比例
		 * @type {number}
		 */
		this.scaleY = 1;
		
		/**
		 * 相对于锚点的旋转角度
		 * @type {number}
		 */
		this.rotation = 0;
		
		
		/**
		 * 区域的背景色
		 * @type {string}
		 */
		this.rectBgColor = "transparent";

		/**
		 * 背景色的透明度。默认不透明
		 * @type {number}
		 */
		this.rectBgAlpha = 1;
		
		/**
		 * 是否显示
		 * @type {boolean}
		 */
		this.show = true;
		
		/**
		 * 线条宽度
		 * @type {number}
		 */
		this.lineWidth = 1;
		
		/**
		 * 填充颜色
		 * @type {string}
		 */
		this.fillStyle = "black";

		/**
		 * 线条颜色
		 * @type {string}
		 */
		this.strokeStyle = "black";
		
		/**
		 * UI所属的图层
		 * @type {Ycc.Layer}
		 */
		this.belongTo = null;
		
		/**
		 * 用户自定义的数据
		 * @type {null}
		 */
		this.userData = null;
		
		/**
		 * 基础绘图UI
		 * @type {Ycc.UI}
		 */
		this.baseUI = null;
		
		/**
		 * 初始化之前的hook
		 * @type {function}
		 */
		this.beforeInit = null;
		
		/**
		 * 初始化之后的hook
		 * @type {function}
		 */
		this.afterInit = null;
		
		
		this.extend(option);
	};
	
	Ycc.UI.Base.prototype = new Ycc.Listener();
	//Ycc.UI.Base.prototype.constructor = Ycc.UI.Base;
	
	
	/**
	 * 在某个图层中初始化UI
	 * @param layer	{Layer}		图层
	 */
	Ycc.UI.Base.prototype.init = function (layer) {
		Ycc.utils.isFn(this.beforeInit) && this.beforeInit();
		this.belongTo = layer;
		this.ctx = layer.ctx;
		this.baseUI = new Ycc.UI(layer.canvasDom);

		// 初始化时计算一次属性
		this.computeUIProps();
		Ycc.utils.isFn(this.afterInit) && this.afterInit();
	};
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Base.prototype.computeUIProps = function () {
	
	};
	
	/**
	 * 渲染rect的背景
	 */
	Ycc.UI.Base.prototype.renderRectBgColor = function () {
		this.ctx.save();
		this.ctx.globalAlpha = this.rectBgAlpha;
		this.ctx.fillStyle = this.rectBgColor;
		this.ctx.beginPath();
		this.ctx.rect(this.rect.x,this.rect.y,this.rect.width,this.rect.height);
		this.ctx.closePath();
		this.ctx.fill();
		this.ctx.restore();
	};
	
	/**
	 * 删除自身。
	 * 若子类包含多个UI，需要重载
	 */
	Ycc.UI.Base.prototype.removeSelf = function () {
		this.belongTo.removeUI(this);
	};
	
	/**
	 * 坐标系的缩放和旋转。
	 * 先缩放、再旋转。
	 * @todo 子类渲染前需要调用此方法
	 */
	Ycc.UI.Base.prototype.scaleAndRotate = function () {
		// 坐标系缩放
		this.ctx.scale(this.scaleX,this.scaleY);
		
		// 坐标系旋转
		this.ctx.translate(this.anchorX+this.rect.x,this.anchorY+this.rect.y);
		this.ctx.rotate(this.rotation*Math.PI/180);
		this.ctx.translate(-this.anchorX-this.rect.x,-this.anchorY-this.rect.y);
	};
	

	/**
	 * 渲染至绘图环境。
	 * 		<br> 注意：重写此方法时，不能修改UI类的属性。修改属性，应该放在computeUIProps方法内。
	 * @param [ctx]	绘图环境。可选
	 * @override
	 */
	Ycc.UI.Base.prototype.render = function (ctx) {
	
	};
	
	/**
	 * 给定宽度，获取能容纳的最长单行字符串
	 * @param content	{string} 文本内容
	 * @param width		{number} 指定宽度
	 * @return {string}
	 */
	Ycc.UI.Base.prototype.getMaxContentInWidth = function (content, width) {
		var out = content;
		var outW = 0;
		
		if(this.ctx.measureText(content).width<=width)
			return content;
		for(var i = 0;i<content.length;i++){
			out = content.slice(0,i+1);
			outW = this.ctx.measureText(out).width;
			if(outW>width){
				return content.slice(0,i);
			}
		}
	};
	
	
	/**
	 * 合并参数
	 * @param option
	 * @return {Ycc.UI}
	 */
	Ycc.UI.Base.prototype.extend = function (option) {
		option = option || {};
		for(var key in this){
			if(typeof option[key]!=="undefined"){
				this[key] = option[key];
			}
		}
		return this;
	};
	
	
	/**
	 * 克隆ui
	 * @return {Ycc.UI}
	 */
	Ycc.UI.Base.prototype.clone = function () {
		var ui = new this.yccClass();
		ui.extend(this);
		return ui;
	};
	
	/**
	 * 获取UI的绝对坐标，主要考虑图层坐标
	 * @return {Ycc.Math.Rect}
	 */
	Ycc.UI.Base.prototype.getAbsolutePosition = function(){
		var pos = new Ycc.Math.Rect();
		pos.x = this.rect.x+this.belongTo.x;
		pos.y = this.rect.y+this.belongTo.y;
		pos.width = this.rect.width;
		pos.height = this.rect.height;
		return pos;
	};
	
	
	/**
	 * 根据图层坐标和UI位置坐标，将UI内某个点的相对坐标（相对于UI），转换为舞台的绝对坐标
	 * @todo 所有UI类render的时候都应该加上这个转换
	 * @param dotOrArr {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 * @return {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 */
	Ycc.UI.Base.prototype.transformToAbsolute = function (dotOrArr) {
		var res = null;
		if(Ycc.utils.isArray(dotOrArr)){
			res = [];
			for(var i=0;i<dotOrArr.length;i++){
				var resDot = new Ycc.Math.Dot(0,0);
				var dot = dotOrArr[i];
				resDot.x=this.belongTo.x+this.rect.x+dot.x;
				resDot.y=this.belongTo.y+this.rect.y+dot.y;
				res.push(resDot);
			}
			return res;
		}
		res = new Ycc.Math.Dot(0,0);
		res.x = this.belongTo.x+this.rect.x+dotOrArr.x;
		res.x = this.belongTo.y+this.rect.y+dotOrArr.y;
		return res;
	};
	
	/**
	 * 根据图层坐标和UI位置坐标，将某个点的绝对坐标，转换为相对于UI的相对坐标
	 * @param dotOrArr {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 * @return {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 */
	Ycc.UI.Base.prototype.transformToLocal = function (dotOrArr) {
		var res = null;
		if(Ycc.utils.isArray(dotOrArr)){
			res = [];
			for(var i=0;i<dotOrArr.length;i++){
				var resDot = new Ycc.Math.Dot(0,0);
				var dot = dotOrArr[i];
				resDot.x=dot.x-(this.belongTo.x+this.rect.x);
				resDot.y=dot.y-(this.belongTo.y+this.rect.y);
				res.push(resDot);
			}
			return res;
		}
		res = new Ycc.Math.Dot(0,0);
		res.x = dotOrArr.x-(this.belongTo.x+this.rect.x);
		res.x = dotOrArr.y-(this.belongTo.y+this.rect.y);
		return res;
	};


})(window.Ycc);