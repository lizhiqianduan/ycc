/**
 * @file    Ycc.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description  Ycc.class文件
 *
 */

/**
 * 应用启动入口类，每个实例都与一个canvas绑定。
 * 该canvas元素会被添加至HTML结构中，作为应用的显示舞台。
 * @param config {Object} 整个ycc的配置项
 * @param config.debugDrawContainer {Boolean} 是否显示所有UI的容纳区域
 * @param config.useGesture {Boolean} 是否启用系统的手势库，默认启用
 * 若开启，所有UI都会创建一个属于自己的离屏canvas，大小与舞台一致
 * @constructor
 */
var Ycc = function Ycc(config){
	
	/**
	 * 绘图环境
	 * @type {CanvasRenderingContext2D}
	 */
	this.ctx = null;
	
	/**
	 * 与ycc绑定的canvas元素
	 * @type {null}
	 */
	this.canvasDom = null;
	
	/**
	 * Layer对象数组。包含所有的图层
	 * @type {Array}
	 */
	this.layerList = [];
	
	/**
	 * 实例的快照管理模块
	 * @type {Ycc.PhotoManager}
	 */
	this.photoManager = null;
	
	/**
	 * ycc的图层管理器
	 * @type {null}
	 */
	this.layerManager = null;
	
	/**
	 * 系统心跳管理器
	 */
	this.ticker = null;
	
	/**
	 * 调试模块
	 * @type {null}
	 */
	this.debugger = null;
	
	/**
	 * 资源加载器
	 * @type {Ycc.Loader}
	 */
	this.loader = new Ycc.Loader();
	
	/**
	 * 异步请求的封装
	 * @type {Ycc.Ajax}
	 */
	this.ajax = new Ycc.Ajax();
	
	/**
	 * 基础绘图UI。这些绘图操作会直接作用于舞台。
	 * @type {Ycc.UI}
	 */
	this.baseUI = null;
	
	/**
	 * 整个ycc的配置项
	 * @type {{debugDrawContainer:boolean,useGesture:boolean}}
	 */
	this.config = Ycc.utils.extend({
		debugDrawContainer:false,
		useGesture:true
	},config||{});
	
	/**
	 * 是否移动端
	 * @type {boolean}
	 */
	this.isMobile = Ycc.utils.isMobile();
	
	this.stageW = 0;
	
	this.stageH = 0;
	
	/**
	 * dpi
	 * @type {number}
	 */
	this.dpi = this.getSystemInfo().devicePixelRatio;
};

/**
 * 获取舞台的宽
 */
Ycc.prototype.getStageWidth = function () {
	return this.canvasDom.width;
};

/**
 * 获取舞台的高
 */
Ycc.prototype.getStageHeight = function () {
	return this.canvasDom.height;
};

/**
 * 绑定canvas元素，一个canvas绑定一个ycc实例
 * @param canvas
 * @return {Ycc}
 */
Ycc.prototype.bindCanvas = function (canvas) {
	
	this.canvasDom = canvas;
	
	this.ctx = canvas.getContext('2d');
	
	this.layerList = [];
	
	this.photoManager = new Ycc.PhotoManager(this);
	
	this.layerManager = new Ycc.LayerManager(this);
	
	this.ticker = new Ycc.Ticker(this);
	
	this.debugger = new Ycc.Debugger(this);
	
	this.baseUI = new Ycc.UI(this);
	
	this.init();
	
	return this;
};

/**
 * 类初始化
 */
Ycc.prototype.init = function () {
	if(true===this.config.useGesture)
		this._initStageGestureEvent();
};

/**
 *
 * 需求实现：初始化舞台的手势事件监听器
 * 1、事件传递给所有图层
 * 2、事件传递给最上层UI
 * 3、pc端和移动端统一，pc端视为一个触摸点，而移动端可以存在多个触摸点
 * 4、dragging、dragend事件，的最上层UI为dragstart时所指的UI
 * 5、所有鼠标事件均由舞台转发，转发的坐标均为绝对坐标。
 * 	`layer`和`ui`可以调用各自的`transformToLocal`方法，将绝对坐标转换为自己的相对坐标。
 *
 * @private
 */
Ycc.prototype._initStageGestureEvent = function () {
	var self = this;
	// 鼠标/触摸点开始拖拽时，所指向的UI对象，只用于单个触摸点的情况
	//var dragstartUI = null;
	// 鼠标/触摸点开始拖拽时，所指向的UI对象map，用于多个触摸点的情况
	var dragstartUIMap = {};
	
	var gesture = new Ycc.Gesture({target:this.ctx.canvas});
	gesture.addListener('tap',gestureListener);
	gesture.addListener('longtap',gestureListener);
	gesture.addListener('doubletap',gestureListener);
	gesture.addListener('swipe',gestureListener);
	gesture.addListener('swipeleft',gestureListener);
	gesture.addListener('swiperight',gestureListener);
	gesture.addListener('swipeup',gestureListener);
	gesture.addListener('swipedown',gestureListener);
	gesture.addListener('dragstart',dragstartListener);
	gesture.addListener('dragging',draggingListener);
	gesture.addListener('dragend',dragendListener);
	
	// PC端专属事件
	gesture.addListener('mousemove',gestureListener);
	
	
	function dragstartListener(e) {
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		
		var dragstartUI = self.getUIFromPointer(new Ycc.Math.Dot(x,y));
		if(dragstartUI){
			dragstartUIMap[e.identifier]=dragstartUI;
			dragstartUI.triggerUIEventBubbleUp(e.type,x,y);
		}
		// dragstartUI&&dragstartUI.belongTo.enableEventManager&&triggerUIEvent(e.type,x,y,dragstartUI);
		triggerLayerEvent(e.type,x,y);
	}
	function draggingListener(e) {
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		
		var dragstartUI = dragstartUIMap[e.identifier];
		if(dragstartUI){
			dragstartUIMap[e.identifier]=dragstartUI;
			dragstartUI.triggerUIEventBubbleUp(e.type,x,y);
		}
		triggerLayerEvent(e.type,x,y);
	}
	function dragendListener(e) {
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		
		var dragstartUI = dragstartUIMap[e.identifier];
		if(dragstartUI){
			dragstartUIMap[e.identifier]=dragstartUI;
			dragstartUI.triggerUIEventBubbleUp(e.type,x,y);
			dragstartUI = null;
			dragstartUIMap[e.identifier]=null;
		}
		triggerLayerEvent(e.type,x,y);
	}
	
	// 通用监听
	function gestureListener(e) {
		// console.log('通用监听',e);
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		
		var ui = self.getUIFromPointer(new Ycc.Math.Dot(x,y));
		// triggerLayerEvent(e.type,x,y);
		// ui&&ui.belongTo.enableEventManager&&triggerUIEvent(e.type,x,y,ui);
		if(ui){
			ui.triggerUIEventBubbleUp(e.type,x,y,e);
		}
		triggerLayerEvent(e.type,x,y);
	}
	
	function triggerLayerEvent(type,x,y){
		for(var i=self.layerList.length-1;i>=0;i--){
			var layer = self.layerList[i];
			if(!layer.enableEventManager) continue;
			layer.enableEventManager&&layer.triggerListener(type,new Ycc.Event({
				type:type,
				x:x,
				y:y
			}));
		}
	}
	
	function triggerUIEvent(type,x,y,ui){
		ui.triggerListener(type,new Ycc.Event({
			x:x,
			y:y,
			type:type,
			target:ui
		}));
	}
	
	/**
	 * 冒泡触发UI的事件
	 * @param type
	 * @param x
	 * @param y
	 * @param ui
	 * @return {null}
	 */
	// function triggerUIEventBubbleUp(type,x,y,ui) {
	// 	if(ui && ui.belongTo && ui.belongTo.enableEventManager){
	// 		// 触发ui的事件
	// 		ui.triggerListener(type,new Ycc.Event({x:x,y:y,type:type,target:ui}));
	//
	// 		// 如果ui阻止了事件冒泡，则不触发其父级的事件
	// 		if(ui.stopEventBubbleUp) return;
	//
	// 		// 触发父级ui的事件
	// 		ui.getParentList().reverse().forEach(function (fa) {
	// 			fa.triggerListener(type,new Ycc.Event({x:x,y:y,type:type,target:fa}));
	// 		});
	// 	}
	// }
	
};


/**
 * 清除
 */
Ycc.prototype.clearStage = function () {
	this.ctx.clearRect(0,0,this.getStageWidth(),this.getStageHeight());
};


/**
 * 根据id查找图层
 * @param id 图层id
 * @return {Ycc.Layer}
 */
Ycc.prototype.findLayerById = function (id) {
	for(var i =0;i<this.layerList.length;i++){
		var layer = this.layerList[i];
		if(layer.id===id)
			return layer;
	}
	return null;
};

/**
 * 根据id查找UI
 * @param id UI的id
 * @return {Ycc.UI}
 */
Ycc.prototype.findUiById = function (id) {
	for(var i =0;i<this.layerList.length;i++){
		var layer = this.layerList[i];
		for(var j=0;j<layer.uiList.length;j++){
			var ui = layer.uiList[j];
			if(ui.id===id)
				return ui;
		}
	}
	return null;
};

/**
 * 获取舞台中某个点所对应的最上层UI。
 * @param dot {Ycc.Math.Dot}	点坐标，为舞台的绝对坐标
 * @param uiIsShow {Boolean}	是否只获取显示在舞台上的UI，默认为true
 * @return {UI}
 */
Ycc.prototype.getUIFromPointer = function (dot,uiIsShow) {
	var self = this;
	uiIsShow = Ycc.utils.isBoolean(uiIsShow)?uiIsShow:true;
	// 从最末一个图层开始寻找
	for(var j=self.layerList.length-1;j>=0;j--){
		var layer = self.layerList[j];
		if(uiIsShow&&!layer.show) continue;
		var ui = layer.getUIFromPointer(dot,uiIsShow);
		if(ui)
			return ui;
	}
	return null;
};

/**
 * 获取舞台中某个点所对应的最上层UI，不遍历不可见图层
 * 默认取可见且不是幽灵的UI
 * @param dot 					{Ycc.Math.Dot}	点坐标，为舞台的绝对坐标
 * @param options 				{object}	点坐标，为舞台的绝对坐标
 * @param options.uiIsShow 		{boolean}	UI是否可见
 * @param options.uiIsGhost 	{boolean}	UI是否未幽灵
 * @return {Ycc.UI[]} 			返回找到的UI列表，图层越靠后图层内的UI越靠前
 */
Ycc.prototype.getUIListFromPointer = function (dot,options) {
	var self = this;
	options = options || {
		uiIsShow:true,
		uiIsGhost:false
	};
	var uiList = [];
	// 从最末一个图层开始寻找
	for(var j=self.layerList.length-1;j>=0;j--){
		var layer = self.layerList[j];
		//
		if(!layer.show) continue;
		var list = layer.getUIListFromPointer(dot);
		uiList = uiList.concat(list);
	}
	uiList = uiList.filter(function(item){return (item.show===options.uiIsShow)&&(item.ghost===options.uiIsGhost);});
	return uiList;

};

/**
 * 创建canvas，只针对H5端。微信小游戏的canvas为全局变量，直接使用即可
 * @example
 * var ycc = new Ycc();
 * var stage = canvas || ycc.createCanvas();
 * ycc.bindCanvas(stage);
 *
 * @param options
 * @param options.width
 * @param options.height
 * @param options.dpiAdaptation		是否根据dpi适配canvas大小
 * @return {*}	已创建的canvas元素
 */
Ycc.prototype.createCanvas = function (options) {
	options = options||{};
	var option = Ycc.utils.mergeObject({
		width:window.innerWidth,
		height:window.innerHeight,
		dpiAdaptation:false
	},options);
	var canvas = document.createElement("canvas");
	var dpi = this.getSystemInfo().devicePixelRatio;
	if(option.dpiAdaptation){
		canvas.width = option.width*dpi;
		canvas.height = option.height*dpi;
		canvas.style.width=option.width+'px';
	}else{
		canvas.width = option.width;
		canvas.height = option.height;
	}
	// 去除5px inline-block偏差
	canvas.style.display='block';
	return canvas;
};

/**
 * 获取系统信息
 * @return {{model: string, pixelRatio: number, windowWidth: number, windowHeight: number, system: string, language: string, version: string, screenWidth: number, screenHeight: number, SDKVersion: string, brand: string, fontSizeSetting: number, benchmarkLevel: number, batteryLevel: number, statusBarHeight: number, safeArea: {right: number, bottom: number, left: number, top: number, width: number, height: number}, platform: string, devicePixelRatio: number}}
 */
Ycc.prototype.getSystemInfo = function () {
	return {
		"model":"iPhone 5",
		"pixelRatio":window.devicePixelRatio||1,
		"windowWidth":window.innerWidth,
		"windowHeight":window.innerHeight,
		"screenWidth":320,
		"screenHeight":568,
		"devicePixelRatio":window.devicePixelRatio||1
	};
};

/**
 * 创建一个离屏的绘图空间，大小与舞台等同
 */
Ycc.prototype.createCacheCtx = function () {
	var ctxCache = this.createCanvas({
		width:this.getStageWidth(),
		height:this.getStageHeight()
	}).getContext('2d');

	// debug
	// document.body.appendChild(ctxCache.canvas);
	return ctxCache;
};;/**
 * @file        Ycc.utils.js
 * @author      xiaohei
 * @desc
 *  整个程序公用的基础工具模块
 *
 * @requires    Ycc.init
 */

(function(Ycc){
    Ycc.utils = {};


	/**
     * 合并两个对象。只会保留targetObj中存在的字段。
	 * @param targetObj    目标对象
	 * @param obj2  待合入的对象
	 * @param isDeepClone   是否进行深拷贝
	 * @return {{}} targetObj对象
	 */
    Ycc.utils.extend = function(targetObj, obj2,isDeepClone) {
        if(isDeepClone)
            obj2 = Ycc.utils.deepClone(obj2);
        for (var i in targetObj) {
			if(!targetObj.hasOwnProperty(i)) continue;
            if (obj2 && typeof obj2[i] !=="undefined") {
				targetObj[i] = obj2[i];
            }
        }
        return targetObj;
    };
	
	/**
	 * 合并对象
	 * 将src所有的字段全部合并至target，若存在公有字段，则src会覆盖target对象的字段。
	 * 这个操作是浅拷贝。prototype内的属性不会被覆盖。
	 * @param target	{object}	待覆盖的目标对象
	 * @param src	{object}	源对象
	 * @return 返回target对象
	 */
	Ycc.utils.mergeObject = function(target,src){
		src = src || {};
		for(var key in src){
			if(!src.hasOwnProperty(key)) continue;
			if(typeof src[key]!=="undefined"){
				target[key] = src[key];
			}
		}
		return target;
	};
	
	/**
     * 判断字符串
	 * @param str
	 * @return {boolean}
	 */
	Ycc.utils.isString = function(str) {
        return typeof(str) === "string";
    };
	
	/**
     * 判断数字
	 * @param str
	 * @return {boolean}
	 */
    Ycc.utils.isNum = function(str) {
        return typeof(str) === "number";
    };
	
	/**
	 * 判断boolean
	 * @param str
	 * @return {boolean}
	 */
	Ycc.utils.isBoolean = function(str) {
		return typeof(str) === "boolean";
	};
	
	
	/**
     * 判断对象
	 * @param str
	 * @return {boolean}
	 */
	Ycc.utils.isObj = function(str) {
        return typeof(str) === "object";
    };
	/**
     * 判断函数
	 * @param str
	 * @return {boolean}
	 */
	Ycc.utils.isFn = function(str) {
        return typeof(str) === "function";
    };
	
	/**
     * 判断数组
	 * @param str
	 * @return {boolean}
	 */
    Ycc.utils.isArray = function(str) {
        return Object.prototype.toString.call(str) === '[object Array]';
    };
	
	
	/**
	 * 检测是否是移动端
	 * @return {boolean}
	 */
	Ycc.utils.isMobile = function () {
		var userAgentInfo = navigator.userAgent;
		var Agents = ["Android", "iPhone",
			"SymbianOS", "Windows Phone",
			"iPad", "iPod"];
		var flag = false;
		for (var v = 0; v < Agents.length; v++) {
			if (userAgentInfo.indexOf(Agents[v]) > 0) {
				flag = true;
				break;
			}
		}
		return flag;
	};
	
	
	/**
     * 深拷贝某个对象或者数组
	 * @param arrOrObj
	 * @return {*}
	 */
	Ycc.utils.deepClone = function(arrOrObj){
        
        return (Ycc.utils.isArray(arrOrObj))? deepCopy(arrOrObj):deepExtend(arrOrObj);
        function deepExtend(obj){
            var tempObj = {};
            for(var i in obj){
                if(!obj.hasOwnProperty(i)) continue;
                tempObj[i] = obj[i];
                if(Ycc.utils.isArray(obj[i])){
                    tempObj[i] = deepCopy(obj[i]);
                }else if(Ycc.utils.isObj(obj[i])){
                    tempObj[i] = deepExtend(obj[i]);
                }else{
                    tempObj[i] = obj[i];
                }
            }
            return tempObj;
        }
        function deepCopy(arr){
            var newArr = [];
            var v = null;
            for(var i=0;i<arr.length;i++){
                v = arr[i];
                if(Ycc.utils.isArray(v))
                    newArr.push(deepCopy(v));
                else if(Ycc.utils.isObj(v))
                    newArr.push(deepExtend(v));
                else{
                    newArr.push(v);
                }
            }
            return newArr;
        }
    };
	
	/**
	 * 迷你模板，替换__field__，其中的`field`为`renderObj`中的字段
	 * 返回替换后的模板文本
	 * @param tpl 模板字符串
	 * @param renderObj	渲染的对象
	 * @return {string}
	 */
	Ycc.utils.renderTpl=function (tpl,renderObj) {
		return tpl.replace(/__.+?__/g,function (txt) {
			console.log('匹配到的文本-->',txt);
			var key = txt.slice(2).slice(0,-2).trim();
			if(renderObj[key]!==undefined)
				return renderObj[key];
			else
				return txt;
		});
	};
	
	
	/**
	 * 释放obj内存 只清空字段
	 * @param obj
	 */
	Ycc.utils.releaseObject = function (obj) {
		for(var key in obj){
			if(!obj.hasOwnProperty(key)) continue;
			delete obj[key];
		}
	};
	
	/**
	 * 释放arr内存 只清空元素
	 * @param arr
	 */
	Ycc.utils.releaseArray = function (arr) {
		arr.length = 0;
	};
	
	/**
	 * 检测是否微信环境
	 * @return {boolean}
	 */
	Ycc.utils.isWx = function () {
		return "undefined"!== typeof wx;
	}
	
	
	
})(Ycc);

;/**
 * @file    Ycc.Math.js
 * @author  xiaohei
 * @date    2017/11/2
 * @description  Ycc.Math文件
 */


(function (Ycc) {
	
	var extend = Ycc.utils.extend;
	
	/**
	 * 数学表达式模块
	 * @constructor
	 */
	Ycc.Math = function () {};
	
	/**
	 * 点
	 * @param x	{number} x坐标
	 * @param y {number} y坐标
	 * @constructor
	 *//**
	 * 点
	 * @param [dot] {object}
	 * @param dot.x {number} x坐标
	 * @param dot.y {number} y坐标
	 * @constructor
	 */
	Ycc.Math.Dot = function (dot) {
		/**
		 * x坐标
		 * @type {number}
		 */
		this.x = 0;
		/**
		 * y坐标
		 * @type {number}
		 */
		this.y = 0;
		
		var len = arguments.length;
		if(len===1){
			this.x = dot.x;
			this.y = dot.y;
		}else if(len===2){
			this.x = arguments[0];
			this.y = arguments[1];
		}
		
	};
	
	/**
	 * 点是否在某个区域内
	 * @param rect	{Ycc.Math.Rect}	区域
	 */
	Ycc.Math.Dot.prototype.isInRect = function (rect) {
		return this.x>=rect.x&&this.x<=rect.x+rect.width  && this.y>=rect.y && this.y<=rect.y+rect.height;
	};
	
	/**
	 * 判读两点位置是否相同
	 * @param dot
	 * @return {boolean}
	 */
	Ycc.Math.Dot.prototype.isEqual = function (dot) {
		return this.x===dot.x && this.y===dot.y;
	};
	
	/**
	 * 点的加法/点的偏移量
	 * @param dot {Ycc.Math.Dot} 加的点
	 * @return {Ycc.Math.Dot} 返回一个新的点
	 */
	Ycc.Math.Dot.prototype.plus = function (dot) {
		return new Ycc.Math.Dot(this.x+dot.x,this.y+dot.y);
	};
	
	/**
	 * 将当前点绕另外一个点旋转一定度数
	 * @param rotation	旋转角度
	 * @param anchorDot	锚点坐标
	 * @return 旋转后的点
	 */
	Ycc.Math.Dot.prototype.rotate = function (rotation,anchorDot) {
		anchorDot=anchorDot||new Ycc.Math.Dot(0,0);
		var dotX = this.x,dotY=this.y,anchorX=anchorDot.x,anchorY=anchorDot.y;
		var dx = (dotX - anchorX)*Math.cos(rotation/180*Math.PI) - (dotY - anchorY)*Math.sin(rotation/180*Math.PI)+anchorX;
		var dy = (dotY - anchorY)*Math.cos(rotation/180*Math.PI) + (dotX - anchorX)*Math.sin(rotation/180*Math.PI)+anchorY;
		return new Ycc.Math.Dot(dx,dy);
	};
	
	/**
	 * 判断三点是否共线
	 * @param dot1
	 * @param dot2
	 * @param dot3
	 */
	Ycc.Math.Dot.threeDotIsOnLine = function (dot1,dot2,dot3) {
		// 存在位置相同点肯定共线
		if(dot1.isEqual(dot2) || dot1.isEqual(dot3) || dot2.isEqual(dot3))
			return true;
		// 三个点x一样
		if(dot1.x===dot2.x&&dot2.x===dot3.x)
			return true;
		var k1 = Math.abs(dot1.y-dot2.y)/Math.abs(dot1.x-dot2.x);
		var k2 = Math.abs(dot1.y-dot3.y)/Math.abs(dot1.x-dot3.x);
		return k1===k2;
	};
	
	
	
	
	/**
	 * 区域
	 * @param startDot {Dot}
	 * @param width
	 * @param height
	 * @constructor
	 *//**
	 * 区域
	 * @param x
	 * @param y
	 * @param width
	 * @param height
	 * @constructor
	 *//**
	 * 区域
	 * @param rect
	 * @param rect.x
	 * @param rect.y
	 * @param rect.width
	 * @param rect.height
	 * @constructor
	 */
	Ycc.Math.Rect = function (rect) {
		/**
		 * 构造器的引用
		 * @type {function}
		 */
		this.yccClass = Ycc.Math.Rect;
		
		/**
		 * 左上角x坐标
		 * @type {number}
		 */
		this.x = 0;
		/**
		 * 左上角y坐标
		 * @type {number}
		 */
		this.y = 0;
		/**
		 * 区域宽
		 * @type {number}
		 */
		this.width = 0;
		/**
		 * 区域高
		 * @type {number}
		 */
		this.height = 0;
		
		var len = arguments.length;
		if(len===1){
			this.x = rect.x;
			this.y = rect.y;
			this.width = rect.width;
			this.height = rect.height;
		}else if(len===3){
			this.x = arguments[0].x;
			this.y = arguments[0].y;
			this.width = arguments[1];
			this.height = arguments[2];
		}else if(len === 4){
			this.x = arguments[0];
			this.y = arguments[1];
			this.width = arguments[2];
			this.height = arguments[3];
		}
		
		
		this.toPositive();
	};
	
	/**
	 * 将矩形的长和宽转换为正数
	 */
	Ycc.Math.Rect.prototype.toPositive = function () {
		var x0 = this.x,
			y0 = this.y,
			x1 = this.x + this.width,
			y1 = this.y + this.height;
		this.x = x0<x1?x0:x1;
		this.y = y0<y1?y0:y1;
		this.width = Math.abs(this.width);
		this.height = Math.abs(this.height);
	};
	
	/**
	 * 获取区域的顶点列表
	 * @return {Ycc.Math.Dot[]}
	 */
	Ycc.Math.Rect.prototype.getVertices = function () {
		return [
			new Ycc.Math.Dot(this.x,this.y),
			new Ycc.Math.Dot(this.x+this.width,this.y),
			new Ycc.Math.Dot(this.x+this.width,this.y+this.height),
			new Ycc.Math.Dot(this.x,this.y+this.height),
			new Ycc.Math.Dot(this.x,this.y)
		];
	};
	
	/**
	 * 根据顶点更新数值
	 * @param vertices
	 * @return {*}
	 */
	Ycc.Math.Rect.prototype.updateByVertices = function (vertices) {
		if(!Ycc.utils.isArray(vertices))
			return console.error('参数必须是数组！');
		this.x = vertices[0].x;
		this.y = vertices[0].y;
		this.width = vertices[1].x-this.x;
		this.height = vertices[2].y-this.y;
	};
	
	
	
	
	/**
	 * 向量构造函数
	 * @constructor
	 */
	Ycc.Math.Vector = function () {
		this.x = 0;
		this.y = 0;
		this.z = 0;
		
		if(arguments.length===3 || arguments.length===2){
			this.x=arguments[0]||0;
			this.y=arguments[1]||0;
			this.z=arguments[2]||0;
		}
		
		if(arguments.length===1){
			if(!Ycc.utils.isObj(arguments[0])) console.error('constructor need a objec as param!');
			this.x=arguments[0].x||0;
			this.y=arguments[0].y||0;
			this.z=arguments[0].z||0;
		}
	};
	
	/**
	 * 向量的点乘法
	 * @param v2 {Ycc.Math.Vector} 点乘向量
	 * @return {number}
	 */
	Ycc.Math.Vector.prototype.dot = function (v2) {
		return this.x*v2.x+this.y*v2.y+this.z*v2.z;
	};
	
	
	/**
	 * 向量的叉乘法
	 * @param v2 {Ycc.Math.Vector} 叉乘向量
	 * @return {number}
	 */
	Ycc.Math.Vector.prototype.cross = function (v2) {
		var res = new Ycc.Math.Vector();
		res.x = this.y*v2.z-v2.y*this.z;
		res.y = v2.x*this.z-this.x*v2.z;
		res.z = this.x*v2.y-v2.x*this.y;
		return res;
	};
	
	
	/**
	 * 获取向量的模长
	 * @return {number}
	 */
	Ycc.Math.Vector.prototype.getLength = function () {
		return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z,2);
	};
	
	
	/**
	 * 矩阵的构造方法。
	 * @param data	{array}		矩阵所有行拼接的数组
	 * @param m		{number}	行数
	 * @param n		{number}	列数
	 * @constructor
	 */
	Ycc.Math.Matrix = function (data,m,n) {
		this.data 	= data;
		this.m 		= m;
		this.n		= n;
	};
	
	/**
	 * 矩阵点乘法
	 * @param M	{Ycc.Math.Matrix}	另一个矩阵
	 */
	Ycc.Math.Matrix.prototype.dot = function (M) {
		if(M.m!==this.n || M.n!==this.m)
			return console.error('两个矩阵的行数和列数不对应，不能相乘！');
		
		var N = new Ycc.Math.Matrix([],this.m,this.m);
		// 循环行
		for(var i=1;i<=this.m;i++){
			// 循环矩阵赋值
			for(var k=1;k<=this.m;k++){
				var temp =0;
				// 循环列
				for(var j=1;j<=this.n;j++){
					temp += this.get(i,j)*M.get(j,k);
				}
				N.set(i,k,temp);
			}
			
		}
		return N;
	};
	
	/**
	 * 获取矩阵i行j列的元素。
	 * 注：i，i下标从1开始
	 * @param i
	 * @param j
	 * @return {number}
	 */
	Ycc.Math.Matrix.prototype.get = function (i, j) {
		return this.data[(i-1)*this.n+j-1];
	};
	
	/**
	 * 设置矩阵i行j列的元素为val
	 * 注：i，i下标从1开始
	 * @param i
	 * @param j
	 * @param val
	 */
	Ycc.Math.Matrix.prototype.set = function (i, j, val) {
		this.data[(i-1)*this.n+j-1] = val;
	};
	
	
})(Ycc);;/**
 * @file    Ycc.Tree.class.js
 * @author  xiaohei
 * @date    2018/8/6
 * @description  Ycc.Tree.class文件
 */





(function (Ycc) {
	
	
	// 节点的自增id
	var nodeID = 1;

	/**
	 * 存储所有树节点的引用，不允许重载
	 * 使用prototype好处：
	 * 	1、所有Tree对象公用
	 * 	2、JSON.stringify不会将此序列化，避免抛循环引用的错误
	 * key为$id val为Tree对象
	 * @type {{}}
	 */
	var nodeMap = {};

	/**
	 * 树的构造函数
	 * 若参数为空，默认创建只有一个根节点的树
	 * @constructor
	 */
	Ycc.Tree = function() {
		
		/**
		 * 节点的自增ID，不允许修改，且每个对象必须唯一
		 * @type {number}
		 */
		this.$id = nodeID++;

		/**
		 * 节点的父节点ID，不允许修改
		 * @type {null|Ycc.Tree}
		 */
		this.$parentID = null;
		
		/**
		 * 节点的子节点列表
		 * @type {Array}
		 */
		this.children = [];
		
		/**
		 * 节点所携带的数据
		 * @type {any}
		 */
		this.data = null;
		
		// 存入map中，方便通过id寻找
		nodeMap[this.$id] = this;
	};
	
	/**
	 * 释放当前节点的内存，非递归
	 * @param treeNode
	 */
	Ycc.Tree.release = function (treeNode) {
		
		// 删除父级children的引用
		var pa = treeNode.getParent();
		if(pa){
			var children = pa.children;
			var index = children.indexOf(treeNode);
			if(index!==-1)
				children[index]=null;
		}
		
		// 删除nodeMap引用
		delete nodeMap[treeNode.$id];
		
		/**
		 * 节点的子节点列表
		 * @type {Array}
		 */
		treeNode.children.length = 0;
		
		/**
		 * 节点所携带的数据
		 * @type {any}
		 */
		treeNode.data = null;
	};
	
	/**
	 * 获取nodeMap表
	 * @return {{}}
	 */
	Ycc.Tree.getNodeMap = function () {
		return nodeMap;
	};

	/**
	 * 获取nodeMap表
	 * @return {{}}
	 */
	Ycc.Tree.prototype.getNodeMap = function () {
		return nodeMap;
	};
	
	/**
	 * 获取父级
	 * @return {Ycc.Tree}
	 */
	Ycc.Tree.prototype.getParent = function () {
		if(!this.$parentID) return null;
		
		return nodeMap[this.$parentID];
	};
	
	
	/**
	 * 添加一颗子树
	 * @param tree
	 */
	Ycc.Tree.prototype.addChildTree = function (tree) {
		if(tree.$parentID) return console.error("sub tree's parent has exist! can't add!",tree);
		tree.$parentID = this.$id;
		this.children.push(tree);
		return this;
	};
	
	/**
	 * 删除一颗子树，只能删除直接子节点
	 * @param tree
	 * @return {*}
	 */
	Ycc.Tree.prototype.removeChildTree = function (tree) {
		var index = this.children.indexOf(tree);
		if(index===-1) return this;
		this.children.splice(index,1);
		return this;
	};
	
	
	/**
	 * 获取树的深度
	 * @return {number}
	 */
	Ycc.Tree.prototype.getDepth = function () {
		var self = this;
		var dep = 1;
		if(self.children.length>0){
			for(var i=0;i<self.children.length;i++){
				var subDep = self.children[i].getDepth();
				dep = subDep+1>dep?subDep+1:dep;
			}
		}
		
		return dep;
	};
	
	
	/**
	 * 树的迭代器，返回集中常用的迭代方法
	 * @param option 			遍历时的配置项
	 * @param option.reverse	遍历子节点时，是否将子节点反向，默认false，目前仅支持depthDown遍历
	 * @return {{each: each, leftChildFirst: leftChildFirst, rightChildFirst: rightChildFirst, depthDown: depthDown}}
	 */
	Ycc.Tree.prototype.itor = function (option) {
		var self = this;
		option = option || {
			reverse:false
		};

		/**
		 * 父代优先遍历
		 * 先遍历父代，再依次遍历子代
		 * 若cb返回true，则停止遍历
		 * @param cb
		 * @return {boolean}
		 */
		function each(cb) {
			if(cb.call(self,self)) return true;
			if(self.children.length>0){
				for(var i=0;i<self.children.length;i++){
					if(self.children[i].itor().each(cb)) return true;
				}
			}
			return false;
		}
		
		/**
		 * 左树优先遍历
		 * 只要最左边的树不为空就继续遍历其子树，最后遍历根节点
		 * 若cb返回true，则停止遍历
		 *
		 * @param cb
		 * @return {boolean}
		 */
		function leftChildFirst(cb) {
			if(self.children.length>0){
				for(var i=0;i<self.children.length;i++){
					if(self.children[i].itor().leftChildFirst(cb)) return true;
				}
			}
			if(cb.call(self,self)) return true;
		}
		
		/**
		 * 右树优先遍历
		 * 只要最右边的树不为空就继续遍历其子树，最后遍历根节点
		 * 若cb返回true，则停止遍历
		 *
		 * @param cb
		 * @return {boolean}
		 */
		function rightChildFirst(cb) {
			if(self.children.length>0){
				for(var i=self.children.length-1;i>=0;i--){
					if(self.children[i].itor().rightChildFirst(cb)) return true;
				}
			}
			if(cb.call(self,self)) return true;
		}
		
		/**
		 * 根据当前节点，按层级依次向下遍历
		 * 这只是depthDownByNodes的特殊情况
		 * 若cb返回true，则停止遍历
		 *
		 * @param cb(node)
		 * @return {boolean}
		 */
		function depthDown(cb) {
			depthDownByNodes([self],cb);
		}
		
		/**
		 * 根据所给的节点列表，按层级依次向下遍历
		 * 若cb返回true，则停止遍历
		 *
		 * @param nodes {Ycc.Tree[]}
		 * @param cb(node,layer)
		 * @param [layer]	{number} 当前nodes列表所在的层级，可选参数
		 * @return {boolean|number}
		 */
		function depthDownByNodes(nodes,cb,layer){
			if(nodes.length===0)
				return true;
			layer=layer||0;
			layer++;
			// 待遍历的节点判断反向
			var itorNodes = option.reverse?reverse(nodes):nodes;
			// 下一层需要遍历的所有节点
			var nextNodes = [];
			// 是否停止遍历下一层的标志位
			var breakFlag = false;
			for(var i=0;i<itorNodes.length;i++) {
				var rvl = cb.call(self, itorNodes[i], layer);
				// 如果返回为true，则表示停止遍历下一层
				// 如果返回为-1，则表示当前节点的所有子孙节点不再遍历
				if (rvl===true) {
					breakFlag = true;
					break;
				}else if(rvl===-1)
					continue;
				nextNodes = nextNodes.concat(option.reverse?reverse(itorNodes[i].children):itorNodes[i].children);
			}
			if(breakFlag){
				nextNodes = [];
			}
			// 是否反向
			if(option.reverse) nextNodes.reverse();
			return depthDownByNodes(nextNodes,cb,layer);
		}
		
		/**
		 * 将list反向
		 * @param list
		 * @return {Array}
		 */
		function reverse(list){
			var ls = [];
			for(var i=list.length-1;i>=0;i--){
				ls.push(list[i]);
			}
			return ls;
		}
		
		return {
			each:each,
			leftChildFirst:leftChildFirst,
			rightChildFirst:rightChildFirst,
			depthDown:depthDown
		};
	};
	
	
	/**
	 * 转化为节点列表
	 * @return {Ycc.Tree[]}
	 */
	Ycc.Tree.prototype.toNodeList = function () {
		var list = [];
		this.itor().depthDown(function (node) {
			list.push(node);
		});
		return list;
	};
	
	/**
	 * 获取节点列表按照层级的分类
	 * key为层级，val为Ycc.Tree列表
	 * @return {{}}
	 */
	Ycc.Tree.prototype.getNodeListGroupByLayer = function () {
		var list = {};
		this.itor().depthDown(function (node,layer) {
			if(!list[layer])
				list[layer] = [];
			list[layer].push(node);
		});
		return list;
	};
	
	/**
	 * 获取节点的所有父级，靠近节点的父级排序在后
	 * @return {Ycc.Tree[]}
	 */
	Ycc.Tree.prototype.getParentList = function () {
		var node = this;
		var list = [];
		while(node.$parentID){
			var parent = nodeMap[node.$parentID];
			list.unshift(parent);
			node = parent;
		}
		return list;
	};
	
	/**
	 * 获取节点的所有兄弟节点，包括自身
	 * @return {Ycc.Tree[]}
	 */
	Ycc.Tree.prototype.getBrotherList = function () {
		var list = [];
		if(!this.$parentID)
			list = [this];
		else
			list = nodeMap[this.$parentID].children;
		return list;
	};



/////////////////////////// static Methods
	
	/**
	 * 根据传入的json构造一棵树
	 *
	 * 若节点有数据必须包含data字段
	 * 若节点有子节点必须包含children字段，且为数组
	 * 只关注data和children字段，其他字段将忽略
	 *
	 * @param json {object} json对象，示例：{data,children}
	 * @return {Ycc.Tree}
	 */
	Ycc.Tree.createByJSON = function (json) {
		var root = new Ycc.Tree();
		root.data = json.data;
		if(Ycc.utils.isArray(json.children) && json.children.length>0){
			for(var i=0;i<json.children.length;i++){
				root.addChildTree(Ycc.Tree.createByJSON(json.children[i]));
			}
		}
		return root;
	};
	
	
	/**
	 * 根据传入的节点列表构造一棵树
	 *
	 * 只关注字段id,parentID
	 *
	 * 构造成功后将生成新的$id,$parentID，且所有字段都将放入data中，包括id和parentID
	 *
	 * @param nodes {Array[]} json对象数组
	 * @return {Ycc.Tree}
	 */
	Ycc.Tree.createByNodes = function (nodes) {
		
		if(!Ycc.utils.isArray(nodes) || nodes.length===0)
			return console.error('need an Array as param!');
		
		var root = null;
		
		var treeNodes = [];
		nodes.forEach(function (node) {
			var treeNode = new Ycc.Tree();
			treeNode.data = node;
			treeNodes.push(treeNode);
			if(!Ycc.utils.isNum(node.parentID) && !node.parentID)
				root = treeNode;
		});
		
		
		treeNodes.forEach(function (treeNode) {
			treeNodes.forEach(function (subNode) {
				if(subNode.data.parentID === treeNode.data.id){
					treeNode.addChildTree(subNode);
				}
			});
		});
		
		return root;
	};
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
})(Ycc);;/**
 * @file    Ycc.Graph.class.js
 * @author  xiaohei
 * @date    2018/8/14
 * @description  Ycc.Graph.class文件
 *
 * 图的结构类，有向图、无向图等
 */

(function (Ycc) {
	
	// 节点唯一id
	var vid = 1;
	// 边的唯一id
	var eid = 1;
	// 图的唯一id
	var gid = 1;
	
	// 节点map key为$id val为有向顶点/无向顶点
	var vMap = {};
	// 边map key为$id val为有向边/无向边
	var eMap = {};

	
	/**
	 * 图的结构类
	 * @constructor
	 */
	Ycc.Graph = function (type) {
		/**
		 * 图的分类 1--有向图  2--无向图
		 * @type {number}
		 */
		this.type = type||1;
		
		/**
		 * 图的id
		 * @type {number}
		 */
		this.$id = gid++;

		/**
		 * 图包含的顶点
		 * @type {Ycc.Graph.DirectedV[] | Ycc.Graph.UnDirectedV[]}
		 */
		this.vList = [];

		/**
		 * 图包含的边
		 * @type {Ycc.Graph.E[]}
		 */
		this.eList = [];
	};
	
	
	/**
	 * 获取顶点的map
	 * @return {{}}
	 */
	Ycc.Graph.prototype.getMapV = function () {
		return vMap;
	};
	
	/**
	 * 获取边的map
	 * @return {{}}
	 */
	Ycc.Graph.prototype.getMapE = function () {
		return eMap;
	};
	
	
	/**
	 * 广度优先搜索
	 * @param vArrId {array} 顶点$id数组，代表从哪些顶点开始遍历
	 * @param cb {function} 回调函数
	 *   若回调函数返回true，则遍历结束
	 * @param [vSearchedId] 已遍历的$id数组
	 *
	 * @return {boolean}
	 */
	Ycc.Graph.prototype.bfs = function (vArrId,cb,vSearchedId) {
		vArrId = vArrId||[];
		vSearchedId = vSearchedId || [];
		
		// 递归结束条件
		if(vSearchedId.length===this.vList.length)
			return true;
		
		// 若未结束，但长度为0，说明图中存在孤立部分，任取一个孤立部分的顶点，继续遍历
		if(vArrId.length===0){
			var tempID = null;
			for(var j=0;j<this.vList.length;j++){
				if(vSearchedId.indexOf(this.vList[j].$id)===-1){
					tempID=this.vList[j].$id;
					break;
				}
			}
			return this.bfs([tempID],cb,vSearchedId);
		}
		
		// 修改已遍历的顶点
		var v = null;
		for(var i=0;i<vArrId.length;i++){
			v = vMap[vArrId[i]];
			if(cb.call(this,v)) return true;
			vSearchedId.push(v.$id);
		}
		
		// 下一层需要遍历的节点
		var next = [];
		for(var k=0;k<vArrId.length;k++){
			v = vMap[vArrId[k]];
			var temp =  v.getAccessibleIds().filter(function (id) {
				return vSearchedId.indexOf(id)===-1;
			});
			next = next.concat(temp);
		}
		
		return this.bfs(next,cb,vSearchedId);
	};
	
	
	/**
	 * 图的深度优先遍历
	 * @param vStartID 从哪个顶点开始遍历
	 * @param cb
	 * @param vSearchedId 已遍历的$id数组
	 */
	Ycc.Graph.prototype.dfs = function (vStartID,cb,vSearchedId) {
		vSearchedId = vSearchedId || [];
		
		// 修改已遍历的顶点
		var v = vMap[vStartID];
		vSearchedId.push(v.$id);
		if(cb.call(this,v)) return true;
		
		// 遍历可达的节点
		var accessibleIds = v.getAccessibleIds();
		for(var k=0;k<accessibleIds.length;k++){
			var next = accessibleIds[k];
			if(vSearchedId.indexOf(next)===-1){
				if(this.dfs(next,cb,vSearchedId))
					return true;
			}
		}
		
		// 递归结束条件
		if(vSearchedId.length===this.vList.length)
			return true;
		
		// 若递归未结束，说明图中存在孤立部分，任取一个孤立部分的顶点，继续遍历
		var tempID = null;
		for(var j=0;j<this.vList.length;j++){
			if(vSearchedId.indexOf(this.vList[j].$id)===-1){
				tempID=this.vList[j].$id;
				break;
			}
		}
		
		return this.dfs(tempID,cb,vSearchedId);
	};
	
	
	/**
	 * 创建一个有向图
	 * @static
	 * @param vArr {Array} 顶点列表，示例：[{id,data,...}]
	 * @param eArr {Array}	边列表，示例：[{fromId,toId,data,...}]
	 */
	Ycc.Graph.createDirectedGraph  = function (vArr,eArr) {
		var graph = new Ycc.Graph(1);
		var vList = graph.vList;
		var eList = graph.eList;
		
		vArr.forEach(function (v) {
			vList.push(new Ycc.Graph.DirectedV(v));
		});
		
		eArr.forEach(function (e) {
			var from = null,to=null;
			var edge = new Ycc.Graph.DirectedE();
			for(var i =0;i<vList.length;i++){
				// 两个都找到了就跳出去
				if(from && to) break;
				var v = vList[i];
				if(v.data.id === e.fromId){
					from = v;
					v.outIDs.push(edge.$id);
				}
				if(v.data.id === e.toId){
					to = v;
					v.inIDs.push(edge.$id);
				}
			}
			edge.init(from.$id,to.$id,e);
			eList.push(edge);
		});
		return graph;
	};
	
	

	
	
	
	/**
	 * 有向图中的顶点类
	 * @param data 节点的数据
	 * @constructor
	 */
	Ycc.Graph.DirectedV = function (data) {
		/**
		 * 节点id
		 * @type {number}
		 */
		this.$id = vid++;
		
		/**
		 * 节点所携带的数据
		 * @type {any}
		 */
		this.data = data;
		
		/**
		 * 节点的入边$id列表
		 * @type {number[]}
		 */
		this.inIDs = [];
		
		/**
		 * 节点的出边$id列表
		 * @type {number[]}
		 */
		this.outIDs = [];
		
		// 放入map，方便查找
		vMap[this.$id] = this;
	};
	
	/**
	 * 获取有向图中，某个节点指向的节点ID列表
	 * @return {Array}
	 */
	Ycc.Graph.DirectedV.prototype.getAccessibleIds = function () {
		var ids = [];
		this.outIDs.forEach(function (id) {
			ids.push(eMap[id].toID);
		});
		return ids;
	};
	
	

	/**
	 * 有向图中的边类
	 * @constructor
	 */
	Ycc.Graph.DirectedE = function () {
		
		/**
		 * 边的id
		 * @type {number}
		 */
		this.$id = eid++;
		
		/**
		 * 边所携带的数据，比如权重
		 * @type {any}
		 */
		this.data = null;
		
		/**
		 * 边的起点$id
		 * @type {number}
		 */
		this.fromID = null;
		
		/**
		 * 边的终点$id
		 * @type {number}
		 */
		this.toID = null;
		
		// 放入map，方便查找
		eMap[this.$id] = this;
	};
	
	/**
	 * 有向图边的初始化
	 * @param fromID
	 * @param toID
	 * @param data
	 */
	Ycc.Graph.DirectedE.prototype.init = function (fromID, toID, data) {
		this.fromID = fromID;
		this.toID = toID;
		this.data = data;
	};
	
	
	
	
	
	
	
	
	
	
	
	
	/**
	 * 创建一个无向图
	 * @static
	 * @param vArr {Array} 顶点列表，示例：[{id,data,...}]
	 * @param eArr {Array}	边列表，ids为边关联的两个顶点id列表，长度为2，示例：[{ids,data,...}]
	 */
	Ycc.Graph.createUnDirectedGraph  = function (vArr,eArr) {
		var graph = new Ycc.Graph(2);
		var vList = graph.vList;
		var eList = graph.eList;
		
		vArr.forEach(function (v) {
			vList.push(new Ycc.Graph.UnDirectedV(v));
		});
		
		eArr.forEach(function (e) {
			// 边的节点id列表
			var ids = [];
			var edge = new Ycc.Graph.UnDirectedE();
			for(var i =0;i<vList.length;i++){
				// 遍历的顶点
				var v = vList[i];
				// 两个都找到了就跳出去
				if(ids.length===2) break;

				if(v.data.id === e.ids[0] || v.data.id === e.ids[1]){
					ids.push(v.$id);
					v.eIDs.push(edge.$id);
				}
			}
			
			edge.init(ids,e);
			eList.push(edge);
		});
		return graph;
	};
	
	
	
	/**
	 * 无向图中的顶点类
	 * @param data {any} 顶点携带的数据
	 * @constructor
	 */
	Ycc.Graph.UnDirectedV = function (data) {
		/**
		 * 节点id
		 * @type {number}
		 */
		this.$id = vid++;
		
		/**
		 * 节点所携带的数据
		 * @type {any}
		 */
		this.data = data;
		
		/**
		 * 节点的边$id列表
		 * @type {number[]}
		 */
		this.eIDs = [];
		
		
		// 放入map，方便查找
		vMap[this.$id] = this;
		
	};
	
	
	/**
	 * 获取节点的可达节点id列表
	 * @return {number[]}
	 */
	Ycc.Graph.UnDirectedV.prototype.getAccessibleIds = function () {
		var accessibleIds=[];
		for(var i=0;i<this.eIDs.length;i++){
			// 边
			var edge = eMap[this.eIDs[i]];
			if(edge.vIDs[0]===this.$id){
				accessibleIds.push(edge.vIDs[1]);
			}
			
			if(edge.vIDs[1]===this.$id){
				accessibleIds.push(edge.vIDs[0]);
			}
		}
		return accessibleIds;
	};
	

	
	/**
	 * 无向图中的边类
	 * @constructor
	 */
	Ycc.Graph.UnDirectedE = function () {
		
		/**
		 * 边的id
		 * @type {number}
		 */
		this.$id = eid++;
		
		/**
		 * 边所携带的数据，比如权重
		 * @type {any}
		 */
		this.data = null;
		
		/**
		 * 关联的两个顶点$id数组 长度为2
		 * @type {number[]}
		 */
		this.vIDs = [];
		
		// 放入map，方便查找
		eMap[this.$id] = this;
	};
	
	/**
	 * 无向图中的边类初始化
	 * @param ids
	 * @param data
	 */
	Ycc.Graph.UnDirectedE.prototype.init = function (ids, data) {
		this.vIDs = ids;
		this.data = data;
	};
	
	
	
	




})(Ycc);;/**
 * @file    Ycc.Ticker.class.js
 * @author  xiaohei
 * @date    2017/10/26
 * @description  Ycc.Ticker.class文件
 */



(function (Ycc) {
	
	
	/**
	 * 系统心跳管理类。
	 * 管理系统的心跳；自定义帧事件的广播；帧更新图层的更新等。
	 *
	 * 注：
	 * 心跳间隔时间为1e3/60；
	 * 无论帧率为多少，心跳间隔时间不变；
	 * 总帧数<=总心跳次数；
	 * 只有当总帧数*每帧的理论时间小于总心跳时间，帧的监听函数才会触发，以此来控制帧率；
	 *
	 * @param yccInstance
	 * @constructor
	 */
	Ycc.Ticker = function (yccInstance) {
		this.yccClass = Ycc.Ticker;

		/**
		 * ycc实例的引用
		 * @type {Ycc}
		 */
		this.yccInstance = yccInstance;
		
		/**
		 * 启动时间戳
		 * @type {number}
		 */
		this.startTime = performance.now();
		
		/**
		 * 上一帧刷新的时间戳
		 * @type {number}
		 */
		this.lastFrameTime = this.startTime;
		
		/**
		 * 上一帧刷新时的心跳数
		 * @type {number}
		 */
		this.lastFrameTickerCount = 0;
		
		/**
		 * 当前帧与上一帧的刷新的时间差
		 * @type {number}
		 */
		this.deltaTime = 0;
		
		/**
		 * 当前帧与上一帧时间差的期望值（根据帧率计算而来的）
		 * @type {number}
		 */
		this.deltaTimeExpect = 0;
		
		/**
		 * 实际帧间隔与期望帧间隔的时间比
		 * @type {number}
		 */
		this.deltaTimeRatio = 1;
		
		/**
		 * 所有自定义的帧监听函数列表
		 * @type {function[]}
		 */
		this.frameListenerList = [];
		
		/**
		 * 默认帧率
		 * @type {number}
		 */
		this.defaultFrameRate = 60;
		
		/**
		 * 默认帧间隔
		 * @type {number}
		 */
		this.defaultDeltaTime = 1e3/this.defaultFrameRate;
		
		/**
		 * 每帧之间间隔的心跳数
		 * @type {number}
		 */
		this.tickerSpace = 1;
		
		/**
		 * 总帧数
		 * @type {number}
		 */
		this.frameAllCount = 0;
		
		/**
		 * 总心跳次数
		 * @type {number}
		 */
		this.timerTickCount = 0;
		
		/**
		 * 定时器ID。用于停止心跳。
		 * @type {number}
		 * @private
		 */
		this._timerId = 0;
		
		/**
		 * 心跳是否已经启动
		 * @type {boolean}
		 * @private
		 */
		this._isRunning = false;
	};
	
	
	/**
	 * 定时器开始
	 * @param [frameRate] 心跳频率，即帧率
	 * 可取值有[60,30,20,15]
	 */
	Ycc.Ticker.prototype.start = function (frameRate) {
		var self = this;
		if(self._isRunning){
			return;
		}
		var timer = requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || oRequestAnimationFrame || msRequestAnimationFrame;
		// 正常设置的帧率
		frameRate = frameRate?frameRate:self.defaultFrameRate;
		// 每帧之间的心跳间隔，默认为1
		self.tickerSpace = parseInt(60/frameRate)||1;
		
		// 每帧理论的间隔时间
		self.deltaTimeExpect = 1000/frameRate;
		
		// 初始帧数量设为0
		self.frameAllCount = 0;

		// timer兼容
		timer || (timer = function(callback) {
				return setTimeout(function () {
					callback(Date.now());
				}, 1e3 / 60);
			}
		);
		// 启动时间
		self.startTime = performance.now();
		// 启动心跳
		// self._timerId = timer.call(window, cb);
		self._timerId = timer(cb);
		self._isRunning = true;
		
		
		// 心跳回调函数。约60fps
		function cb(curTime) {
			// 总的心跳数加1
			self.timerTickCount++;
			if(self.timerTickCount - self.lastFrameTickerCount === self.tickerSpace){
				// 设置 总帧数加1
				self.frameAllCount++;
				// 设置 两帧的时间差
				self.deltaTime = curTime-self.lastFrameTime;
				// 设置 帧间隔缩放比
				self.deltaTimeRatio = self.deltaTime/self.deltaTimeExpect;
				// 设置 上一帧刷新时间
				self.lastFrameTime += self.deltaTime;
				// 设置 上一帧刷新时的心跳数
				self.lastFrameTickerCount = self.timerTickCount;
				// 执行所有自定义的帧监听函数
				self.broadcastFrameEvent();
				// 执行所有图层的帧监听函数
				self.broadcastToLayer();
			}
			
			// 递归调用心跳函数
			// self._timerId = timer.call(window,cb);
			self._timerId = timer(cb);
		}
		
	};
	
	/**
	 * 停止心跳
	 */
	Ycc.Ticker.prototype.stop = function () {
		var stop = cancelAnimationFrame || webkitCancelAnimationFrame || mozCancelAnimationFrame || oCancelAnimationFrame;
		stop || (stop = function (id) {
			return clearTimeout(id);
		});
		stop(this._timerId);
		this._isRunning = false;
	};
	
	
	
	/**
	 * 给每帧添加自定义的监听函数
	 * @param listener
	 */
	Ycc.Ticker.prototype.addFrameListener = function (listener) {
		this.frameListenerList.push(listener);
	};
	
	/**
	 * 移除某个监听函数
	 * @param listener
	 */
	Ycc.Ticker.prototype.removeFrameListener = function (listener) {
		var index = this.frameListenerList.indexOf(listener);
		if(index!==-1)
			this.frameListenerList.splice(index,1);
	};
	
	
	/**
	 * 执行所有自定义的帧监听函数
	 */
	Ycc.Ticker.prototype.broadcastFrameEvent = function () {
		for(var i =0;i<this.frameListenerList.length;i++){
			var listener = this.frameListenerList[i];
			Ycc.utils.isFn(listener) && listener();
		}
	};
	
	/**
	 * 执行所有图层的监听函数
	 */
	Ycc.Ticker.prototype.broadcastToLayer = function () {
		for(var i = 0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			layer.show && layer.enableFrameEvent && layer.onFrameComing();
		}
	};
	
	
	
	
	
	
})(Ycc);;/**
 * @file    Ycc.Debugger.class.js
 * @author  xiaohei
 * @date    2018/10/24
 * @description  Ycc.Debugger.class文件
 */


(function (Ycc) {
	
	/**
	 * ycc的调试模块
	 * @constructor
	 */
	Ycc.Debugger = function (yccInstance) {
		this.yccClass = Ycc.Debugger;
		
		/**
		 * ycc的实例
		 */
		this.yccInstance = yccInstance;
		/**
		 * 信息面板显示的UI 帧间隔
		 * @type {Ycc.UI}
		 */
		this.deltaTime = null;
		/**
		 * 信息面板显示的UI 帧间隔期望值
		 * @type {Ycc.UI}
		 */
		this.deltaTimeExpect = null;
		/**
		 * 信息面板显示的UI 总帧数
		 * @type {Ycc.UI}
		 */
		this.frameAllCount = null;
		/**
		 * 信息面板显示的UI 帧间隔平均值
		 * @type {Ycc.UI}
		 */
		this.deltaTimeAverage = null;
		
		/**
		 * 当前帧渲染耗时
		 * @type {Ycc.UI}
		 */
		this.renderTime = null;
		
		/**
		 * 当前帧渲染的所有UI个数
		 * @type {Ycc.UI}
		 */
		this.renderUiCount = null;
		
		this.totalJSHeapSize = null;
		
		this.usedJSHeapSize = null;
		
		this.jsHeapSizeLimit = null;
		
		
		/**
		 * 调试面板所显示的字段，示例：[{name,cb,ui}]
		 * @type {Array}
		 */
		this.fields = [];
		
		/**
		 * 调试面板的容纳区
		 * @type {Ycc.UI.Rect}
		 */
		this.rect = null;
		
		/**
		 * 调试面板的图层
		 */
		this.layer = null;
		
	};
	
	
	Ycc.Debugger.prototype.init = function () {
		this.rect = new Ycc.UI.Rect({
			name:'debuggerRect',
			rect:new Ycc.Math.Rect(10,10,200,140),
			color:'rgba(255,255,0,0.5)'
		});
		this.layer = yccInstance.layerManager.newLayer({
			name:"debug图层"
		});
		var self = this;
		this.yccInstance.ticker.addFrameListener(function () {
			self.updateInfo();
		});
	};
	
	/**
	 * 显示调试面板
	 */
	Ycc.Debugger.prototype.showDebugPanel = function () {
		this.init();
		var layer = this.layer;
		if(layer.uiList.indexOf(this.rect)===-1)
			layer.addUI(this.rect);
	};
	
	
	
	/**
	 * 更新面板的调试信息
	 */
	Ycc.Debugger.prototype.updateInfo = function () {
		
		// 强制使debug面板置顶
		var layerList = this.yccInstance.layerList;
		var index = layerList.indexOf(this.layer);
		// bug 调试layer必须存在
		if(index===-1) return;
		if(index+1!==layerList.length){
			layerList.splice(index,1);
			layerList.push(this.layer);
		}
		
		this.rect.rect.height = this.fields.length*20;
		this.fields.forEach(function (field) {
			field.ui.content = field.name+' '+field.cb();
		});
		
	};
	
	
	/**
	 * 添加一个信息项
	 * @param name
	 * @param cb()	{function}
	 *  cb必须返回一个值，这个值将直接填入
	 *
	 */
	Ycc.Debugger.prototype.addField = function (name, cb) {
		var index = this.fields.length;
		var ui  = new Ycc.UI.SingleLineText({
			content:"usedJSHeapSize "+cb(),
			fontSize:'12px',
			rect:new Ycc.Math.Rect(0,20*index,100,20),
			color:'green'
		});
		this.fields.push({name:name,cb:cb,ui:ui});
		this.rect.addChild(ui);
	};
	
	
	/**
	 * 将调试面板添加至某个图层
	 * @param layer {Ycc.Layer}
	 */
	Ycc.Debugger.prototype.addToLayer = function (layer) {
		if(layer.uiList.indexOf(this.rect)===-1)
			layer.addUI(this.rect);
	};
	
	/**
	 * 更新某个调试字段的回调函数
	 * @param name
	 * @param cb
	 */
	Ycc.Debugger.prototype.updateField = function (name,cb) {
		for(var i=0;i<this.fields.length;i++){
			if(this.fields[i].name===name){
				this.fields[i].cb=null;
				this.fields[i].cb=cb;
				return;
			}
		}
	};
	
	
	/**
	 * 调试日志信息类
	 * @param message
	 * @constructor
	 */
	Ycc.Debugger.Log = function (message) {
		this.message = '[Ycc logger]=> '+message;
	};
	/**
	 * 调试错误信息类
	 * @param message
	 * @constructor
	 */
	Ycc.Debugger.Error = function (message) {
		this.message = '[Ycc  error]=> '+message;
	};
	
	
	
	
})(Ycc);;/**
 * @file    Ycc.Loader.class.js
 * @author  xiaohei
 * @date    2017/10/9
 * @description  Ycc.Loader.class文件
 */



(function (Ycc) {
	
	/**
	 * ycc实例的资源加载类
	 * @constructor
	 */
	Ycc.Loader = function () {
		this.yccClass = Ycc.Loader;
		
		/**
		 * 异步模块
		 * @type {Ycc.Ajax}
		 */
		this.ajax = new Ycc.Ajax();
		
		/**
		 * 基础地址，末尾必须有斜线'/'
		 * @type {string}
		 */
		this.basePath = '';
	};
	
	/**
	 * 并发加载资源
	 * @param resArr
	 * @param [resArr.name] 			资源名称，方便查找
	 * @param resArr.url  				资源的url
	 * @param [resArr.type]  			资源类型 image,audio，默认为image
	 * @param [resArr.res]  			资源加载完成后，附加给该字段
	 * @param [resArr.crossOrigin]  	资源跨域配置项
	 * @param endCb						资源加载结束的回调
	 * @param [progressCb]				资源加载进度的回调
	 * @param [endResArr] 				用于存储加载已结束的音频，一般不用传值
	 * @param [endResMap] 				用于存储加载已结束的音频map，一般不用传值。注：map的key是根据name字段生成的
	 */
	Ycc.Loader.prototype.loadResParallel = function (resArr, endCb, progressCb,endResArr,endResMap) {
		endResArr = endResArr || [];
		endResMap = endResMap || {};
		
		for(var i=0;i<resArr.length;i++){
			var curRes = resArr[i];
			var successEvent = "load";
			var errorEvent = "error";
			curRes.type = curRes.type || 'image';
			
			if(curRes.type==='image'){
				curRes.res = new Image();
				curRes.res.src = curRes.url;
				curRes.res.crossOrigin = curRes.crossOrigin||'';
			}
			if(curRes.type==='audio'){
				successEvent = 'loadedmetadata';
				curRes.res = new Audio();
				curRes.res.src = curRes.url;
				curRes.res.preload = "load";
				curRes.res.crossOrigin = curRes.crossOrigin||'';
			}
			
			curRes.res.addEventListener(successEvent,listener(curRes,i,true));
			curRes.res.addEventListener(errorEvent,listener(curRes,i,false));
			
			
			function listener(curRes,index,error) {
				return function () {
					endResArr.push(curRes);
					if(typeof curRes.name!=='undefined') endResMap[curRes.name] = curRes.res;
					Ycc.utils.isFn(progressCb) && progressCb(curRes,error,index);
					if(resArr.length===endResArr.length){
						endCb(endResArr,endResMap);
					}
				};
			}
		}
	};
	

	/**
	 * 依次加载资源
	 * @param resArr
	 * @param [resArr.name] 	资源名称，方便查找
	 * @param resArr.url  		资源的url
	 * @param [resArr.type]  	资源类型 image,audio
	 * @param [resArr.res]  	资源加载完成后，附加给该字段
	 * @param endCb				资源加载结束的回调
	 * @param [progressCb]		资源加载进度的回调
	 * @param [endResArr] 		用于存储加载已结束的音频，一般不用传值
	 * @param [endResMap] 		用于存储加载已结束的音频map，一般不用传值。注：map的key是根据name字段生成的
	 */
	Ycc.Loader.prototype.loadResOneByOne = function (resArr, endCb, progressCb,endResArr,endResMap) {
		endResArr = endResArr || [];
		endResMap = endResMap || {};
		if(resArr.length===endResArr.length){
			endCb(endResArr,endResMap);
			return;
		}
		var self = this;
		// 当前加载的下标
		var index = endResArr.length;
		var curRes = resArr[index];
		var successEvent = "load";
		var errorEvent = "error";
		curRes.type = curRes.type || 'image';
		
		
		
		var timerId = 0;
		polyfillWx(self.basePath + curRes.url,function (fullPath) {
			
			if(curRes.type==='image'){
				curRes.res = new Image();
				curRes.res.src = fullPath;
				
				curRes.res.addEventListener(successEvent,onSuccess);
				curRes.res.addEventListener(errorEvent,onError);
				
				// 超时提示只针对图片
				timerId = setTimeout(function () {
					curRes.res.removeEventListener(successEvent,onSuccess);
					curRes.res.removeEventListener(errorEvent,onSuccess);
					onError({message:"获取资源超时！"});
				},curRes.timeout||10000);
				
			}else if(curRes.type==='audio'){
				// 兼容wx端
				if("undefined"!==typeof wx){
					curRes.res = new Audio();
					curRes.res.src = fullPath;
					successEvent = 'loadedmetadata';
					errorEvent = 'error';
					curRes.res.addEventListener(successEvent,onSuccess);
					curRes.res.addEventListener(errorEvent,onError);
					return;
				}
				
				
				curRes.res = new AudioPolyfill();
				if(!curRes.res.context){
					onError({message:"浏览器不支持AudioContext！"});
					return;
				}
				console.log(fullPath);
				self.ajax.get(fullPath,(function (curRes) {
					return function (arrayBuffer) {
						curRes.res.context.decodeAudioData(arrayBuffer, function(buf) {
							curRes.res.buf=buf;
							onSuccess();
						}, onError);
					}
				})(curRes),onError,'arraybuffer');
			}
			
		});

		
		
		function onSuccess() {
			console.log('loader:',curRes.name,'success');
			clearTimeout(timerId);
			if(curRes.type==='image' || ("undefined"!==typeof wx && curRes.type==='audio' )){
				curRes.res.removeEventListener(successEvent,onSuccess);
				curRes.res.removeEventListener(errorEvent,onError);
			}

			endResArr.push(curRes);
			if(typeof curRes.name!=='undefined') endResMap[curRes.name] = curRes.res;

			Ycc.utils.isFn(progressCb) && progressCb(curRes,null,index);
			self.loadResOneByOne(resArr,endCb,progressCb,endResArr,endResMap);
		}
		function onError(e) {
			console.log('loader:',curRes.name,'error');
			clearTimeout(timerId);
			if(curRes.type==='image' || ("undefined"!==typeof wx && curRes.type==='audio' )){
				curRes.res.removeEventListener(successEvent,onSuccess);
				curRes.res.removeEventListener(errorEvent,onError);
			}

			endResArr.push(curRes);
			if(typeof curRes.name!=='undefined') endResMap[curRes.name] = curRes.res;

			Ycc.utils.isFn(progressCb) && progressCb(curRes,e,index);
			self.loadResOneByOne(resArr,endCb,progressCb,endResArr,endResMap);
		}

		
	};
	
	/**
	 * 获取资源
	 * @param resArr
	 * @param name
	 */
	Ycc.Loader.prototype.getResByName = function (name,resArr) {
		for(var i=0;i<resArr.length;i++){
			if(resArr[i].name===name)
				return resArr[i];
		}
		return null;
	};
	
	
	
	/**
	 * URL兼容微信的云开发
	 * @param fullURL
	 * 若为云开发，此路径为云开发中的FileID
	 * 非云开发时，此路径为绝对路径
	 * @param cb(url)
	 */
	function polyfillWx(fullURL, cb) {
		// 微信端、并且使用了云路径的资源
		if(Ycc.utils.isWx()&&fullURL.indexOf('cloud://')!==-1){
			wx.cloud.downloadFile({
				fileID: fullURL,
				success: function(res){
					// 返回临时文件路径
					cb.call(this,res.tempFilePath);
				},
				fail: function () {
					cb.call(this,fullURL);
				}
			});
		}else{
			cb.call(this,fullURL);
		}
	}
	
	
	
	
	
	/**
	 * audio元素的垫片，此类是私有类
	 * @constructor
	 */
	function AudioPolyfill(){
		this.currentTime = 0;
		
		/**
		 * 播放器
		 * @type {null}
		 */
		this.source = null;
		
		/**
		 * 是否正在播放
		 * @type {boolean}
		 */
		this.running = false;
	}
	
	/**
	 * audio api环境
	 * 公用属性
	 * @readonly
	 */
	AudioPolyfill.prototype.context = (("undefined"!==typeof AudioContext)&&new AudioContext()) ||
		(("undefined"!==typeof webkitAudioContext)&&new webkitAudioContext());
		///("undefined"!==typeof AudioContext || "undefined"!==typeof webkitAudioContext) && new (AudioContext || webkitAudioContext)();
	
	
	/**
	 * 播放音效
	 * 根据currentTime播放
	 */
	AudioPolyfill.prototype.play = function () {
		var context = this.context;
		if(!context) return;

		this.running = true;
		// 先stop
		this.source && this.source.stop();
		var source = context.createBufferSource();
		source.buffer = this.buf;
		source.connect(context.destination);
		source.start(this.currentTime);
		
		this.source = source;
	};
	
	/**
	 * 暂停音效
	 */
	AudioPolyfill.prototype.pause = function () {
		var context = this.context;
		if(!context) return;

		this.running = false;
		this.source.stop();
		this.source = null;
	};
	
	
})(Ycc);;/**
 * @file    Ycc.Ajax.class.js
 * @author  xiaohei
 * @date    2018/10/31
 * @description  Ycc.Ajax.class文件
 */



(function (Ycc) {
	
	/**
	 * 异步加载类
	 * @constructor
	 */
	Ycc.Ajax = function () {
		this.yccClass = Ycc.Ajax;
	};
	
	

	/**
	 * ajax get请求
	 * @param url
	 * @param successCb			成功的回调函数
	 * @param errorCb			失败的回调函数
	 * @param responseType
	 */
	/**
	 * ajax get请求
	 * @param option
	 * @param option.url
	 * @param option.successCb
	 * @param option.successCb
	 * @param option.responseType
	 */
	Ycc.Ajax.prototype.get = function (option) {
		var self = this;
		
		var url='',
			successCb,
			errorCb,
			responseType='json';
		if(arguments.length===1){
			url='';
			successCb=option.successCb;
			errorCb=option.errorCb;
			responseType='json';
		}else {
			url=arguments[0];
			successCb=arguments[1];
			errorCb=arguments[2];
			responseType=arguments[3];
		}
		
		
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = responseType;
		
		// Decode asynchronously
		request.onload = function() {
			successCb.call(self,request.response);
		};
		
		request.onerror = function (e) {
			errorCb.call(self,e);
		};
		request.send();
	};
	
	
	
	
})(Ycc);;/**
 * @file    Ycc.Event.class.js
 * @author  xiaohei
 * @date    2017/11/20
 * @description  Ycc.Event.class文件
 */



(function (Ycc) {
	
	/**
	 * 事件的数据结构类
	 * @param type {String}	事件类型
	 * @constructor
	 */
	Ycc.Event = function (type) {
		this.yccClass = Ycc.Event;
		
		/**
		 * 事件类型
		 * @type {string|Object}
		 */
		this.type = type?type:"";
		/**
		 * 鼠标或点击位置
		 * @type {number}
		 */
		this.x=0;
		/**
		 * 鼠标或点击位置
		 * @type {number}
		 */
		this.y=0;
		/**
		 * ycc事件所对应的原始事件
		 */
		this.originEvent = null;
		
		/**
		 * 鼠标按下的ycc事件
		 * @type {Ycc.Event}
		 */
		// this.mouseDownYccEvent = null;

		/**
		 * 鼠标抬起的ycc事件
		 * @type {Ycc.Event}
		 */
		// this.mouseUpYccEvent = null;

		/**
		 * 是否阻止向下传递。默认为false，不阻止
		 * @type {boolean}
		 */
		this.stop = false;
		
		/**
		 * 事件触发的对象
		 * @type {Ycc.UI|null}
		 */
		this.target = null;
		
		/**
		 * 事件触发时，鼠标的坐标与UI的坐标差。
		 * 即(e.x-target.x,e.y-target.y)，
		 * 该属性只在事件类型为mousedown、dragstart、dragging时有效
		 * @type {Ycc.Math.Dot|null}
		 */
		// this.targetDeltaPosition = null;
		
		if(Ycc.utils.isObj(type)){
			Ycc.utils.extend(this,type);
		}
	};
	
	/**
	 * 鼠标按下事件，全局保存，若存在，则表明鼠标处于按下状态
	 * @type {Ycc.Event}
	 */
	// Ycc.Event.mouseDownEvent = null;

	/**
	 * 鼠标抬起事件，全局保存，若存在，则表明鼠标处于抬起状态
	 * @type {Ycc.Event}
	 */
	// Ycc.Event.mouseUpEvent = null;
	
	/**
	 * 拖拽开始的标志位
	 * @type {null}
	 */
	// Ycc.Event.dragStartFlag = false;
	
	
	
})(Ycc);;/**
 * @file    Ycc.Listener.class.js
 * @author  xiaohei
 * @date    2017/11/16
 * @description  Ycc.Listener.class文件
 */




(function (Ycc) {
	
	/**
	 * 事件监听类。供Layer及UI类继承
	 * @constructor
	 */
	Ycc.Listener = function () {
		this.yccClass = Ycc.Listener;
		/**
		 * 所有的监听器。key为type，val为listener数组。
		 * @type {{}}
		 */
		this.listeners = {};
		/**
		 * 被阻止的事件类型。key为type，val为boolean
		 * @type {{}}
		 */
		this.stopType = {};

		/**
		 * 被禁用的事件类型。key为type，val为boolean
		 * @type {{}}
		 */
		this.disableType = {};
		
		/**
		 * 是否阻止所有的事件触发
		 * @desc 只会阻止当前UI事件的触发，不会阻止其下面子元素事件的触发
		 * @type {boolean}
		 */
		this.stopAllEvent = false;
		
		/**
		 * 点击 的监听。默认为null
		 * @type {function}
		 */
		this.onclick = null;
		/**
		 * 鼠标按下 的监听。默认为null
		 * @type {function}
		 */
		this.onmousedown = null;
		/**
		 * 鼠标抬起 的监听。默认为null
		 * @type {function}
		 */
		this.onmouseup = null;
		/**
		 * 鼠标移动 的监听。默认为null
		 * @type {function}
		 */
		this.onmousemove = null;
		/**
		 * 拖拽开始 的监听。默认为null
		 * @type {function}
		 */
		this.ondragstart = null;
		/**
		 * 拖拽 的监听。默认为null
		 * @type {function}
		 */
		this.ondragging = null;
		/**
		 * 拖拽结束 的监听。默认为null
		 * @type {function}
		 */
		this.ondragend = null;
		/**
		 * 鼠标移入 的监听。默认为null
		 * @type {function}
		 */
		this.onmouseover = null;
		/**
		 * 鼠标移出 的监听。默认为null
		 * @type {function}
		 */
		this.onmouseout = null;
		/**
		 * 触摸开始 的监听。默认为null
		 * @type {function}
		 */
		this.ontouchstart = null;
		
		/**
		 * 触摸移动 的监听。默认为null
		 * @type {function}
		 */
		this.ontouchmove = null;
		/**
		 * 触摸结束 的监听。默认为null
		 * @type {function}
		 */
		this.ontouchend = null;

		/**
		 * 点击事件 的监听。默认为null
		 * @type {function}
		 */
		this.ontap = null;
	};
	
	
	/**
	 * 释放某个监听器的内存
	 * 将其所有引用属性设为null，等待GC
	 * @static
	 * @param listener
	 */
	Ycc.Listener.release = function (listener) {
		// 临时变量
		var key = null;
		
		listener.yccClass = null;
		
		/**
		 * 所有的监听器。key为type，val为listener数组。
		 * @type {{}}
		 */
		for(key in listener.listeners){
			if(!listener.listeners.hasOwnProperty(key)) continue;
			listener.listeners[key].length=0;
			delete listener.listeners[key];
		}
		// listener.listeners = null;
		
		
		/**
		 * 被阻止的事件类型。key为type，val为boolean
		 * @type {{}}
		 */
		Ycc.utils.releaseObject(listener.stopType);
		// listener.stopType = null;
		
		/**
		 * 被禁用的事件类型。key为type，val为boolean
		 * @type {{}}
		 */
		Ycc.utils.releaseObject(listener.disableType);
		// listener.disableType = null;
		
		/**
		 * 是否阻止所有的事件触发
		 * @type {boolean}
		 */
		listener.stopAllEvent = true;
		
		/**
		 * 点击 的监听。默认为null
		 * @type {function}
		 */
		listener.onclick = null;
		/**
		 * 鼠标按下 的监听。默认为null
		 * @type {function}
		 */
		listener.onmousedown = null;
		/**
		 * 鼠标抬起 的监听。默认为null
		 * @type {function}
		 */
		listener.onmouseup = null;
		/**
		 * 鼠标移动 的监听。默认为null
		 * @type {function}
		 */
		listener.onmousemove = null;
		/**
		 * 拖拽开始 的监听。默认为null
		 * @type {function}
		 */
		listener.ondragstart = null;
		/**
		 * 拖拽 的监听。默认为null
		 * @type {function}
		 */
		listener.ondragging = null;
		/**
		 * 拖拽结束 的监听。默认为null
		 * @type {function}
		 */
		listener.ondragend = null;
		/**
		 * 鼠标移入 的监听。默认为null
		 * @type {function}
		 */
		listener.onmouseover = null;
		/**
		 * 鼠标移出 的监听。默认为null
		 * @type {function}
		 */
		listener.onmouseout = null;
		/**
		 * 触摸开始 的监听。默认为null
		 * @type {function}
		 */
		listener.ontouchstart = null;
		
		/**
		 * 触摸移动 的监听。默认为null
		 * @type {function}
		 */
		listener.ontouchmove = null;
		/**
		 * 触摸结束 的监听。默认为null
		 * @type {function}
		 */
		listener.ontouchend = null;
		
		/**
		 * 点击事件 的监听。默认为null
		 * @type {function}
		 */
		listener.ontap = null;
	};
	
	
	
	
	/**
	 * 添加某个类型的监听器
	 * @param type	{string}
	 * @param listener	{function}
	 */
	Ycc.Listener.prototype.addListener = function (type, listener) {
		var ls = this.listeners[type];
		if(!ls)
			this.listeners[type] = [];
		this.listeners[type].indexOf(listener) === -1 && this.listeners[type].push(listener);
	};
	
	
	/**
	 * 阻止某个事件类型继续传递
	 * @param type
	 */
	Ycc.Listener.prototype.stop = function (type) {
		this.stopType[type] = true;
	};
	
	/**
	 * 触发某一类型的监听器
	 * @param type
	 * @param data
	 */
	Ycc.Listener.prototype.triggerListener = function (type,data) {
		if(this.stopAllEvent) return;
		if(this.disableType[type]) return;
		
		if(!this.stopType[type])
			Ycc.utils.isFn(this["on"+type]) && this["on"+type].apply(this,Array.prototype.slice.call(arguments,1));

		var ls = this.listeners && this.listeners[type];
		if(!ls || !Ycc.utils.isArray(ls)) return;
		for(var i=0;i<ls.length;i++){
			if(!this.stopType[type])
				ls[i].apply(this,Array.prototype.slice.call(arguments,1));
		}
	};
	
	
	/**
	 * 移除某个类型的监听器
	 * @param type
	 * @param listener
	 */
	Ycc.Listener.prototype.removeListener = function (type,listener) {
		var ls = this.listeners[type];
		if(!ls || !Ycc.utils.isArray(ls)) return;
		for(var i=0;i<ls.length;i++){
			if(ls[i]===listener) {
				ls.splice(i,1);
				return;
			}
		}
	};
	
	/**
	 * 禁止某个事件触发
	 * @param type
	 */
	Ycc.Listener.prototype.disableEvent = function (type) {
		this.disableType[type] = true;
	};
	
	/**
	 * 恢复某个事件的触发
	 * @param type
	 */
	Ycc.Listener.prototype.resumeEvent = function (type) {
		this.disableType[type] = false;
	};
	
	
	
	
	
})(Ycc);;/**
 * @file    Ycc.TouchLifeTracer.class.js
 * @author  xiaohei
 * @date    2018/6/12
 * @description  Ycc.TouchLifeTracer.class文件
 * @requires Ycc.Listener
 */


(function (Ycc) {
	
	
	
	
	/**
	 * touch事件的生命周期类
	 * @constructor
	 * @private
	 * */
	var TouchLife = (function () {
		var id = 0;
		return function () {
			/**
			 * 生命周期的id
			 * @type {number}
			 * */
			this.id=id++;
			
			/**
			 * 开始的touch事件
			 * @type {Touch}
			 * */
			this.startTouchEvent = null;
			
			/**
			 * 结束的touch事件
			 * @type {Touch}
			 * */
			this.endTouchEvent = null;
			
			/**
			 * 结束的touch事件
			 * @type {Touch[]}
			 * */
			this.moveTouchEventList = [];
			
			/**
			 * 开始时间
			 * @type {number}
			 */
			this.startTime = Date.now();
			
			/**
			 * 结束时间
			 * @type {number}
			 */
			this.endTime = 0;
		};
	})();
	
	
	/**
	 * touch事件追踪器
	 * @param opt
	 * @param opt.target	被追踪的dom对象
	 * @extends Ycc.Listener
	 * @constructor
	 */
	Ycc.TouchLifeTracer = function(opt) {
		Ycc.Listener.call(this);
		
		/**
		 * 追踪的对象
		 * */
		this.target = opt.target;
		
		/**
		 * 作用于target的所有生命周期，包含存活和死亡的周期
		 * */
		this._lifeList = [];
		
		/**
		 * 当前存活的生命周期，正在与target接触的触摸点生命周期
		 * */
		this.currentLifeList = [];
		
		/**
		 * 当前对象的touch
		 * @type {Array}
		 */
		this.targetTouches = [];
		
		/**
		 * 当前target所有的touch
		 * @type {Array}
		 */
		this.touches = [];
		
		/**
		 * 当前改变的所有touch
		 * @type {Array}
		 */
		this.changedTouches = [];
		
		/**
		 * 某个生命周期开始
		 * @type {function}
		 * @param callback(life)
		 * */
		this.onlifestart = null;
		
		/**
		 * 某个生命周期状态变更
		 * @type {function}
		 * @param callback(life)
		 * */
		this.onlifechange = null;
		
		/**
		 * 某个生命周期开始
		 * @type {function}
		 * @param callback(life)
		 * */
		this.onlifeend = null;
		
		/**
		 * 添加生命周期
		 * @param life {TouchLife}	生命周期
		 * @return {*}
		 */
		this.addLife = function (life) {
			this._lifeList.push(life);
		};
		
		/**
		 * 根据identifier查找生命周期，此方法只能在生命周期内使用
		 * @param identifier
		 * @return {*}
		 */
		this.findCurrentLifeByTouchID = function (identifier) {
			for(var i=0;i<this.currentLifeList.length;i++){
				var life = this.currentLifeList[i];
				if(life.startTouchEvent.identifier===identifier)
					return life;
			}
		};
		
		/**
		 * 根据touchID删除当前触摸的生命周期
		 * @param identifier
		 * @return {boolean}
		 */
		this.deleteCurrentLifeByTouchID = function (identifier) {
			for(var i=0;i<this.currentLifeList.length;i++){
				var life = this.currentLifeList[i];
				if(life.startTouchEvent.identifier===identifier){
					this.currentLifeList.splice(i,1);
					return true;
				}
			}
			return false;
		};
		
		
		/**
		 * 初始化
		 */
		this.init = function () {
			var self = this;
			this.target.addEventListener("touchstart",function (e) {
				e.preventDefault();
				self.syncTouches(e);
				var life = new TouchLife();
				life.startTouchEvent = e.changedTouches[0];
				self.addLife(life);
				self.currentLifeList.push(life);
				// self.onlifestart && self.onlifestart(life);
				self.triggerListener('lifestart',life);
			});
			
			this.target.addEventListener('touchmove',function (e) {
				e.preventDefault();
				self.syncTouches(e);
				var touches = e.changedTouches;
				for(var i=0;i<touches.length;i++){
					var touch = touches[i];
					var life = self.findCurrentLifeByTouchID(touch.identifier);
					var index = self.indexOfTouchFromMoveTouchEventList(life.moveTouchEventList,touch);
					if(index===-1)
						life.moveTouchEventList.push(touch);
					else
						life.moveTouchEventList[index]=touch;
					// self.onlifechange && self.onlifechange(life);
					self.triggerListener('lifechange',life);
				}
			});
			this.target.addEventListener('touchend',function (e) {
				e.preventDefault();
				self.syncTouches(e);
				var touch = e.changedTouches[0];
				var life = self.findCurrentLifeByTouchID(touch.identifier);
				life.endTouchEvent = touch;
				life.endTime = Date.now();
				self.deleteCurrentLifeByTouchID(touch.identifier);
				// self.onlifeend && self.onlifeend(life);
				self.triggerListener('lifeend',life);
			});
		};
		
		this.init();
	};
	
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.TouchLifeTracer.prototype,Ycc.Listener.prototype);
	
	/**
	 * 同步当前HTML元素的touches
	 * @param e 原生的touch事件。touchstart、end、move ...
	 */
	Ycc.TouchLifeTracer.prototype.syncTouches = function (e) {
		this.touches = [];
		this.changedTouches = [];
		this.targetTouches = [];
		var i=0;
		var touches=[];
		touches = e.touches;
		for(i=0;i<touches.length;i++){
			this.touches.push(touches[i]);
		}
		touches = e.changedTouches;
		for(i=0;i<e.changedTouches.length;i++){
			this.changedTouches.push(touches[i]);
		}
		touches = e.targetTouches;
		for(i=0;i<e.targetTouches.length;i++){
			this.targetTouches.push(touches[i]);
		}
	};
	
	/**
	 * 寻找移动过的接触点
	 */
	Ycc.TouchLifeTracer.prototype.indexOfTouchFromMoveTouchEventList = function (moveTouchEventList,touch) {
		for(var i=0;i<moveTouchEventList.length;i++){
			if(touch.identifier===moveTouchEventList[i].identifier)
				return i;
		}
		return -1;
	};
	
})(Ycc);;/**
 * @file    Ycc.Gesture.class.js
 * @author  xiaohei
 * @date    2018/6/19
 * @description  Ycc.Gesture.class文件
 * 移动端的手势类，封装简单的手势操作，操作只对target元素生效，若需要转发给Ycc.UI，则需要自己处理
 * @requires Ycc.TouchLifeTracer
 */


(function (Ycc) {
	
	/**
	 *
	 * @param option
	 * @param option.target 手势触发的HTML对象
	 * @extends Ycc.Listener
	 * @constructor
	 */
	Ycc.Gesture = function (option) {
		Ycc.Listener.call(this);
		this.yccClass = Ycc.Gesture;
		
		this.option = option;
		
		/**
		 * 长按事件的定时器id
		 * @type {null}
		 * @private
		 */
		this._longTapTimeout = null;
		
		this._init();
	};
	Ycc.Gesture.prototype = new Ycc.Listener();
	
	
	
	
	Ycc.Gesture.prototype._init = function () {
		if(Ycc.utils.isMobile()){
			console.log('mobile gesture init...');
			this._initForMobile();
		}else{
			console.log('pc gesture init...');
			this._initForPC();
		}
	};
	
	/**
	 * 初始化移动端的手势
	 * @private
	 */
	Ycc.Gesture.prototype._initForMobile = function () {
		var self = this;
		var tracer = new Ycc.TouchLifeTracer({target:this.option.target});
		// 上一次触摸、当前触摸
		var preLife,curLife;
		// 是否阻止事件
		var prevent = {
			tap:false,
			swipe:false
		};
		tracer.onlifestart = function (life) {

			self.triggerListener('tap',self._createEventData(life.startTouchEvent,'tap'));
			self.triggerListener('log','tap triggered');

			// 触发拖拽开始事件
			self.triggerListener('dragstart',self._createEventData(life.startTouchEvent,'dragstart'));

			// 多个触摸点的情况
			if(tracer.currentLifeList.length>1){
				self.triggerListener('log','multi touch start ...');
				self.triggerListener('multistart',tracer.currentLifeList);
				
				prevent.tap = false;
				prevent.swipe = false;
				clearTimeout(this._longTapTimeout);
				// 缩放、旋转只取最先接触的两个点即可
				preLife = tracer.currentLifeList[0];
				curLife = tracer.currentLifeList[1];
				return this;
			}
			
			// 只有一个触摸点的情况
			prevent.tap = false;
			prevent.swipe = false;
			//长按事件
			this._longTapTimeout = setTimeout(function () {
				self.triggerListener('longtap',self._createEventData(life.startTouchEvent,'longtap'));
			},750);
		};
		tracer.onlifechange = function (life) {
			// 只要存在移动的接触点，就触发dragging事件
			life.moveTouchEventList.forEach(function (moveEvent) {
				self.triggerListener('dragging',self._createEventData(moveEvent,'dragging'));
			});
			
			if(tracer.currentLifeList.length>1){
				prevent.tap=true;
				prevent.swipe=true;
				self.triggerListener('log','multi touch move ...');
				self.triggerListener('multichange',preLife,curLife);
				
				var rateAndAngle = self.getZoomRateAndRotateAngle(preLife,curLife);

				if(Ycc.utils.isNum(rateAndAngle.rate)){
					self.triggerListener('zoom',rateAndAngle.rate);
					self.triggerListener('log','zoom triggered',rateAndAngle.rate);
				}
				if(Ycc.utils.isNum(rateAndAngle.angle)){
					self.triggerListener('rotate',rateAndAngle.angle);
					self.triggerListener('log','rotate triggered',rateAndAngle.angle);
				}
				return this;
			}
			
			// 只有一个触摸点的情况
			if(life.moveTouchEventList.length>0){
				var firstMove = life.startTouchEvent;
				var lastMove = Array.prototype.slice.call(life.moveTouchEventList,-1)[0];
				// 如果触摸点按下期间存在移动行为，且移动距离大于10，则认为该操作不是tap、longtap
				if(Math.abs(lastMove.pageX-firstMove.pageX)>10 || Math.abs(lastMove.pageY-firstMove.pageY)>10){
					prevent.tap=true;
					clearTimeout(this._longTapTimeout);
				}
			}
			
		};
		tracer.onlifeend = function (life) {
			self.triggerListener('dragend',self._createEventData(life.endTouchEvent,'dragend'));

			// 若某个触摸结束，当前触摸点个数为1，说明之前的操作为多点触控。这里发送多点触控结束事件
			if(tracer.currentLifeList.length===1){
				return self.triggerListener('multiend',preLife,curLife);
			}
			
			if(tracer.currentLifeList.length===0){
				
				// 开始和结束时间在300ms内，认为是tap事件
				if(!prevent.tap && life.endTime-life.startTime<300){
					// 取消长按事件
					clearTimeout(this._longTapTimeout);
					
					// 两次点击在300ms内，并且两次点击的范围在10px内，则认为是doubletap事件
					if(preLife && life.endTime-preLife.endTime<300 && Math.abs(preLife.endTouchEvent.pageX-life.endTouchEvent.pageX)<10&& Math.abs(preLife.endTouchEvent.pageY-life.endTouchEvent.pageY)<10){
						self.triggerListener('doubletap',self._createEventData(life.endTouchEvent,'doubletap'));
						self.triggerListener('log','doubletap triggered');
						preLife = null;
						return this;
					}
					preLife=life;
					return this;
				}
				
				// 如果触摸点按下期间存在移动行为，且移动范围大于30px，触摸时间在200ms内，则认为该操作是swipe
				if(!prevent.swipe && life.endTime-life.startTime<300 ){
					var firstMove = life.startTouchEvent;
					var lastMove = Array.prototype.slice.call(life.moveTouchEventList,-1)[0];
					if(Math.abs(lastMove.pageX-firstMove.pageX)>30 || Math.abs(lastMove.pageY-firstMove.pageY)>30){
						var dir = self._getSwipeDirection(firstMove.pageX,firstMove.pageY,lastMove.pageX,lastMove.pageY);
						var type = 'swipe'+dir;
						self.triggerListener('log',type);
						life.endTouchEvent.swipeDirection = dir;
						// 触发swipeXXX
						self.triggerListener(type,self._createEventData(life.endTouchEvent,type));
						// 触发swipe
						self.triggerListener('swipe',self._createEventData(life.endTouchEvent,'swipe'));
						console.log('swipe',type);
					}
					return this;
				}
			}
		};
		
	};
	
	/**
	 * pc端的初始化，pc端只有一个鼠标，操作相对简单
	 * @private
	 */
	Ycc.Gesture.prototype._initForPC = function () {
		var self = this;
		
		// 鼠标按下的yccEvent
		var mouseDownEvent = null;
		// 鼠标抬起的yccEvent
		var mouseUpEvent = null;
		// 拖动是否触发的标志
		var dragStartFlag = false;
		// 记录上一次点击事件，用于判断doubletap
		var preTap = null;
		// 记录长按的计时ID，用于判断longtap
		var longTapTimeoutID = -1;

		// 拖拽过程中的生命周期ID
		var identifier = 0;
		
		/**
		 * 需求实现：
		 * 1、事件传递给所有图层
		 * 2、事件传递给最上层UI
		 * 3、记录按下时鼠标的位置，及按下时鼠标所指的UI
		 * */
		this.option.target.addEventListener('mousedown',function (e) {
			// console.log(e.type,'...');
			e.identifier=++identifier;
			mouseDownEvent = self._createEventData(e);
			longTapTimeoutID = setTimeout(function () {
				console.log('longtap',Date.now(),'...');
				self.triggerListener('log','long tap ...');
				self.triggerListener('longtap',self._createEventData(mouseDownEvent,'longtap'));
			},750);
		});
		
		/**
		 * 需求实现：
		 * 1、事件传递给所有图层
		 * 2、事件传递给最上层UI
		 * 3、如果move时，鼠标为按下状态，触发一次所有图层的dragstart事件
		 * 4、如果move时，鼠标为按下状态，触发一次 鼠标按下时UI 的dragstart事件
		 * 5、如果move时，鼠标为按下状态，触发所有图层的dragging事件
		 * 6、如果move时，鼠标为按下状态，触发 鼠标按下时UI 的dragging事件
		 * */
		this.option.target.addEventListener('mousemove',function (e) {
			// console.log(e.type,'....',self);
			self.triggerListener('mousemove',self._createEventData(e,'mousemove'));
			
			// 如果鼠标正处于按下状态，则模拟触发dragging事件
			if(mouseDownEvent){
				// 判断是否真的移动，是否真的存在拖拽
				if(mouseDownEvent && e.clientX===mouseDownEvent.clientX&&e.clientY===mouseDownEvent.clientY) return;
				// 解决webkit内核mouseup自动触发mousemove的BUG
				if(mouseUpEvent && e.clientX===mouseDownEvent.clientX&&e.clientY===mouseDownEvent.clientY) return;
				
				// 取消长按事件
				clearTimeout(longTapTimeoutID);
				
				// dragging之前，触发一次dragstart事件
				if(!dragStartFlag){
					self.triggerListener('dragstart',self._createEventData(mouseDownEvent,'dragstart'));
					// 设置标志位
					dragStartFlag = true;
				}
				e.identifier=identifier;
				self.triggerListener('dragging',self._createEventData(e,'dragging'));
			}else{
				// 取消长按事件
				clearTimeout(longTapTimeoutID);
			}
			
		});
		
		/**
		 * 需求实现：
		 * 1、事件传递给所有图层
		 * 2、事件传递给 鼠标按下时所指的UI
		 * 3、清除按下时鼠标的位置，及按下时鼠标所指的UI
		 * */
		this.option.target.addEventListener('mouseup',function (e) {
			// console.log(e.type,'...');
			e.identifier=identifier;
			
			mouseUpEvent = self._createEventData(e);
			
			// 如果存在拖拽标志位，抬起鼠标时需要发送dragend事件
			if(dragStartFlag){
				// 取消长按事件
				clearTimeout(longTapTimeoutID);
				self.triggerListener('dragend',self._createEventData(e,'dragend'));
				
				// 如果鼠标按下期间存在移动行为，且移动范围大于30px，按下时间在300ms内，则认为该操作是swipe
				if(dragStartFlag&&mouseUpEvent.createTime-mouseDownEvent.createTime<300 ){
					if(Math.abs(mouseUpEvent.pageX-mouseDownEvent.pageX)>30 || Math.abs(mouseUpEvent.pageY-mouseDownEvent.pageY)>30){
						var dir = self._getSwipeDirection(mouseDownEvent.pageX,mouseDownEvent.pageY,mouseUpEvent.pageX,mouseUpEvent.pageY);
						var type = 'swipe'+dir;
						self.triggerListener('log',type);
						mouseDownEvent.swipeDirection = dir;
						// 触发swipeXXX
						self.triggerListener(type,self._createEventData(mouseDownEvent,type));
						// 触发swipe
						self.triggerListener('swipe',self._createEventData(mouseDownEvent,'swipe'));

						console.log('swipe',type);
						// self.triggerListener('log',type);
						// self.triggerListener(type,self._createEventData(mouseDownEvent,type));
					}
				}
				
				dragStartFlag = false;
				mouseDownEvent = null;
				return null;
			}
			
			//不存在拖拽事件，且开始按下鼠标和结束时间在300ms内，认为是tap事件
			if(!dragStartFlag&&mouseDownEvent && mouseUpEvent.createTime-mouseDownEvent.createTime<300){
				// 取消长按事件
				clearTimeout(longTapTimeoutID);

				var curTap = self._createEventData(mouseDownEvent,'tap');
				self.triggerListener('tap',curTap);
				self.triggerListener('log','tap triggered');
				
				// 两次点击在300ms内，并且两次点击的范围在10px内，则认为是doubletap事件
				if(preTap && curTap.createTime-preTap.createTime<300 && Math.abs(preTap.pageX-curTap.pageX)<10&& Math.abs(preTap.pageY-curTap.pageY)<10){
					self.triggerListener('doubletap',self._createEventData(curTap,'doubletap'));
					self.triggerListener('log','doubletap triggered');
					preTap = null;
					return this;
				}
				preTap=curTap;
				mouseDownEvent = null;
				return this;
			}
			
			
			
			
			
		});
		
		// 若鼠标超出舞台，给所有图层广播一个mouseup事件，解决拖拽超出舞台的问题。
		// this.option.target.addEventListener("mouseout",function (e) {
		// 	var yccEvent = new Ycc.Event({
		// 		type:"mouseup",
		// 		x:parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
		// 		y:parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top)
		// 	});
		// 	if(yccEvent.x>parseInt(this.width)) yccEvent.x = parseInt(this.width);
		// 	if(yccEvent.x<0) yccEvent.x=0;
		// 	if(yccEvent.y>parseInt(this.height)) yccEvent.y = parseInt(this.height);
		// 	if(yccEvent.y<0) yccEvent.y=0;
		//
		// 	for(var i=self.layerList.length-1;i>=0;i--){
		// 		var layer = self.layerList[i];
		// 		if(!layer.enableEventManager) continue;
		// 		layer.triggerListener(yccEvent.type,yccEvent);
		// 	}
		// });
	};
	
	/**
	 * 构造筛选事件中的有用信息
	 * @param event	{MouseEvent | TouchEvent}	鼠标事件或者触摸事件
	 * @param [type] {String} 事件类型，可选
	 * @return {{target: null, clientX: number, clientY: number, pageX: number, pageY: number, screenX: number, screenY: number, force: number}}
	 * @private
	 */
	Ycc.Gesture.prototype._createEventData = function (event,type) {
		
		var data={
			/**
			 * 事件类型
			 */
			type:"",
			/**
			 * 事件触发对象
			 */
			target:null,
			
			/**
			 * 事件的生命周期ID，只在拖拽过程中存在，存在时此值大于-1
			 * PC端表示mousedown直至mouseup整个周期
			 * mobile端表示touchstart直至touchend整个周期
			 */
			identifier:-1,
			
			clientX:0,
			clientY:0,
			pageX:0,
			pageY:0,
			screenX:0,
			screenY:0,
			force:1,
			
			/**
			 * 手势滑动方向，此属性当且仅当type为swipe时有值
			 */
			swipeDirection:'',

			/**
			 * 创建时间
			 */
			createTime:Date.now()
		};

		data = Ycc.utils.extend(data,event);
		data.type=type;
		return data;
	};
	
	
	/**
	 * 获取某个触摸点的swipe方向
	 * @private
	 */
	Ycc.Gesture.prototype._getSwipeDirection = function (x1,y1,x2,y2) {
		return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'left' : 'right') : (y1 - y2 > 0 ? 'up' : 'down');
	};
	
	/**
	 * 获取缩放比例
	 * @param preLife
	 * @param curLife
	 * @return {number}
	 * @private
	 */
	Ycc.Gesture.prototype.getZoomRateAndRotateAngle = function (preLife, curLife) {
		this.triggerListener('log','preLife');
		this.triggerListener('log',preLife);
		this.triggerListener('log','curLife');
		this.triggerListener('log',curLife);
		
		var x0=preLife.startTouchEvent.pageX,
			y0=preLife.startTouchEvent.pageY,
			x1=curLife.startTouchEvent.pageX,
			y1=curLife.startTouchEvent.pageY;
		
		var preMoveTouch = preLife.moveTouchEventList.length>0?preLife.moveTouchEventList[preLife.moveTouchEventList.length-1]:preLife.startTouchEvent;
		var curMoveTouch = curLife.moveTouchEventList.length>0?curLife.moveTouchEventList[curLife.moveTouchEventList.length-1]:curLife.startTouchEvent;
		var x0move=preMoveTouch.pageX,
			y0move=preMoveTouch.pageY,
			x1move=curMoveTouch.pageX,
			y1move=curMoveTouch.pageY;
		
		var vector0 = new Ycc.Math.Vector(x1-x0,y1-y0),
			vector1 = new Ycc.Math.Vector(x1move-x0move,y1move-y0move);
		
		var angle = Math.acos(vector1.dot(vector0)/(vector1.getLength()*vector0.getLength()))/Math.PI*180;
		return {
			rate:vector1.getLength()/vector0.getLength(),
			angle:angle*(vector1.cross(vector0).z>0?-1:1)
		};//(new Ycc.Math.Vector(x1move-x0move,y1move-y0move).getLength())/(new Ycc.Math.Vector(x1-x0,y1-y0).getLength());
	};


})(Ycc);
;/**
 * @file    Ycc.Layer.class.js
 * @author  xiaohei
 * @date    2017/11/16
 * @description  Ycc.Layer.class文件
 * @requires Ycc.Listener
 */



(function (Ycc) {
	
	
	var layerIndex = 0;
	
	/**
	 * 图层类。
	 * 每新建一个图层，都会新建一个canvas元素。
	 * 每个图层都跟这个canvas元素绑定。
	 * @param yccInstance	{Ycc} ycc实例
	 * @param option		{object} 配置项
	 * @param option.enableEventManager		{boolean} 是否监听舞台事件
	 *
	 * @constructor
	 * @extends Ycc.Listener
	 */
	Ycc.Layer = function(yccInstance,option){
	 	Ycc.Listener.call(this);

	 	option = option || {};
		
		/**
		 * 类型
		 */
	 	this.yccClass = Ycc.Layer;
	 	
		/**
		 * 存储图层中的所有UI。UI的顺序，即为图层中的渲染顺序。
		 * @type {Ycc.UI[]}
		 */
		this.uiList = [];
		
		/**
		 * 该图层ui的总数（只在渲染之后赋值）
		 * @type {number}
		 */
		this.uiCountRecursion = 0;
		
		/**
		 * 该图层渲染的ui总数(只在渲染之后赋值）
		 * @type {number}
		 */
		this.uiCountRendered = 0;
		
		/**
		 * ycc实例的引用
		 */
		this.yccInstance = yccInstance;
		
		/**
		 * 当前图层的绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = null;
		
		/**
		 * 是否使用独立的缓存canvas
		 * @type {boolean}
		 */
		this.useCache = false;
		
		/**
		 * 图层的缓存绘图环境
		 */
		this.ctxCache = null;
		
		/**
		 * 缓存时drawImage所绘制的最小区域
		 * @type {Ycc.Math.Rect}
		 */
		this.ctxCacheRect = null;
		
		/**
		 * 是否以红色方框框选缓存的最小区域，调试时可使用
		 * @type {boolean}
		 */
		this.renderCacheRect = false;
		
		/**
		 * 图层id
		 */
		this.id = layerIndex++;
		
		/**
		 * 图层类型。
		 * `ui`表示用于绘图的图层。`tool`表示辅助的工具图层。`text`表示文字图层。
		 * 默认为`ui`。
		 */
		this.type = "ui";
		
		/**
		 * 图层中的文字。仅当图层type为text时有值。
		 * @type {string}
		 */
		this.textValue = "";
		
		/**
		 * 图层名称
		 * @type {string}
		 */
		this.name = option.name?option.name:"图层_"+this.type+"_"+this.id;
		
		/**
		 * 图层位置的x坐标。默认与舞台左上角重合
		 * @type {number}
		 */
		this.x = 0;
		
		/**
		 * 图层位置的Y坐标。默认与舞台左上角重合
		 * @type {number}
		 */
		this.y = 0;
		
		/**
		 * 图层宽
		 * @type {number}
		 */
		this.width = yccInstance.getStageWidth();
		/**
		 * 图层高
		 * @type {number}
		 */
		this.height = yccInstance.getStageHeight();
		
		/**
		 * 图层是否显示
		 */
		this.show = true;
		
		/**
		 * 是否监听舞台的事件。用于控制舞台事件是否广播至图层。默认关闭
		 * @type {boolean}
		 */
		this.enableEventManager = false;
		
		/**
		 * 是否接收每帧更新的通知。默认为false
		 * @type {boolean}
		 */
		this.enableFrameEvent = false;
		
		/**
		 * 若接收通知，此函数为接收通知的回调函数。当且仅当enableFrameEvent为true时生效
		 * @type {function}
		 */
		this.onFrameComing = function () {};
		
		
		
		// 覆盖参数
		Ycc.utils.extend(this,option);
		// 初始化
		this.init();
	};
	Ycc.Layer.prototype = new Ycc.Listener();
	Ycc.Layer.prototype.constructor = Ycc.Layer;
	
	
	/**
	 * 释放layer的内存，等待GC
	 * 将所有引用属性置为null
	 * @param layer
	 */
	Ycc.Layer.release = function (layer) {
		Ycc.Listener.release(layer);
		
		/**
		 * 类型
		 */
		layer.yccClass = null;
		
		/**
		 * 存储图层中的所有UI。UI的顺序，即为图层中的渲染顺序。
		 * @type {Ycc.UI[]}
		 */
		layer.uiList = null;
		
		/**
		 * ycc实例的引用
		 */
		layer.yccInstance = null;
		/**
		 * 图层是否显示
		 */
		layer.show = false;
		
		/**
		 * 是否监听舞台的事件。用于控制舞台事件是否广播至图层。默认关闭
		 * @type {boolean}
		 */
		layer.enableEventManager = false;
		
		/**
		 * 是否接收每帧更新的通知。默认为false
		 * @type {boolean}
		 */
		layer.enableFrameEvent = false;
		
		/**
		 * 若接收通知，此函数为接收通知的回调函数。当且仅当enableFrameEvent为true时生效
		 * @type {function}
		 */
		layer.onFrameComing = null;
	};
	
	
	
	
	
	
	
	
	/**
	 * 初始化
	 * @return {null}
	 */
	Ycc.Layer.prototype.init = function () {
		var self = this;
		
		// 初始化图层属性
		this.ctx = this.yccInstance.ctx;
		// useCache参数判断
		this.ctxCache = this.useCache?this.yccInstance.createCacheCtx():this.ctx;
		
		// 初始化画布属性
		self._setCtxProps();
		// 初始化图层事件
		// self._initEvent();
	};
	
	/**
	 * 事件的初始化。此方法已废弃，改由舞台转发事件
	 * <br> 注：如果鼠标按下与抬起的位置有变动，默认不会触发click事件。
	 * @private
	 */
	Ycc.Layer.prototype._initEvent = function () {
		var self = this;
		// 记录鼠标按下的事件
		var mouseDownYccEvent = null;
		// 记录鼠标抬起的事件
		var mouseUpYccEvent = null;
		// 鼠标是否已经移动
		var mouseHasMove = false;
		// 是否有拖拽事件触发的标志位
		var dragFlag = false;
		
		this.addListener("click",function (e) {
			// 如果鼠标已经改变了位置，那么click事件不触发
			if(mouseHasMove) return;
			defaultMouseListener(e);
		});
		
		this.addListener("mousedown",function (e) {
			mouseHasMove = false;
			dragFlag = false;
			mouseDownYccEvent = e;
			defaultMouseListener(e);
		});

		this.addListener("mouseup",function (e) {
			if(dragFlag){
				var dragendEvent = new Ycc.Event({
					type:"dragend",
					x:e.x,
					y:e.y,
					mouseDownYccEvent:mouseDownYccEvent
				});
				self.triggerListener("dragend",dragendEvent);
				if(mouseDownYccEvent&&mouseDownYccEvent.target){
					self.target = mouseDownYccEvent.target;
					self.target.triggerListener("dragend",dragendEvent);
				}
			}
			e.mouseDownYccEvent = mouseDownYccEvent = null;
			mouseUpYccEvent = e;
			
			defaultMouseListener(e);
		});
		
		this.addListener("mousemove",mouseMoveListener);
		
		
		/**
		 * 图层中鼠标移动的监听器
		 * @param e	{Ycc.Event}
		 */
		function mouseMoveListener(e) {
			// 判断事件是否已经被阻止
			if(e.stop) return;
			// 判断是否真的移动
			if(mouseDownYccEvent && e.x===mouseDownYccEvent.x&&e.y===mouseDownYccEvent.y) return;
			// 解决webkit内核mouseup自动触发mousemove的BUG
			if(mouseUpYccEvent && e.x===mouseUpYccEvent.x&&e.y===mouseUpYccEvent.y) {
				return;
			}

			// 设置已经移动的标志位
			mouseHasMove = true;
			
			// 如果鼠标已经按下，则表示拖拽事件。
			if(mouseDownYccEvent){
				// 1.拖拽之前，触发一次dragstart事件
				if(!dragFlag){
					var dragStartEvent = new Ycc.Event({
						type:"dragstart",
						x:mouseDownYccEvent.x,
						y:mouseDownYccEvent.y,
						mouseDownYccEvent:mouseDownYccEvent
					});
					
					// 先触发图层的拖拽事件，该事件没有target属性
					self.triggerListener(dragStartEvent.type,dragStartEvent);
					if(mouseDownYccEvent.target){
						dragStartEvent.target = mouseDownYccEvent.target;
						dragStartEvent.target.triggerListener(dragStartEvent.type,dragStartEvent);
					}
				}

				// 2.修改拖拽已经发生的标志位
				dragFlag = true;
				// 3.触发dragging事件
				var draggingEvent = new Ycc.Event({
					type:"dragging",
					x:e.x,
					y:e.y,
					mouseDownYccEvent:mouseDownYccEvent
				});
				// 先触发图层的拖拽事件，该事件没有target属性
				self.triggerListener(draggingEvent.type,draggingEvent);
				if(mouseDownYccEvent.target){
					draggingEvent.target = mouseDownYccEvent.target;
					draggingEvent.target.triggerListener(draggingEvent.type,draggingEvent);
				}
				// 触发拖拽事件时，不再触发鼠标的移动事件，所以此处直接返回
				return null;
			}
			
			// 下面处理普通的鼠标移动事件
			for(var i = self.uiList.length-1;i>=0;i--){
				var ui = self.uiList[i];
				// 图层内部UI的相对坐标
				var dot = new Ycc.Math.Dot(e.x - ui.belongTo.x,e.y - ui.belongTo.y);
				// 如果位于rect内，触发事件,并阻止继续传递
				if(dot.isInRect(ui.rect)){
					e.stop = true;
					e.mouseDownYccEvent = mouseDownYccEvent;
					e.mouseUpYccEvent = mouseUpYccEvent;
					e.target = ui;
					ui.triggerListener(e.type,e);
					break;
				}
			}
		}
		
		
		/**
		 * 默认的事件监听器。默认鼠标事件触发点位于rect内，事件才转发给UI。
		 * @todo 其他事件需要考虑图层坐标
		 * @param e	{Ycc.Event}	ycc事件，e中的坐标值x、y为绝对坐标
		 */
		function defaultMouseListener(e) {
			if(e.stop) return;
			for(var i = self.uiList.length-1;i>=0;i--){
				var ui = self.uiList[i];
				var dot = new Ycc.Math.Dot(e.x,e.y);
				// 如果位于rect内，并且事件未被阻止，触发事件,并阻止继续传递
				if(ui.rect && dot.isInRect(ui.getAbsolutePosition()) && e.stop===false){
					e.stop = true;
					e.mouseDownYccEvent = mouseDownYccEvent;
					e.mouseUpYccEvent = mouseUpYccEvent;
					e.target = ui;
					e.targetDeltaPosition = new Ycc.Math.Dot(e.x-ui.getAbsolutePosition().x,e.y-ui.getAbsolutePosition().y);
					ui.triggerListener(e.type,e);
					break;
				}
			}
		}
		
		/**
		 * 直接将事件转发给UI。不做任何处理。
		 * @param e
		 */
		function broadcastDirect(e) {
			e.mouseDownYccEvent = mouseDownYccEvent;
			for(var i = 0;i<self.uiList.length;i++){
				var ui = self.uiList[i];
				ui.triggerListener(e.type,e);
			}
		}
		
	};
	
	/**
	 * 设置画布所有的属性
	 * @param props 属性map
	 * @param ctx	绘图环境，可选参数，默认为上屏canvas的绘图环境
	 * @private
	 */
	Ycc.Layer.prototype._setCtxProps = function (props,ctx) {
		var self = this;
		ctx = ctx || self.ctx;
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
		// dpi兼容
		ctxConfig.fontSize=parseInt(ctxConfig.fontSize)*this.yccInstance.getSystemInfo().devicePixelRatio+'px';
		ctxConfig.font = [ctxConfig.fontStyle,ctxConfig.fontVariant,ctxConfig.fontWeight,ctxConfig.fontSize,ctxConfig.fontFamily].join(" ");
		for(var key in ctxConfig){
			if(!ctxConfig.hasOwnProperty(key)) continue;
			ctx[key] = ctxConfig[key];
		}
	};
	
	
	/**
	 * 清除图层
	 */
	Ycc.Layer.prototype.clear = function () {
		this.ctx.clearRect(0,0,this.width,this.height);
	};
	
	
	/**
	 * 清空图层内的所有UI
	 */
	Ycc.Layer.prototype.removeAllUI = function () {
		this.uiList.forEach(function (ui) {
			Ycc.UI.release(ui);
		});
		this.uiList.length=0;
		// 更新缓存
		this.updateCache();
	};
	
	
	/**
	 * 删除自身
	 */
	Ycc.Layer.prototype.removeSelf = function () {
		this.removeAllUI();
		this.yccInstance.layerManager.deleteLayer(this);
		Ycc.Layer.release(this);
	};
	
	
	/**
	 * 渲染图层至舞台
	 * @deprecated
	 */
	Ycc.Layer.prototype.renderToStage = function () {
		if(this.show)
			this.yccInstance.ctx.drawImage(this.ctx.canvas,0,0,this.width,this.height);
	};
	
	/**
	 * 添加一个UI图形至图层，如果设置了beforUI，该UI会被添加至该UI之前
	 * @param ui {Ycc.UI}	UI图形
	 * @param beforeUI {Ycc.UI|null}	UI图形
	 */
	Ycc.Layer.prototype.addUI = function (ui,beforeUI) {
		var self = this;
		// 遍历所有节点，初始化
		ui.itor().each(function (child) {
			child.init(self);
		});
		var index = this.uiList.indexOf(beforeUI);
		if(!beforeUI||index===-1){
			this.uiList.push(ui);
			ui._onAdded&&ui._onAdded();
			return;
		}
		this.uiList.splice(index,0,ui);
		ui._onAdded&&ui._onAdded();

		// 更新缓存
		this.updateCache();
	};
	
	/**
	 * 删除图层内的某个UI图形，及其子UI
	 * @param ui
	 */
	Ycc.Layer.prototype.removeUI = function (ui) {
		if(!ui) return false;
		var index = this.uiList.indexOf(ui);
		if(index===-1) return false;
		
		Ycc.UI.release(ui);
		this.uiList[index]=null;
		this.uiList.splice(index,1);
		// 更新缓存
		this.updateCache();
		return true;
	};
	
	/**
	 * 渲染Layer中的所有UI，
	 * <br>直接将UI的离屏canvas绘制至上屏canvas。
	 *
	 * @param forceUpdate {boolean}	是否强制更新
	 * 若强制更新，所有图层会强制更新缓存
	 * 若非强制更新，对于使用缓存的图层，只会绘制缓存至舞台
	 */
	Ycc.Layer.prototype.render = function (forceUpdate) {
		this.reRender(forceUpdate);
	};
	
	/**
	 * 重绘图层。
	 * <br>直接将UI的离屏canvas绘制至上屏canvas。
	 *
	 * @param forceUpdate {boolean}	是否强制更新
	 * 若强制更新，所有图层会强制更新缓存
	 * 若非强制更新，对于使用缓存的图层，只会绘制缓存至舞台
	 */
	Ycc.Layer.prototype.reRender = function (forceUpdate) {
		if(!this.show) return;
		if(this.useCache){
			return this.renderCacheToStage(forceUpdate);
		}
		// 绘制所有UI至上屏ctx
		this.renderAllToCtx(this.ctx);
	};
	
	/**
	 * 绘制缓存区域至上屏canvas
	 * @param forceUpdate {boolean}	是否强制更新，若为true，绘制之前先重新绘制缓存
	 */
	Ycc.Layer.prototype.renderCacheToStage = function (forceUpdate) {
		if(!this.useCache) return;
		// 若强制更新，则先更新离屏canvas的缓存
		if(forceUpdate) this.updateCache();
		
		var dpi = this.yccInstance.dpi;
		if(!this.ctxCacheRect){
			this.ctx.drawImage(this.ctxCache.canvas,0,0);
		}else{
			var x = this.ctxCacheRect.x*dpi,
				y=this.ctxCacheRect.y*dpi,
				width=this.ctxCacheRect.width*dpi,
				height=this.ctxCacheRect.height*dpi;
			this.ctx.drawImage(this.ctxCache.canvas,x,y,width,height,x,y,width,height);
		}
		
		// 兼容wx端，wx端多一个draw API
		this.ctx.draw && this.ctx.draw();
	};
	
	
	/**
	 * 获取图层中某个点所对应的最上层UI，最上层UI根据层级向下遍历，取层级最深的可见UI。
	 * @param dot {Ycc.Math.Dot}	点坐标，为舞台的绝对坐标
	 * @param uiIsShow {Boolean}	是否只获取显示在舞台上的UI，默认为true
	 * @return {UI}
	 */
	Ycc.Layer.prototype.getUIFromPointer = function (dot,uiIsShow) {
		uiIsShow = Ycc.utils.isBoolean(uiIsShow)?uiIsShow:true;
		var self = this;
		var temp = null;
		/*for(var i =self.uiList.length-1;i>=0;i--){
			var ui = self.uiList[i];
			if(uiIsShow&&!ui.show) continue;
			// 右子树优先寻找
			ui.itor().rightChildFirst(function (child) {
				console.log(child);
				// 跳过不可见的UI
				if(uiIsShow&&!child.show) return false;
				
				// 如果位于rect内，此处根据绝对坐标比较
				if(dot.isInRect(child.getAbsolutePosition())){
					console.log(child,222);
					temp = child;
					return true;
				}
			});
		}*/
		
		
		var tempLevel = 0;
		for(var i=0;i<this.uiList.length;i++){
			var ui = self.uiList[i];
			if(uiIsShow&&!ui.show) continue;
			//this.uiList[i].__render();
			// 按树的层次向下遍历
			this.uiList[i].itor().depthDown(function (child, level) {
				// 幽灵状态的UI不予获取
				if(child.ghost) return -1;
				
				// 跳过不可见的UI，返回-1阻止继续遍历其子UI
				if(uiIsShow&&!child.show) return -1;

				// 如果位于rect内，并且层级更深，则暂存，此处根据绝对坐标比较
				if(child.containDot(dot) && level>=tempLevel){
					temp = child;
					tempLevel=level;
				}
			});
		}
		return temp;
	};
	
	/**
	 * 获取图层中某个点所对应的所有UI，无论显示不显示，无论是否是幽灵，都会获取。
	 * @param dot {Ycc.Math.Dot}	点坐标，为舞台的绝对坐标
	 * @return {Ycc.UI[]}
	 */
	Ycc.Layer.prototype.getUIListFromPointer = function (dot) {
		var self = this;
		var uiList = [];
		for(var i=0;i<this.uiList.length;i++){
			// 按树的层次向下遍历
			this.uiList[i].itor().depthDown(function (child, level) {
				// 如果位于rect内，并且层级更深，则暂存，此处根据绝对坐标比较
				if(child.containDot(dot)) uiList.push(child);
			});
		}
		return uiList;
	};
	
	/**
	 * 根据图层坐标，将图层内某个点的相对坐标（相对于图层），转换为舞台的绝对坐标
	 * @param dotOrArr	{Ycc.Math.Dot | Ycc.Math.Dot[]}
	 * @return {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 */
	Ycc.Layer.prototype.transformToAbsolute = function (dotOrArr) {
		var res = null;
		if(Ycc.utils.isArray(dotOrArr)){
			res = [];
			for(var i=0;i<dotOrArr.length;i++){
				var resDot = new Ycc.Math.Dot(0,0);
				var dot = dotOrArr[i];
				resDot.x=this.x+dot.x;
				resDot.y=this.y+dot.y;
				res.push(resDot);
			}
			return res;
		}
		res = new Ycc.Math.Dot(0,0);
		res.x = this.x+(dotOrArr.x);
		res.y = this.y+(dotOrArr.y);
		return res;
	};
	
	/**
	 * 根据图层坐标，将某个点的绝对坐标，转换为图层内的相对坐标
	 * @param dotOrArr	{Ycc.Math.Dot | Ycc.Math.Dot[]}
	 * @return {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 */
	Ycc.Layer.prototype.transformToLocal = function (dotOrArr) {
		var res = null;
		if(Ycc.utils.isArray(dotOrArr)){
			res = [];
			for(var i=0;i<dotOrArr.length;i++){
				var resDot = new Ycc.Math.Dot(0,0);
				var dot = dotOrArr[i];
				resDot.x=dot.x-this.x;
				resDot.y=dot.y-this.y;
				res.push(resDot);
			}
			return res;
		}
		res = new Ycc.Math.Dot(0,0);
		res.x = (dotOrArr.x)-this.x;
		res.y = (dotOrArr.y)-this.y;
		return res;
	};
	
	/**
	 * 绘制所有UI至某个绘图环境
	 * @param ctx
	 */
	Ycc.Layer.prototype.renderAllToCtx = function (ctx) {
		var self = this;
		self.uiCountRecursion=0;
		self.uiCountRendered=0;
		for(var i=0;i<this.uiList.length;i++){
			if(!this.uiList[i].show) continue;
			//this.uiList[i].__render();
			// 按树的层次向下渲染
			this.uiList[i].itor().depthDown(function (ui, level) {
				//console.log(level,ui);
				self.uiCountRecursion++;
				// UI显示
				if(ui.show){
					var renderError = ui.__render();
					// 若使用了缓存，需要计算缓存的最小绘制区域
					if(self.useCache) self._mergeCtxCacheRect(ui.getAbsolutePositionRect());
					if(!renderError) self.uiCountRendered++;
					// else console.log(renderError,111);
				}else
					return -1;
			});
			// 触发此UI所有子UI渲染完成后的回调
			this.uiList[i]._onChildrenRendered&&this.uiList[i]._onChildrenRendered();
		}
		var rect = this.ctxCacheRect;
		if(this.useCache&&rect&&this.renderCacheRect){
			var dpi = this.yccInstance.dpi;
			var stageW = this.yccInstance.getStageWidth()/dpi;
			var stageH = this.yccInstance.getStageHeight()/dpi;
			
			var x = rect.x<0?0:rect.x,y=rect.y<0?0:rect.y,width=rect.width>stageW?stageW:rect.width,height=rect.height>stageH?stageH:rect.height;
			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle='red';
			ctx.strokeWidth=2;
			ctx.rect(x*dpi,y*dpi,width*dpi,height*dpi);
			ctx.closePath();
			ctx.stroke();
			ctx.restore();
		}
		
		// 兼容wx端，wx端多一个draw API
		ctx.draw && ctx.draw();
	};
	
	/**
	 * 合并需要合并的最小区域
	 * @param absolutePositionRect	当前UI的绝对坐标范围
	 * @private
	 */
	Ycc.Layer.prototype._mergeCtxCacheRect = function (absolutePositionRect) {
		var ycc = this.yccInstance;
		
		if(!this.ctxCacheRect)
			return this.ctxCacheRect = new Ycc.Math.Rect(absolutePositionRect);
		
		var stageW = ycc.getStageWidth();
		var stageH = ycc.getStageHeight();
		var dpi = ycc.dpi;
		
		var rect = this.ctxCacheRect;
		
		var x1 = rect.x+rect.width;
		var y1 = rect.y+rect.height;
		
		var x2 = absolutePositionRect.x+absolutePositionRect.width;
		var y2 = absolutePositionRect.y+absolutePositionRect.height;
		
		// x、y取最小
		rect.x=rect.x<absolutePositionRect.x?rect.x:absolutePositionRect.x;
		rect.y=rect.y<absolutePositionRect.y?rect.y:absolutePositionRect.y;
		// 高宽取最大
		rect.width = x1<x2?(x2-rect.x):(x1-rect.x);
		rect.height = y1<y2?(y2-rect.y):(y1-rect.y);
		
		// 再次计算
		rect.x = rect.x<0?0:rect.x;
		rect.y = rect.y<0?0:rect.y;
		rect.width = rect.x+rect.width>stageW/dpi?stageW/dpi-rect.x:rect.width;
		rect.height = rect.y+rect.height>stageH/dpi?stageH/dpi-rect.y:rect.height;
		return rect;
	};
	
	/**
	 * 更新图层的缓存绘图环境
	 */
	Ycc.Layer.prototype.updateCache = function () {
		// 判断是否使用缓存
		if(!this.useCache) return;

		this.clearCache();
		this.renderAllToCtx(this.ctxCache);
		
	};
	
	/**
	 * 清空缓存画布、缓存区域
	 */
	Ycc.Layer.prototype.clearCache = function () {
		this.ctxCache.canvas.width = this.ctx.canvas.width;
		// 清空缓存区域
		this.ctxCacheRect = null;
	};
	
})(Ycc);;/**
 * @file    Ycc.Layer.class.js
 * @author  xiaohei
 * @date    2017/10/23
 * @description  Ycc.LayerManager.class文件
 */


(function (Ycc) {
	
	/**
	 * Ycc的图层管理类。每个图层管理器都与一个canvas舞台绑定。
	 * @param yccInstance {Ycc}		ycc实例
	 * @constructor
	 */
	Ycc.LayerManager = function (yccInstance) {
		
		/**
		 * ycc实例
		 */
		this.yccInstance = yccInstance;
		
		/**
		 * 保存渲染时间，主要是reReader方法的耗时，开发者可以在每次reRender调用后获取该值
		 * @type {number}
		 * @readonly
		 */
		this.renderTime = 0;
		
		/**
		 * 保存最大的渲染时间，主要是reReader方法的耗时，开发者可以在每次reRender调用后获取该值
		 * @type {number}
		 * @readonly
		 */
		this.maxRenderTime = 0;
		
		/**
		 * 保存渲染的UI个数，主要是reReader方法中的UI个数，开发者可以在每次reRender调用后获取该值
		 * @type {number}
		 * @readonly
		 */
		this.renderUiCount = 0;
	};
	
	Ycc.LayerManager.prototype.init = function () {
	
	};
	
	
	/**
	 * 新建图层
	 * @param config
	 */
	Ycc.LayerManager.prototype.newLayer = function (config) {
		var layer = new Ycc.Layer(this.yccInstance,config);
		this.yccInstance.layerList.push(layer);
		return layer;
	};
	
	/**
	 * 删除图层。
	 * @param layer
	 */
	Ycc.LayerManager.prototype.deleteLayer = function (layer) {
		var layerList = this.yccInstance.layerList;
		for(var i = 0;i<layerList.length;i++){
			if(layerList[i].id === layer.id){
				this.yccInstance.layerList.splice(i,1);
				return layer;
			}
		}
		return layer;
	};
	
	/**
	 * 删除所有图层
	 */
	Ycc.LayerManager.prototype.deleteAllLayer = function () {
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			layer.removeAllUI();
			Ycc.Layer.release(layer);
			layer = null;
		}
		this.yccInstance.layerList=[];
	};
	
	
	
	/**
	 * 重新将所有图层绘制至舞台。不显示的图层也会更新。
	 * @param forceUpdate {boolean}	是否强制更新
	 * 若强制更新，所有图层会强制更新缓存
	 * 若非强制更新，对于使用缓存的图层，只会绘制缓存至舞台
	 */
	Ycc.LayerManager.prototype.reRenderAllLayerToStage = function (forceUpdate) {
		var t1 = Date.now();
		this.renderUiCount = 0;
		this.yccInstance.clearStage();
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			// 该图层是否可见
			if(!layer.show) continue;
			layer.reRender(forceUpdate);
			this.renderUiCount+=layer.uiCountRendered;
		}

		this.renderTime = Date.now()-t1;
		this.maxRenderTime=this.renderTime>this.maxRenderTime?this.renderTime:this.maxRenderTime;
	};
	
	
	
	
	/**
	 * 只允许某一个图层接收舞台事件
	 * @param layer	{Layer}		允许接收事件的图层
	 */
	Ycc.LayerManager.prototype.enableEventManagerOnly = function (layer) {
		if(!layer) return false;
		for(var i=0;i<this.yccInstance.layerList.length;i++) {
			this.yccInstance.layerList[i].enableEventManager = false;
		}
		layer.enableEventManager = true;
		return this;
	};
	
	/**
	 * 允许所有图层接收舞台事件
	 * @param enable
	 * @return {Ycc.LayerManager}
	 */
	Ycc.LayerManager.prototype.enableEventManagerAll = function (enable) {
		for(var i=0;i<this.yccInstance.layerList.length;i++) {
			this.yccInstance.layerList[i].enableEventManager = enable;
		}
		return this;
	};
	
	
	/**
	 * 根据json数组绘制所有图层
	 * @param jsonArray {Array} json数组，示例：[{option,ui[]}]
	 * @return {*}
	 */
	Ycc.LayerManager.prototype.renderAllLayerByJsonArray = function (jsonArray) {
		if(!Ycc.utils.isArray(jsonArray)){
			return console.error('jsonArray is not an Array!',jsonArray);
		}
		
		var self = this;
		for(var i=0;i<jsonArray.length;i++){
			var layerConfig = jsonArray[i];
			if(!Ycc.utils.isObj(layerConfig)){
				return console.error('item in jsonArray should be an Object!',layerConfig);
			}
			
			var layer = self.newLayer(layerConfig.option);
			
			for(var j=0;j<layerConfig.ui.length;j++){
				var uiConfig = layerConfig.ui[j];
				layer.addUI(new Ycc.UI[uiConfig.type](uiConfig.option));
			}
			
			layer.render();
			
		}
		
	};
	
	
	
})(Ycc);;/**
 * @file    Ycc.PhotoManager.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description		Ycc.PhotoManager.class文件。
 * 	Ycc实例的快照管理类
 *
 */



(function (Ycc){
	/**
	 * 照片数据结构类
	 * @param imageData
	 * @constructor
	 */
	var Photo = function(imageData) {
		this.imageData = imageData;
		this.createTime = new Date();
		this.id = this.createTime.getTime();
	};
	
	
	/**
	 * Ycc实例的快照管理类
	 * @param yccInstance {Ycc}
	 * @constructor
	 */
	Ycc.PhotoManager = function (yccInstance) {

		this.yccInstance = yccInstance;

		this.ctx = yccInstance.ctx;
		
		this._photos = [];
	};
	
	/**
	 * 保存快照，即保存当前的原子图形渲染步骤
	 */
	Ycc.PhotoManager.prototype.takePhoto = function () {
		this._photos.push(new Photo(this.ctx.getImageData(0,0,this.yccInstance.getStageWidth(),this.yccInstance.getStageHeight())));
		return this;
	};
	
	/**
	 * 获取保存的历史照片
	 * @returns {Array}
	 */
	Ycc.PhotoManager.prototype.getHistoryPhotos = function () {
		return this._photos;
	};
	/**
	 * 显示照片
	 * @param photo		{Photo}
	 * @returns 		{Photo}
	 */
	Ycc.PhotoManager.prototype.showPhoto = function (photo) {
		this.ctx.putImageData(photo.imageData,0,0);
		return photo;
	};
	
	
	/**
	 * 显示最后一次保存的快照
	 * @returns {boolean}
	 */
	Ycc.PhotoManager.prototype.showLastPhoto = function () {
		var len = this._photos.length;
		var photo = false;
		if(len>=1){
			photo = this._photos[len-1];
			this.showPhoto(photo);
		}
		return photo;
	};
	
	/**
	 * 删除照片
	 * @param photoId	照片的id
	 * @returns {*}
	 */
	Ycc.PhotoManager.prototype.delPhotoById = function (photoId) {
		var tempPhotos = this._photos.slice(0);
		for(var i=0;i<tempPhotos.length;i++){
			if(tempPhotos[i].id === photoId){
				tempPhotos.splice(i+1,1);
				this._photos = tempPhotos;
				return tempPhotos[i];
			}
		}
		return false;
	};
	
	
	
	
	
	
})(Ycc);;/**
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
	 * 每个UI类的对象都跟一个Ycc绑定。
	 *
	 * @param yccInstance	{Ycc}
	 * @constructor
	 */
	Ycc.UI = function(yccInstance){
		this.yccClass = Ycc.UI;

		/**
		 * 保存的快照，每个元素都是`getImageData`的返回值
		 * @type {Array}
		 * @private
		 */
		this._photos = [];
		
		
		/**
		 * 当前绘图环境
		 */
		this.ctx = yccInstance.ctx;
		
		/**
		 * 当前绘图环境的宽
		 */
		this.ctxWidth = yccInstance.getStageWidth();

		/**
		 * 当前绘图环境的高
		 */
		this.ctxHeight = yccInstance.getStageHeight();
		
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
	

	
	
	















})(Ycc);;/**
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
		return this;
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
		if(this.isOutOfStage())
			return {message:'UI超出舞台！'};


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
	
})(Ycc);;/**
 * @file    Ycc.UI.Polygon.class.js
 * @author  xiaohei
 * @date    2019/4/26
 * @description  Ycc.UI.Polygon.class文件
 */

(function (Ycc) {
	
	/**
	 * 多边形UI
	 * 位置坐标x、y为只读属性，且为相对坐标，默认取多边形的第一个顶点坐标
	 * @constructor
	 * @extends Ycc.UI.Base
	 * @param option    			{object}        	所有可配置的配置项
	 * @param option.fill 			{boolean}			是否填充绘制，false表示描边绘制
	 * @param option.coordinates  	{Ycc.Math.Dot[]}    多边形点坐标的数组，为保证图形能够闭合，起点和终点必须相等。注意：点列表的坐标为相对坐标
	 */
	Ycc.UI.Polygon = function Polygon(option) {
		option = option || {};
		Ycc.UI.Base.call(this, option);
		this.yccClass = Ycc.UI.Polygon;
		
		/**
		 * 位置x
		 * @type {number}
		 * @readonly
		 */
		this.x=0;
		/**
		 * 位置y
		 * @type {number}
		 * @readonly
		 */
		this.y=0;
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

		// 计算相对位置
		if(this.coordinates[0])
			this.x=this.coordinates[0].x,this.y=this.coordinates[0].y;
	};
	
	/**
	 * 渲染至ctx
	 * @param ctx
	 */
	Ycc.UI.Polygon.prototype.render = function (ctx) {
		var self = this;
		ctx = ctx || self.ctxCache;
		if(!self.ctx){
			console.error("[Ycc error]:","ctx is null !");
			return;
		}
		
		// console.log('render');
		
		// 绘制旋转缩放之前的UI

		ctx.save();
		ctx.fillStyle = this.fillStyle;
		ctx.strokeStyle = this.strokeStyle;
		this.renderPath(ctx);
		this.fill?ctx.fill():ctx.stroke();
		ctx.restore();
	};
	
	/**
	 * 根据coordinates绘制路径
	 * 只绘制路径，不填充、不描边
	 * 继承的子类若不是多边形，需要重载此方法
	 * <br> 开启离屏canvas后，此过程只会发生在离屏canvas中
	 * @param ctx 离屏canvas的绘图环境
	 */
	Ycc.UI.Polygon.prototype.renderPath = function () {
		if(this.coordinates.length===0) return;
		
		var self = this;
		var ctx = this.ctxCache;
		
		var start = this.transformByRotate(this.coordinates[0]);
		ctx.beginPath();
		ctx.moveTo(start.x*this.dpi,start.y*this.dpi);
		for(var i=0;i<this.coordinates.length-1;i++){
			var dot = this.transformByRotate(this.coordinates[i]);
			if(this.isDrawIndex) ctx.fillText(i+'',dot.x-10,dot.y+10);
			ctx.lineTo(dot.x*this.dpi,dot.y*this.dpi);
		}
		ctx.closePath();
	
	};
	
	/**
	 * 获取当前UI平移、旋转之后位置的多边形区域
	 * @return {Ycc.Math.Dot[]} 返回多边形点的坐标数组
	 * @override
	 */
	Ycc.UI.Polygon.prototype.getAbsolutePositionPolygon = function () {
		var self = this;
		return this.coordinates.map(function (point) {
			return self.transformByRotate(point);
		});
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
	 * 获取能容纳当前UI的最小方形区域
	 * @return {Ycc.Math.Rect}
	 */
	Ycc.UI.Polygon.prototype.getAbsolutePositionRect = function () {
		if(!this.coordinates[0]) return console.log(new Ycc.Debugger.Error('need compute prop coordinates').message);
		
		var start = this.coordinates[0];
		var minx=start.x,miny=start.y,maxx=start.x,maxy=start.y;
		
		for(var i=0;i<this.coordinates.length-1;i++){
			var dot = this.coordinates[i];
			if(dot.x<minx) minx=dot.x;
			if(dot.x>=maxx) maxx=dot.x;
			if(dot.y<miny) miny=dot.y;
			if(dot.y>=maxy) maxy=dot.y;
		}
		
		var posAbsolute = this.transformToAbsolute({x:minx,y:miny});
		return new Ycc.Math.Rect(posAbsolute.x,posAbsolute.y,maxx-minx,maxy-miny);
	};
	
	
	/**
	 * 绘制旋转缩放之前的UI
	 * @override
	 */
	Ycc.UI.Polygon.prototype.renderDashBeforeUI = function (ctx) {
		if(!this.isShowRotateBeforeUI || this.coordinates.length===0) return;
		
		var self = this;
		ctx = ctx || self.ctx;
		var pa = this.getParent();
		var paPos =pa? pa.getAbsolutePosition():new Ycc.Math.Dot();
		var start = new Ycc.Math.Dot(this.coordinates[0].x+paPos.x,this.coordinates[0].y+paPos.y);
		
		ctx.save();
		// 虚线
		ctx.setLineDash([10]);
		ctx.beginPath();
		ctx.moveTo(start.x*this.dpi,start.y*this.dpi);
		for(var i=0;i<self.coordinates.length-1;i++){
			var dot = self.coordinates[i];
			ctx.lineTo(dot.x*this.dpi+paPos.x*this.dpi,dot.y*this.dpi+paPos.y*this.dpi);
		}
		ctx.closePath();
		ctx.strokeStyle = this.strokeStyle;
		ctx.stroke();
		ctx.restore();
	};

	
	/**
	 * 重载基类的包含某个点的函数，用于点击事件等的响应
	 * 两种方法：
	 * 方法一：经过该点的水平射线与多边形的焦点数，即Ray-casting Algorithm
	 * 方法二：某个点始终位于多边形逆时针向量的左侧、或者顺时针方向的右侧即可判断，算法名忘记了
	 * 此方法采用方法一，并假设该射线平行于x轴，方向为x轴正方向
	 * @param dot {Ycc.Math.Dot} 需要判断的点，绝对坐标
	 * @param noneZeroMode {Number} 是否noneZeroMode 1--启用 2--关闭 默认启用
	 * 		从这个点引出一根“射线”，与多边形的任意若干条边相交，计数初始化为0，若相交处被多边形的边从左到右切过，计数+1，若相交处被多边形的边从右到左切过，计数-1，最后检查计数，如果是0，点在多边形外，如果非0，点在多边形内
	 * @return {boolean}
	 */
	Ycc.UI.Polygon.prototype.containDot = function (dot,noneZeroMode) {
		// 默认启动none zero mode
		noneZeroMode=noneZeroMode||this.noneZeroMode;
		var _dot = dot;
		
		var x = _dot.x,y=_dot.y;
		var crossNum = 0;
		// 点在线段的左侧数目
		var leftCount = 0;
		// 点在线段的右侧数目
		var rightCount = 0;
		for(var i=0;i<this.coordinates.length-1;i++){
			var start = this.transformByRotate(this.coordinates[i]);
			var end = this.transformByRotate(this.coordinates[i+1]);
			
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
	
	
	
	
})(Ycc);;/**
 * @file    Ycc.UI.Ellipse.class.js
 * @author  xiaohei
 * @date    2017/11/24
 * @description  Ycc.UI.Ellipse.class文件
 */



(function (Ycc) {
	
	/**
	 * 椭圆
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.fill=false {boolean}	填充or描边
	 * @param option.color=black {string} 圆的颜色
	 * @param option.point {Ycc.Math.Dot} 圆心位置
	 * @param option.width=20 {number} 长轴
	 * @param option.height=10 {number} 短轴
	 * @param option.angle=0	{number} 椭圆绕其中心的自转角度
	 * 		注：通过rotation设置的旋转角度只会旋转椭圆的中心点，此处的angle是将椭圆本身围绕中心点旋转。
	 * 		此处的理解，可以结合地球绕太阳旋转，angle表示自转角度，rotation表示公转角度。
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.Ellipse = function Ellipse(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.Ellipse;
		
		this.point = new Ycc.Math.Dot();
		this.width = 20;
		this.height = 10;
		
		/**
		 * 椭圆自转角度
		 * @type {number}
		 */
		this.angle = 0;
		
		// centrePoint,width,height,rotateAngle,fill
		
		this.color = "black";
		this.fill = false;
		
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Ellipse.prototype,Ycc.UI.Polygon.prototype);
	Ycc.UI.Ellipse.prototype.constructor = Ycc.UI.Ellipse;
	
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Ellipse.prototype.computeUIProps = function () {
		var x=this.point.x,
			y=this.point.y,
			a=this.width/2,
			b=this.height/2,
			angle = this.angle/180*Math.PI;
		
		var yMax = Math.sqrt(Math.cos(angle)*Math.cos(angle)*b*b+Math.sin(angle)*Math.sin(angle)*a*a) + y;
		var yMin = -yMax+2*y;
		var xMax = Math.sqrt(Math.cos(angle)*Math.cos(angle)*a*a+Math.sin(angle)*Math.sin(angle)*b*b) + x;
		var xMin = -xMax+2*x;
		
		this.rect.x = xMin;
		this.rect.y = yMin;
		this.rect.width = xMax-xMin;
		this.rect.height = yMax-yMin;
		
		// 计算多边形坐标
		this.coordinates= this.rect.getVertices();
		// 计算相对位置
		this.x=this.point.x,this.y=this.point.y;

	};
	
	
	
	/**
	 * 绘制
	 */
	Ycc.UI.Ellipse.prototype.render = function () {
		var width = this.width*this.dpi,
			rotateAngle=this.angle,
			height=this.height*this.dpi;
		
		var point = this.transformByRotate(this.point);
		// 只绘制至上屏canvas
		var ctx = this.ctxCache;
		
		ctx.save();
		var r = (width > height) ? width : height;
		var x = point.x*this.dpi;
		var y = point.y*this.dpi;
		
		// 计算压缩比例
		var ratioX = width / r;
		var ratioY = height / r;
		// 默认旋转中心位于画布左上角，需要改变旋转中心点
		ctx.translate(x,y);
		ctx.rotate(parseInt(rotateAngle)*Math.PI/180);
		// 再变换回原来的旋转中心点
		ctx.translate(-x,-y);
		// this.ctx.scale(1, 1);
		ctx.scale(ratioX, ratioY);
		ctx.beginPath();
		ctx.arc(x / ratioX,  y/ ratioY, r/2, 0, 2 * Math.PI, false);
		ctx.closePath();
		
		ctx.fillStyle = this.ctx.strokeStyle = this.color;
		if(!this.fill)
			ctx.stroke();
		else
			ctx.fill();
			
		ctx.restore();
	};
	
	
	/**
	 * 判断是否在椭圆内
	 * @param dot	绝对坐标
	 * @param noneZeroMode
	 * @override
	 */
	Ycc.UI.Ellipse.prototype.containDot = function (dot,noneZeroMode) {
		var point = this.transformByRotate(this.point);
		// 椭圆自转角度
		dot = new Ycc.Math.Dot(dot).rotate(-this.angle,point);
		return Math.pow((dot.x-point.x)/this.width*2,2)+Math.pow((dot.y-point.y)/this.height*2,2)<=1;
	};
	
	/**
	 * 渲染旋转平移之前的位置
	 * @param ctx
	 * @override
	 */
	Ycc.UI.Ellipse.prototype.renderDashBeforeUI=function (ctx) {
		if(!this.isShowRotateBeforeUI || this.coordinates.length===0) return;
		var width = this.width,
			rotateAngle=this.angle,
			height=this.height;
		
		var pa = this.getParent();
		var point = pa?pa.transformToAbsolute(this.point):this.point;
		
		this.ctx.save();
		var r = (width > height) ? width : height;
		// 计算压缩比例
		var ratioX = width / r;
		var ratioY = height / r;
		this.ctx.scale(ratioX, ratioY);
		this.ctx.beginPath();
		this.ctx.arc(point.x / ratioX,  point.y/ ratioY, r/2, 0, 2 * Math.PI, false);
		this.ctx.closePath();
		
		this.ctx.strokeStyle = this.color;
		this.ctx.setLineDash([10]);

		this.ctx.stroke();
		
		this.ctx.restore();
	}
	
})(Ycc);;/**
 * @file    Ycc.UI.Circle.class.js
 * @author  xiaohei
 * @date    2017/11/23
 * @description  Ycc.UI.Circle.class文件
 */



(function (Ycc) {
	
	/**
	 * 圆
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.fill=true {boolean}	填充or描边
	 * @param option.color=black {string} 圆的颜色
	 * @param option.point {Ycc.Math.Dot} 圆心位置，相对坐标
	 * @param option.r=10 {number} 圆的半径
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.Circle = function Circle(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.Circle;
		
		this.point = null;
		this.r = 10;
		this.color = "black";
		this.fill = true;
		
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Circle.prototype,Ycc.UI.Polygon.prototype);
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Circle.prototype.computeUIProps = function () {
		if(!this.point) return new Ycc.Debugger.Error('Circle need prop point');
		
		var x=this.point.x,
			y=this.point.y,
			r=this.r;
		this.rect = new Ycc.Math.Rect(x-r,y-r,2*r,2*r);
		// 计算多边形坐标
		this.coordinates= this.rect.getVertices();
		// 计算相对位置
		this.x=this.point.x,this.y=this.point.y;
		
	};
	
	
	/**
	 * 绘制
	 * @override
	 */
	Ycc.UI.Circle.prototype.render = function () {
		var ctx = this.ctxCache;
		
		var point = this.transformByRotate(this.point);
		
		
		ctx.save();
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.strokeStyle = this.color;
		
		ctx.arc(
			point.x*this.dpi,
			point.y*this.dpi,
			this.r*this.dpi,
			0,
			2*Math.PI
		);
		
		ctx.closePath();
		if(!this.fill)
			ctx.stroke();
		else
			ctx.fill();
		ctx.restore();
	};
	
	/**
	 * 绘制旋转缩放之前的UI
	 * @override
	 */
	Ycc.UI.Circle.prototype.renderDashBeforeUI = function (ctx) {
		if(!this.isShowRotateBeforeUI || this.coordinates.length===0) return;
		var self = this;
		ctx = this.ctx;
		var pa = this.getParent();
		var point = pa?pa.transformToAbsolute(this.point):this.point;
		
		ctx.save();
		// 虚线
		ctx.setLineDash([10]);
		ctx.beginPath();
		this.ctx.arc(
			point.x,
			point.y,
			this.r,
			0,
			2*Math.PI
		);
		ctx.closePath();
		ctx.strokeStyle = this.color;
		ctx.stroke();
		ctx.restore();
	};
	
	
	/**
	 * 判断是否在圆内
	 * @param dot	绝对坐标
	 * @param noneZeroMode
	 * @override
	 */
	Ycc.UI.Circle.prototype.containDot = function (dot,noneZeroMode) {
		var point = this.transformByRotate(this.point);
		return Math.pow(dot.x-point.x,2)+Math.pow(dot.y-point.y,2)<=Math.pow(this.r,2);
	};
	
	
})(Ycc);;/**
 * @file    Ycc.UI.Image.class.js
 * @author  xiaohei
 * @date    2017/11/22
 * @description  Ycc.UI.Image.class文件
 */



(function (Ycc) {
	
	
	/**
	 * 图片UI
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.fillMode=none {string} 填充方式
	 * 		<br> none 			-- 无填充方式。左上角对齐，超出隐藏，不修改rect大小。
	 * 		<br> repeat 		-- 重复。左上角对齐，重复平铺图片，不修改rect大小，超出隐藏。
	 * 		<br> scale 			-- 缩放。左上角对齐，缩放至整个rect区域，不修改rect大小。
	 * 		<br> scaleRepeat 	-- 先缩放再重复。左上角对齐，缩放至某个rect区域，再重复填充整个rect区域，不修改rect大小。
	 * 		<br> auto 			-- 自动。左上角对齐，rect大小自动适配图片。若图片超出rect，会动态修改rect大小。
	 * 		<br> scale9Grid 	-- 9宫格模式填充。左上角对齐，中间区域将拉伸，不允许图片超出rect区域大小，不会修改rect大小。
	 * @param option.res	{Image}		需要填充的图片资源。注：必须已加载完成。
	 * @param option.mirror	{Number}	将图片镜像绘制方式
	 * 		<br> 0		--		无
	 * 		<br> 1		--		上下颠倒
	 * 		<br> 2		--		左右翻转
	 * 		<br> 3		--		上下左右颠倒
	 * @param option.scale9GridRect	{Ycc.Math.Rect}	9宫格相对于res图片的中间区域，当且仅当fillMode为scale9Grid有效。
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.Image = function Image(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.Image;
		
		/**
		 * 填充方式
		 * 		<br> none -- 无填充方式。左上角对齐，超出隐藏，不修改rect大小。
		 * 		<br> repeat -- 重复。左上角对齐，重复平铺图片，不修改rect大小，超出隐藏。
		 * 		<br> scale -- 缩放。左上角对齐，缩放至整个rect区域，不修改rect大小。
		 * 		<br> auto -- 自动。左上角对齐，rect大小自动适配图片。若图片超出rect，会动态修改rect大小。
		 * 		<br> scale9Grid -- 9宫格模式填充。左上角对齐，中间区域将拉伸，不允许图片超出rect区域大小，不会修改rect大小。		 *
		 * @type {string}
		 */
		this.fillMode = "none";

		/**
		 * 需要填充的图片资源。注：必须已加载完成。
		 * @type {Image}
		 */
		this.res = null;
		
		/**
		 * 图片颠倒方式
		 * 		<br> 0		--		无
		 * 		<br> 1		--		左右颠倒
		 * 		<br> 2		--		上下翻转
		 * 		<br> 3		--		上下左右颠倒
		 * @type {number}
		 */
		this.mirror = 0;
		
		/**
		 * 9宫格相对于res图片的中间区域，当且仅当fillMode为scale9Grid有效。
		 * @type {Ycc.Math.Rect}
		 */
		this.scale9GridRect=null;
		
		/**
		 * 缩放重复模式下，原始图片的缩放区域，当且仅当fillMode为scaleRepeat有效。
		 * @type {null}
		 */
		this.scaleRepeatRect = null;
		

		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Image.prototype,Ycc.UI.Polygon.prototype);
	Ycc.UI.Image.prototype.constructor = Ycc.UI.Image;
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Image.prototype.computeUIProps = function () {
		if(this.fillMode === "auto"){
			this.rect.width = this.res.width;
			this.rect.height = this.res.height;
		}
		// 计算多边形坐标
		this.coordinates= this.rect.getVertices();
		// 计算相对位置
		this.x=this.rect.x,this.y=this.rect.y;

	};
	
	/**
	 * 处理镜像
	 * @param rect {Ycc.Math.Rect} 计算之后的图片容纳区
	 * @private
	 */
	Ycc.UI.Image.prototype._processMirror = function (rect) {
		var ctx = this.ctxCache;
		var x = rect.x*this.dpi;
		var y = rect.y*this.dpi;
		var width = rect.width*this.dpi;
		var height = rect.height*this.dpi;
		
		if(this.mirror===1){
			ctx.scale(-1, 1);
			ctx.translate(-x*2-width,0);
		}
		if(this.mirror===2){
			ctx.scale(1, -1);
			ctx.translate(0,-y*2-height);
		}
		if(this.mirror===3){
			ctx.scale(-1, -1);
			ctx.translate(-x*2-width,-y*2-height);
		}
		
	};
	
	/**
	 * 绘制
	 */
	Ycc.UI.Image.prototype.render = function () {
		var ctx = this.ctxCache;
		
		ctx.save();
		// this.scaleAndRotate();
		
		var rect = this.getAbsolutePositionRect();//this.rect;
		var img = this.res;
		// 局部变量
		var i,j,wCount,hCount,xRest,yRest;
		var x = rect.x*this.dpi;
		var y = rect.y*this.dpi;
		var width = rect.width*this.dpi;
		var height = rect.height*this.dpi;
		var imgWidth = img.width*this.dpi;
		var imgHeight = img.height*this.dpi;
		
		// 坐标系旋转
		var absoluteAnchor = this.transformToAbsolute({x:this.anchorX,y:this.anchorY});
		ctx.translate(absoluteAnchor.x*this.dpi,absoluteAnchor.y*this.dpi);
		ctx.rotate(this.rotation*Math.PI/180);
		ctx.translate(-absoluteAnchor.x*this.dpi,-absoluteAnchor.y*this.dpi);
		
		this._processMirror(rect);
		if(this.fillMode === "none")
			ctx.drawImage(this.res,0,0,rect.width,rect.height,rect.x,rect.y,rect.width,rect.height);
		else if(this.fillMode === "scale")
			ctx.drawImage(this.res,0,0,img.width,img.height,x,y,width,height);
		else if(this.fillMode === "auto"){
			ctx.drawImage(this.res,0,0,img.width,img.height,x,y,width,height);
		}else if(this.fillMode === "repeat"){
			// x,y方向能容纳的img个数
			wCount = parseInt(width/imgWidth)+1;
			hCount = parseInt(height/imgHeight)+1;

			for(i=0;i<wCount;i++){
				for(j=0;j<hCount;j++){
					xRest = img.width;
					yRest = img.height;
					if(i===wCount-1)
						xRest = rect.width-i*img.width;
					if(j===hCount-1)
						yRest = rect.height-j*img.height;
					ctx.drawImage(this.res,
						0,0,
						xRest,yRest,
						x+imgWidth*i,y+imgHeight*j,
						xRest*this.dpi,yRest*this.dpi);
				}
			}
		}else if(this.fillMode === "scaleRepeat"){
			// x,y方向能容纳的img个数
			wCount = parseInt(rect.width/this.scaleRepeatRect.width)+1;
			hCount = parseInt(rect.height/this.scaleRepeatRect.height)+1;
			
			for(i=0;i<wCount;i++){
				for(j=0;j<hCount;j++){
					xRest = this.scaleRepeatRect.width;
					yRest = this.scaleRepeatRect.height;
					if(i===wCount-1)
						xRest = rect.width-i*this.scaleRepeatRect.width;
					if(j===hCount-1)
						yRest = rect.height-j*this.scaleRepeatRect.height;
					this.ctx.drawImage(this.res,
						0,0,
						img.width,img.height,
						rect.x*this.dpi+this.scaleRepeatRect.width*i,rect.y*this.dpi+this.scaleRepeatRect.height*j,
						xRest*this.dpi,yRest*this.dpi);
				}
			}
		}else if(this.fillMode === "scale9Grid"){
			var centerRect = this.scale9GridRect;
			
			var grid = [];

			var src,dest;
			
			// 第1块
			grid[0]={};
			grid[0].src = new Ycc.Math.Rect(0,0,centerRect.x,centerRect.y);
			grid[0].dest = new Ycc.Math.Rect(rect.x,rect.y,centerRect.x,centerRect.y);
			
			// 第3块
			grid[2]={};
			grid[2].src = new Ycc.Math.Rect(centerRect.x+centerRect.width,0,img.width-centerRect.x-centerRect.width,centerRect.y);
			grid[2].dest = new Ycc.Math.Rect(rect.width-grid[2].src.width+rect.x,rect.y,grid[2].src.width,grid[2].src.height);
			
			// 第7块
			grid[6]={};
			grid[6].src = new Ycc.Math.Rect(0,centerRect.y+centerRect.height,centerRect.x,img.height-centerRect.y-centerRect.height);
			grid[6].dest = new Ycc.Math.Rect(rect.x,rect.y+rect.height-grid[6].src.height,grid[6].src.width,grid[6].src.height);
			
			// 第9块
			grid[8]={};
			grid[8].src = new Ycc.Math.Rect(centerRect.x+centerRect.width,centerRect.y+centerRect.height,img.width-centerRect.x-centerRect.width,img.height-centerRect.y-centerRect.height);
			grid[8].dest = new Ycc.Math.Rect(rect.width-grid[8].src.width+rect.x,rect.y+rect.height-grid[8].src.height,grid[8].src.width,grid[8].src.height);
			
			
			// 第2块
			grid[1]={};
			grid[1].src = new Ycc.Math.Rect(centerRect.x,0,centerRect.width,centerRect.y);
			grid[1].dest = new Ycc.Math.Rect(grid[0].dest.x+grid[0].dest.width,rect.y,rect.width-grid[0].dest.width-grid[2].dest.width,centerRect.y);
			
			// 第4块
			grid[3]={};
			grid[3].src = new Ycc.Math.Rect(grid[0].src.x,centerRect.y,grid[0].src.width,centerRect.height);
			grid[3].dest = new Ycc.Math.Rect(grid[0].dest.x,grid[0].dest.y+grid[0].dest.height,grid[0].dest.width,rect.height-grid[0].dest.height-grid[6].dest.height);
			
			// 第6块
			grid[5]={};
			grid[5].src = new Ycc.Math.Rect(grid[2].src.x,centerRect.y,grid[2].src.width,centerRect.height);
			grid[5].dest = new Ycc.Math.Rect(grid[2].dest.x,grid[3].dest.y,grid[2].dest.width,grid[3].dest.height);
			
			// 第8块
			grid[7]={};
			grid[7].src = new Ycc.Math.Rect(grid[1].src.x,grid[6].src.y,centerRect.width,grid[6].src.height);
			grid[7].dest = new Ycc.Math.Rect(grid[1].dest.x,grid[6].dest.y,grid[1].dest.width,grid[6].dest.height);
			
			// 第5块
			grid[4]={};
			grid[4].src = new Ycc.Math.Rect(centerRect.x,centerRect.y,centerRect.width,centerRect.height);
			grid[4].dest = new Ycc.Math.Rect(grid[1].dest.x,grid[5].dest.y,grid[1].dest.width,grid[5].dest.height);
			
			
			
			for(var k=0;k<grid.length;k++){
				if(!grid[k]) continue;
				src = grid[k].src;
				dest = grid[k].dest;
				ctx.drawImage(this.res,
					// 源
					src.x,src.y,src.width,src.height,
					// 目标
					dest.x*this.dpi,dest.y*this.dpi,dest.width*this.dpi,dest.height*this.dpi
				);
				
			}
			
		}
		ctx.restore();
		
	};
	
	
	
})(Ycc);;/**
 * @file    Ycc.UI.ImageFrameAnimation.js
 * @author  xiaohei
 * @date    2018/9/29
 * @description  Ycc.UI.ImageFrameAnimation文件
 */


(function (Ycc) {
	/**
	 * 图片序列帧动画的UI
	 * @param option				{object}		所有可配置的配置项
	 * @param option.rect			{Ycc.Math.Rect}	容纳区。会将显示区的内容缩放至这个区域。
	 * @param option.res			{Image}			需要填充的图片资源。注：必须已加载完成。
	 * @param option.frameSpace		{Number}		序列帧播放的帧间隔。默认为1，即每帧都更换图片
	 * @param option.firstFrameRect	{Number}		首帧的显示区。该区域相对于原始图片，且之后帧显示区将按照这个区域的width递推
	 * @param option.frameRectCount	{Number}		帧显示区的递推个数。该个数相对于原始图片，表示之后帧显示区的递推个数
	 * @param option.autoplay		{Boolean}		自动播放
	 * @param option.mirror			{Number}		将图片镜像绘制方式
	 * 		<br> 0		--		无
	 * 		<br> 1		--		上下颠倒
	 * 		<br> 2		--		左右翻转
	 * 		<br> 3		--		上下左右颠倒
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.ImageFrameAnimation = function ImageFrameAnimation(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.ImageFrameAnimation;
		
		
		/**
		 * 需要填充的图片资源。注：必须已加载完成。
		 * @type {Image}
		 */
		this.res = null;
		
		/**
		 * 序列帧播放的帧间隔。默认为1，即每帧都更换图片
		 * @type {number}
		 */
		this.frameSpace = 1;
		
		/**
		 * 首帧的显示区
		 * @type {null|Ycc.Math.Rect}
		 */
		this.firstFrameRect = null;
		
		/**
		 * 动画开始时系统的总帧数
		 * @type {number}
		 */
		this.startFrameCount = 0;
		
		/**
		 * 帧显示区的递推个数
		 * @type {number}
		 */
		this.frameRectCount = 1;
		
		/**
		 * 是否自动播放
		 * @type {boolean}
		 */
		this.autoplay = false;
		
		/**
		 * 是否真正播放
		 * @type {boolean}
		 */
		this.isRunning = false;
		
		/**
		 * 图片颠倒方式
		 * 		<br> 0		--		无
		 * 		<br> 1		--		左右颠倒
		 * 		<br> 2		--		上下翻转
		 * 		<br> 3		--		上下左右颠倒
		 * @type {number}
		 */
		this.mirror = 0;
		
		
		
		this.extend(option);
		
		// 初始化
		this.isRunning = this.autoplay;
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.ImageFrameAnimation.prototype,Ycc.UI.Polygon.prototype);
	Ycc.UI.ImageFrameAnimation.prototype.constructor = Ycc.UI.ImageFrameAnimation;
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.ImageFrameAnimation.prototype.computeUIProps = function () {
		// 计算多边形坐标
		this.coordinates= this.rect.getVertices();
		// 计算相对位置
		this.x=this.rect.x,this.y=this.rect.y;
	};
	
	/**
	 * 处理镜像
	 * @param rect {Ycc.Math.Rect} 计算之后的图片容纳区
	 * @private
	 */
	Ycc.UI.ImageFrameAnimation.prototype._processMirror = function (rect) {
		var ctx = this.ctxCache;
		var x = rect.x*this.dpi;
		var y = rect.y*this.dpi;
		var width = rect.width*this.dpi;
		var height = rect.height*this.dpi;
		if(this.mirror===1){
			ctx.scale(-1, 1);
			ctx.translate(-x*2-width,0);
		}
		if(this.mirror===2){
			ctx.scale(1, -1);
			ctx.translate(0,-y*2-height);
		}
		if(this.mirror===3){
			ctx.scale(-1, -1);
			ctx.translate(-x*2-width,-y*2-height);
		}
		
	};
	
	/**
	 * 绘制
	 */
	Ycc.UI.ImageFrameAnimation.prototype.render = function () {
		var ctx = this.ctxCache;
		
		// 绝对坐标
		var rect = this.getAbsolutePositionRect();
		
		var x = rect.x*this.dpi;
		var y = rect.y*this.dpi;
		var width = rect.width*this.dpi;
		var height = rect.height*this.dpi;
		
		// 获取当前显示第几个序列图，由于默认播放第一帧图片，这里直接渲染第二帧图片
		var index = parseInt((this.belongTo.yccInstance.ticker.frameAllCount-this.startFrameCount)/this.frameSpace)%this.frameRectCount+1;
		// 若没开始播放，默认只绘制第一个序列帧
		if(!this.isRunning || index>=this.frameRectCount)
			index=0;
		// 绘制
		ctx.save();
		this.scaleAndRotate();

		// 处理镜像属性
		this._processMirror(rect);

		ctx.drawImage(this.res,
			this.firstFrameRect.x+this.firstFrameRect.width*index,this.firstFrameRect.y,this.firstFrameRect.width,this.firstFrameRect.height,
			x,y,width,height);
		ctx.restore();
	};
	
	
	/**
	 * 开始播放
	 */
	Ycc.UI.ImageFrameAnimation.prototype.start = function () {
		this.startFrameCount = this.belongTo.yccInstance.ticker.frameAllCount;
		this.isRunning = true;
	};
	
	/**
	 * 停止播放
	 */
	Ycc.UI.ImageFrameAnimation.prototype.stop = function () {
		this.isRunning = false;
	};
	
	
	
})(Ycc);

;/**
 * @file    Ycc.UI.Line.class.js
 * @author  xiaohei
 * @date    2017/11/17
 * @description  Ycc.UI.Line.class文件
 */


(function (Ycc) {
	
	/**
	 * 线段。可设置属性如下
	 * @param option	{object}		所有可配置的配置项
	 * @param option.start	{Ycc.Math.Dot}	起点
	 * @param option.end	{Ycc.Math.Dot}	终点
	 * @param option.width=1	{number}	线条宽度
	 * @param option.color="black"	{string}	线条颜色
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.Line = function Line(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.Line;
		
		this.start = new Ycc.Math.Dot(0,0);
		this.end = new Ycc.Math.Dot(0,0);
		this.width = 1;
		this.color = "black";
		
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Line.prototype,Ycc.UI.Polygon.prototype);
	Ycc.UI.Line.prototype.constructor = Ycc.UI.Line;

	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Line.prototype.computeUIProps = function () {
		this.rect.x = this.start.x<this.end.x?this.start.x:this.end.x;
		this.rect.y = this.start.y<this.end.y?this.start.y:this.end.y;
		this.rect.width = Math.abs(this.start.x-this.end.x);
		this.rect.height = Math.abs(this.start.y-this.end.y);
		
		
		// 计算多边形坐标
		var x1=this.start.x,y1=this.start.y,x2=this.end.x,y2=this.end.y;
		// 垂直线段的斜率
		var k = -(x2-x1)/(y2-y1);
		if(y2-y1===0) {
			this.coordinates=[
				{x:this.start.x,y:this.start.y-this.width/2},
				{x:this.start.x,y:this.start.y+this.width/2},
				{x:this.end.x,y:this.end.y+this.width/2},
				{x:this.end.x,y:this.end.y-this.width/2},
				{x:this.start.x,y:this.start.y-this.width/2},
			];
		}else {
			var cx1 = x1-Math.pow(Math.pow(this.width/2,2)/(k*k+1),0.5);
			var cx2 = x1+Math.pow(Math.pow(this.width/2,2)/(k*k+1),0.5);
			var cx3 = x2+Math.pow(Math.pow(this.width/2,2)/(k*k+1),0.5);
			var cx4 = x2-Math.pow(Math.pow(this.width/2,2)/(k*k+1),0.5);
			
			var cy1 = k*(cx1-x1)+y1;
			var cy2 = k*(cx2-x1)+y1;
			var cy3 = k*(cx3-x2)+y2;
			var cy4 = k*(cx4-x2)+y2;
			
			
			// 计算多边形坐标
			// 计算多边形坐标
			this.coordinates=[
				{x:cx1,y:cy1},
				{x:cx2,y:cy2},
				{x:cx3,y:cy3},
				{x:cx4,y:cy4},
				{x:cx1,y:cy1},
			];
		}
		// 计算相对位置
		this.x=this.start.x,this.y=this.start.y;
		this.strokeStyle = this.color;
		this.fillStyle = this.color;
	};
	/**
	 * 绘制函数与Polygon相同
	 */
	// Ycc.UI.Line.prototype.render = function () {
	//
	// 	var pa = this.getParent();
	// 	var start = pa?pa.transformToAbsolute(this.start):this.start;
	// 	var end = pa?pa.transformToAbsolute(this.end):this.end;
	// 	this.ctx.save();
	// 	this.ctx.strokeStyle = this.color;
	// 	this.ctx.lineWidth = this.width;
	//
	// 	this.ctx.beginPath();
	// 	this.ctx.moveTo(start.x, start.y);
	// 	this.ctx.lineTo(end.x, end.y);
	// 	this.ctx.stroke();
	// 	this.ctx.closePath();
	// 	this.ctx.restore();
	// };
	
	
	
	
	
})(Ycc);;/**
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
		
		// 计算多边形坐标
		this.coordinates= this.rect.getVertices();
		// 计算相对位置
		this.x=this.rect.x,this.y=this.rect.y;

	};
	/**
	 * 绘制
	 */
	Ycc.UI.BrokenLine.prototype.render = function () {
		if(this.pointList.length<2) return null;

		var ctx = this.ctxCache;
		
		// 父级
		var pa = this.getParent();
		ctx.save();
		ctx.strokeStyle = this.color;
		ctx.strokeWidth = this.width;
		ctx.beginPath();
		// 因为直接操作舞台，所以绘制之前需要转换成舞台绝对坐标
		// var pointList = pa?pa.transformToAbsolute(this.pointList):this.pointList;
		var pointList = this.transformByRotate(this.pointList);
		
		if(this.smooth)
			this._smoothLineRender(pointList);
		else
			this._normalRender(pointList);
		ctx.closePath();
		ctx.restore();
	};
	
	/**
	 * 普通绘制
	 * @param pointList
	 * @private
	 */
	Ycc.UI.BrokenLine.prototype._normalRender = function (pointList) {
		var ctx = this.ctxCache;
		ctx.moveTo(pointList[0].x*this.dpi, pointList[0].y*this.dpi);
		for(var i =1;i<pointList.length;i++){
			ctx.lineTo(pointList[i].x*this.dpi, pointList[i].y*this.dpi);
		}
		ctx.stroke();
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
		var ctx = this.ctxCache;
		// 获取生成曲线的两个控制点和两个顶点，N个顶点可以得到N-1条曲线
		var list = getCurveList(pointList);
		// 调用canvas三次贝塞尔方法bezierCurveTo逐一绘制
		ctx.beginPath();
		for(var i=0;i<list.length;i++){
			ctx.moveTo(list[i].start.x*this.dpi,list[i].start.y*this.dpi);
			ctx.bezierCurveTo(list[i].dot1.x*this.dpi,list[i].dot1.y*this.dpi,list[i].dot2.x*this.dpi,list[i].dot2.y*this.dpi,
				list[i].end.x*this.dpi,list[i].end.y*this.dpi);
		}
		ctx.stroke();
		
		
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
	
	
	
	
	
})(Ycc);;/**
 * @file    Ycc.UI.MultiLineText.class.js
 * @author  xiaohei
 * @date    2017/11/16
 * @description  Ycc.UI.MultiLineText.class文件
 */




(function (Ycc) {
	
	/**
	 * 多行文本UI
	 * @constructor
	 * @extends Ycc.UI.Base
	 * @param option	{object}		所有可配置的配置项
	 * @param option.content=""	{string}	内容
	 * @param option.color=black	{string}	颜色
	 * @param option.rect	{Ycc.Math.Rect}	文字的绘制区域。若超出长度，此区域会被修改
	 * @param option.wordBreak=break-all	{string}	水平方向文字超出换行
	 * 		<br>`break-all`		超出即换行
	 * 		<br>`break-word`		在单词处换行
	 * 		<br>`no-break`		不换行，超出即隐藏
	 * 		<br>默认为`no-break`
	 * @param option.overflow=auto	{string}	垂直方向超出rect之后的显示方式
	 * 		<br> `hidden` -- 直接隐藏
	 * 		<br> `auto`	-- 修改rect大小，完全显示
	 */
	Ycc.UI.MultiLineText = function MultiLineText(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.MultiLineText;
		
		// /**
		//  * 配置项
		//  */
		// this.option = Ycc.utils.extend({
		// 	content:"",
		// 	fontSize:"16px",
		// 	lineHeight:24,
		// 	fill:true,
		// 	color:"black",
		// 	rect:null,
		// 	wordBreak:"break-all",
		// 	overflow:"auto"
		// },option);
		
		/**
		 * 显示在文本框中的文本行。私有属性，不允许修改。
		 * @type {string[]}
		 */
		this.displayLines = [];
		
		this.content = "";
		this.fontSize = "16px";
		this.lineHeight = 24;
		this.fill = true;
		this.color = "black";
		this.wordBreak = "break-all";
		this.overflow = "auto";

		this.extend(option);
	};

	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.MultiLineText.prototype,Ycc.UI.Polygon.prototype);
	Ycc.UI.MultiLineText.prototype.constructor = Ycc.UI.MultiLineText;
	
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.MultiLineText.prototype.computeUIProps = function () {
		var self = this;
		// 取离屏绘图环境
		var ctx = this.ctxCache;
		
		// 设置画布属性再计算，否则计算内容长度会有偏差
		self.belongTo._setCtxProps(self,ctx);
		
		var config = this;
		// 文本行
		var lines = this.content.split(/(?:\r\n|\r|\n)/);
		// 待显示的文本行
		this.displayLines = getRenderLines();
		if(config.overflow === "auto"){
			config.rect.height = config.lineHeight*this.displayLines.length;
		}
		
		// 计算多边形坐标
		this.coordinates= this.rect.getVertices();
		// 计算相对位置
		this.x=this.rect.x,this.y=this.rect.y;

		/**
		 * 获取需要实际绘制的文本行数组
		 */
		function getRenderLines(){
			switch (config.wordBreak){
				case "no-break":
				case "break-all":
					return getBreakAllRenderLines();
					break;
				case "break-word":
					return getBreakWordRenderLines();
					break;
				default:
					return getBreakAllRenderLines();
			}
			
			/**
			 * 获取break-all时的绘制文本行
			 */
			function getBreakAllRenderLines(){
				var res = [];
				for(var i = 0;i<lines.length;i++){
					var line = lines[i];
					var _lines = dealLine(line);
					res = res.concat(_lines);
				}
				return res;
				
				/**
				 * 递归处理单行超长的情况
				 * @param line
				 */
				function dealLine(line){
					var subLines = [];
					var lineW = ctx.measureText(line).width;
					// 若没有超长
					if(lineW<=config.rect.width*self.dpi){
						subLines.push(line);
						return subLines;
					}
					
					for(var j=0;j<line.length;j++){
						var part = line.slice(0,j+1);
						var partW = ctx.measureText(part).width;
						if(partW>config.rect.width*self.dpi){
							var subLine = line.slice(0,j-1);
							subLines.push(subLine);
							var restLine = line.slice(j-1);
							// 递归处理剩下的字符串
							subLines = subLines.concat(dealLine(restLine));
							return subLines;
						}
					}
				}
			}
			
			/**
			 * 获取break-word时的绘制文本行
			 */
			
			function getBreakWordRenderLines(){
				var res = [];
				for(var i = 0;i<lines.length;i++){
					var line = lines[i];
					var _lines = dealLine(line);
					res = res.concat(_lines);
				}
				return res;
				
				/**
				 * 递归处理单行超长的情况
				 * @param line
				 */
				function dealLine(line){
					var subLines = [];
					var lineW = ctx.measureText(line).width;
					// 若没有超长
					if(lineW<=config.rect.width*self.dpi){
						subLines.push(line);
						return subLines;
					}
					// 记录最后一次空格出现的位置
					var spacePosition = 0;
					for(var j=0;j<line.length;j++){
						var part = line.slice(0,j+1);
						var partW = ctx.measureText(part).width;
						// console.log(part,partW,config.rect.width*self.dpi,222);
						var curChar = line[j];
						if(curChar===" ")
							spacePosition = j;
						if(partW>config.rect.width*self.dpi){
							var subLine = "";
							var restLine = "";
							// 若当前字符为空格
							if(curChar===" " || spacePosition===0){
								subLine = line.slice(0,j);
								subLines.push(subLine);
								restLine = line.slice(j);
								// 递归处理剩下的字符串
								subLines = subLines.concat(dealLine(restLine));
								return subLines;
							}
							
							// 当前字符不为空格
							subLine = line.slice(0,spacePosition);
							subLines.push(subLine);
							restLine = line.slice(spacePosition);
							// 递归处理剩下的字符串
							subLines = subLines.concat(dealLine(restLine));
							return subLines;
							
						}
					}
				}
			}
		}
	};
	
	
	
	/**
	 * 渲染至ctx
	 * @param ctx
	 */
	Ycc.UI.MultiLineText.prototype.render = function (ctx) {
		
		var self = this;
		
		ctx = ctx || this.ctxCache;
		
		if(!ctx){
			console.error("[Ycc error]:","ctx is null !");
			return;
		}
		
		
		// 引用
		var config = this;
		// 绝对坐标的rect
		var rect = this.getAbsolutePositionRect();
		var lineHeight = config.lineHeight*self.dpi;
		
		ctx.save();
		ctx.fillStyle = config.color;
		ctx.strokeStyle = config.color;
		
		// 坐标系旋转
		var absoluteAnchor = this.transformToAbsolute({x:this.anchorX,y:this.anchorY});
		ctx.translate(absoluteAnchor.x,absoluteAnchor.y);
		ctx.rotate(this.rotation*Math.PI/180);
		ctx.translate(-absoluteAnchor.x,-absoluteAnchor.y);

		// 绘制
		for(var i = 0;i<self.displayLines.length;i++){
			var x = rect.x*self.dpi;
			var y = rect.y*self.dpi + i*config.lineHeight*self.dpi;
			if(y+lineHeight>rect.y*self.dpi+rect.height*self.dpi){
				break;
			}
			ctx.fillText(self.displayLines[i],x,y);
		}
		ctx.restore();
	};
	
	
	
})(Ycc);;/**
 * @file    Ycc.UI.Rect.class.js
 * @author  xiaohei
 * @date    2017/11/17
 * @description  Ycc.UI.Rect.class文件
 */



(function (Ycc) {
	
	/**
	 * 方块
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.fill=true {boolean}	填充or描边
	 * @param option.color=black {string} 方块颜色
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.Rect = function Rect(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.Rect;
		
		/**
		 * 配置项
		 */
		// this.option = Ycc.utils.extend({
		// 	rect:null,
		// 	fill:true,
		// 	color:"black"
		// },option);
		
		this.fill = true;
		this.color = "black";
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Rect.prototype,Ycc.UI.Polygon.prototype);
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Rect.prototype.computeUIProps = function () {
		// 计算多边形坐标
		this.coordinates = this.rect.getVertices();
		// 赋值位置信息
		this.x = this.rect.x,this.y=this.rect.y;
		
		// this._setCtxProps(this);
	};
	
	
	/**
	 * 绘制
	 */
	Ycc.UI.Rect.prototype.render = function (ctx) {
		var self = this;
		ctx = ctx || self.ctxCache;
		if(!ctx){
			console.error("[Ycc error]:","ctx is null !");
			return;
		}
		
		
		ctx.save();
		ctx.fillStyle = this.color;
		ctx.strokeStyle = this.color;
		this.renderPath(ctx);
		this.fill?ctx.fill():ctx.stroke();
		ctx.restore();
	};
	
	
	
	
})(Ycc);;/**
 * @file    Ycc.UI.CropRect.class.js
 * @author  xiaohei
 * @date    2017/11/29
 * @description  Ycc.UI.CropRect.class文件
 */



(function (Ycc) {
	
	/**
	 * 裁剪框
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.fill=true {boolean}	填充or描边
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.CropRect = function CropRect(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.CropRect;
		
		/**
		 * 控制点的大小
		 * @type {number}
		 */
		this.ctrlSize = 6;
		
		/**
		 * 拖拽是否允许超出舞台
		 * @type {boolean}
		 */
		this.enableDragOut = false;
		
		/**
		 * 是否填充
		 * @type {boolean}
		 */
		this.fill = true;
		
		/**
		 * 左上角 的控制点
		 * @type {Ycc.Math.Rect}
		 */
		this.ctrlRect1 = new Ycc.Math.Rect();
		/**
		 * 右上角 的控制点
		 * @type {Ycc.Math.Rect}
		 */
		this.ctrlRect2 = new Ycc.Math.Rect();
		/**
		 * 左下角 的控制点
		 * @type {Ycc.Math.Rect}
		 */
		this.ctrlRect3 = new Ycc.Math.Rect();
		/**
		 * 右下角 的控制点
		 * @type {Ycc.Math.Rect}
		 */
		this.ctrlRect4 = new Ycc.Math.Rect();
		
		/**
		 * 选框选择后，下方按钮的配置项
		 * @type {Ycc.UI.SingleLineText[]}
		 */
		this.btns = [];
		
		/**
		 * 下方按钮的高度
		 * @type {number}
		 */
		this.btnHeight = 38;
		
		/**
		 * 下方按钮左右的间距
		 * @type {number}
		 */
		this.btnVerticalPadding = 10;
		
		/**
		 * 是否将名字显示在左上角
		 * @type {boolean}
		 */
		this.showName = true;
		
		this.extend(option);
		
		this._initUI();
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.CropRect.prototype,Ycc.UI.Polygon.prototype);
	
	
	/**
	 * 是否显示框选后的操作按钮
	 * @param show {Boolean}	`true`--显示 `false`--隐藏
	 */
	Ycc.UI.CropRect.prototype.showBtns = function (show) {
		if(this.btns.length>0){
			for(var i =0;i<this.btns.length;i++){
				if(Ycc.utils.isObj(this.btns[i])){
					this.btns[i].show = show;
				}
			}
			this.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
		}
	};
	
	/**
	 * 设置区块的操作按钮
	 * @param btns
	 */
	Ycc.UI.CropRect.prototype.setCtrlBtns = function (btns) {
		var self = this;
		// 添加文字按钮到图层
		if(btns.length!==0){
			btns.forEach(function (config) {
				// 默认参数
				config = Ycc.utils.extend({
					content:"",
					rectBgColor:"#666",
					color:"#fff",
					ontap:function () {}
				},config);
				var btn = new Ycc.UI.SingleLineText(config);
				btn.addListener("mouseover",function () {
					this.color="#ccc";
					this.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
				});
				btn.addListener("mouseout",function () {
					this.color="#fff";
					this.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
				});
				self.btns.push(btn);
				self.belongTo.addUI(btn);
			})
		}
		
	};
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 */
	Ycc.UI.CropRect.prototype.computeUIProps = function () {
		// 设置画布属性再计算，否则计算内容长度会有偏差
		this.belongTo._setCtxProps(this);
		
		var rect = this.rect;
		// 操作按钮的总长度
		var totalW = 0;
		// 循环内临时变量
		var tempW = 0;
		// 操作按钮左上角的起点坐标
		var x0 = this.rect.x;
		var y0 = this.rect.y+this.rect.height;
		// 舞台的宽高
		var stageW = this.belongTo.yccInstance.getStageWidth();
		var stageH = this.belongTo.yccInstance.getStageHeight();
		// 计算控制点的属性
		this.ctrlRect1 = (new Ycc.Math.Rect(rect.x,rect.y,this.ctrlSize,this.ctrlSize));
		this.ctrlRect2 = (new Ycc.Math.Rect(rect.x+rect.width-this.ctrlSize,rect.y,this.ctrlSize,this.ctrlSize));
		this.ctrlRect3 = (new Ycc.Math.Rect(rect.x,rect.y+rect.height-this.ctrlSize,this.ctrlSize,this.ctrlSize));
		this.ctrlRect4 = (new Ycc.Math.Rect(rect.x+rect.width-this.ctrlSize,rect.y+rect.height-this.ctrlSize,this.ctrlSize,this.ctrlSize));
	
		// 设置操作按钮的属性，并求其总长度
		if(this.btns.length===0) return;
		for(var k=0;k<this.btns.length;k++){
			var btn = this.btns[k];
			btn.overflow="auto";
			btn.xAlign="center";
			btn.rect.width=parseInt(this.ctx.measureText(btn.content).width+2*this.btnVerticalPadding);
			btn.rect.height = this.btnHeight;
			totalW += btn.rect.width+1;
		}
		// 操作按钮越界后的处理
		if(x0+totalW>stageW)
			x0 = stageW-totalW;
		if(y0+this.btnHeight>stageH){
			// 上边也放不下
			if(this.rect.y<this.btnHeight){
				y0 = 0;
			}else{
				y0 = this.rect.y-this.btnHeight-2;
			}
		}
		// 计算操作按钮的位置
		for(var i=0;i<this.btns.length;i++){
			var ui = this.btns[i];
			ui.rect.x=x0+tempW;
			ui.rect.y=y0+2;
			tempW += ui.rect.width+1;
		}
		
		// 计算多边形坐标
		this.coordinates= this.rect.getVertices();
		// 计算相对位置
		this.x=this.rect.x,this.y=this.rect.y;

	};
	
	/**
	 * 初始化UI
	 * @private
	 */
	Ycc.UI.CropRect.prototype._initUI = function () {
		var self = this;
		//拖拽开始时的坐标信息
		var startPos = null;
		//拖拽开始时的位置信息
		var startRect = null;
		
		this.userData = this.userData?this.userData:{};
		this.addListener("dragstart",function (e) {
			console.log('dragstart',e);
			// self.showBtns(false);
			// 标识第几个变换控制点
			this.userData.ctrlStart = 0;
			// 拖拽开始时选框的位置
			this.userData.dragStartPosition = new Ycc.Math.Rect(this.rect);
			// 拖拽开始时鼠标的位置
			this.userData.dragStartMousePosition = new Ycc.Math.Dot(e);
			var dot = new Ycc.Math.Dot(e);
			startPos = dot;
			startRect = new Ycc.Math.Rect(self.rect);
			for(var i=1;i<=4;i++){
				if(dot.isInRect(this["ctrlRect"+i])){
					this.userData.ctrlStart = i;
					return null;
				}
			}
		});
		
		this.addListener("dragging",function (e) {
			// 拖拽开始的起点位置
			var r = this.userData.dragStartPosition;
			// 拖拽开始时鼠标的位置
			var m = this.userData.dragStartMousePosition;
			// 选框位置信息的暂存值
			var x,y,width,height;
			// 控制点的拖拽事件
			if(this.userData.ctrlStart<=4&&this.userData.ctrlStart>=1){
				// 拖动左上角控制点
				if(this.userData.ctrlStart===1 ){
					x = e.x-(m.x-r.x);
					y = e.y-(m.y-r.y);
					width = r.width-(e.x-r.x);
					height = r.height-(e.y-r.y);
					if(x<=r.x+r.width-this.ctrlSize*2)
						this.rect.x = x;
					if(y<=r.y+r.height-this.ctrlSize*2)
						this.rect.y = y;
					
				}
				// 拖动右上角控制点
				if(this.userData.ctrlStart===2){
					x = r.x;
					y = e.y-(m.y-r.y);
					width = e.x-r.x+(r.width+r.x-m.x);
					height = r.height-(e.y-r.y);
					this.rect.x = x;
					if(y<=r.y+r.height-this.ctrlSize*2)
						this.rect.y = y;
				}
				// 拖动左下角控制点
				if(this.userData.ctrlStart===3){
					x = e.x-(m.x-r.x);
					y = r.y;
					width = r.width-(e.x-r.x);
					height = e.y - r.y + (r.height+r.y-m.y);
					if(x<=r.x+r.width-this.ctrlSize*2)
						this.rect.x = x;
					this.rect.y = y;
				}
				// 拖动右下角控制点
				if(this.userData.ctrlStart===4){
					this.rect.x = r.x;
					this.rect.y = r.y;
					this.rect.width = (e.x-r.x)+(r.x+r.width-m.x);
					this.rect.height = (e.y-r.y)+(r.y+r.height-m.y);
				}
				
				
				if(width>=this.ctrlSize*2)
					this.rect.width = width;
				if(height>=this.ctrlSize*2)
					this.rect.height = height;
				
			}else{
				// 选框的拖拽事件
				this.rect.x = startRect.x+e.x-startPos.x;
				this.rect.y = startRect.y+e.y-startPos.y;
			}
			
			// 处理选择器的最小宽度
			if(this.rect.width<=this.ctrlSize*2){
				this.rect.width = this.ctrlSize*2;
			}
			// 处理选择器的最小高度
			if(this.rect.height<=this.ctrlSize*2){
				this.rect.height = this.ctrlSize*2;
			}
			
			// 处理不允许拖拽出舞台
			if(!this.enableDragOut){
				var stageW = this.belongTo.yccInstance.getStageWidth();
				var stageH = this.belongTo.yccInstance.getStageHeight();
				if(this.rect.x<=0) this.rect.x=0;
				if(this.rect.y<=0) this.rect.y=0;
				if(this.rect.x+this.rect.width>=stageW){
					this.rect.x = stageW-this.rect.width;
				}
				if(this.rect.y+this.rect.height>=stageH){
					this.rect.y = stageH-this.rect.height;
				}
				
			}
			
			/**
			 * @todo 此处是否在UI内渲染，有待考虑
			 */
			this.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
		});
		
		this.addListener("dragend",function (e) {
			self.showBtns(true);
		});
	};
	
	/**
	 * 绘制
	 */
	Ycc.UI.CropRect.prototype.render = function () {
		
		var rect = this.rect;
		
		this.ctx.save();
		this.ctx.fillStyle = this.fillStyle;
		this.ctx.strokeStyle = this.strokeStyle;
		
		this.ctx.beginPath();
		this.ctx.rect(rect.x,rect.y,rect.width,rect.height);
		this.ctx.closePath();
		if(!this.fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		
		
		this.ctx.beginPath();
		this.ctx.rect(this.ctrlRect1.x,this.ctrlRect1.y,this.ctrlRect1.width,this.ctrlRect1.height);
		this.ctx.rect(this.ctrlRect2.x,this.ctrlRect2.y,this.ctrlRect2.width,this.ctrlRect2.height);
		this.ctx.rect(this.ctrlRect3.x,this.ctrlRect3.y,this.ctrlRect3.width,this.ctrlRect3.height);
		this.ctx.rect(this.ctrlRect4.x,this.ctrlRect4.y,this.ctrlRect4.width,this.ctrlRect4.height);
		this.ctx.closePath();
		this.ctx.fill();
		
		this.ctx.restore();
		
		// 绘制名字
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.fillStyle="blue";
		this.ctx.font="normal normal bold 14px Arial";
		this.ctx.fillText(this.name,rect.x+10,rect.y+10);
		this.ctx.closePath();
		this.ctx.restore();
		
	};
	
	
	/**
	 * 删除自身及操作按钮
	 */
	Ycc.UI.CropRect.prototype.removeSelf = function () {
		this.belongTo.removeUI(this);
		this.btns.forEach(function (t) {
			t.removeSelf();
		});
	};
	
	
	
})(Ycc);;/**
 * @file    Ycc.UI.SingleLineText.class.js
 * @author  xiaohei
 * @date    2017/11/15
 * @description  Ycc.UI.SingleLineText.class文件
 */




(function (Ycc) {
	
	/**
	 * 绘制单行文本
	 * @constructor
	 * @extends Ycc.UI.Base
	 * @param option	{object}		所有可配置的配置项
	 * @param option.content=""	{string}	内容
	 * @param option.color=black	{string}	颜色
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。位置坐标x,y为rect的x,y
	 * @param option.overflow=auto	{string}	水平方向超出rect之后的显示方式
	 * 		<br> `hidden` -- 直接隐藏
	 * 		<br> `auto`	-- 修改rect大小，完全显示
	 * @return {Ycc.UI}
	 */

	Ycc.UI.SingleLineText = function SingleLineText(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.SingleLineText;
		
		/**
		 * 区域内显示的文本
		 * @type {string}
		 */
		this.displayContent = "";
		
		/**
		 * 期望绘制的文本内容
		 * @type {string}
		 */
		this.content = "";

		/**
		 * 文字大小
		 * @type {string}
		 */
		this.fontSize = "16px";
		
		/**
		 * 文字描边or填充
		 * @type {boolean}
		 */
		this.fill = true;
		
		/**
		 * 文字颜色
		 * @type {string}
		 */
		this.color = "black";

		/**
		 * 文字在区域内x方向的排列方式。 `left` or `center`
		 * @type {string}
		 */
		this.xAlign = "left";
		
		/**
		 * 文字在区域内y方向的排列方式
		 * @type {string}
		 */
		this.yAlign = "center";
		
		/**
		 * 文字超出后的处理方式。 `auto` or `hidden`
		 * @type {string}
		 */
		this.overflow = "auto";

		this.extend(option);
	};

	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.SingleLineText.prototype,Ycc.UI.Polygon.prototype);
	Ycc.UI.SingleLineText.prototype.constructor = Ycc.UI.SingleLineText;
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.SingleLineText.prototype.computeUIProps = function () {
		var self = this;
		
		var ctx = this.ctxCache;
		var rect = this.rect;
		var x = rect.x*this.dpi;
		var y = rect.y*this.dpi;
		var width = rect.width*this.dpi;
		var height = rect.height*this.dpi;
		
		// 设置画布属性再计算，否则计算内容长度会有偏差
		this._setCtxProps(self);
		
		// 内容的长度
		var contentWidth = ctx.measureText(this.content).width;
		
		this.displayContent = this.content;
		
		// 长度超长时的处理
		/*if(contentWidth>width){
			if(this.overflow === "hidden"){
				self.displayContent = self.getMaxContentInWidth(this.content,width);
			}else if(this.overflow === "auto"){
				this.rect.width = contentWidth;
			}
		}*/
		// console.log(contentWidth,width);
		
		if(this.overflow === "hidden"){
			if(contentWidth>width)
				self.displayContent = self.getMaxContentInWidth(this.content,width);
		}else if(this.overflow === "auto"){
			if(contentWidth>width){
				this.rect.width = contentWidth/this.dpi;
			}
			if(parseInt(this.fontSize)>this.rect.height){
				this.rect.height = parseInt(this.fontSize);
			}
		}
		
		// 计算多边形坐标
		this.coordinates= this.rect.getVertices();
		// 计算相对位置
		this.x=this.rect.x,this.y=this.rect.y;
	};
	/**
	 * 渲染至离屏ctx
	 * <br> 开启离屏canvas后，此过程只会发生在离屏canvas中
	 * @param ctx
	 */
	Ycc.UI.SingleLineText.prototype.render = function (ctx) {
		var self = this;
		
		ctx = ctx||self.ctxCache;
		
		if(!ctx){
			console.error("[Ycc error]:","ctx is null !");
			return;
		}

		// 设置画布属性再计算，否则计算内容长度会有偏差
		self.belongTo._setCtxProps(self,ctx);
		
		// dpi
		var dpi = this.belongTo.yccInstance.getSystemInfo().devicePixelRatio;
		// 文字的绘制起点
		var x,y,width,height;
		// 字体大小
		var fontSize = parseInt(self.fontSize)*dpi;
		// 配置项
		var option = this;
		// 绝对坐标
		var rect = this.getAbsolutePositionRect();
		rect = new Ycc.Math.Rect(rect.x*dpi,rect.y*dpi,rect.width*dpi,rect.height*dpi);
		x = rect.x;
		
		var textWidth = ctx.measureText(this.displayContent).width;
		if(this.xAlign==="center"){
			x+=(rect.width-textWidth)/2;
		}
		if(this.xAlign==="right"){
			x+=(rect.width-textWidth);
		}
		
		y = rect.y;
		
		if(fontSize>rect.height){
			return console.warn("[Ycc warning] : ","行高不够，或者文字太大！",option);
		}
		// 上下居中
		if(option.yAlign==="center"){
			y = y+rect.height/2-fontSize/2;
		}
		
		ctx.save();
		// this.scaleAndRotate();
		// 坐标系旋转
		var absoluteAnchor = this.transformToAbsolute({x:this.anchorX,y:this.anchorY});
		ctx.translate(absoluteAnchor.x,absoluteAnchor.y);
		ctx.rotate(this.rotation*Math.PI/180);
		ctx.translate(-absoluteAnchor.x,-absoluteAnchor.y);
		
		ctx.fillStyle = option.color;
		ctx.strokeStyle = option.color;
		// this.baseUI.text([x,y],self.displayContent,option.fill);
		ctx.fillText(self.displayContent,x,y);
		ctx.restore();
		
		// console.log('缓存绘制',x,y,fontSize,textWidth);
	}
	
	
	
	
	
})(Ycc);;/**
 * @file    Ycc.UI.ScrollerRect.class.js
 * @author  xiaohei
 * @date    2019/11/19
 * @description  Ycc.UI.ScrollerRect.class文件
 * 滚动区域UI
 */



(function (Ycc) {

    /**
     * 滚动区域UI
	 * 此UI只能为顶级UI
     * @param option	            {object}		所有可配置的配置项
	 * @param option.rect	        {Ycc.Math.Rect}	容纳区。
	 * @param option.selfRender	    {Boolean}	    是否自身实时渲染
	 * @param option.contentW	    {number}	    滚动内容的宽
	 * @param option.contentH	    {number}	    滚动内容的高
     * @constructor
     * @extends Ycc.UI.Polygon
     */
    Ycc.UI.ScrollerRect = function ScrollerRect(option) {
        Ycc.UI.Polygon.call(this,option);
        this.yccClass = Ycc.UI.ScrollerRect;
	
		/**
         * 是否自身实时渲染，启用后，会实时重绘整个画布
		 * @type {boolean}
		 */
		this.selfRender = false;
	
		/**
		 * 滚动内容的宽
		 * @type {number}
		 */
		this.contentW = 0;
		
		/**
		 * 滚动内容的高
		 * @type {number}
		 */
		this.contentH = 0;
        
        this.extend(option);

		/**
		 * 此区域默认为幽灵
		 * @type {boolean}
		 */
		this.ghost = true;
	
		/**
		 * 滚动区的UI容纳区，此区域用于容纳区域内的UI，不可编辑修改属性
		 * @type {Ycc.UI.Rect}
		 * @private
		 */
		this._wrapper = null;
	
		/**
		 * 滚动区的事件容纳区，此区域用于接收舞台的事件
		 * @type {Ycc.UI.Rect}
		 * @private
		 */
		this._eventWrapper = null;
	
		/**
		 * 不阻止事件传递
		 * @type {boolean}
		 */
		this.stopEventBubbleUp = false;
	
		/**
		 * 加入舞台后的回调
		 * @override
		 * @private
		 */
		this._onAdded = function () {
			this._initWrapperRect();
			this._initEvent();
		};

		/**
		 * 所有子UI渲染完毕后，需要恢复裁剪区
		 * @private
		 */
		this._onChildrenRendered = function () {
			this.ctx.restore();
		};
		
    };
    // 继承prototype
    Ycc.utils.mergeObject(Ycc.UI.ScrollerRect.prototype,Ycc.UI.Polygon.prototype);


    /**
     * 计算UI的各种属性。此操作必须在绘制之前调用。
     * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
     * @override
     */
    Ycc.UI.ScrollerRect.prototype.computeUIProps = function () {
        // 计算多边形坐标
        this.coordinates = this.rect.getVertices();
        // 赋值位置信息
        this.x = this.rect.x,this.y=this.rect.y;

        // this._setCtxProps(this);
    };


    /**
     * 绘制
     */
    Ycc.UI.ScrollerRect.prototype.render = function (ctx) {
        var self = this;
        ctx = ctx || self.ctxCache;

        ctx.save();
        this.renderPath(ctx);
		ctx.clip();
    };
	
	
	/**
	 * 重载基类方法
	 * @param ui
	 */
	Ycc.UI.ScrollerRect.prototype.addChild = function (ui) {
		if(this.belongTo) ui.init(this.belongTo);

		// 将子UI加到容器中
		if(ui===this._wrapper||ui===this._eventWrapper)
			this.addChildTree(ui);
		else
			this._wrapper.addChildTree(ui);

		return this;
	};
	
	
	
	/**
     * 初始化
	 * @private
	 */
	Ycc.UI.ScrollerRect.prototype._initEvent = function () {
		var self = this;
		
		
		// 监听tap事件，向wrapper内部UI传递
		this._eventWrapper.addListener('tap',function (e) {
			var list = self.belongTo.getUIListFromPointer(e,{uiIsShow:true,uiIsGhost:false});
			list = list.filter(function(item){return item.show&&!item.ghost;})
			// console.log('点击的列表',list);
			if(list.length<=1) return;
			// console.log('倒数第二个',list[list.length-2]);
			// 最后一个UI为_eventWrapper自身，这里取倒数第二个触发事件，因为其层级深
			list[list.length-2].triggerUIEventBubbleUp('tap',e.x,e.y);
		});
		
		
		// 监听swipe
		var timerid = 0;
		this._eventWrapper.addListener('swipe',function (e) {
			// console.log('swipe',e);
			var dir = e.originEvent.swipeDirection;
			var dirMap = {left:-1,right:1,up:-1,down:1};
			var s = 100;
			var v0 = 30;
			var t = 10;
			
			var delta = 100;
			var t0 = 0;
			timerid = setInterval(function () {
				t0++;
				delta = v0*t0-t0*t0;
				
				if(t0 === t){
					clearInterval(timerid);
				}
				
				if(dir==='left'||dir==='right') self._wrapper.rect.x = endStatus.rect.x+(dirMap[dir])*delta;
				if(dir==='up'||dir==='down') self._wrapper.rect.y = endStatus.rect.y+(dirMap[dir])*delta;
				self._checkRangeLimit();
				if(self.selfRender) self.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
			},20);
		});
		
		
		
	    //拖动开始时UI容纳区的状态
	    var startStatus = {
	        rect:null,
            startEvent:null
        };
	    // 拖拽结束时UI容纳区的状态
		var endStatus = {
			rect:null,
			endEvent:null
		};
		this._eventWrapper.addListener('dragstart',function (e) {
			clearInterval(timerid);
			startStatus.startEvent = e;
			startStatus.rect = new Ycc.Math.Rect(self._wrapper.rect);
		});
        
        this._eventWrapper.addListener('dragging',function (e) {
			var deltaX = e.x-startStatus.startEvent.x;
			var deltaY = e.y-startStatus.startEvent.y;
			
			self._wrapper.rect.x = startStatus.rect.x+deltaX;
			self._wrapper.rect.y = startStatus.rect.y+deltaY;
			self._checkRangeLimit();
			
			
            if(self.selfRender) self.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
		});
  
		this._eventWrapper.addListener('dragend',function (e) {
			endStatus.endEvent = e;
			endStatus.rect = new Ycc.Math.Rect(self._wrapper.rect);
		});
		      

        /*this._wrapper.onrenderstart = function () {
			self.belongTo.yccInstance.ctx.save();
			self.belongTo.yccInstance.ctx.clip();
		};
        this._eventWrapper.onrenderend = function () {
			self.belongTo.yccInstance.ctx.restore();
		}*/
	};
	
	/**
	 * 创建一个容器方块
	 * @private
	 */
	Ycc.UI.ScrollerRect.prototype._initWrapperRect = function () {
		this._wrapper = new Ycc.UI.Rect({name:'滚动区UI容器',opacity:0,rect:new Ycc.Math.Rect(0,0,this.rect.width,this.rect.height),ghost:true});
		this._eventWrapper = new Ycc.UI.Rect({name:'滚动区事件容器',opacity:0,rect:new Ycc.Math.Rect(this.rect.x,this.rect.y,this.rect.width,this.rect.height),ghost:false});
		// this._wrapper.ontap = console.log;
		// this._eventWrapper.ontap = console.log;
		this.addChild(this._wrapper);
		this.belongTo.addUI(this._eventWrapper);
	};
	
	/**
	 * 容纳区极限值校正
	 * @private
	 */
	Ycc.UI.ScrollerRect.prototype._checkRangeLimit = function(){
		var self = this;
		// x、y坐标的极限值
		var maxX = self.contentW-self.rect.width;
		var maxY = self.contentH-self.rect.height;
		
		// x、y坐标不能大于0
		self._wrapper.rect.x = self._wrapper.rect.x>=0?0:self._wrapper.rect.x;
		self._wrapper.rect.y = self._wrapper.rect.y>=0?0:self._wrapper.rect.y;
		
		// x、y坐标不能小于极限值
		self._wrapper.rect.x = self._wrapper.rect.x<-maxX?-maxX:self._wrapper.rect.x;
		self._wrapper.rect.y = self._wrapper.rect.y<-maxY?-maxY:self._wrapper.rect.y;

		if(self.contentW<=self.rect.width) self._wrapper.rect.x = 0;
		if(self.contentH<=self.rect.height) self._wrapper.rect.y = 0;
	}
	
})(Ycc);;/**
 * @file    Ycc.UI.ComponentButton.class.js
 * @author  xiaohei
 * @date    2018/11/27
 * @description  Ycc.UI.ComponentButton.class文件
 */

(function (Ycc) {
	
	/**
	 * 按钮组件
	 * 组件自身也是一个UI，所以option包含ui.base的所有属性
	 * @param option					{Object}
	 * @param option.rect				{Ycc.Math.Rect}		相对于父级按钮的位置，继承于base
	 * @param option.rectBgColor		{String}			按钮区域的背景色，继承于base
	 * @param option.rectBorderWidth	{Number}			按钮区域的边框宽度，继承于base
	 * @param option.rectBorderColor	{String}			按钮区域的边框颜色，继承于base
	 * @param option.backgroundImageRes	{String}			按钮区域的图片资源
	 * @param option.text				{String}			按钮内的文字
	 * @param option.textColor			{String}			按钮内的文字的颜色
	 * @constructor
	 */
	Ycc.UI.ComponentButton = function ComponentButton(option) {
		Ycc.UI.Base.call(this,option);
		this.yccClass = Ycc.UI.ComponentButton;
		
		/**
		 * 容纳区的边框宽度
		 * @type {number}
		 */
		this.rectBorderWidth = 1;
		
		/**
		 * 容纳区边框颜色
		 * @type {string}
		 */
		this.rectBorderColor = "#000";
		
		/**
		 * 背景图资源
		 * @type {null}
		 */
		this.backgroundImageRes = null;
		
		/**
		 * 按钮内的文字
		 * @type {string}
		 */
		this.text = "";
		
		/**
		 * 按钮文字颜色
		 * @type {string}
		 */
		this.textColor = "black";
		
		/**
		 * 背景
		 * @type {null}
		 * @private
		 */
		this.__bgUI = null;
		
		/**
		 * 文字
		 * @type {null}
		 * @private
		 */
		this.__textUI = null;
		
		this.extend(option);
		
		this.__componentInit();
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.ComponentButton.prototype,Ycc.UI.Base.prototype);
	Ycc.UI.ComponentButton.prototype.constructor = Ycc.UI.ComponentButton;
	
	
	/**
	 * 组件初始化
	 * @private
	 */
	Ycc.UI.ComponentButton.prototype.__componentInit = function () {
		
		if(this.backgroundImageRes){
			this.__bgUI = new Ycc.UI.Image({
				rect:new Ycc.Math.Rect(0,0,this.rect.width,this.rect.height),
				fillMode:'scale',
				res:this.backgroundImageRes,
				stopEventBubbleUp:false
			});
			this.addChild(this.__bgUI);
		}
		if(this.text!==""){
			this.__textUI = new Ycc.UI.SingleLineText({
				rect:new Ycc.Math.Rect(0,0,this.rect.width,this.rect.height),
				content:this.text,
				color:this.textColor,
				xAlign:'center',
				stopEventBubbleUp:false
			});
			this.addChild(this.__textUI);
		}
	};
	
	
	/**
	 * 更新属性
	 */
	Ycc.UI.Base.prototype.computeUIProps = function () {
		if(this.__bgUI){
			this.__bgUI.rect.width = this.rect.width;
			this.__bgUI.rect.height = this.rect.height;
			this.__bgUI.res = this.backgroundImageRes;
		}
		if(this.__textUI){
			this.__textUI.rect.width = this.rect.width;
			this.__textUI.rect.height = this.rect.height;
			this.__textUI.content = this.text;
			this.__textUI.color = this.textColor;
		}
	};
})(Ycc);;/**
 * @file    Ycc.polyfill.wx.js
 * @author  xiaohei
 * @date    2018/11/19
 * @description  Ycc.polyfill.wx文件
 */


// 兼容微信
if("undefined"!== typeof wx){
	// Ycc.prototype.getStageWidth = function () {
	//
	// };
	
	/*Ycc.Gesture.prototype._init = function () {
		console.log('wx gesture init');
	};*/
	
	Ycc.utils.isMobile = function () {
		console.log('wx isMobile');
		return true;
	};
	
	if("undefined"!== typeof performance){
		performance.now = function () {
			return Date.now();
		};
	}
};;/**
 * @file    Ycc.polyfill.export.js
 * @author  xiaohei
 * @date    2018/12/11
 * @description  Ycc.polyfill.export文件
 *
 * 导出兼容文件，兼容npm模块的加载模式
 */


;if(typeof exports==="object"&&typeof module!=="undefined"){
	module.exports=Ycc;
}else if(typeof define==="function"){
	define("Ycc",Ycc)
}else{
	var g;
	if(typeof window!=="undefined"){g=window}
	else if(typeof global!=="undefined"){g=global}
	else if(typeof self!=="undefined"){g=self}
	else{g=this}
	g.Ycc = Ycc;
}