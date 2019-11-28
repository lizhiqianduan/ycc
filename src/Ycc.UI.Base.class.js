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
	// 全局的透明度
	var globalAlpha = 1;

	/**
	 * 所有UI类的基类。
	 * <br> 所有UI都必须遵循先计算、后绘制的流程
	 * 所有UI的rect坐标均为相对坐标，且相对于父级，若没有父级，则相对于图层
	 * UI只有在被添加至图层时，即layer.addUI(ui)，UI的绘图环境ctx才会被初始化
	 *
	 * @constructor
	 * @extends Ycc.Listener Ycc.Tree
	 */
	Ycc.UI.Base = function (option) {
		Ycc.Listener.call(this);
		
		Ycc.Tree.call(this);
		
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
		 * 缓存的绘图环境
		 * @type {null}
		 */
		this.ctxCache = null;
		
		/**
		 * 设备像素比
		 * @type {number}
		 */
		this.dpi = 1;
		
		/**
		 * UI的绘图区域
		 * @type {Ycc.Math.Rect}
		 */
		this.rect = new Ycc.Math.Rect();
		
		/**
		 * x相对父级的位置
		 * @type {number}
		 */
		this.x = 0;
		
		/**
		 * y相对父级的位置
		 * @type {number}
		 */
		this.y = 0;
		
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
		 * 相对于锚点的旋转角度
		 * @type {number}
		 */
		this.rotation = 0;
		

		/**
		 * 容纳区的背景色
		 * @type {string}
		 */
		this.rectBgColor = "rgba(0,0,0,0)";
		
		/**
		 * 容纳区的边框宽度
		 * @type {number}
		 */
		this.rectBorderWidth = 0;
		
		/**
		 * 容纳区边框颜色
		 * @type {string}
		 */
		this.rectBorderColor = "#000";
		
		/**
		 * 是否显示
		 * @type {boolean}
		 */
		this.show = true;
		
		/**
		 * 是否幽灵状态，默认false
		 * 幽灵状态的UI：只能用于显示，不可点击，事件也不会触发，其子元素的事件也不会触发，不能通过getUIFromPointer获取
		 * 用于解决多个UI重叠时是否需要穿透，以点击被覆盖UI的问题
		 * @type {boolean}
		 */
		this.ghost = false;
		
		/**
		 * 默认情况下，UI阻止事件冒泡，但不会阻止事件传播给图层
		 * @type {boolean}
		 */
		this.stopEventBubbleUp = true;

		/**
		 * 透明度
		 * @type {number}
		 */
		this.opacity = 1;
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
		 * 是否显示缩放之前的位置
		 * @type {boolean}
		 */
		this.isShowRotateBeforeUI = false;
		
		/**
		 * 基础绘图UI
		 * @type {Ycc.UI}
		 */
		this.baseUI = null;
		
		/**
		 * 初始化之前的hook
		 * @type {function}
		 * @private
		 */
		this._beforeInit = null;
		
		/**
		 * 初始化之后的hook
		 * @type {function}
		 * @private
		 */
		this._afterInit = null;
		/**
		 * UI被加入舞台的回调，只会在addUI的时候触发
		 * @type {null}
		 * @private
		 */
		this._onAdded = null;
		/**
		 * UI的所有子UI渲染完成后的回调，只会在UI为顶级UI时才会触发
		 * @type {null}
		 * @private
		 */
		this._onChildrenRendered = null;

		/**
		 * 计算属性前的hook
		 * @type {function}
		 */
		this.oncomputestart = null;
		
		/**
		 * 计算属性后的hook
		 * @type {function}
		 */
		this.oncomputeend = null;
		
		/**
		 * 渲染前的hook
		 * @type {function}
		 */
		this.onrenderstart = null;
		
		/**
		 * 渲染后的hook
		 * @type {function}
		 */
		this.onrenderend = null;
		
		
		this.extend(option);
	};
	
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Base.prototype,Ycc.Listener.prototype);
	Ycc.utils.mergeObject(Ycc.UI.Base.prototype,Ycc.Tree.prototype);
	
	
	/**
	 * 在某个图层中初始化UI
	 * @param layer	{Layer}		图层
	 */
	Ycc.UI.Base.prototype.init = function (layer) {
		Ycc.utils.isFn(this._beforeInit) && this._beforeInit();
		this.belongTo = layer;
		this.ctx = layer.ctx;
		// UI的离屏canvas使用图层的离屏canvas
		this.ctxCache = this.belongTo.ctxCache;
		this.dpi = this.belongTo.yccInstance.getSystemInfo().devicePixelRatio;
		// debug
		// document.body.appendChild(this.ctxCache.canvas);
		// this.ctxCache.canvas.style.background="red";

		// 初始化时计算一次属性
		// this.computeUIProps();
		
		// 初始化时，直接计算并渲染至离屏canvas中，以等待外部使用
		// this.__render();
		Ycc.utils.isFn(this._afterInit) && this._afterInit();
	};
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * <br> 开启离屏canvas后，此过程只会发生在离屏canvas中
	 * @override
	 */
	Ycc.UI.Base.prototype.computeUIProps = function () {
	
	};
	
	/**
	 * 渲染容纳区rect的背景色
	 * <br> 开启离屏canvas后，此过程只会发生在离屏canvas中
	 * @param absoluteRect	{Ycc.Math.Rect}	容纳区的绝对位置
	 */
	Ycc.UI.Base.prototype.renderRectBgColor = function (absoluteRect) {
		var rect = absoluteRect;
		var dots = this.getAbsolutePositionPolygon();
		if(!dots||dots.length===0) return console.log(new Ycc.Debugger.Log("no polygon coordirates!").message);

		var ctx = this.ctxCache;

		ctx.save();
		ctx.fillStyle = this.rectBgColor;
		ctx.beginPath();
		ctx.moveTo(dots[0].x*this.dpi,dots[0].y*this.dpi);
		for(var i=1;i<dots.length-1;i++)
			ctx.lineTo(dots[i].x*this.dpi,dots[i].y*this.dpi);
		// this.ctx.rect(rect.x,rect.y,rect.width,rect.height);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
		rect = null;
	};
	
	/**
	 * 渲染容纳区rect的边框
	 * <br> 开启离屏canvas后，此过程只会发生在离屏canvas中
	 * @param absoluteRect	{Ycc.Math.Rect}	容纳区的绝对位置
	 */
	Ycc.UI.Base.prototype.renderRectBorder = function (absoluteRect) {
		// console.log('绘制边框');
		// 边框宽度为0，不渲染
		if(this.rectBorderWidth<=0) return;
		var ctx = this.ctxCache;

		var rect = absoluteRect;
		ctx.save();
		ctx.strokeStyle = this.rectBorderColor;
		ctx.strokeWidth = this.rectBorderWidth;
		ctx.beginPath();
		ctx.rect(rect.x*this.dpi,rect.y*this.dpi,rect.width*this.dpi,rect.height*this.dpi);
		ctx.closePath();
		ctx.stroke();
		ctx.restore();
		rect = null;
	};
	
	/**
	 * 绘制UI平移、旋转之前的位置，用虚线绘制
	 * 需要子UI重载
	 * @param [ctx]	绘图环境，非必传
	 */
	Ycc.UI.Base.prototype.renderDashBeforeUI = function (ctx) {
	
	};
	
	
	/**
	 * 删除自身。
	 * 若子类包含多个UI，需要重载
	 */
	Ycc.UI.Base.prototype.removeSelf = function () {
		this.belongTo.removeUI(this);
	};
	
	
	
	/**
	 * 添加子ui
	 * @param ui
	 * @return {Ycc.UI.Base}
	 */
	Ycc.UI.Base.prototype.addChild = function (ui) {
		if(this.belongTo)
			ui.init(this.belongTo);
		this.addChildTree(ui);
		return ui;
	};
	
	/**
	 * 删除子ui
	 * @param ui
	 */
	Ycc.UI.Base.prototype.removeChild = function (ui) {
		this.removeChildTree(ui);
		Ycc.UI.release(ui);
		return this;
	};
	
	/**
	 * 坐标系的缩放和旋转。
	 * 先缩放、再旋转。
	 * @todo 子类渲染前需要调用此方法
	 * @todo 多边形替换rect后，此方法废弃，不再调用
	 */
	Ycc.UI.Base.prototype.scaleAndRotate = function () {
		// 坐标系缩放
		// this.ctx.scale(this.scaleX,this.scaleY);
		var rect = this.getAbsolutePositionRect();
		// 坐标系旋转
		this.ctx.translate(this.anchorX+rect.x,this.anchorY+rect.y);
		this.ctx.rotate(this.rotation*Math.PI/180);
		this.ctx.translate(-this.anchorX-rect.x,-this.anchorY-rect.y);
	};
	
	
	/**
	 * 判断ui是否存在于舞台之外，渲染时可以不予渲染
	 * 在compute之后使用，判断更准确
	 * @return {boolean}
	 */
	Ycc.UI.Base.prototype.isOutOfStage = function () {
		var stageW = this.belongTo.yccInstance.getStageWidth();
		var stageH = this.belongTo.yccInstance.getStageHeight();
		var absolute = this.getAbsolutePositionRect();
		return absolute.x>stageW
			|| (absolute.x+absolute.width<0)
			|| absolute.y>stageH
			|| (absolute.y+absolute.height<0);
	};
	
	/**
	 * 判断当前区域在某个区域外
	 * @param rect {Ycc.Math.Rect}
	 */
	Ycc.UI.Base.prototype.isOutOfRect = function (rect) {
		var x = rect.x;
		var y = rect.y;
		var w = rect.width;
		var h = rect.height;
		var absolute = this.getAbsolutePositionRect();
		return absolute.x>w
			|| (absolute.x+absolute.width<x)
			|| absolute.y>h
			|| (absolute.y+absolute.height<y);
	};
	
	
	/**
	 * 递归释放内存，等待GC
	 * 将所有引用属性设为null
	 * @param uiNode	ui节点
	 */
	Ycc.UI.release = function (uiNode) {
		
		uiNode.itor().leftChildFirst(function (ui) {
			
			// console.log('release '+(!!ui.yccClass?ui.yccClass.name:''),ui);
			
			if(ui.yccClass===Ycc.UI.Image || ui.yccClass===Ycc.UI.ImageFrameAnimation)
				ui.res=null;
			
			// 释放Tree的内存
			Ycc.Tree.release(ui);
			// 释放listener内存
			Ycc.Listener.release(ui);

			/////////////// 释放UI内存
			ui.yccInstance=null;
			
			/**
			 * 构造器的引用，Ycc中的每个类都有此属性
			 */
			ui.yccClass = null;
			
			/**
			 * 绘图环境
			 * @type {null}
			 */
			ui.ctx = null;
			
			/**
			 * UI所属的图层
			 * @type {Ycc.Layer}
			 */
			ui.belongTo = null;
			
			/**
			 * 用户自定义的数据
			 * @type {null}
			 */
			ui.userData = null;
			
			/**
			 * 基础绘图UI
			 * @type {Ycc.UI}
			 */
			ui.baseUI = null;
			
			/**
			 * 初始化之前的hook
			 * @type {function}
			 */
			ui._beforeInit = null;
			
			/**
			 * 初始化之后的hook
			 * @type {function}
			 */
			ui._afterInit = null;
			
			/**
			 * 计算属性前的hook
			 * @type {function}
			 */
			ui.oncomputestart = null;
			
			/**
			 * 计算属性后的hook
			 * @type {function}
			 */
			ui.oncomputeend = null;
			
			/**
			 * 渲染前的hook
			 * @type {function}
			 */
			ui.onrenderstart = null;
			
			/**
			 * 渲染后的hook
			 * @type {function}
			 */
			ui.onrenderend = null;
		});
		
		
		
		
	};

	/**
	 * 渲染至绘图环境。
	 * 		<br> 注意：重写此方法时，不能修改UI类的属性。修改属性，应该放在computeUIProps方法内。
	 * @override
	 */
	Ycc.UI.Base.prototype.render = function () {
	
	};
	
	/**
	 * 绘制UI的容器（红色小方框）
	 * <br> 开启离屏canvas后，此过程只会发生在离屏canvas中
	 * @param absoluteRect {Ycc.Math.Rect}	UI的绝对坐标
	 * @private
	 */
	Ycc.UI.Base.prototype._renderContainer = function (absoluteRect) {
		var rect = absoluteRect;
		var ctx = this.ctxCache;
		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle = "#ff0000";
		ctx.rect(rect.x*this.dpi,rect.y*this.dpi,rect.width*this.dpi,rect.height*this.dpi);
		ctx.closePath();
		ctx.stroke();
		ctx.restore();
		rect=null;
	};
	
	/**
	 * 渲染统一调用的入口，供图层统一调用。
	 * 新增渲染过程中的hook函数。
	 * 此方法不允许重载、覆盖
	 * <br> 开启离屏canvas后，此过程只会发生在离屏canvas中
	 * @private
	 * @return {renderError.message|null}
	 */
	Ycc.UI.Base.prototype.__render = function () {
		this.triggerListener('computestart',new Ycc.Event("computestart"));
		var error = this.computeUIProps();
		this.triggerListener('computeend',new Ycc.Event("computeend"));
		
		if(error) return error;
		
		// 超出舞台时，不予渲染，此步骤挪到外面做判断，不再重复判断
		if(!this.belongTo.useCache&&this.isOutOfStage())
			return {message:'UI超出舞台！'};
		if(this.belongTo.useCache&&this.isOutOfRect(new Ycc.Math.Rect(0,0,this.ctxCache.canvas.width*this.dpi,this.ctxCache.canvas.height*this.dpi)))
			return {message:'UI超出离屏Canvas！'};
		
		
		// 绘制前的处理
		this._processBeforeRender();

		var absolutePosition = this.getAbsolutePositionRect();
		// 绘制UI的背景，rectBgColor
		this.renderRectBgColor(absolutePosition);
		// 绘制容纳区的边框
		this.renderRectBorder(absolutePosition);
		// 绘制旋转平移之前的UI，只在离屏canvas中绘制
		this.renderDashBeforeUI(this.ctxCache);
		
		// 全局UI配置项，是否绘制UI的容器
		if(this.belongTo.yccInstance.config.debugDrawContainer){
			this._renderContainer(absolutePosition);
		}

		this.render();

		// 绘制后的处理
		this._processAfterRender();
	};

	/**
	 * UI类渲染前的处理
	 * @private
	 */
	Ycc.UI.Base.prototype._processBeforeRender = function(){
		this.triggerListener('renderstart',new Ycc.Event("renderstart"));
		// 保存
		globalAlpha = this.ctx.globalAlpha;
		// 设置透明度
		this.ctx.globalAlpha = this.opacity;
	};

	/**
	 * UI类渲染后的处理
	 * @private
	 */
	Ycc.UI.Base.prototype._processAfterRender = function(){
		// 取消设置的透明度
		this.ctx.globalAlpha = globalAlpha;
		this.triggerListener('renderend',new Ycc.Event("renderend"));
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
		var ctx = this.ctxCache;
		
		if(ctx.measureText(content).width<=width)
			return content;
		for(var i = 0;i<content.length;i++){
			out = content.slice(0,i+1);
			outW = ctx.measureText(out).width;
			if(outW>width){
				return content.slice(0,i);
			}
		}
	};
	
	
	/**
	 * 合并参数，只会合并对象中已存在的key
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
	 * 获取UI平移、旋转之后位置的多边形区域，子UI需覆盖此方法
	 */
	Ycc.UI.Base.prototype.getAbsolutePositionPolygon = function () {};
	
	/**
	 * 获取容纳UI的矩形区域，子UI可以覆盖此方法
	 * 注：此区域未经过旋转
	 * @return {Ycc.Math.Rect}
	 */
	Ycc.UI.Base.prototype.getAbsolutePositionRect = function () {
		var pos = this.getAbsolutePosition();
		return new Ycc.Math.Rect(pos.x,pos.y,this.rect.width,this.rect.height);
	};
	
	/**
	 * 获取UI的绝对坐标，主要考虑图层坐标
	 * 注：此区域未经过旋转
	 * @return {Ycc.Math.Rect}
	 */
	Ycc.UI.Base.prototype.getAbsolutePosition = function(){
		var pos = new Ycc.Math.Rect();
		var pa = this.getParent();

		pos.width = this.rect.width;
		pos.height = this.rect.height;

		if(!pa){
			pos.x = this.rect.x+this.belongTo.x;
			pos.y = this.rect.y+this.belongTo.y;
		}else{
			var paRect = pa.getAbsolutePosition();
			pos.x = this.rect.x+paRect.x;
			pos.y = this.rect.y+paRect.y;
		}
		return pos;
	};
	
	
	/**
	 * 根据图层坐标和UI位置坐标，将某个点的相对坐标（相对于UI的父级），转换为舞台的绝对坐标
	 * @param dotOrArr {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 * @return {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 */
	Ycc.UI.Base.prototype.transformToAbsolute = function (dotOrArr) {
		var self = this;
		if(Ycc.utils.isArray(dotOrArr)){
			return dotOrArr.map(function (item) {
				return self.transformToAbsolute(item);
			});
		}
		
		var pa = this.getParent();
		if(!pa){
			return new Ycc.Math.Dot(dotOrArr.x+this.belongTo.x,dotOrArr.y+this.belongTo.y);
		}else{
			var paAbsolute = pa.getAbsolutePosition();
			return new Ycc.Math.Dot(dotOrArr.x+paAbsolute.x,dotOrArr.y+paAbsolute.y);
		}
	};
	
	/**
	 * 根据图层坐标和UI位置坐标，将某个点的绝对坐标，转换为相对于UI父级的相对坐标
	 * @param dotOrArr {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 * @return {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 */
	Ycc.UI.Base.prototype.transformToLocal = function (dotOrArr) {
		var res = null;
		var absolutePos = this.getAbsolutePosition();
		if(Ycc.utils.isArray(dotOrArr)){
			res = [];
			for(var i=0;i<dotOrArr.length;i++){
				var resDot = new Ycc.Math.Dot(0,0);
				var dot = dotOrArr[i];
				resDot.x=dot.x-(absolutePos.x)+this.x;
				resDot.y=dot.y-(absolutePos.y)+this.y;
				res.push(resDot);
			}
			return res;
		}
		res = new Ycc.Math.Dot(0,0);
		// 本地坐标需加上当前的x、y
		res.x = dotOrArr.x-(absolutePos.x)+this.x;
		res.y = dotOrArr.y-(absolutePos.y)+this.y;
		return res;
	};
	

	/**
	 * 判断某个点是否在UI组件内
	 * 默认根据ui的容纳区rect字段进行判断，子UI可以覆盖此方法
	 * @param dot	{Ycc.Math.Dot}	某个点的绝对坐标
	 * @return {boolean}
	 */
	Ycc.UI.Base.prototype.containDot = function (dot) {
		return dot.isInRect(this.getAbsolutePosition());
	};
	
	/**
	 * 获取当前UI在树结构中的深度
	 */
	Ycc.UI.Base.prototype.getDeepLevel = function () {
		return this.getParentList().length+1;
	};
	
	/**
	 * 根据当前的锚点、旋转角度获取某个点的转换之后的坐标
	 * @param dot {Ycc.Math.Dot|Ycc.Math.Dot[]}	需要转换的点，该点为相对坐标，相对于当前UI的父级
	 * @return {Ycc.Math.Dot}		转换后的点，该点为绝对坐标
	 */
	Ycc.UI.Base.prototype.transformByRotate = function (dot) {
		var self = this;
		// 点数组的转换
		if(Ycc.utils.isArray(dot)){
			return dot.map(function (itemDot) {
				return self.transformByRotate(itemDot);
			});
		}
		
		var res = new Ycc.Math.Dot();
		// 位置的绝对坐标
		var pos = this.getAbsolutePosition();
		// pos={x:0,y:0};
		var dotX = dot.x;
		var dotY = dot.y;
		
		// 坐标旋转
		var dx = (dotX - this.anchorX)*Math.cos(this.rotation/180*Math.PI) - (dotY - this.anchorY)*Math.sin(this.rotation/180*Math.PI)+this.anchorX;
		var dy = (dotY - this.anchorY)*Math.cos(this.rotation/180*Math.PI) + (dotX - this.anchorX)*Math.sin(this.rotation/180*Math.PI)+this.anchorY;
		// res.x=dx+pos.x;
		// res.y=dy+pos.y;
		res = this.transformToAbsolute({x:dx,y:dy});

		return res;
	};
	
	
	/**
	 * 设置当前环境画布的所有的属性
	 * @param props 属性map
	 * @param ctx	绘图环境，可选参数，默认为离屏canvas的绘图环境
	 * @private
	 */
	Ycc.UI.Base.prototype._setCtxProps = function (props,ctx) {
		var self = this;
		ctx = ctx || self.ctxCache;
		var ctxConfig = {
			fontStyle:"normal",
			fontVariant:"normal",
			fontWeight:"normal",
			fontSize:"16px",
			fontFamily:"微软雅黑",
			font:"16px 微软雅黑",
			textBaseline:"hanging",
			fillStyle:"red",
			strokeStyle:"blue"
		};
		ctxConfig = Ycc.utils.extend(ctxConfig,props);
		// dpi兼容 字体大小
		ctxConfig.fontSize=parseInt(ctxConfig.fontSize)*this.dpi+'px';
		ctxConfig.font = [ctxConfig.fontStyle,ctxConfig.fontVariant,ctxConfig.fontWeight,ctxConfig.fontSize,ctxConfig.fontFamily].join(" ");
		for(var key in ctxConfig){
			if(!ctxConfig.hasOwnProperty(key)) continue;
			ctx[key] = ctxConfig[key];
		}
	};
	
	
	/**
	 * 冒泡触发UI的事件
	 * @param type
	 * @param x
	 * @param y
	 * @param originEvent ycc事件所对应的原始事件
	 * @return {Ycc.UI[]}  返回已触发事件的UI列表
	 */
	Ycc.UI.Base.prototype.triggerUIEventBubbleUp = function(type,x,y,originEvent) {
		var ui = this;
		var list = [];
		if(ui && ui.belongTo && ui.belongTo.enableEventManager){
			// 触发ui的事件
			ui.triggerListener(type,new Ycc.Event({x:x,y:y,type:type,target:ui,originEvent:originEvent}));
			// 如果ui阻止了事件冒泡，则不触发其父级的事件
			if(ui.stopEventBubbleUp) return;
			
			// 触发父级ui的事件
			var faList = ui.getParentList().reverse();
			for(var i=0;i<faList.length;i++){
				var fa = faList[i];
				fa.triggerListener(type,new Ycc.Event({x:x,y:y,type:type,target:fa,originEvent:originEvent}));
				list.push(fa);
				// 如果fa阻止了事件冒泡，则不触发其父级的事件
				if(fa.stopEventBubbleUp) break;
			}
		}
		return list;
	}
	
})(Ycc);