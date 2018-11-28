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
 * @param config.debug.drawContainer {Boolean} 是否显示所有UI的容纳区域
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
	 * @type {*|{}}
	 */
	this.config = config || {
		debug:{
			drawContainer:false
		}
	};
	
	/**
	 * 是否移动端
	 * @type {boolean}
	 */
	this.isMobile = Ycc.utils.isMobile();
	
	this.stageW = 0;
	
	this.stageH = 0;
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
	gesture.addListener('swipeleft',gestureListener);
	gesture.addListener('swiperight',gestureListener);
	gesture.addListener('swipeup',gestureListener);
	gesture.addListener('swipedown',gestureListener);
	gesture.addListener('dragstart',dragstartListener);
	gesture.addListener('dragging',draggingListener);
	gesture.addListener('dragend',dragendListener);
	
	
	function dragstartListener(e) {
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		
		var dragstartUI = self.getUIFromPointer(new Ycc.Math.Dot(x,y));
		dragstartUI&&(dragstartUIMap[e.identifier]=dragstartUI);
		// dragstartUI&&dragstartUI.belongTo.enableEventManager&&triggerUIEvent(e.type,x,y,dragstartUI);
		triggerUIEventBubbleUp(e.type,x,y,dragstartUI);
		triggerLayerEvent(e.type,x,y);
	}
	function draggingListener(e) {
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		
		var dragstartUI = dragstartUIMap[e.identifier];
		// dragstartUI&&dragstartUI.belongTo.enableEventManager&&triggerUIEvent(e.type,x,y,dragstartUI);
		triggerUIEventBubbleUp(e.type,x,y,dragstartUI);
		triggerLayerEvent(e.type,x,y);
	}
	function dragendListener(e) {
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		
		var dragstartUI = dragstartUIMap[e.identifier];
		triggerUIEventBubbleUp(e.type,x,y,dragstartUI);
		triggerLayerEvent(e.type,x,y);
		// wx端的一个bug
		if (dragstartUI){
			// dragstartUI.belongTo.enableEventManager && triggerUIEvent(e.type, x, y, dragstartUI);
			dragstartUI = null;
			dragstartUIMap[e.identifier]=null;
		}
	}
	
	// 通用监听
	function gestureListener(e) {
		// console.log(e);
		// 在canvas中的绝对位置
		var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
			y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
		
		var ui = self.getUIFromPointer(new Ycc.Math.Dot(x,y));
		// triggerLayerEvent(e.type,x,y);
		// ui&&ui.belongTo.enableEventManager&&triggerUIEvent(e.type,x,y,ui);

		triggerUIEventBubbleUp(e.type,x,y,ui);
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
	function triggerUIEventBubbleUp(type,x,y,ui) {
		if(ui && ui.belongTo.enableEventManager){
			// 触发ui的事件
			ui.triggerListener(type,new Ycc.Event({x:x,y:y,type:type,target:ui}));

			// 如果ui阻止了事件冒泡，则不触发其父级的事件
			if(ui.stopEventBubbleUp) return;
			
			// 触发父级ui的事件
			ui.getParentList().reverse().forEach(function (fa) {
				fa.triggerListener(type,new Ycc.Event({x:x,y:y,type:type,target:fa}));
			});
		}
	}
	
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

;/**
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
			new Ycc.Math.Dot(this.x,this.y+this.height)
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
	 * @param option 暂时不用
	 * @return {{each: each, leftChildFirst: leftChildFirst, rightChildFirst: rightChildFirst, depthDown: depthDown}}
	 */
	Ycc.Tree.prototype.itor = function (option) {
		var self = this;

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
		 * @return {boolean}
		 */
		function depthDownByNodes(nodes,cb,layer){
			if(nodes.length===0)
				return true;
			layer=layer||0;
			layer++;
			var nextNodes = [];
			// 是否停止遍历下一层的标志位
			var breakFlag = false;
			for(var i=0;i<nodes.length;i++) {
				// 如果返回为true，则表示停止遍历下一层
				if (cb.call(self, nodes[i], layer)) {
					breakFlag = true;
					break;
				}
				nextNodes = nextNodes.concat(nodes[i].children);
			}
			if(breakFlag){
				nextNodes = [];
			}
			return depthDownByNodes(nextNodes,cb,layer);
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
	 * @param json{data,children} {object} json对象
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
	 * @param vArr {[{id,data,...}]} 顶点列表
	 * @param eArr {[{fromId,toId,data,...}]}	边列表
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
	 * @param vArr {[{id,data,...}]} 顶点列表
	 * @param eArr {[{ids,data,...}]}	边列表，ids为边关联的两个顶点id列表，长度为2
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
		 * 所有帧时间差的总和
		 * @type {number}
		 */
		this.deltaTimeTotalValue = 0;
		
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
	 */
	Ycc.Ticker.prototype.start = function (frameRate) {
		var self = this;
		if(self._isRunning){
			return;
		}
		
		// 正常设置的帧率
		frameRate = frameRate?frameRate:self.defaultFrameRate;
		
		// 每帧理论的间隔时间
		self.deltaTimeExpect = 1000/frameRate;
		
		var timer = requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || oRequestAnimationFrame || msRequestAnimationFrame;
		
		// 初始帧数量设为0
		self.frameAllCount = 0;

		// timer兼容
		timer || (timer = function(e) {
				return setTimeout(e, 1e3 / 60);
			}
		);
		// 启动时间
		self.startTime = performance.now();
		// 启动心跳
		// self._timerId = timer.call(window, cb);
		self._timerId = timer(cb);
		self._isRunning = true;
		
		
		// 心跳回调函数。约60fps
		function cb() {
			
			// 当前时间
			var curTime = self.timerTickCount===0?self.startTime:performance.now();

			// 总的心跳数加1
			self.timerTickCount++;

			// 总的心跳时间
			var tickTime = curTime - self.startTime;
			
			// 所有帧刷新总时间，理论值
			var frameTime = self.frameAllCount * self.deltaTimeExpect;

			// 当总帧数*每帧的理论时间小于总心跳时间，触发帧的回调
			if(tickTime > frameTime || "undefined"!==typeof wx){
				// 总帧数加1
				self.frameAllCount++;
				// 执行所有自定义的帧监听函数
				self.broadcastFrameEvent();
				// 执行所有图层的帧监听函数
				self.broadcastToLayer();
				// 两帧的时间差
				self.deltaTime = performance.now()-self.lastFrameTime;
				// 帧间隔缩放比
				self.deltaTimeRatio = self.deltaTime/self.deltaTimeExpect;
				// 帧时间差的总和（忽略第一帧）
				self.frameAllCount>1&&(self.deltaTimeTotalValue +=self.deltaTime);
				
				if(self.deltaTime/self.deltaTimeExpect>3){
					console.warn("第%d帧：",self.frameAllCount);
					console.warn("该帧率已低于正常值的1/3！若相邻帧持续警告，请适当降低帧率，或者提升刷新效率！","正常值：",frameRate," 当前值：",1000/self.deltaTime);
				}
				// 设置上一帧刷新时间
				self.lastFrameTime += self.deltaTime;
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
		 * 调试面板所显示的字段
		 * @type {Array[]}
		 * {name,cb,ui}
		 */
		this.fields = [];
		
		/**
		 * 调试面板的容纳区
		 * @type {Ycc.UI.Rect}
		 */
		this.rect = new Ycc.UI.Rect({
			name:'debuggerRect',
			rect:new Ycc.Math.Rect(10,10,200,140),
			color:'rgba(255,255,0,0.5)'
		});
		
		/**
		 * 调试面板的图层
		 */
		this.layer = yccInstance.layerManager.newLayer({
			name:"debug图层"
		});
		
		
		this.init();
	};
	
	
	Ycc.Debugger.prototype.init = function () {
		var self = this;
		this.yccInstance.ticker.addFrameListener(function () {
			self.updateInfo();
		});
	};
	
	/**
	 * 显示调试面板
	 */
	Ycc.Debugger.prototype.showDebugPanel = function () {
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
	 * @param [resArr.name] 	资源名称，方便查找
	 * @param resArr.url  		资源的url
	 * @param [resArr.type]  	资源类型 image,audio，默认为image
	 * @param [resArr.res]  	资源加载完成后，附加给该字段
	 * @param endCb				资源加载结束的回调
	 * @param [progressCb]		资源加载进度的回调
	 * @param [endResArr] 		用于存储加载已结束的音频，一般不用传值
	 * @param [endResMap] 		用于存储加载已结束的音频map，一般不用传值。注：map的key是根据name字段生成的
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
			}
			if(curRes.type==='audio'){
				successEvent = 'loadedmetadata';
				curRes.res = new Audio();
				curRes.res.src = curRes.url;
				curRes.res.preload = "load";
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

		if(curRes.type==='image'){
			curRes.res = new Image();
			curRes.res.src = self.basePath + curRes.url;

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
				curRes.res.src = self.basePath + curRes.url;
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
			console.log(self.basePath + curRes.url);
			self.ajax.get(self.basePath + curRes.url,(function (curRes) {
				return function (arrayBuffer) {
					curRes.res.context.decodeAudioData(arrayBuffer, function(buf) {
						curRes.res.buf=buf;
						onSuccess();
					}, onError);
				}
			})(curRes),onError,'arraybuffer');
		}
		
		
		
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
	AudioPolyfill.prototype.context = ("undefined"!==typeof AudioContext || "undefined"!==typeof webkitAudioContext) && new (AudioContext || webkitAudioContext)();
	
	
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
					console.log('swipe');
					var firstMove = life.startTouchEvent;
					var lastMove = Array.prototype.slice.call(life.moveTouchEventList,-1)[0];
					if(Math.abs(lastMove.pageX-firstMove.pageX)>30 || Math.abs(lastMove.pageY-firstMove.pageY)>30){
						var type = 'swipe'+self._getSwipeDirection(firstMove.pageX,firstMove.pageY,lastMove.pageX,lastMove.pageY);
						self.triggerListener('log',type);
						self.triggerListener(type,self._createEventData(life.endTouchEvent,type));
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
			// console.log(e.type,'...');
			
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
						var type = 'swipe'+self._getSwipeDirection(mouseDownEvent.pageX,mouseDownEvent.pageY,mouseUpEvent.pageX,mouseUpEvent.pageY);
						console.log('swipe',type);
						self.triggerListener('log',type);
						self.triggerListener(type,self._createEventData(mouseDownEvent,type));
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
					preLife = null;
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
		 * ycc实例的引用
		 */
		this.yccInstance = yccInstance;
		
		/**
		 * 当前图层的绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = null;
		
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
	 */
	Ycc.Layer.prototype._setCtxProps = function (props) {
		var self = this;
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
		
		ctxConfig.font = [ctxConfig.fontStyle,ctxConfig.fontVariant,ctxConfig.fontWeight,ctxConfig.fontSize,ctxConfig.fontFamily].join(" ");
		for(var key in ctxConfig){
			if(!ctxConfig.hasOwnProperty(key)) continue;
			self.ctx[key] = ctxConfig[key];
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
		if(!beforeUI)
			return this.uiList.push(ui);
		var index = this.uiList.indexOf(beforeUI);
		if(index===-1)
			return this.uiList.push(ui);
		this.uiList.splice(index,0,ui);
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
		return true;
	};
	
	/**
	 * 渲染Layer。
	 * <br>注意：并没有渲染至舞台。
	 */
	Ycc.Layer.prototype.render = function () {
		for(var i=0;i<this.uiList.length;i++){
			if(!this.uiList[i].show) continue;
			this.uiList[i].render();
		}
	};
	
	/**
	 * 重绘图层。
	 * <br>注意：并没有渲染至舞台。
	 */
	Ycc.Layer.prototype.reRender = function () {
		// this.clear();
		var self = this;
		self.uiCountRecursion=0;
		for(var i=0;i<this.uiList.length;i++){
			if(!this.uiList[i].show) continue;
			//this.uiList[i].__render();
			// 按树的层次向下渲染
			this.uiList[i].itor().depthDown(function (ui, level) {
				//console.log(level,ui);
				self.uiCountRecursion++;
				if(ui.show)
					ui.__render();
			});
		}
		// 兼容wx端，wx端多一个draw API
		self.ctx.draw && self.ctx.draw();
	};
	
	/**
	 * 获取图层中某个点所对应的最上层UI，最上层UI根据右子树优先遍历。
	 * @param dot {Ycc.Math.Dot}	点坐标，为舞台的绝对坐标
	 * @param uiIsShow {Boolean}	是否只获取显示在舞台上的UI，默认为true
	 * @return {UI}
	 */
	Ycc.Layer.prototype.getUIFromPointer = function (dot,uiIsShow) {
		uiIsShow = Ycc.utils.isBoolean(uiIsShow)?uiIsShow:true;
		var self = this;
		var temp = null;
		for(var i =self.uiList.length-1;i>=0;i--){
			var ui = self.uiList[i];
			if(uiIsShow&&!ui.show) continue;
			// 右子树优先寻找
			ui.itor().rightChildFirst(function (child) {
				// 跳过不可见的UI
				if(uiIsShow&&!child.show) return false;
				
				// 如果位于rect内，此处根据绝对坐标比较
				if(dot.isInRect(child.getAbsolutePosition())){
					temp = child;
					return true;
				}
			});
		}
		return temp;
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
	 */
	Ycc.LayerManager.prototype.reRenderAllLayerToStage = function () {
		var t1 = Date.now();
		this.renderUiCount = 0;
		this.yccInstance.clearStage();
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			// 该图层是否可见
			if(!layer.show) continue;
			layer.reRender();
			this.renderUiCount+=layer.uiCountRecursion;
		}

		this.renderTime = Date.now()-t1;
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
	 * @param jsonArray {[{option,ui[]}]}
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
		 * 默认情况下，UI阻止事件冒泡，但不会阻止事件传播给图层
		 * @type {boolean}
		 */
		this.stopEventBubbleUp = true;
		
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
		Ycc.utils.isFn(this.beforeInit) && this.beforeInit();
		this.belongTo = layer;
		this.ctx = layer.ctx;

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
	 * 渲染容纳区rect的背景色
	 * @param absoluteRect	{Ycc.Math.Rect}	容纳区的绝对位置
	 */
	Ycc.UI.Base.prototype.renderRectBgColor = function (absoluteRect) {
		var rect = absoluteRect;
		this.ctx.save();
		this.ctx.fillStyle = this.rectBgColor;
		this.ctx.beginPath();
		this.ctx.rect(rect.x,rect.y,rect.width,rect.height);
		this.ctx.closePath();
		this.ctx.fill();
		this.ctx.restore();
		rect = null;
	};
	
	/**
	 * 渲染容纳区rect的边框
	 * @param absoluteRect	{Ycc.Math.Rect}	容纳区的绝对位置
	 */
	Ycc.UI.Base.prototype.renderRectBorder = function (absoluteRect) {
		// 边框宽度为0，不渲染
		if(this.rectBorderWidth<=0) return;

		var rect = absoluteRect;
		this.ctx.save();
		this.ctx.strokeStyle = this.rectBorderColor;
		this.ctx.strokeWidth = this.rectBorderWidth;
		this.ctx.beginPath();
		this.ctx.rect(rect.x,rect.y,rect.width,rect.height);
		this.ctx.closePath();
		this.ctx.stroke();
		this.ctx.restore();
		rect = null;
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
	 */
	Ycc.UI.Base.prototype.scaleAndRotate = function () {
		// 坐标系缩放
		this.ctx.scale(this.scaleX,this.scaleY);
		var rect = this.getAbsolutePosition();
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
		var absolute = this.getAbsolutePosition();
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
			ui.beforeInit = null;
			
			/**
			 * 初始化之后的hook
			 * @type {function}
			 */
			ui.afterInit = null;
			
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
	 * @param [ctx]	绘图环境。可选
	 * @override
	 */
	Ycc.UI.Base.prototype.render = function (ctx) {
	
	};
	
	/**
	 * 绘制UI的容器（红色小方框）
	 * @private
	 */
	Ycc.UI.Base.prototype._renderContainer = function () {
		var rect = this.rect;
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.strokeStyle = "#ff0000";
		this.ctx.rect(rect.x,rect.y,rect.width,rect.height);
		this.ctx.closePath();
		this.ctx.stroke();
		this.ctx.restore();
	};
	
	/**
	 * 渲染统一调用的入口，供图层统一调用。
	 * 新增渲染过程中的hook函数。
	 * 此方法不允许重载、覆盖
	 * @param [ctx]	绘图环境。可选
	 * @private
	 */
	Ycc.UI.Base.prototype.__render = function (ctx) {
		this.triggerListener('computestart',new Ycc.Event("computestart"));
		this.computeUIProps();
		this.triggerListener('computeend',new Ycc.Event("computeend"));
		// 超出舞台时，不予渲染
		if(this.isOutOfStage())
			return;
		var absolutePosition = this.getAbsolutePosition();
		// 绘制UI的背景，rectBgColor
		this.renderRectBgColor(absolutePosition);
		// 绘制容纳区的边框
		this.renderRectBorder(absolutePosition);
		
		// 全局UI配置项，是否绘制UI的容器
		if(this.belongTo.yccInstance.config.debug.drawContainer){
			this._renderContainer();
		}
		
		
		
		
		this.triggerListener('renderstart',new Ycc.Event("renderstart"));
		this.render(ctx);
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
	 * 根据图层坐标和UI位置坐标，将UI内某个点的相对坐标（相对于UI），转换为舞台的绝对坐标
	 * @todo 所有UI类render的时候都应该加上这个转换
	 * @param dotOrArr {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 * @return {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 */
	Ycc.UI.Base.prototype.transformToAbsolute = function (dotOrArr) {
		var res = null;
		var absoluteRect = this.getAbsolutePosition();
		
		if(Ycc.utils.isArray(dotOrArr)){
			res = [];
			for(var i=0;i<dotOrArr.length;i++){
				var resDot = new Ycc.Math.Dot(0,0);
				var dot = dotOrArr[i];
				resDot.x=absoluteRect.x+dot.x;
				resDot.y=absoluteRect.y+dot.y;
				res.push(resDot);
			}
			return res;
		}
		res = new Ycc.Math.Dot(0,0);
		res.x = absoluteRect.x+dotOrArr.x;
		res.y = absoluteRect.y+dotOrArr.y;
		return res;
	};
	
	/**
	 * 根据图层坐标和UI位置坐标，将某个点的绝对坐标，转换为相对于UI的相对坐标
	 * @param dotOrArr {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 * @return {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 */
	Ycc.UI.Base.prototype.transformToLocal = function (dotOrArr) {
		var res = null;
		var absoluteRect = this.getAbsolutePosition();
		if(Ycc.utils.isArray(dotOrArr)){
			res = [];
			for(var i=0;i<dotOrArr.length;i++){
				var resDot = new Ycc.Math.Dot(0,0);
				var dot = dotOrArr[i];
				resDot.x=dot.x-(absoluteRect.x);
				resDot.y=dot.y-(absoluteRect.y);
				res.push(resDot);
			}
			return res;
		}
		res = new Ycc.Math.Dot(0,0);
		res.x = dotOrArr.x-(absoluteRect.x);
		res.y = dotOrArr.y-(absoluteRect.y);
		return res;
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
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Ellipse = function Ellipse(option) {
		Ycc.UI.Base.call(this,option);
		this.yccClass = Ycc.UI.Ellipse;
		
		this.point = new Ycc.Math.Dot();
		this.width = 20;
		this.height = 10;
		this.angle = 0;
		
		// centrePoint,width,height,rotateAngle,fill
		
		this.color = "black";
		this.fill = false;
		
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Ellipse.prototype,Ycc.UI.Base.prototype);
	Ycc.UI.Ellipse.prototype.constructor = Ycc.UI.Ellipse;
	
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 * @todo 计算容纳区域
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
	};
	
	
	
	/**
	 * 绘制
	 */
	Ycc.UI.Ellipse.prototype.render = function () {
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
		// 默认旋转中心位于画布左上角，需要改变旋转中心点
		this.ctx.translate(point.x,point.y);
		this.ctx.rotate(parseInt(rotateAngle)*Math.PI/180);
		// 再变换回原来的旋转中心点
		this.ctx.translate(-point.x,-point.y);
		// this.ctx.scale(1, 1);
		this.ctx.scale(ratioX, ratioY);
		this.ctx.beginPath();
		this.ctx.arc(point.x / ratioX,  point.y/ ratioY, r/2, 0, 2 * Math.PI, false);
		this.ctx.closePath();
		
		this.ctx.fillStyle = this.ctx.strokeStyle = this.color;
		if(!this.fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		
		this.ctx.restore();
	};
	
	
	
	
	
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
	 * @param option.point {Ycc.Math.Dot} 圆心位置
	 * @param option.r=10 {number} 圆的半径
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Circle = function Circle(option) {
		Ycc.UI.Base.call(this,option);
		this.yccClass = Ycc.UI.Circle;
		
		this.point = null;
		this.r = 10;
		this.color = "black";
		this.fill = true;
		
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Circle.prototype,Ycc.UI.Base.prototype);
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Circle.prototype.computeUIProps = function () {
		var x=this.point.x,
			y=this.point.y,
			r=this.r;
		this.rect = new Ycc.Math.Rect(x-r,y-r,2*r,2*r);
	};
	
	
	/**
	 * 绘制
	 */
	Ycc.UI.Circle.prototype.render = function () {
		
		var pa = this.getParent();
		var point = pa?pa.transformToAbsolute(this.point):this.point;
		
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.fillStyle = this.color;
		this.ctx.strokeStyle = this.color;
		
		this.ctx.arc(
			point.x,
			point.y,
			this.r,
			0,
			2*Math.PI
		);
		
		this.ctx.closePath();
		if(!this.fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		this.ctx.restore();
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
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Image = function Image(option) {
		Ycc.UI.Base.call(this,option);
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
	Ycc.utils.mergeObject(Ycc.UI.Image.prototype,Ycc.UI.Base.prototype);
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
	};
	
	/**
	 * 处理镜像
	 * @param rect {Ycc.Math.Rect} 计算之后的图片容纳区
	 * @private
	 */
	Ycc.UI.Image.prototype._processMirror = function (rect) {
		if(this.mirror===1){
			this.ctx.scale(-1, 1);
			this.ctx.translate(-rect.x*2-rect.width,0);
		}
		if(this.mirror===2){
			this.ctx.scale(1, -1);
			this.ctx.translate(0,-rect.y*2-rect.height);
		}
		if(this.mirror===3){
			this.ctx.scale(-1, -1);
			this.ctx.translate(-rect.x*2-rect.width,-rect.y*2-rect.height);
		}
		
	};
	
	/**
	 * 绘制
	 */
	Ycc.UI.Image.prototype.render = function () {
		this.ctx.save();
		this.scaleAndRotate();
		
		var rect = this.getAbsolutePosition();//this.rect;
		var img = this.res;
		// 局部变量
		var i,j,wCount,hCount,xRest,yRest;
		
		this._processMirror(rect);
		if(this.fillMode === "none")
			this.ctx.drawImage(this.res,0,0,rect.width,rect.height,rect.x,rect.y,rect.width,rect.height);
		else if(this.fillMode === "scale")
			this.ctx.drawImage(this.res,0,0,img.width,img.height,rect.x,rect.y,rect.width,rect.height);
		else if(this.fillMode === "auto"){
			this.ctx.drawImage(this.res,0,0,img.width,img.height,rect.x,rect.y,rect.width,rect.height);
		}else if(this.fillMode === "repeat"){
			// x,y方向能容纳的img个数
			wCount = parseInt(rect.width/img.width)+1;
			hCount = parseInt(rect.height/img.height)+1;

			for(i=0;i<wCount;i++){
				for(j=0;j<hCount;j++){
					xRest = img.width;
					yRest = img.height;
					if(i===wCount-1)
						xRest = rect.width-i*img.width;
					if(j===hCount-1)
						yRest = rect.height-j*img.height;
					this.ctx.drawImage(this.res,
						0,0,
						xRest,yRest,
						rect.x+img.width*i,rect.y+img.height*j,
						xRest,yRest);
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
						rect.x+this.scaleRepeatRect.width*i,rect.y+this.scaleRepeatRect.height*j,
						xRest,yRest);
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
				this.ctx.drawImage(this.res,
					// 源
					src.x,src.y,src.width,src.height,
					// 目标
					dest.x,dest.y,dest.width,dest.height
				);
				
			}
			
		}
		this.ctx.restore();
		
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
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.ImageFrameAnimation = function ImageFrameAnimation(option) {
		Ycc.UI.Base.call(this,option);
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
	Ycc.utils.mergeObject(Ycc.UI.ImageFrameAnimation.prototype,Ycc.UI.Base.prototype);
	Ycc.UI.ImageFrameAnimation.prototype.constructor = Ycc.UI.ImageFrameAnimation;
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.ImageFrameAnimation.prototype.computeUIProps = function () {
	
	};
	
	/**
	 * 处理镜像
	 * @param rect {Ycc.Math.Rect} 计算之后的图片容纳区
	 * @private
	 */
	Ycc.UI.ImageFrameAnimation.prototype._processMirror = function (rect) {
		if(this.mirror===1){
			this.ctx.scale(-1, 1);
			this.ctx.translate(-rect.x*2-rect.width,0);
		}
		if(this.mirror===2){
			this.ctx.scale(1, -1);
			this.ctx.translate(0,-rect.y*2-rect.height);
		}
		if(this.mirror===3){
			this.ctx.scale(-1, -1);
			this.ctx.translate(-rect.x*2-rect.width,-rect.y*2-rect.height);
		}
		
	};
	
	/**
	 * 绘制
	 */
	Ycc.UI.ImageFrameAnimation.prototype.render = function () {
		
		// 绝对坐标
		var rect = this.getAbsolutePosition();
		// 获取当前显示第几个序列图，由于默认播放第一帧图片，这里直接渲染第二帧图片
		var index = parseInt((this.belongTo.yccInstance.ticker.frameAllCount-this.startFrameCount)/this.frameSpace)%this.frameRectCount+1;
		// 若没开始播放，默认只绘制第一个序列帧
		if(!this.isRunning || index>=this.frameRectCount)
			index=0;
		// 绘制
		this.ctx.save();
		this.scaleAndRotate();

		// 处理镜像属性
		this._processMirror(rect);

		this.ctx.drawImage(this.res,
			this.firstFrameRect.x+this.firstFrameRect.width*index,this.firstFrameRect.y,this.firstFrameRect.width,this.firstFrameRect.height,
			rect.x,rect.y,rect.width,rect.height);
		this.ctx.restore();
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
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Line = function Line(option) {
		Ycc.UI.Base.call(this,option);
		this.yccClass = Ycc.UI.Line;
		
		this.start = new Ycc.Math.Dot(0,0);
		this.end = new Ycc.Math.Dot(0,0);
		this.width = 1;
		this.color = "black";
		
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Line.prototype,Ycc.UI.Base.prototype);
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
	};
	/**
	 * 绘制
	 */
	Ycc.UI.Line.prototype.render = function () {
		
		var pa = this.getParent();
		var start = pa?pa.transformToAbsolute(this.start):this.start;
		var end = pa?pa.transformToAbsolute(this.end):this.end;
		this.ctx.save();
		this.ctx.strokeStyle = this.color;
		this.ctx.strokeWidth = this.width;
		
		this.ctx.beginPath();
		this.ctx.moveTo(start.x, start.y);
		this.ctx.lineTo(end.x, end.y);
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
	};
	
	
	
	
	
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
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.BrokenLine = function BrokenLine(option) {
		Ycc.UI.Base.call(this,option);

		this.yccClass = Ycc.UI.BrokenLine;
		
		this.pointList = [];
		this.width = 1;
		this.color = "black";
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.BrokenLine.prototype,Ycc.UI.Base.prototype);
	
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
		var pointList = pa?pa.transformToAbsolute(this.pointList):this.pointList;
		this.ctx.moveTo(pointList[0].x, pointList[0].y);
		for(var i =1;i<pointList.length;i++){
			this.ctx.lineTo(pointList[i].x, pointList[i].y);
		}
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
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
		Ycc.UI.Base.call(this,option);
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
	Ycc.utils.mergeObject(Ycc.UI.MultiLineText.prototype,Ycc.UI.Base.prototype);
	Ycc.UI.MultiLineText.prototype.constructor = Ycc.UI.MultiLineText;
	
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.MultiLineText.prototype.computeUIProps = function () {
		var self = this;
		var config = this;
		// 文本行
		var lines = this.content.split(/(?:\r\n|\r|\n)/);
		// 待显示的文本行
		this.displayLines = getRenderLines();
		if(config.overflow === "auto"){
			config.rect.height = config.lineHeight*this.displayLines.length;
		}
		
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
					var lineW = self.ctx.measureText(line).width;
					// 若没有超长
					if(lineW<=config.rect.width){
						subLines.push(line);
						return subLines;
					}
					
					for(var j=0;j<line.length;j++){
						var part = line.slice(0,j+1);
						var partW = self.ctx.measureText(part).width;
						if(partW>config.rect.width){
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
					var lineW = self.ctx.measureText(line).width;
					// 若没有超长
					if(lineW<=config.rect.width){
						subLines.push(line);
						return subLines;
					}
					// 记录最后一次空格出现的位置
					var spacePosition = 0;
					for(var j=0;j<line.length;j++){
						var part = line.slice(0,j+1);
						var partW = self.ctx.measureText(part).width;
						var curChar = line[j];
						if(curChar===" ")
							spacePosition = j;
						if(partW>config.rect.width){
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
		
		self.ctx = ctx || self.ctx;
		
		if(!self.ctx){
			console.error("[Ycc error]:","ctx is null !");
			return;
		}
		
		
		// 引用
		var config = this;
		// 绝对坐标的rect
		var rect = this.getAbsolutePosition();
		
		this.ctx.save();
		this.ctx.fillStyle = config.color;
		this.ctx.strokeStyle = config.color;
		
		// 绘制
		for(var i = 0;i<self.displayLines.length;i++){
			var x = rect.x;
			var y = rect.y + i*config.lineHeight;
			if(y+config.lineHeight>rect.y+rect.height){
				break;
			}
			this.belongTo.yccInstance.baseUI.text([x,y],self.displayLines[i],config.fill);
		}
		this.ctx.restore();
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
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Rect = function Rect(option) {
		Ycc.UI.Base.call(this,option);
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
	Ycc.utils.mergeObject(Ycc.UI.Rect.prototype,Ycc.UI.Base.prototype);
	
	/**
	 * 绘制
	 */
	Ycc.UI.Rect.prototype.render = function () {
		
		var rect = this.getAbsolutePosition();

		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.fillStyle = this.color;
		this.ctx.strokeStyle = this.color;
		this.ctx.rect(rect.x,rect.y,rect.width,rect.height);
		this.ctx.closePath();
		if(!this.fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		this.ctx.restore();
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
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.CropRect = function CropRect(option) {
		Ycc.UI.Base.call(this,option);
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
	Ycc.utils.mergeObject(Ycc.UI.CropRect.prototype,Ycc.UI.Base.prototype);
	
	
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
					onclick:function () {}
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
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.overflow=auto	{string}	水平方向超出rect之后的显示方式
	 * 		<br> `hidden` -- 直接隐藏
	 * 		<br> `auto`	-- 修改rect大小，完全显示
	 * @return {Ycc.UI}
	 */

	Ycc.UI.SingleLineText = function SingleLineText(option) {
		Ycc.UI.Base.call(this,option);
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
	Ycc.utils.mergeObject(Ycc.UI.SingleLineText.prototype,Ycc.UI.Base.prototype);
	Ycc.UI.SingleLineText.prototype.constructor = Ycc.UI.SingleLineText;
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.SingleLineText.prototype.computeUIProps = function () {
		var self = this;
		
		// 设置画布属性再计算，否则计算内容长度会有偏差
		self.belongTo._setCtxProps(self);
		
		// 内容的长度
		var contentWidth = this.ctx.measureText(this.content).width;
		
		this.displayContent = this.content;
		
		// 长度超长时的处理
		if(contentWidth>this.rect.width){
			if(this.overflow === "hidden"){
				self.displayContent = self.getMaxContentInWidth(this.content,this.rect.width);
			}else if(this.overflow === "auto"){
				this.rect.width = contentWidth;
			}
		}
		
		if(this.overflow === "hidden"){
			if(contentWidth>this.rect.width)
				self.displayContent = self.getMaxContentInWidth(this.content,this.rect.width);
		}else if(this.overflow === "auto"){
			if(contentWidth>this.rect.width){
				this.rect.width = contentWidth;
			}
			if(parseInt(this.fontSize)>this.rect.height){
				this.rect.height = parseInt(this.fontSize);
			}
			
		}
	};
	/**
	 * 渲染至ctx
	 * @param ctx
	 */
	Ycc.UI.SingleLineText.prototype.render = function (ctx) {
		var self = this;
		
		// 设置画布属性再计算，否则计算内容长度会有偏差
		self.belongTo._setCtxProps(self);

		self.ctx = ctx || self.ctx;
		
		if(!self.ctx){
			console.error("[Ycc error]:","ctx is null !");
			return;
		}
		
		
		
		// 文字的绘制起点
		var x,y;
		// 字体大小
		var fontSize = parseInt(self.fontSize);
		// 配置项
		var option = this;
		// 绝对坐标
		var rect = this.getAbsolutePosition();
		x = rect.x;
		
		var textWidth = this.ctx.measureText(this.displayContent).width;
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
		
		this.ctx.save();
		this.ctx.fillStyle = option.color;
		this.ctx.strokeStyle = option.color;
		// this.baseUI.text([x,y],self.displayContent,option.fill);
		this.ctx.fillText(self.displayContent,x,y);
		this.ctx.restore();
	};
	
	
	
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
			this.addChild(new Ycc.UI.Image({
				rect:new Ycc.Math.Rect(0,0,this.rect.width,this.rect.height),
				fillMode:'scale',
				res:this.backgroundImageRes
			}));
		}
		if(this.text!==""){
			this.addChild(new Ycc.UI.SingleLineText({
				rect:new Ycc.Math.Rect(0,0,this.rect.width,this.rect.height),
				content:this.text,
				color:this.textColor,
				xAlign:'center',
				ontap:function (e) {
					console.log(e);
				}
			}));
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
	module.exports = Ycc;
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
 * @file    Loading.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  Loading文件
 */

function Loading(){
	/**
	 * 正在加载下方的进度
	 * @type {string}
	 */
	this.textUI = new Ycc.UI.SingleLineText({
		content:'',
		fontSize:'12px',
		rect:new Ycc.Math.Rect(0,stageH/2+20,stageW,20),
		xAlign:"center",
		color:'red'
	});
	
	this.layer = ycc.layerManager.newLayer();
	
	this.layer.addUI(new Ycc.UI.Rect({
		rect:new Ycc.Math.Rect(0,0,stageW,stageH),
		color:"gray"
	}));
	this.layer.addUI(new Ycc.UI.SingleLineText({
		content:"正在加载...",
		rect:new Ycc.Math.Rect(0,stageH/2,stageW,20),
		xAlign:"center",
		color:'red'
	}));
	this.layer.addUI(this.textUI);
	
	this.hidden = function(){
		this.layer.show = false;
	};
	
	this.show = function(){
		this.layer.show = true;
	};
	
	this.updateText = function (text) {
		this.textUI.content = text;
		ycc.layerManager.reRenderAllLayerToStage();
	};
};/**
 * @file    GameScene.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  GameScene文件
 */

/**
 * 游戏场景的构造器
 * @param levelName	关卡名
 * @constructor
 */
function GameScene(levelName){
	
	// 游戏进行中的图层
	this.layer = ycc.layerManager.newLayer({enableEventManager:true,name:'场景图层'});
	
	// 放置按钮的图层
	this.btnLayer = ycc.layerManager.newLayer({enableEventManager:true,name:"按钮图层"});

	// 游戏结束图层
	this.gameOverLayer = null;
	
	// mario的UI
	this.mario = null;
	
	// 终点的x坐标、通过newFlag自动赋值
	this.endPoint = 0;

    // 右上角金币UI
    this.coinUI = null;
    
    // 音乐按钮
    this.musicBtn = null;

    // 分数
    this.score = 0;
	
	// matter引擎
	this.engine = null;
	
	// 人脸方向
	this.direction = '';

    // 方向键下 是否正在按住
    this.downIsPressing = false;

    // 人物从下蹲起身的标志位
    this.downTouchEndFlag = false;

    // 跳跃键 是否正在按住
    this.jumpIsPressing = false;

	// 物理引擎中的物体
	this.bodies = null;
	
	// 人物正在接触的物体数组
	this.marioContactWith = [];
	
	// 人物是否正站立在墙体上
	this.marioStayingOnWall = false;
	
	// 游戏是否胜利、接触旗子就表示游戏胜利
	this.isGameVictory = false;
	
	// 当前游戏关卡
	this.gameLevel = (location.hash || levelName ||'#1_1').slice(1);
	
	// 通关时的桶，默认的通关效果
	this.endBucket = null;

	this.init();
	
}

// 初始化
GameScene.prototype.init = function () {

	// 通过关卡创建当前关卡的UI及其场景
	this['level_'+this.gameLevel] && this['level_'+this.gameLevel]();
	
	this.collisionListenerInit();
	if(bgmAutoplay){
		audios.bgm.currentTime=0;
		audios.bgm.play();
	}
};




/**
 * 将matter的刚体绑定至UI
 * @param body matter刚体
 * @param ui
 */
GameScene.prototype.bindMatterBodyWithUI = function (body,ui) {
	ui._matterBody = body;
	body._yccUI = ui;
};

/**
 * 获取与ui绑定的matter刚体
 * @param ui
 */
GameScene.prototype.getMatterBodyFromUI = function (ui) {
	return ui._matterBody;
};

/**
 * 获取与matter刚体绑定的ui
 * @param body
 * @return {*}
 */
GameScene.prototype.getUIFromMatterBody = function (body) {
	return body._yccUI;
};

/**
 * 关卡公共的设置
 * @param bgName
 * @param bgRepeatType
 * @param bgWidth
 */
GameScene.prototype.levelCommonSetting = function (bgName,bgRepeatType,bgWidth) {
	bgName = bgName || 'bg01';
	bgRepeatType = bgRepeatType || 2;
	bgWidth = bgWidth || 9999;
	// 游戏背景图
	this.createBackground(bgName,bgWidth,stageH,bgRepeatType);
	
	// 游戏接触的弹出图层
	this.createGameOverLayer();
	
	// 方向键
	this.createDirectionBtn();
	
	// 技能键
	this.createSkillBtn();
	
	// 右上角的金币计数
	this.createCoinUI();
	
	// 最下方的死亡线，即Mario最低能降落到多少，超出即认为死亡
	this.newDeadLine(bgWidth,-100);
	
	
	// 起点
	this.newBounds(8);
};

/**
 * 关卡公用的结束标志，即旗子后面一个走进去的桶
 * 只要人物碰到旗子即认为通关
 * @param x	旗子所在的位置
 */
GameScene.prototype.levelCommonEnd = function (x) {
	// 终点旗子
	x=x||1800;
	this.newFlag(x,200,400);
	this.newGround(x,200,1000);
	this.endBucket = this.newBucket(x+stageW-90,200-10,4,90,90);
	
	// 创建Mario，防止场景覆盖Mario
	this.createMario();
};

/**
 * 关卡默认的通关回调
 */
GameScene.prototype.levelCommonOnVictory = function () {
	var endBucket = this.endBucket;
	if(this.marioContactWith.indexOf(endBucket._matterBody)>-1){
		Matter.World.remove(engine.world, endBucket._matterBody);
		this.gameOverLayer.show=true;
	}
	
	// 最后的桶在图层最前面，人物走进去的效果
	var uiList = endBucket.belongTo.uiList;
	var i=uiList.indexOf(endBucket);
	uiList.splice(i,1);
	uiList.push(endBucket);

};



/**
 * 调试
 */
GameScene.prototype.debug = function () {
	var bodies = Matter.Composite.allBodies(engine.world);
	var context = ycc.ctx;
	context.save();
	context.beginPath();
	for (var i = 0; i < bodies.length; i += 1) {
		var vertices = bodies[i].vertices;
		context.moveTo(vertices[0].x+this.layer.x, vertices[0].y);
		for (var j = 1; j < vertices.length; j += 1) {
			context.lineTo(vertices[j].x+this.layer.x, vertices[j].y);
		}
		context.lineTo(vertices[0].x+this.layer.x, vertices[0].y);
	}
	context.lineWidth = 2;
	context.strokeStyle = '#999';
	context.stroke();
	context.restore();
};


/**
 * 碰撞检测
 */
GameScene.prototype.collisionListenerInit = function () {
	var self = this;
	
	Matter.Events.on(engine,'collisionStart',function (event) {
		for(var i=0;i<event.pairs.length;i++){
			var pair = event.pairs[i];
			var mario = getMarioFromPair(pair);
			var other = getAnotherBodyFromPair(pair,mario);
			
			if(mario&&other){
				var index=self.marioContactWith.indexOf(other);
				index===-1&&self.marioContactWith.push(other);
			}
		}
	});

	Matter.Events.on(engine,'collisionEnd',function (event) {

        for(var i=0;i<event.pairs.length;i++){
            var pair = event.pairs[i];
            //console.log(i,pair.bodyA.label,pair.bodyB.label)
            var mario = getMarioFromPair(pair);
            var other = getAnotherBodyFromPair(pair,mario);

            if(mario&&other){
                var index=self.marioContactWith.indexOf(other);
                index!==-1&&self.marioContactWith.splice(index,1);
            }
        }
	});
	
	
	Matter.Events.on(engine,'collisionActive',function (event) {
		for(var i=0;i<event.pairs.length;i++){
			var pair = event.pairs[i];
			var mario = getMarioFromPair(pair);
			var other = getAnotherBodyFromPair(pair,mario);
			
			if(mario&&other){
                var index=self.marioContactWith.indexOf(other);
                index===-1&&self.marioContactWith.push(other);
			}
		}
	});
	
	// 碰撞时获取与Mario相碰撞的另一刚体
	function getAnotherBodyFromPair(pair,mario) {
		if(!mario)
			return null;
		if(mario===pair.bodyA)
			return pair.bodyB;
		if(mario===pair.bodyB)
			return pair.bodyA;
	}
	// 碰撞时获取Mario
	function getMarioFromPair(pair) {
		var marioBody = self.getMatterBodyFromUI(self.mario);
		if(pair.bodyA.label=== marioBody.label)
			return pair.bodyA;
		if(pair.bodyB.label=== marioBody.label)
			return pair.bodyB;
		return null;
	}
	
};

/**
 * 判断Mario是否真正攻击
 * @returns {boolean}
 */
GameScene.prototype.isFighting = function(){
    var res = this.mario._fightFrameCount>0 && ycc.ticker.frameAllCount - this.mario._fightFrameCount<6;
    if(!res)
        this.mario._fightFrameCount=0;
    return res;
};

/**
 * 判断Mario是否处于正常站立状态
 * 并设置属性marioStayingOnWall
 */
GameScene.prototype.marioStayingOnWallCompute = function () {
    for(var i=0;i<this.marioContactWith.length;i++){
        var body = this.marioContactWith[i];
        if(['wall','ground','bucket','flag','girl','mushroom','wallBox'].indexOf(body.label)!==-1){
            var marioRect = this.mario.rect;
            var wallRect = this.getUIFromMatterBody(body).rect;
            this.marioStayingOnWall = parseInt(marioRect.y+marioRect.height)<=body.vertices[0].y
                && marioRect.x+marioRect.width>=body.vertices[0].x
                && marioRect.x<body.vertices[0].x+wallRect.width;

            // 如果处于站立状态，立即中断循环
            if(this.marioStayingOnWall) return;
        }
    }

    this.marioStayingOnWall = false;

};

/**
 * 更新界面中的UI的位置、速度，毒蘑菇、小乌龟、飞鸟等
 */
GameScene.prototype.updateUIPosition = function () {
	var self = this;
	var bodies = Matter.Composite.allBodies(engine.world);
	
	// console.log(audios.bgm.running);
	if(audios.bgm.running){
		this.musicBtn.children[0].show = false;
		this.musicBtn.rotation+=1;
	}else{
		this.musicBtn.children[0].show = true;
		this.musicBtn.rotation=0;
	}
	
	for(var i=0;i<bodies.length;i++){
		var body = bodies[i];
		var ui = self.getUIFromMatterBody(body);
		
		// 更新蘑菇的UI位置
		if(body.label==='mushroom'){
			ui.rect.x=body.vertices[0].x;
			ui.rect.y=body.vertices[0].y;
			// 蘑菇落地之后反弹势能设为0，即不反弹
			body.restitution=body.velocity.y===0?1:0;
			// 更新蘑菇速度。原因在于：速度较小时，matter引擎碰撞后反弹不了
			Matter.Body.setVelocity(body,{x:(body.velocity.x>=0)?1:-1,y:body.velocity.y});
			Matter.Body.setAngle(body,0);
		}
		
		// 更新导弹的位置
		if(body.label==='missile'){
			Matter.Body.setPosition(body,{x:body.position.x-2*ycc.ticker.deltaTimeRatio,y:body.position.y});

			ui.rect.x=body.vertices[0].x-5;
			ui.rect.y=body.vertices[0].y;
		}
	}

};



/**
 * 判断Mario是否处于悬空、跳跃状态
 * 并设置属性jumpIsPressing
 */
GameScene.prototype.jumpIsPressingCompute = function () {
	if(this.jumpIsPressing && this.marioStayingOnWall){
		Matter.Body.setVelocity(this.getMatterBodyFromUI(this.mario), {x:0,y:-10});
        audios.jump.currentTime=0;
        audios.jump.play();
		this.jumpIsPressing = false;
	}else{
		this.jumpIsPressing = false;
	}
};

/**
 * 根据Mario的rect属性设置刚体的高、宽
 */
GameScene.prototype.updateMarioBodyVerticesByMarioRect = function () {
	var temp = new Ycc.Math.Rect(this.mario.rect);
	temp.x+=6;
	temp.width-=16;
	// 赋值刚体高、宽
	Matter.Body.setVertices(this.getMatterBodyFromUI(this.mario),temp.getVertices());
	temp=null;
};

/**
 * 计算Mario需要显示的图片及Mario的高度等
 */
GameScene.prototype.marioImageResCompute = function () {
	
	var marioBody = this.getMatterBodyFromUI(this.mario);
	// 刚体位置
	var pos = marioBody.position;
	
	// console.log(this.marioStayingOnWall,this.isFighting(),this.downIsPressing);
	
	// 人物正在行走或站立，并且没有攻击，并且没有下蹲
	if(this.marioStayingOnWall && !this.isFighting() && !this.downIsPressing){
		this.mario.res = images.mario;
		this.mario.frameRectCount = 3;

        // 起身的标志位
        if(this.downTouchEndFlag){
            // 此处重新赋值的原因在于，人物下蹲后刚体尺寸发生了变化，所以起身时需要重新计算刚体高度
            // 重新赋值高度
            this.mario.rect.height = this.mario.res.naturalHeight*2;
            // 更新刚体的高、宽
			this.updateMarioBodyVerticesByMarioRect();
            this.downTouchEndFlag=false;
		}
		  
		// 赋值序列帧动画第一帧的图片高度
		this.mario.firstFrameRect.height = this.mario.res.naturalHeight;
	}

	// 人物处于空中
	else if(!this.marioStayingOnWall){
		this.mario.res = this.downIsPressing?images.marioDown:images.marioJump;
		this.mario.frameRectCount = 1;
		
		// 人物在空中，且游戏胜利，说明人物正在空中接触旗子
		if(this.isGameVictory){
			this.mario.res = images.marioTouchFlag;
		}
		
		// 人物在空中起身
		if(this.downTouchEndFlag){
			// 此处重新赋值的原因在于，人物下蹲后刚体尺寸发生了变化，所以起身时需要重新计算刚体高度
			// 重新赋值高度
			this.mario.rect.height = this.mario.res.naturalHeight*2;
			// 更新刚体的高、宽
			this.updateMarioBodyVerticesByMarioRect();
			this.downTouchEndFlag=false;
			this.mario.firstFrameRect.height = this.mario.res.naturalHeight;
		}
		
	}
	
	// 人物处于下蹲状态
	else if(this.downIsPressing){
		console.log('下蹲');
		
		this.mario.res = images.marioDown;
		this.mario.frameRectCount = 1;

		// 计算刚体位置
		pos.y+=(this.mario.rect.height-this.mario.res.naturalHeight*2)/2;
		// 赋值人物高度
		this.mario.rect.height=this.mario.res.naturalHeight*2;
		// 赋值刚体高度
		this.updateMarioBodyVerticesByMarioRect();
		// 赋值序列帧动画第一帧的图片高度
		this.mario.firstFrameRect.height = this.mario.res.naturalHeight;
		// 重新赋值刚体位置
		Matter.Body.setPosition(marioBody,pos);
	}

	// 人物行走或者站立时，正在攻击
	else if(this.marioStayingOnWall && this.isFighting()){
		this.mario.res = images.marioFight;
		this.mario.frameRectCount = 1;
	}
	
};

/**
 * 处理Mario穿透的金币等物品
 */
GameScene.prototype.marioContactWithCompute = function(){
    var self = this;
	var marioBody = self.getMatterBodyFromUI(this.mario);
	// 接触旗子是否下落至最低点的标志位
	for(var i=0;i<this.marioContactWith.length;i++){
		var body = this.marioContactWith[i];
		
		// 接触旗子，游戏胜利
		if(body.label==='flag'){
			this.isGameVictory = true;
			// 并且下落至最低点时，去除旗子的刚体，只保留UI
			if(this.marioStayingOnWall){
				audios.bgm.pause();
				audios.victory.currentTime=0;
				audios.victory.play();
				Matter.World.remove(engine.world, body);
			}
		}
		
		if(body.label==='coin'){
			audios.touchCoin.currentTime=0;
			audios.touchCoin.play();
			self.layer.removeUI(self.getUIFromMatterBody(body));
			Matter.World.remove(engine.world, body);
			// 金币+1
			self.score++;
			self.coinUI.content="× "+self.score;
			
		}
		
		if(body.label==='mushroom'){
			// 如果只接触蘑菇，说明是踩在蘑菇上面，并且支持同时踩两个蘑菇。否则游戏结束
			if(this.marioContactWith.length===1 && this.marioStayingOnWall){
				audios.touchMushroom.currentTime=0;
				audios.touchMushroom.play();
				self.layer.removeUI(self.getUIFromMatterBody(body));
				Matter.World.remove(engine.world, body);

				// 给人物一个反弹速度，防止蘑菇删除后人物直接下落
				Matter.Body.setVelocity(marioBody,{x:0,y:-4})
			}else if(this.marioContactWith.length===2 && this.marioContactWith[0].label==='mushroom'&& this.marioContactWith[1].label==='mushroom' && this.marioStayingOnWall){
				audios.touchMushroom.currentTime=0;
				audios.touchMushroom.play();
				self.layer.removeUI(self.getUIFromMatterBody(this.marioContactWith[0]));
				Matter.World.remove(engine.world, this.marioContactWith[0]);
				self.layer.removeUI(self.getUIFromMatterBody(this.marioContactWith[1]));
				Matter.World.remove(engine.world, this.marioContactWith[1]);
				
				// 给人物一个反弹速度，防止蘑菇删除后人物直接下落
				Matter.Body.setVelocity(marioBody,{x:0,y:-4})
				
			}else{
				// 去除物理引擎、保留UI
				Matter.World.remove(engine.world, body);
				// 角色死亡
				self.marioDeadProcess();
			}
		}
		
		// 处理人物撞墙的撞碎效果 todo
		if(body.label==='wallBox' && !this.marioStayingOnWall){
			var marioRect = this.mario.rect;
			var wallRect = this.getUIFromMatterBody(body).rect;
			var test = parseInt(marioRect.y)>=body.vertices[0].y+wallRect.height
				&& marioRect.x+marioRect.width-16>body.vertices[0].x
				&& marioRect.x<=body.vertices[0].x+wallRect.width-17;

			if(test){
				this.marioHitWall(body);
			}
		}
		
		
		
		if(body.label==='missile'){
			// 去除导弹的刚体，使其UI的位置不再更新
			Matter.World.remove(engine.world,body);
		}
		
		if(body.label==='deadLine' || body.label==='missile'){
			// 角色死亡
			self.marioDeadProcess();
		}
	}
	
};

/***
 * 角色死亡游戏结束之后的处理
 */
GameScene.prototype.marioDeadProcess = function(){
	// 停止背景乐
	audios.bgm.pause();
	
	// 去除Mario的刚体，防止碰撞，并且去除之后MarioUI的位置不会再更新
	Matter.World.remove(engine.world,this.mario._matterBody);

	// 停止更新
	this.update = null;
	
	// 禁止按钮图层的事件
	this.btnLayer.enableEventManager=false;
	// 方向设为空
	this.direction='';
	// 停止帧动画
	this.mario.stop();
	// 播放音效
	audios.dead2.play();
	// 显示结束之后的图层
	this.gameOverLayer.show = true;
	
	// ycc.ticker.stop(60);
};

/**
 * 判断游戏胜利、执行游戏胜利的回调
 */
GameScene.prototype.gameVictoryCompute = function () {
	if(this.isGameVictory){
		
		var marioBody = this.getMatterBodyFromUI(this.mario);
		Matter.Body.setVelocity(marioBody,{x:0,y:marioBody.velocity.y});
		this.direction='left';
		
		
		if(this.marioStayingOnWall){
			var marioBodyPosition = marioBody.position;
			!this.mario.isRunning && this.mario.start();
			Matter.Body.setPosition(marioBody, {x:marioBodyPosition.x+3*ycc.ticker.deltaTimeRatio,y:marioBodyPosition.y});
			
		}
		var key = 'level_'+this.gameLevel+'_onVictory';
		if(this[key]){
			this[key]();
		}else{
			this.levelCommonOnVictory();
		}
	}
};


/**
 * 人物方向的控制
 */
GameScene.prototype.directionCompute = function () {
	var marioBody = this.getMatterBodyFromUI(this.mario);
	var marioBodyPosition = marioBody.position;
	
	// 游戏胜利后不能控制人物移动
	if(this.isGameVictory) return;
	
	// 不在空中的下蹲不能控制人物左右移动
	if((this.marioStayingOnWall&&this.downIsPressing)) {
		return;
	}
	
	// 正常的左右移动
	if(this.direction==='left'){
		Matter.Body.setPosition(marioBody, {x:marioBodyPosition.x-3*ycc.ticker.deltaTimeRatio,y:marioBodyPosition.y});
	}
	if(this.direction==='right'){
		Matter.Body.setPosition(marioBody, {x:marioBodyPosition.x+3*ycc.ticker.deltaTimeRatio,y:marioBodyPosition.y});
	}

};

/**
 * 处理人物撞墙的撞碎效果
 * @param wallBoxBody
 */
GameScene.prototype.marioHitWall = function (wallBoxBody) {
	var self = this;
	var wallBox = this.getUIFromMatterBody(wallBoxBody);
	var wallBoxRect = wallBox.getAbsolutePosition();
	var marioRect = this.mario.getAbsolutePosition();
	// Mario中线
	var middleX = marioRect.x+marioRect.width/2;
	
	console.log('mario middle x--> ',middleX);
	
	
	if(middleX<=wallBoxRect.x){
		console.log('撞第一块');
		// wallBox.children[0] && wallBox.removeChild(wallBox.children[0]);
		rebuildWall(wallBox,0,1);
		return;
	}

	if(middleX>=wallBoxRect.x+wallBoxRect.width){
		console.log('撞最后一块');
		rebuildWall(wallBox,wallBox.children.length-1,1);
		// wallBox.children[wallBox.children.length-1] && wallBox.removeChild(wallBox.children[wallBox.children.length-1]);
		return;
	}
	
	
	for(var i=0;i<wallBox.children.length;i++){
		var child = wallBox.children[i].getAbsolutePosition();
		if(middleX<child.width+child.x && middleX>child.x){
			rebuildWall(wallBox,i,1);
			// wallBox.removeChild(wallBox.children[i]);
			return;
		}
		
		// 恰好撞在中线处，可以撞碎两块墙
		if(middleX===child.x){
			console.log('撞相邻两块');
			rebuildWall(wallBox,i,2);
			// wallBox.removeChild(wallBox.children[i]);
			// if(wallBox.children[i-1]) wallBox.removeChild(wallBox.children[i-1]);
			return;
		}
	}
	
	
	/**
	 * 人物撞击墙体时，重新构建该墙体
	 * @param wallBoxUI 		撞击前的墙体UI
	 * @param index				消失墙的朵数的起点
	 * @param delCount			消失墙的的朵数
	 */
	function rebuildWall(wallBoxUI,index,delCount){
		var rect = wallBoxUI.rect;
		var children = wallBoxUI.children;
		var len = children.length;

		// 只要其中有一个是特殊墙体，都不重新构建
		if(children[index].__specialType!==0 || children[index+delCount-1].__specialType!==0){
			
			var child = (children[index].__specialType===1 && children[index]) || (children[index+delCount-1].__specialType===1 && children[index+delCount-1]);
			// 如果撞击了金币墙体，整个重建
			if(child){
				// 墙体金币数减一
				child.__coinNumber--;
				// 总金币+1
				self.score++;
				self.coinUI.content="× "+self.score;

				// 播放音效
				audios.touchCoin.currentTime=0;
				audios.touchCoin.play();
				
				// 撞击金币的特效
				var childAbsolute = child.getAbsolutePosition();
				self.newCoinAnimation(childAbsolute.x+childAbsolute.width/2-self.layer.x,stageH-(childAbsolute.y),2,6);

				// 直到墙体的金币数为0时，才重新构建墙体
				if(child.__coinNumber===0){
					child.__specialType=2;
					var tempX = children[0].getAbsolutePosition().x-self.layer.x;
					var tempSpecial = rebuildSpecial(0,len-1);
					self.newWall(tempX,stageH-(rect.y+rect.height),1,len,tempSpecial);

					// 删除之前的物理刚体及其UI
					Matter.World.remove(engine.world, self.getMatterBodyFromUI(wallBoxUI));
					self.layer.removeUI(wallBoxUI);
					tempX=0;tempSpecial=null;
				}
			}
			return;
		}
		
		// 没有撞击特殊墙体时，播放音效
		audios.touchWall.currentTime=0;
		audios.touchWall.play();
		
		// 一块都不剩的情况
		if(len<=delCount){
			console.log('一块都不剩')
		}else if(index>0 && index+delCount<len){
			// 分成两块
			console.log('分成两块');
			self.newWall(children[0].getAbsolutePosition().x-self.layer.x,stageH-(rect.y+rect.height),1,index,rebuildSpecial(0,index));
			self.newWall(children[index+delCount].getAbsolutePosition().x-self.layer.x,stageH-(rect.y+rect.height),1,len-index-delCount,rebuildSpecial(index+delCount,len-1));
		}else{
		//撞击后还是一块的情况
			console.log('还剩一块');
			var i = 0;
			var special = null;
			if(delCount===1){
				// 前面少一块
				if(index===0) {
					i=1;
					special = rebuildSpecial(1,len-1);
					__log = JSON.stringify(special);
				}else{
					// 后面少一块
					i=0;
					special = rebuildSpecial(0,index);
				}
			}
			if(delCount===2){
				// 前面少2块
				if(index===1) {
					i=delCount;
					special = rebuildSpecial(index,len-1);
				}else {
					// 后面少2块
					i=0;
					special = rebuildSpecial(0,index);
				}
			}

			var x = children[i].getAbsolutePosition().x-self.layer.x;
			self.newWall(x,stageH-(rect.y+rect.height),1,len-delCount,special);
		}
		
		// 删除之前的物理刚体及其UI
		Matter.World.remove(engine.world, self.getMatterBodyFromUI(wallBoxUI));
		self.layer.removeUI(wallBoxUI);
		
		
		/**
		 * 根据开始和结束的下标，重新构造special，以保证撞击之前的UI效果
		 * 处理 金币墙体、不可撞碎的墙体等
		 * @param startIndex
		 * @param endIndex
		 */
		function rebuildSpecial(startIndex, endIndex) {
			var special = [];
			for(var i=startIndex;i<=endIndex;i++){
				if(children[i].__specialType!==0)
					special.push([0,i-startIndex,children[i].__specialType,children[i].__coinNumber]);
			}
			return special;
		}
	}
	
};

/**
 * 删除界面上的UI，及其被绑定的body
 * @param ui 	GameScene.ui中创建的ui
 */
GameScene.prototype.removeUI = function (ui) {
	var body = ui._matterBody;
	if(body){
		ui._matterBody._yccUI = null;
		ui._matterBody=null;
		Matter.World.remove(engine.world,body);
	}
	this.layer.removeUI(ui);
};

// 每帧的更新函数
GameScene.prototype.update = function () {

	var marioBody = this.getMatterBodyFromUI(this.mario);
    // 强制设置Mario的旋转角度为0，防止倾倒
    Matter.Body.setAngle(marioBody,0);

    // 强制设置Mario的旋转角速度为0，防止人物一只脚站立时旋转
    Matter.Body.setAngularVelocity(marioBody,0);
	
    // 判断Mario是否处于正常站立
	this.marioStayingOnWallCompute();
	
	// 判断Mario是否处于悬空、跳跃状态，跳跃键处于按下状态
	this.jumpIsPressingCompute();

	// 判断当前帧应该显示的Mario图片
	this.marioImageResCompute();

    // 处理Mario接触的金币等
    this.marioContactWithCompute();
	

	// 处理人物方向键的控制
	this.directionCompute();
	
	// 默认情况、更新人物位置
	// 减8是因为Mario图片比实际碰撞body偏大
	this.mario.rect.x=marioBody.vertices[0].x-8;
	this.mario.rect.y=marioBody.vertices[0].y;
	
	this.updateUIPosition();

	
	
	
	// 判断游戏胜利、执行游戏胜利的回调
	this.gameVictoryCompute();
	
	// 场景的移动
	if(this.mario.rect.x-stageW/2>0 && this.mario.rect.x<this.endPoint){
		// 初始layer的x为0
		this.layer.x = -(this.mario.rect.x-stageW/2);
	}



	
	
};
;/**
 * @file    GameScene.ui.js.js
 * @author  xiaohei
 * @date    2018/10/15
 * @description  GameScene.ui.js文件
 */



(function(GameScene){
	
	
	
	
	
	/**
	 * 创建路面
	 * @param startX 	路面的起点
	 * @param height	路面距离屏幕最下方的高度
	 * @param width		路面宽度（长）
	 */
	GameScene.prototype.newGround = function (startX,height,width) {
		var ground = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-height,width,height),
			res:images.wall,
			fillMode:'repeat',
			name:'ground'
		});
		this.layer.addUI(ground);
		
		// 绑定至物理引擎
		var rect = ground.rect,ui = ground;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
			isStatic:true,
			label:"ground",
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0,
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;

		return ground;
	};
	
	/**
	 * 创建一堆墙
	 * @param x				起始x坐标
	 * @param marginBottom	最下一行距离屏幕最下方的高度
	 * @param row			行数
	 * @param col			列数
	 * @param [special]		特殊的墙体，它是一个二维数组
	 * [[row,col,type],[row,col,type]]
	 */
	GameScene.prototype.newWall = function (x, marginBottom,row, col,special) {
		// 一朵墙高宽
		var wallWidth 	= 40;
		var wallHeight 	= 40;
		var height = marginBottom;
		
		// 方案一：每行都是一个完整的body。缺点：人物碰撞时无法方便判断与哪个墙体body碰撞
		/*for(var i=0;i<row;i++){
			var wall = new Ycc.UI.Image({
				rect:new Ycc.Math.Rect(x,stageH-height-wallHeight*i,wallWidth*col,wallHeight),
				res:images.wall,
				fillMode:'scaleRepeat',
				scaleRepeatRect:new Ycc.Math.Rect(0,0,wallWidth,wallHeight),
				name:'wall'
			});
			
			this.layer.addUI(wall);
			// 绑定至物理引擎
			var rect = wall.rect,ui = wall;
			this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
				isStatic:true,
				friction:0,
				frictionStatic:0,
				frictionAir:0,
				restitution:0,
				label:"wall",
				group:-1
			}),ui);
			Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
			rect = null;ui=null;
		}*/
		
		// 方案二：每行每列都是一个单独的body。缺点：人物在墙面行走时容易被单独的墙体body卡住
		/*for(var i=0;i<row;i++){
			for(var j=0;j<col;j++){
				var wall = new Ycc.UI.Image({
					rect:new Ycc.Math.Rect(x+j*wallWidth,stageH-height-wallHeight*i,wallWidth,wallHeight),
					res:images.wall,
					fillMode:'scaleRepeat',
					scaleRepeatRect:new Ycc.Math.Rect(0,0,wallWidth,wallHeight),
					name:'wall'
				});
				
				this.layer.addUI(wall);
				// 绑定至物理引擎
				var rect = wall.rect,ui = wall;
				this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
					isStatic:true,
					friction:0,
					frictionStatic:0,
					frictionAir:0,
					restitution:0,
					label:"wall",
					group:-1
				}),ui);
				Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
				rect = null;ui=null;
			}
		}*/
		
		// 方案三：结合方案一和二，每行一个rect绑定一个body，rect添加多个子UI
		for(var i=0;i<row;i++){
			// 一行墙体的容器
			var wallBox = new Ycc.UI.Rect({
				rect:new Ycc.Math.Rect(x,stageH-height-wallHeight*(i+1),wallWidth*col,wallHeight),
				color:'rgba(0,0,0,0)',
				name:'wallBox'
			});
			
			this.layer.addUI(wallBox);
			// 绑定至物理引擎
			var rect = wallBox.rect,ui = wallBox;
			this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
				isStatic:true,
				friction:0,
				frictionStatic:0,
				frictionAir:0,
				restitution:0,
				label:"wallBox",
				collisionFilter:{
					group:-1
				}
			}),ui);
			Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
			rect = null;ui=null;
			
			// 子UI
			for(var j=0;j<col;j++){
				var itemSpecial = getItemSpecial(i,j);
				var specialType = (itemSpecial && itemSpecial[2]) || 0;
				var wall = new Ycc.UI.Image({
					rect:new Ycc.Math.Rect(j*wallWidth,0,wallWidth,wallHeight),
					res:getResBySpecialType(specialType),
					fillMode:'scaleRepeat',
					scaleRepeatRect:new Ycc.Math.Rect(0,0,wallWidth,wallHeight),
					name:'wall'
				});
				
				// 附加字段
				// 类型
				wall.__specialType = specialType;
				// 墙体内的金币数目
				wall.__coinNumber = (specialType===1 && itemSpecial[3]) || 0;
				
				wallBox.addChild(wall);
			}
		}
		
		/**
		 * 根据类型获取墙体的UI
		 * @param type
		 * @return {*}
		 */
		function getResBySpecialType(type) {
			if(type===0) return images.wall;
			if(type===1) return images.wallSpecial01;
			if(type===2) return images.wallSpecial02;
		}
		
		
		/**
		 * 根据行号和列号获取墙体的特殊类型
		 * 1 -- 普通墙体
		 * 2 -- 金币墙体
		 * 3 -- 不可撞碎墙体
		 *
		 * @param rowIndex
		 * @param colIndex
		 * @return {Array}
		 */
		function getItemSpecial(rowIndex, colIndex) {
			// 默认为0
			if(!special || special.length===0) return null;
			
			for(var i=0;i<special.length;i++){
				if(special[i][0]===rowIndex && special[i][1]===colIndex)
					return special[i];
			}
			return null;
		}
	};



    /**
     * 创建一堆金币
     * @param x			起始x坐标
     * @param height	最下一行距离屏幕最下方的高度
     * @param row		行数
     * @param col		列数
     */
    GameScene.prototype.newCoin = function (x, height,row, col) {
        var w = 21;
        var h = 34;
        var wGap = 10;
        var hGap = 10;

        for(var i=0;i<row;i++){
            for(var j=0;j<col;j++){
                var coin = new Ycc.UI.Image({
                    rect:new Ycc.Math.Rect(x+(w+wGap)*j,stageH-height-(h+hGap)*i,w,h),
                    res:images.coin100,
                    fillMode:'scale',
                    name:'coin'
                });

                this.layer.addUI(coin);
                // 绑定至物理引擎
                var rect = coin.rect,ui = coin;
                this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
                    isStatic:true,
                    isSensor:true,
                    friction:0,
                    frictionStatic:0,
                    frictionAir:0,
                    restitution:0,
                    label:"coin",
                }),ui);
                Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
                rect = null;ui=null;

            }


        }

    };
	
	
	/**
	 * 新建一个金币旋转特性
	 * @param middleX			旋转的中心线
	 * @param marginBottom		初始位置距离最下方的高度
	 * @param zoomSpeed			旋转速度，可取值1 2 4 5 10
	 * @param upSpeed			向上的初速度
	 */
	GameScene.prototype.newCoinAnimation = function (middleX, marginBottom,zoomSpeed,upSpeed) {
		var self = this;
		var w = 20;
		var h = 34;
		// 旋转速度
		zoomSpeed = zoomSpeed || 2;
		// 向上的初速度
		upSpeed = upSpeed || 4;
		
		var x = middleX-w/2;
		var coin = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(x,stageH-marginBottom-h,w,h),
			res:images.coin100,
			fillMode:'scale',
			name:'coinAnimation'
		});
		
		// 绑定至物理引擎
		var rect = coin.rect,ui = coin;
		var body = Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0,
			label:"coinAnimation",
			collisionFilter:{
				// 不与其他刚体碰撞
				group:-1
			},
		});
		this.bindMatterBodyWithUI(body,ui);
		Matter.World.add(engine.world,body);
		Matter.Body.setVelocity(body, {x:0,y:-upSpeed});
		rect = null;ui=null;
		
		console.log(body);
		
		coin.addListener('computestart',startListener);
		coin.addListener('renderend',renderendListener);
		
		this.layer.addUI(coin);
		
		
		function renderendListener() {
			if(parseInt(body.velocity.y)===0){
				coin.removeListener('computestart',startListener);
				coin.removeListener('renderend',renderendListener);
				self.removeUI(this);
			}
			
		}
		function startListener() {
			var ui = this;
			ui.mirrorCount=ui.mirrorCount || 0;
			ui.zoomOut=!!ui.zoomOut;
			
			// console.log(ui.mirrorCount,ycc.ticker.frameAllCount);
			// if(ycc.ticker.frameAllCount===71) debugger;
			
			Matter.Body.setAngle(body,0);
			
			ui.rect.y=body.vertices[0].y;
			
			if(ui.rect.width===0){
				ui.zoomOut = true;
				ui.mirrorCount++;
			}
			
			if(ui.rect.width===w)
				ui.zoomOut = false;
			
			if(ui.mirrorCount%2===0)
				ui.mirror=0;
			else
				ui.mirror=1;
			
			if(ui.zoomOut){
				ui.rect.x-=zoomSpeed/2;
				ui.rect.width+=zoomSpeed;
			}else{
				ui.rect.x+=zoomSpeed/2;
				ui.rect.width-=zoomSpeed;
			}
			
		}
	};
 
	
	/**
	 * 新建一个女孩
	 * @param startX			起始x坐标
	 * @param marginBottom		女孩距离屏幕最下方的高度
	 */
	GameScene.prototype.newGirl = function (startX,marginBottom) {

		var name = 'girl';
		var width = 36;
		var height = 64;
		
		var image = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-marginBottom-height,width,height),
			res:images.girl,
			fillMode:'scale',
			name:name,
		});
		this.layer.addUI(image);
		
		// 绑定至物理引擎
		var rect = image.rect,ui = image;
		var w = rect.width;
		var h = rect.height;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,w,h,{
			isStatic:true,
			label:name,
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
		
		return image;
	};
	
	/**
	 * 新建一个导弹
	 * @param startX			起始x坐标
	 * @param marginBottom		导弹距离屏幕最下方的高度
	 */
	GameScene.prototype.newMissile = function (startX,marginBottom) {
		
		var name = 'missile';
		var width = 30;
		var height = 20;
		
		var image = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-marginBottom-height,width,height),
			res:images.missile,
			fillMode:'scale',
			name:name,
		});
		this.layer.addUI(image);
		
		// 绑定至物理引擎
		var rect = image.rect,ui = image;
		var w = rect.width;
		var h = rect.height;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2+5,rect.y+rect.height/2,w,h,{
			isStatic:true,
			label:name,
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
		
		return image;
	};
	
	
	/**
	 * 新建一个蘑菇
	 * @param startX			起始x坐标
	 * @param marginBottom		蘑菇距离屏幕最下方的高度
	 */
	GameScene.prototype.newMushroom = function (startX,marginBottom) {
		// ui名字
		var name = 'mushroom';

		// 蘑菇高宽
		var width = 36;
		var height = 38;

		// 蘑菇速度
		var speed = 1;
		
		var image = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-marginBottom-height,width,height),
			res:images.mushroom,
			fillMode:'scale',
			name:name,
		});
		this.layer.addUI(image);
		
		// 绑定至物理引擎
		var rect = image.rect,ui = image;
		var w = rect.width;
		var h = rect.height;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,w,h,{
			label:name,
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0,
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		Matter.Body.setVelocity(this.getMatterBodyFromUI(ui),{x:-speed,y:0});
		rect = null;ui=null;
		return image;
	};
	
	
	/**
	 * 新建一个桶
	 * @param startX 				桶的左侧起点
	 * @param marginBottom			桶下边缘距离屏幕最下方的高度
	 * @param [bucketWidth]			桶的宽度
	 * @param [bucketHeight]		桶的高度
	 * @param [direction]			桶的朝向  1上 2右 3下 4左
	 */
	GameScene.prototype.newBucket = function (startX,marginBottom,direction,bucketWidth,bucketHeight) {
		
		var height = marginBottom;
		bucketWidth=bucketWidth||80;
		bucketHeight=bucketHeight||90;

		var image = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-height-bucketHeight,bucketWidth,bucketHeight),
			res:images.bucket,
			fillMode:'scale',
			name:'bucket',
			anchorX:bucketWidth/2,
			anchorY:bucketHeight/2,
			rotation:[0,0,90,180,270][direction||1]
		});
		this.layer.addUI(image);
	
		// 绑定至物理引擎
		var rect = image.rect,ui = image;
		var w = rect.width;
		var h = rect.height;
		if(image.rotation===90||image.rotation===270){
			rect.x+=(bucketHeight-bucketWidth)/2;
			rect.y+=(bucketHeight-bucketWidth)/2;
			w=rect.height;
			h=rect.width;
		}
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,w,h,{
			isStatic:true,
			label:"bucket",
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
		return image;
	};
	
	/**
	 * 新建一个旗子，每个关卡只能有一个
	 * 旗子之后的一个屏幕宽度，场景不再左右移动
	 * 旗子必须插在地面上，即下方必须存在ground
	 * @param startX 				旗子的左侧起点
	 * @param height				旗子下边缘距离屏幕最下方的高度
	 * @param [flagHeight]			旗子的高度
	 */
	GameScene.prototype.newFlag = function (startX,height,flagHeight) {
		this.endPoint = startX+stageW/2;
		// 旗子之后的一个屏幕宽度新增一个限制区
		this.newBounds(startX+stageW);
		var objectHeight = flagHeight||images.flag.naturalHeight;
		var objectWidth = images.flag.naturalWidth;
		
		var image = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-height-objectHeight,objectWidth,objectHeight),
			res:images.flag,
			fillMode:'scale9Grid',
			scale9GridRect:new Ycc.Math.Rect(16,78,8,14),
			name:'flag',
		});
		this.layer.addUI(image);
		
		// 绑定至物理引擎
		var rect = image.rect,ui = image;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+16,rect.y+rect.height/2,1,9999,{
			isStatic:true,
			label:"flag",
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
		return image;
	};

    /**
     * 在横坐标x处创建一个限制
	 * @param x
     */
	GameScene.prototype.newBounds = function(x){
        Matter.World.add(engine.world,Matter.Bodies.rectangle(x,0,1,2*stageH,{
            isStatic:true,
            friction:0,
            frictionStatic:0,
            frictionAir:0,
            restitution:0,
            label:"bound"
        }));
    };

	/**
	 * 死亡线、看不见的虚拟线，只要人物触碰立即死亡，只能是横线
	 * @param width		横线长度
	 * @param height	横线距离屏幕最下方的高度
	 */
	GameScene.prototype.newDeadLine = function(width,height){
		Matter.World.add(engine.world,Matter.Bodies.rectangle(width/2,stageH-height,width,1,{
			isStatic:true,
			isSensor:true,
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0,
			label:"deadLine"
		}));
	};
	
	
	
	
	
	/**
	 * 生成马里奥
	 */
	GameScene.prototype.createMario = function () {
		this.mario = new Ycc.UI.ImageFrameAnimation({
			rect:new Ycc.Math.Rect(10,0,18*2,images.mario.naturalHeight*2),
			// rect:new Ycc.Math.Rect(320-26,stageH-300,18*2,images.mario.naturalHeight*2),
			res:images.mario,
			firstFrameRect:new Ycc.Math.Rect(0,0,18,images.mario.naturalHeight),
			frameRectCount:3,
			//autoplay:true,
			frameSpace:8
		});
		this.mario._fightFrameCount=0;
		this.layer.addUI(this.mario);
		
		// 绑定至物理引擎
		var rect = this.mario.rect,ui=this.mario;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2+8,rect.y+rect.height/2,rect.width-16,rect.height,{
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0,
			label:"Mario",
		}),ui);
		this.updateMarioBodyVerticesByMarioRect();
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
	};
	
	
	
	/**
	 * 创建背景
	 * @param imgName		背景图片资源的名称，对应于loader加载时的name字段
	 * @param width			背景需要覆盖的区域宽
	 * @param height		背景需要覆盖的区域高
	 * @param type			背景图片资源的类型	1-方图  2-长图 默认方图
	 */
	GameScene.prototype.createBackground = function (imgName,width,height,type) {
		var imgRes = images[imgName];
		type = type || 1;
		var rect = null;
		if(type===1)
			rect = new Ycc.Math.Rect(0,0,imgRes.naturalWidth,imgRes.naturalHeight);
		else
			rect = new Ycc.Math.Rect(0,0,imgRes.naturalWidth/imgRes.naturalHeight*stageH,stageH);
			
		var ui = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(0,0,width,height),
			res:imgRes,
			fillMode:'scaleRepeat',
			scaleRepeatRect:rect,
			name:'bg'
		});
		this.layer.addUI(ui);
	};
	
	
	/**
	 * 创建右上角金币计数UI
	 */
	GameScene.prototype.createCoinUI = function(){
		var coin = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(stageW-100,10,10,15),
			res:images.coin100,
			fillMode:'scale',
			name:'coinUI'
		});
		var coinText = new Ycc.UI.SingleLineText({
			content:"× 0",
			rect:new Ycc.Math.Rect(15,0,40,20),
			color:'yellow'
		});
		coin.addChild(coinText);
		this.btnLayer.addUI(coin);
		this.coinUI = coinText;
	};
	
	/**
	 * 生成方向键
	 */
	GameScene.prototype.createDirectionBtn = function () {
		var self = this;
		// 按钮大小
		var btnSize = 50;
		// 按钮之间的间隙
		var btnSpace = 20;
		// 按钮组距屏幕左侧的宽度
		var marginLeft = 20;
		
		// 按钮组距屏幕下侧的宽度
		var marginBottom = 10;
		
		// 左
		self.btnLayer.addUI(new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(marginLeft,stageH-(2*btnSize+btnSpace+marginBottom),btnSize,btnSize),
			fillMode:'scale',
			anchorX:btnSize/2,
			anchorY:btnSize/2,
			res:images.btn,
			rotation:180,
			ondragstart:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				self.mario.mirror=1;
				self.mario.start();
				self.direction = 'left';
			},
			ondragend:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				self.mario.stop();
				self.direction = '';
			}
		}));
		
		// 右
		self.btnLayer.addUI(new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(marginLeft+btnSize+btnSpace,stageH-(2*btnSize+btnSpace+marginBottom),btnSize,btnSize),
			fillMode:'scale',
			anchorX:btnSize/2,
			anchorY:btnSize/2,
			res:images.btn,
			rotation:0,
			ondragstart:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				self.mario.mirror=0;
				self.mario.start();
				self.direction = 'right';
			},
			ondragend:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				self.mario.stop();
				self.direction = '';
			}
			
		}));
		// 下
		self.btnLayer.addUI(new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(marginLeft+btnSize/2+btnSpace/2,stageH-(btnSize+marginBottom),btnSize,btnSize),
			fillMode:'scale',
			anchorX:btnSize/2,
			anchorY:btnSize/2,
			res:images.btn,
			rotation:90,
			ondragstart:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				// 如果人物不处于站立或行走状态，按下键无效
				if(!self.marioStayingOnWall) {
					console.log('人物当前状态不能下蹲!');
					return;
				}
				self.downIsPressing = true;
			},
			ondragend:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				self.downIsPressing = false;
				self.downTouchEndFlag = true;
			}
		}));
		
		
		
		
		// 上
		/*self.btnLayer.addUI(new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(marginLeft+btnSize+btnSpace,stageH-(btnSize+marginBottom)-(btnSize+btnSpace),btnSize,btnSize),
			fillMode:'scale',
			anchorX:btnSize/2,
			anchorY:btnSize/2,
			res:images.btn,
			rotation:-90,
			ontap:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				if(self.jumpIsPressing) return;
				self.jumpIsPressing = true;
			}
			
		}));*/
		
		// 按键`上`是否是抬起状态。此属性用于阻止人物连跳
		var upIsUp = true;
		window.onkeydown = function(e){
			// 游戏胜利禁用按键
			if(self.isGameVictory) return;
			
			if(e.keyCode===38){
				if(upIsUp){
					upIsUp=false;
					self.jumpIsPressing = true;
				}
			}
			if(e.keyCode===37){
				self.mario.mirror=1;
				!self.mario.isRunning && self.mario.start();
				self.direction = 'left';
			}
			if(e.keyCode===39){
				self.mario.mirror=0;
				!self.mario.isRunning && self.mario.start();
				self.direction = 'right';
			}
			if(e.keyCode===40){
				// 如果人物不处于站立或行走状态，按下键无效
				if(!self.marioStayingOnWall) {
					console.log('人物当前状态不能下蹲!');
					return;
				}
				self.downIsPressing = true;
			}
			
			if(e.keyCode===88){
				if(self.isFighting())
					return;
				// 记录攻击时的帧数
				self.mario._fightFrameCount=ycc.ticker.frameAllCount;
			}
			
			if(e.keyCode===67){
				if(upIsUp){
					upIsUp=false;
					self.jumpIsPressing = true;
				}
			}
			
		};
		
		window.onkeyup = function(e){
			if(e.keyCode===38){
				upIsUp=true;
				self.jumpIsPressing = false;
			}
			if(e.keyCode===37){
				self.mario.stop();
				self.direction = '';
			}
			if(e.keyCode===39){
				self.mario.stop();
				self.direction = '';
			}
			if(e.keyCode===40){
				self.downIsPressing = false;
				self.downTouchEndFlag = true;
			}
			if(e.keyCode===67){
				upIsUp=true;
				self.jumpIsPressing = false;
			}
		};
		
	};
	
	
	/**
	 * 生成功能键
	 */
	GameScene.prototype.createSkillBtn = function () {
		var self = this;
		// 按钮大小
		var btnSize = 50;
		// 按钮之间的间隙
		var btnSpace = 15;
		// 按钮组距屏幕左侧的宽度
		var marginRight = 20;
		// 按钮组距屏幕下侧的宽度
		var marginBottom = 20;
		
		// 跳跃
		self.btnLayer.addUI(new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(stageW-btnSize-marginRight,stageH-(btnSize+marginBottom),btnSize,btnSize),
			fillMode:'scale',
			res:images.jump,
			ontap:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;

				if(self.jumpIsPressing) return;
				self.jumpIsPressing = true;
			}
		}));
		
		// 攻击
		self.btnLayer.addUI(new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(stageW-btnSize*2-btnSpace-marginRight,stageH-(btnSize+marginBottom),btnSize,btnSize),
			fillMode:'scale',
			res:images.fight,
			ontap:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				if(self.isFighting())
					return;
				// 记录攻击时的帧数
				self.mario._fightFrameCount=ycc.ticker.frameAllCount;
			}
		}));
		
		this.createMusicBtn();
	};
	
	/**
	 * 创建音乐按钮
	 */
	GameScene.prototype.createMusicBtn = function () {
		var self = this;
		var btn = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(stageW-40,10,30,30),
			anchorX:15,
			anchorY:15,
			fillMode:'scale',
			res:images.music,
			name:'musicBtn',
			ontap:function (e) {
				if(audios.bgm.running)
					audios.bgm.pause();
				else
					audios.bgm.play();
				
			}
		});
		btn.addChild(new Ycc.UI.Line({
			start:new Ycc.Math.Dot(5,5),
			end:new Ycc.Math.Dot(25,25),
			width:5,
			color:'#ccc',
			ontap:function (e) {
				if(audios.bgm.running)
					audios.bgm.pause();
				else
					audios.bgm.play();
				
			}
		}));
		
		this.musicBtn=btn;
		// 音乐按钮
		self.btnLayer.addUI(btn);
	};
	
	/**
	 * 创建游戏结束图层，及其内容
	 */
	GameScene.prototype.createGameOverLayer = function () {
		var self = this;
		this.gameOverLayer = ycc.layerManager.newLayer({enableEventManager:true,name:"游戏结束图层",show:false});
		
		var mask = new Ycc.UI.Rect({
			rect:new Ycc.Math.Rect(0,0,stageW,stageH),
			color:'rgba(0,0,0,0.6)',
		});
		
		
		var btn,text;
		// 重玩按钮
		btn = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(stageW/2-110,stageH/2+50,100,40),
			res:images.button,
			fillMode:'scale',
			oncomputestart:function () {
				if(self.isGameVictory){
					this.rect.x=stageW/2-110;
				}else{
					this.rect.x=stageW/2-100/2;
				}
			}
		});
		text = new Ycc.UI.SingleLineText({
			rect:new Ycc.Math.Rect(0,0,100,40),
			fontSize:'16px',
			content:"重新开始",
			xAlign:'center',
			yAlign:'center',
			ontap:restart
		});
		btn.addChild(text);
		mask.addChild(btn);
		
		
		// 下一关按钮
		btn = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(stageW/2,stageH/2+50,100,40),
			res:images.button,
			show:false,
			fillMode:'scale'
		});
		text = new Ycc.UI.SingleLineText({
			rect:new Ycc.Math.Rect(0,0,100,40),
			fontSize:'16px',
			content:"下一关",
			xAlign:'center',
			yAlign:'center',
			ontap:nextLevel,
			oncomputestart:function () {
				if(self.isGameVictory){
					this.getParent().show = true;
					this.show = true;
					this.content='下一关';
				}else{
					this.getParent().show = false;
					this.show = false;
				}
			}
		});
		btn.addChild(text);
		mask.addChild(btn);
		
		
		this.gameOverLayer.addUI(mask);
		
		
		
		function nextLevel() {
			console.log('nextLevel');
			clearMemory();
			var index = levelList.indexOf(self.gameLevel);
			if(index===-1) return;
			if(index===levelList.length-1){
				alert('恭喜你！玩通关了！点击返回第一关！');
				if("undefined"!==typeof wx){
					return projectInit('#'+levelList[0]);
				}
				window.location.href=window.location.pathname+'#'+levelList[0];
				window.location.reload();
				return;
			}
			if("undefined"!==typeof wx){
				return projectInit('#'+levelList[index+1]);
			}
			window.location.href=window.location.pathname+'#'+levelList[index+1];
			window.location.reload();
		}
		
		function restart() {
			console.log('restart');
			clearMemory();
			projectInit('#'+self.gameLevel);
		}
		
		function clearMemory() {
			// 去除body引用
			Matter.Composite.allBodies(engine.world).forEach(function (body) {
				if(body._yccUI){
					body._yccUI._matterBody=null;
					body._yccUI=null;
				}
				Matter.World.remove(engine.world,body);
			});
			Matter.Engine.clear(engine);
			
			self.btnLayer.removeSelf();
			self.layer.removeSelf();
			self.gameOverLayer.removeSelf();
			self.update = null;
			currentScene = null;
		}
	};
	
})(GameScene);;/**
 * @file    level-1-1.js
 * @author  xiaohei
 * @date    2018/10/15
 * @description  level-1-1文件
 *
 * 关卡一：吃金币
 */


(function (GameScene) {
	
	
	GameScene.prototype.level_1_1 = function () {
		this.levelCommonSetting();
		
		uiCreator.call(this);
		
		this.levelCommonEnd(1650);
	};
	
	
	function uiCreator(){
		this.newGround(0,150,450);
		
		// this.newGirl(220,150);
		this.newMushroom(220,180);
		this.newMushroom(260,180);
		this.newMushroom(300,180);
		
		this.newBucket(100,150);
		this.newCoin(100,300,1,4);
		
		this.newBucket(350,150);
		
		this.newCoin(380,300,1,1);
		
		this.newCoin(450,350,1,1);
		
		this.newGround(550,150,100);
		this.newCoin(550,350,1,2);
		
		
		
		
		
		
		// 创建一堵墙
		this.newWall(700,250,1,3);
		this.newCoin(700,450,1,5);
		
		this.newWall(850,400,1,3);
		this.newCoin(850,450,1,2);
		
		this.newWall(1050,50,1,3);
		this.newCoin(1050,250,1,5);
		
		
		
		this.newWall(1200,0,2,1);
		this.newWall(1240,0,3,1);
		this.newWall(1280,0,4,1);
		this.newWall(1320,0,5,1);
		this.newWall(1360,0,6,1);
		this.newWall(1400,0,7,1);
		this.newWall(1460,0,8,1);
		
		this.newWall(1560,0,10,1);
		// 添加几发导弹
		this.newMissile(300,300);
		this.newMissile(1300,400);
		this.newMissile(2300,500);
		
		
	}
	


})(GameScene);;/**
 * @file    level_1_2.js
 * @author  xiaohei
 * @date    2018/10/23
 * @description  level_1_2文件
 *
 * 关卡二：超长地图
 */


(function (GameScene) {
	
	GameScene.prototype.level_1_2 = function () {
		this.levelCommonSetting();
		
		uiCreator.call(this);
		
		this.levelCommonEnd(4800);
	};
	
	
	function uiCreator(){
		this.newGround(0,150,500);
		this.newGround(600,150,500);
		this.newGround(1200,150,100);
		this.newGround(1400,150,100);
		this.newGround(1600,150,50);
		this.newGround(1700,150,50);
		this.newGround(1800,150,50);
		
		this.newWall(1900,200,1,4);
		this.newWall(2200,300,1,2);
		this.newWall(2400,400,1,3);
		this.newWall(2600,200,1,3);
		this.newWall(2700,100,1,3);
		this.newWall(2800,300,1,7);
		
		this.newGround(3000,150,500);
		this.newGround(3600,150,500);
		
		this.newWall(4100,200,1,8);
		this.newWall(4400,300,1,3);
		this.newWall(4600,400,1,2);
		
		this.newGround(4800,150,500);
		
		
		
		this.newMushroom(220,180);
		this.newMushroom(260,180);
		this.newMushroom(300,180);
		
		this.newMushroom(1220,180);
		this.newMushroom(1260,180);
		
		this.newMushroom(2220,180);
		this.newMushroom(2260,180);
		
		
		this.newMushroom(3220,180);
		this.newMushroom(3260,180);
		
		this.newMushroom(4220,180);
		this.newMushroom(4260,180);
		
		
		this.newCoin(100,300,1,3);
		this.newCoin(380,300,4,1);
		this.newCoin(450,350,2,1);
		this.newCoin(1200,500,1,3);
		this.newCoin(1800,400,1,3);
		this.newCoin(2100,300,4,3);
		this.newCoin(3100,300,1,3);
		this.newCoin(4100,300,1,3);
		
		// 添加几发导弹
		this.newMissile(900,400);
		this.newMissile(1300,300);
		this.newMissile(1900,600);
		this.newMissile(3300,500);
		
	}
	
})(GameScene);;/**
 * @file    level_1-3.js
 * @author  xiaohei
 * @date    2018/10/25
 * @description  level_1-3文件
 */


(function (GameScene) {
	
	
	GameScene.prototype.level_1_3 = function () {
		this.levelCommonSetting();
		
		uiCreator.call(this);
		
		this.levelCommonEnd(1800);
	};
	
	
	function uiCreator(){
		// 临时变量
		var x=0;
		var marginBottom=150;
		var width = 200;
		
		this.newWall(0,200,1,10,[[0,2,1]]);
		
		this.newWall(150,350,2,5,[[1,2,1,3]]);
		
		this.newMushroom(350,500);
		
		
		/**
		 *
		 *    -----
		 * |   ^^^   |
		 *  _________
		 */
		x=500;
		marginBottom=150;
		width=400;
		this.newGround(x,marginBottom,width);
		this.newBucket(x,marginBottom);
		this.newBucket(x+width-80,marginBottom,1,80);
		this.newWall(x+100,marginBottom+200,1,4,[[0,1,1,1],[0,2,1,1]]);
		this.newCoin(x+150,marginBottom+250,1,3);
		this.newMushroom(x+100,marginBottom);
		this.newMushroom(x+150,marginBottom);
		this.newMushroom(x+200,marginBottom);
		
		
		/**
		 *       __
		 *    __
		 * __
		 */
		x=1000;
		marginBottom = 150;
		width=700;
		this.newWall(x,marginBottom,1,5);
		this.newWall(x+250,marginBottom+100,1,5);
		this.newWall(x+500,marginBottom+200,1,5);
		this.newMushroom(x+200,marginBottom+200);
		this.newCoin(x,marginBottom+100,1,3);
		this.newCoin(x+250,marginBottom+100+100,1,3);
		this.newCoin(x+500,marginBottom+200+100,1,3);
	}
	
	
})(GameScene);;/**
 * @file    level_1_4.js
 * @author  xiaohei
 * @date    2018/11/15
 * @description  level_1_4文件
 */

(function (GameScene) {
	
	GameScene.prototype.level_1_4 = function () {
		this.levelCommonSetting();
		uiCreator.call(this);
		this.levelCommonEnd(5100);
	};
	
	function uiCreator() {
		this.newGround(0,150,300);this.newWall(126,260,1,3,[[0,1,1,3]]);this.newWall(370,260,1,3,[]);this.newCoin(382,400,1,3);this.newWall(556,360,1,3,[]);this.newGround(676,150,300);this.newCoin(770,300,1,3);this.newBucket(864,150,1,80,90);this.newGround(1008,150,300);this.newBucket(1008,150,1,80,90);this.newBucket(1198,150,1,80,90);this.newMushroom(1112,150);this.newWall(1334,260,1,3,[]);this.newWall(1500,160,1,3,[]);this.newCoin(1500,260,1,5);this.newWall(1690,260,1,3,[]);this.newCoin(1692,400,1,3);this.newGround(1850,150,600);this.newBucket(1858,150,1,80,90);this.newBucket(2360,150,1,80,90);this.newMushroom(2080,150);this.newMushroom(2136,150);this.newMushroom(2216,150);this.newMushroom(1986,150);this.newMushroom(1986,310);this.newGround(2498,150,30);this.newGround(2586,150,30);this.newGround(2686,150,30);this.newGround(2788,150,100);this.newWall(2934,260,1,3,[]);this.newWall(3092,360,1,3,[]);this.newWall(3298,460,1,3,[]);this.newWall(3492,560,1,3,[]);this.newGround(3484,150,300);this.newWall(3484,260,1,3,[]);this.newBucket(3562,150,1,80,90);this.newMushroom(3690,150);this.newMushroom(3762,150);this.newWall(3792,260,1,3,[[0,1,1,10]]);this.newWall(2020,260,1,6,[[0,1,1,5]]);this.newGround(3926,150,300);this.newCoin(4128,200,1,3);this.newGround(4346,150,300);this.newWall(4646,260,1,3,[]);this.newWall(4770,0,5,1,[]);this.newWall(4810,0,6,1,[]);this.newWall(4850,0,7,1,[]);this.newWall(4890,0,8,1,[]);this.newWall(4930,0,9,1,[]);this.newWall(4970,0,10,2,[]);
	}
	
	
})(GameScene);

;/**
 * @file    main.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  main文件
 */

if(!Ycc.utils.isMobile())
	alert('此示例在移动端查看效果更好！');



///////////////////////////// 全局变量
var ycc = null;
var stageW = 0;
var stageH = 0;

// 所有的图片资源
var images = null;
// 所以音频资源
var audios = null;
// 背景乐自动播放
var bgmAutoplay = true;
// 当前场景
var currentScene = null;
// loading窗
var loading = null;
// 物理引擎
var engine = null;
// 调试时间节点
var t1=0,t2=0,t3=0,t4=0,__log='自定义';
// 关卡列表
var levelList=['1_1','1_2','1_3','1_4'];
//////


createYcc();


loading = new Loading();
loadRes(function (imgs, musics) {
	loading.hidden();
	images=imgs;
	audios=musics;
	projectInit();
	
});








function createYcc() {
	if(typeof canvas === 'undefined'){
// 创建canvas
		window.canvas = document.createElement('canvas');
		canvas.width=window.innerWidth;
		canvas.height=window.innerHeight;
		document.body.appendChild(canvas);
	}

// 初始化全局变量
	ycc = new Ycc().bindCanvas(canvas);
	stageW = ycc.getStageWidth();
	stageH = ycc.getStageHeight();
	
	
	ycc.debugger.addField('帧间隔',function () {return ycc.ticker.deltaTime;});
	ycc.debugger.addField('总帧数',function () {return ycc.ticker.frameAllCount;});
	ycc.debugger.addField('总UI数',function () {return currentScene&&currentScene.layer.uiCountRecursion;});
	ycc.debugger.addField('画面位置',function () {return currentScene&&currentScene.layer.x;});
	ycc.debugger.addField('渲染时间',function () {return t2-t1;});
	ycc.debugger.addField('update时间',function () {return t3-t2;});
	ycc.debugger.addField('debug时间',function () {return t4-t3;});
	ycc.debugger.addField('自定义',function () {return __log;});
	// ycc.debugger.showDebugPanel();





// 监听每帧、更新场景
	ycc.ticker.addFrameListener(function () {
		t1 = Date.now();

		ycc.layerManager.reRenderAllLayerToStage();

		t2 = Date.now();

		currentScene && currentScene.update && currentScene.update();
		
		t3 = Date.now();

		// 绘制刚体的方框
		// currentScene && currentScene.debug && currentScene.debug();
		// window.onerror = function (e) { alert('系统错误！'+e); };
		
		t4 = Date.now();

	});
	
	
	
}




// 加载资源
function loadRes(cb){
	// http://172.16.10.32:7777/examples/game-super-mario/
	if("undefined"!==typeof wx)
		ycc.loader.basePath = 'https://www.lizhiqianduan.com/products/ycc/examples/game-super-mario/';
	ycc.loader.loadResOneByOne([
		{name:"btn",url:"./images/btn.jpg"},
		{name:"button",url:"./images/button.png"},
		{name:"fight",url:"./images/fight.png"},
		{name:"music",url:"./images/music.png"},
		{name:"jump",url:"./images/jump.png"},
		{name:"mario",url:"./images/mario-walk.png"},
		{name:"girl",url:"./images/girl.png"},
		{name:"mushroom",url:"./images/mushroom.png"},
		{name:"wall",url:"./images/wall.png"},
		{name:"wallSpecial01",url:"./images/wall-special-01.jpg"},
		{name:"wallSpecial02",url:"./images/wall-special-02.png"},
		{name:"marioFight",url:"./images/mario-fight.png"},
		{name:"marioJump",url:"./images/mario-jump.png"},
		{name:"marioDown",url:"./images/mario-down.png"},
		{name:"coin100",url:"./images/coin100.jpg"},
		{name:"bucket",url:"./images/bucket.png"},
		{name:"flag",url:"./images/flag.png"},
		{name:"marioTouchFlag",url:"./images/mario-touch-flag.png"},
		{name:"missile",url:"./images/missile.png"},
		{name:"bg01",url:"./images/bg01.jpg"},
		{name:"bg02",url:"./images/bg02.jpg"},
		{name:"bg03",url:"./images/bg03.jpg"},
		{name:"bg04",url:"./images/bg04.jpg"},
		{name:"bg05",url:"./images/bg05.jpg"},
	],function (lise,imgs) {
		ycc.loader.loadResOneByOne([
			{name:"bgm",type:"audio",url:"./audios/bgm.mp3"},
			{name:"jump",type:"audio",url:"./audios/jump.mp3"},
			{name:"victory",type:"audio",url:"./audios/victory.mp3"},
			{name:"touchWall",type:"audio",url:"./audios/touchWall.mp3"},
			{name:"touchCoin",type:"audio",url:"./audios/touchCoin.mp3"},
			{name:"touchMushroom",type:"audio",url:"./audios/touchMushroom.mp3"},
			{name:"dead1",type:"audio",url:"./audios/dead1.mp3"},
			{name:"dead2",type:"audio",url:"./audios/dead2.mp3"},
		],function (lise,musics) {
			cb(imgs,musics);
		},function (item,error) {
			loading.updateText(item.name);
		});
		
	},function (item,error) {
		// 兼容wx
		if (!item.res.naturalWidth) {
			item.res.naturalWidth = item.res.width;
			item.res.naturalHeight = item.res.height;
		}
		loading.updateText(item.name);
	});
	
}


function projectInit(levelName) {
	
	ycc.ticker.start(60);
	engine = Matter.Engine.create();
	Matter.Engine.run(engine);
	currentScene = new GameScene(levelName);
	ycc.layerManager.reRenderAllLayerToStage();
	
}
