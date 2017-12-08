/**
 * @file    Ycc.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description  Ycc.class文件
 *
 */




(function (win) {
	
	/**
	 * 应用启动入口类，每个实例都与一个舞台绑定。
	 * 每个舞台都是一个canvas元素，该元素会被添加至HTML结构中。
	 *
	 * @param canvasDom		canvas的HTML元素。即，显示舞台
	 * @param [config]		canvas初始化的属性。字体大小、填充颜色、线条颜色、默认背景等。
	 * @constructor
	 */
	win.Ycc = function Ycc(canvasDom,config){
		/**
		 * canvas的Dom对象
		 */
		this.canvasDom = canvasDom;
		
		/**
		 * 显示舞台
		 */
		this.stage = canvasDom;
		/**
		 * 绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = this.canvasDom.getContext("2d");
		/**
		 * 可绘图区的宽
		 */
		this.ctxWidth = this.canvasDom.width;
		/**
		 * 可绘图区的高
		 */
		this.ctxHeight = this.canvasDom.height;
		
		/**
		 * Layer对象数组。包含所有的图层
		 * @type {Array}
		 */
		this.layerList = [];

		/**
		 * 实例的全局配置项
		 */
		this.config = config?config:{};
		
		/**
		 * 实例的快照管理模块
		 * @type {Ycc.PhotoManager}
		 */
		this.photoManager = Ycc.PhotoManager?new Ycc.PhotoManager(this):null;
		
		/**
		 * ycc的图层管理器
		 * @type {null}
		 */
		this.layerManager = Ycc.LayerManager?new Ycc.LayerManager(this):null;
		
		/**
		 * 系统心跳管理器
		 */
		this.ticker = Ycc.Ticker?new Ycc.Ticker(this):null;
		
		/**
		 * 基础绘图UI。这些绘图操作会直接作用于舞台。
		 * @type {Ycc.UI}
		 */
		this.baseUI = new Ycc.UI(this.stage);
		
		this.init();
	};
	
	/**
	 * 获取舞台的宽
	 */
	win.Ycc.prototype.getStageWidth = function () {
		return this.stage.width;
	};
	
	/**
	 * 获取舞台的高
	 */
	win.Ycc.prototype.getStageHeight = function () {
		return this.stage.height;
	};
	
	/**
	 * 类初始化
	 */
	win.Ycc.prototype.init = function () {
		var self = this;
		// 代理的原生鼠标事件，默认每个图层都触发
		var proxyEventTypes = ["mousemove","mousedown","mouseup","click","mouseenter","mouseout"];
		for(var i = 0;i<proxyEventTypes.length;i++){
			this.stage.addEventListener(proxyEventTypes[i],function (e) {
				var yccEvent = new Ycc.Event(e.type);
				yccEvent.originEvent = e;
				yccEvent.x = parseInt(e.clientX - self.stage.getBoundingClientRect().left);
				yccEvent.y = parseInt(e.clientY - self.stage.getBoundingClientRect().top);
				for(var i=self.layerList.length-1;i>=0;i--){
					var layer = self.layerList[i];
					if(!layer.enableEventManager) continue;
					layer.triggerListener(e.type,yccEvent);
				}
			})
		}
	};
	
	/**
	 * 清除
	 */
	win.Ycc.prototype.clearStage = function () {
		this.ctx.clearRect(0,0,this.getStageWidth(),this.getStageHeight());
	};
	
	/**
	 * 根据ycc.layerList重复舞台
	 */
	win.Ycc.prototype.reRenderStage = function () {
		this.clearStage();
		this.layerManager.renderAllLayerToStage();
	};
})(window);;/**
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
	 * @return {{}} 新的对象
	 */
    Ycc.utils.extend = function(targetObj, obj2,isDeepClone) {
        var newobj = {};
        if(isDeepClone)
            obj2 = Ycc.utils.deepClone(obj2);
        for (var i in targetObj) {
			if(!targetObj.hasOwnProperty(i)) continue;
            newobj[i] = targetObj[i];
            if (obj2 && obj2[i] != null) {
                newobj[i] = obj2[i];
            }
        }
        return newobj;
    };
	
	/**
	 * 合并对象：覆盖target对象的字段。浅拷贝。prototype内的属性也会被覆盖。
	 * @param target	{object}	待覆盖的目标对象
	 * @param src	{object}	源对象
	 */
	Ycc.utils.mergeObject = function(target,src){
		src = src || {};
		for(var key in target){
			if(typeof src[key]!=="undefined"){
				this[key] = option[key];
			}
		}
		return this;
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
	};
	

	
})(window.Ycc);;/**
 * @file    Ycc.Ticker.class.js
 * @author  xiaohei
 * @date    2017/10/26
 * @description  Ycc.Ticker.class文件
 */



(function (Ycc) {
	
	
	/**
	 * 系统心跳管理类。
	 * 管理系统的心跳；自定义帧事件的广播；帧更新图层的更新等。
	 * @param yccInstance
	 * @constructor
	 */
	Ycc.Ticker = function (yccInstance) {
		/**
		 * ycc实例的引用
		 * @type {Ycc}
		 */
		this.yccInstance = yccInstance;
		
		/**
		 * 启动时间戳
		 * @type {number}
		 */
		this.startTime = Date.now();
		
		/**
		 * 上一帧刷新的时间戳
		 * @type {number}
		 */
		this.lastFrameTime = 0;
		
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
		 * 实时帧率
		 * @type {number}
		 */
		this.realTimeFrameRate = this.defaultFrameRate;
		
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
		var frameDeltaTime = 1000/frameRate;
		
		var timer = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
		
		// 初始帧数量设为0
		self.frameAllCount = 0;

		// timer兼容
		timer || (timer = function(e) {
				return window.setTimeout(e, 1e3 / 60);
			}
		);
		// 启动时间
		self.startTime = Date.now();
		// 启动心跳
		self._timerId = timer.call(window, cb);
		self._isRunning = true;
		
		
		// 心跳回调函数。约60fps
		function cb() {
			
			// 当前时间
			var curTime = self.timerTickCount===0?self.startTime:Date.now();

			// 总的心跳数加1
			self.timerTickCount++;

			// 总的心跳时间
			var tickTime = curTime - self.startTime;
			
			// 所有帧刷新总时间，理论值
			var frameTime = self.frameAllCount * frameDeltaTime;

			// 判断是否刷新帧
			if(tickTime > frameTime){
				// 总帧数加1
				self.frameAllCount++;
				// 设置实时帧率
				self.realTimeFrameRate = self.frameAllCount*1000/(curTime-self.startTime);
				// 执行所有自定义的帧监听函数
				self.broadcastFrameEvent();
				// 执行所有图层的帧监听函数
				self.broadcastToLayer();
				
				if((Date.now()-self.lastFrameTime)/frameDeltaTime>3){
					console.warn("第%d帧：",self.frameAllCount);
					console.warn("该帧率已低于正常值的1/3！若相邻帧持续警告，请适当降低帧率，或者提升刷新效率！","正常值：",frameRate," 当前值：",1000/(Date.now()-self.lastFrameTime));
				}
				// 设置上一帧刷新时间
				self.lastFrameTime = Date.now();
			}
			
			// 递归调用心跳函数
			self._timerId = timer.call(window,cb);
		}
		
	};
	
	/**
	 * 停止心跳
	 */
	Ycc.Ticker.prototype.stop = function () {
		var stop = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame;
		stop || (stop = function (id) {
			return window.clearTimeout(id);
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
	
	
	
	
	
	
})(window.Ycc);;/**
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
		/**
		 * 保存加载之后的所有图片资源。键为资源名称；值为Image元素
		 * @type {{}}
		 */
		this.imageRes = {};
	};
	
	
	/**
	 * 加载单个图片资源
	 * @param imageSrc	{String}	图片的路径
	 * @param endCb		{Function}	加载成功的回调
	 * @private
	 */
	Ycc.Loader.prototype._loadImage = function (imageSrc,endCb) {
		var img = new Image();
		img.src = imageSrc;
		img.onload = function () {
			Ycc.utils.isFn(endCb) && endCb(img);
		}
	};
	
	/**
	 * 加载图片资源列表
	 * @param imagesSrc		{Object}	资源列表。键为资源名称；值为资源路径
	 * @param progressCb	{function}	加载进度的回调，每加载成功一个资源都会调用一次
	 * @param endCb			{function}	全部加载完成的回调
	 */
	Ycc.Loader.prototype.loadImageList = function (imagesSrc,endCb,progressCb) {
		var self = this;
		// 已加载图片的个数
		var loadedNum = 0;
		// 资源的名称
		var keys = Object.keys(imagesSrc);
		for(var i =0;i<keys.length;i++){
			var src = imagesSrc[keys[i]];
			this._loadImage(src,(function (key) {
				return function (img) {
					self.imageRes[key] = img;
					loadedNum++;
					Ycc.utils.isFn(progressCb)&&progressCb(img);
					if(loadedNum===keys.length){
						Ycc.utils.isFn(endCb)&&endCb(self.imageRes);
					}
				}
				
			})(keys[i]));
		}
	}
	
	
	
})(window.Ycc);;/**
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
		/**
		 * 事件类型
		 * @type {string}
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
		this.mouseDownYccEvent = null;

		/**
		 * 鼠标抬起的ycc事件
		 * @type {Ycc.Event}
		 */
		this.mouseUpYccEvent = null;

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
		 * 事件触发时，鼠标的坐标与UI的坐标差。即(e.x-target.x,e.y-target.y)
		 * @type {Ycc.Math.Dot|null}
		 */
		this.targetDeltaPosition = null;
		
	}
	
	
	
})(window.Ycc);;/**
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
		this.ondraggend = null;
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
		if(!this.stopType[type])
			Ycc.utils.isFn(this["on"+type]) && this["on"+type].call(this,data);

		var ls = this.listeners[type];
		if(!ls || !Ycc.utils.isArray(ls)) return;
		for(var i=0;i<ls.length;i++){
			if(!this.stopType[type])
				ls[i].call(this,data);
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
	}
	
	
	
	
	
})(window.Ycc);;/**
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
	 * @constructor
	 * @extends Ycc.Listener
	 */
	Ycc.Layer = function(yccInstance,option){
	 	Ycc.Listener.call(this);
	 	

		
		var defaultConfig = {
			name:"",
			type:"ui",
			
			// 图层在舞台的渲染位置
			x:0,
			y:0,
			
			// 图层的高宽
			width:yccInstance.getStageWidth(),
			height:yccInstance.getStageHeight(),
			show:true,
			enableEventManager:false,
			enableFrameEvent:false,
			ctxConfig:{
				fontStyle:"normal",
				fontVariant:"normal",
				fontWeight:"normal",
				fontSize:"16px",
				fontFamily:"微软雅黑",
				font:"16px 微软雅黑",
				textBaseline:"top",
				fillStyle:"red",
				strokeStyle:"blue"
			}
		};
		// 深拷贝
		var config = Ycc.utils.extend(defaultConfig,option,true);
		
		var canvasDom = document.createElement("canvas");
		canvasDom.width = config.width;
		canvasDom.height = config.height;
		
		 /**
		  * 配置项
		  */
		this.option = config;

		/**
		 * 存储图层中的所有UI。UI的顺序，即为图层中的渲染顺序。
		 * @type {Ycc.UI[]}
		 */
		this.uiList = [];
		
		/**
		 * 绘图环境的默认属性配置项
		 * @type {ctxConfig|{}}
		 */
		this.ctxConfig = config.ctxConfig;
		/**
		 * 初始化配置项
		 */
		this.config = config;
		
		/**
		 * ycc实例的引用
		 */
		this.yccInstance = yccInstance;
		/**
		 * 虚拟canvas元素的引用
		 * @type {Element}
		 */
		this.canvasDom = canvasDom;
		
		/**
		 * 画布属性的双向绑定
		 */
		this.canvasDom._props = {};
		
		/**
		 * 当前图层的绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = this.canvasDom.getContext('2d');
		
		/**
		 * 图层id
		 */
		this.id = layerIndex++;
		
		/**
		 * 图层类型。
		 * `ui`表示用于绘图的图层。`tool`表示辅助的工具图层。`text`表示文字图层。
		 * 默认为`ui`。
		 */
		this.type = config.type;
		
		/**
		 * 图层中的文字。仅当图层type为text时有值。
		 * @type {string}
		 */
		this.textValue = "";
		
		/**
		 * 图层名称
		 * @type {string}
		 */
		this.name = config.name?config.name:"图层_"+this.type+"_"+this.id;
		
		/**
		 * 图层位置的x坐标。默认与舞台左上角重合
		 * @type {number}
		 */
		this.x = config.x;
		
		/**
		 * 图层位置的Y坐标。默认与舞台左上角重合
		 * @type {number}
		 */
		this.y = config.y;
		
		/**
		 * 图层宽
		 * @type {number}
		 */
		this.width = config.width;
		/**
		 * 图层高
		 * @type {number}
		 */
		this.height = config.height;
		
		/**
		 * 图层是否显示
		 */
		this.show = config.show;
		
		/**
		 * 是否监听舞台的事件。用于控制舞台事件是否广播至图层。默认关闭
		 * @type {boolean}
		 */
		this.enableEventManager = config.enableEventManager;
		
		/**
		 * 是否接收每帧更新的通知
		 * @type {boolean}
		 */
		this.enableFrameEvent = config.enableFrameEvent;
		
		/**
		 * 若接收通知，此函数为接收通知的回调函数。当且仅当enableFrameEvent为true时生效
		 * @type {function}
		 */
		this.onFrameComing = function () {};
		
		this.init();
	};
	Ycc.Layer.prototype = new Ycc.Listener();
	Ycc.Layer.prototype.constructor = Ycc.Layer;
	
	/**
	 * 初始化
	 * @return {null}
	 */
	Ycc.Layer.prototype.init = function () {
		var self = this;
		// 初始化画布的属性
		if(!this.ctxConfig || !Ycc.utils.isObj(this.ctxConfig))
			return null;
		// 设置画布的所有属性
		self._setCtxProps();
		self._initEvent();
		//双向绑定ctx的属性
		var ctxConfig = this.ctxConfig;
		for(var key in ctxConfig){
			if(!ctxConfig.hasOwnProperty(key)) continue;
			Object.defineProperty(this.ctx.canvas._props,key,{
				enumerable : true,
				configurable : true,
				set : (function(k){
					return function (newValue) {
						// 修改_props的属性后自动设置画布的属性
						self.ctxConfig[k] = newValue;
						self._setCtxProps();
					};
				})(key),
				get:(function(k){
					return function () {
						return self.ctxConfig[k];
					};
				})(key)
			})
		}
		
		
	};
	
	/**
	 * 事件的初始化。
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
				var dragendEvent = new Ycc.Event("dragend");
				dragendEvent.x = e.x;
				dragendEvent.y = e.y;
				dragendEvent.mouseDownYccEvent = mouseDownYccEvent;
				self.triggerListener("dragend",dragendEvent);
				if(mouseDownYccEvent.target){
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
					var dragStartEvent = new Ycc.Event("dragstart");
					dragStartEvent.x = mouseDownYccEvent.x;
					dragStartEvent.y = mouseDownYccEvent.y;
					dragStartEvent.mouseDownYccEvent = mouseDownYccEvent;
					
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
				var draggingEvent = new Ycc.Event("dragging");
				draggingEvent.x = e.x;
				draggingEvent.y = e.y;
				draggingEvent.mouseDownYccEvent = mouseDownYccEvent;
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
		 * @param e	{Ycc.Event}	ycc事件
		 */
		function defaultMouseListener(e) {
			if(e.stop) return;
			for(var i = self.uiList.length-1;i>=0;i--){
				var ui = self.uiList[i];
				// 图层内部UI的相对坐标
				var layerX = e.x - ui.belongTo.x;
				var layerY = e.y - ui.belongTo.y;
				var dot = new Ycc.Math.Dot(layerX,layerY);
				// 如果位于rect内，并且事件未被阻止，触发事件,并阻止继续传递
				if(ui.rect && dot.isInRect(ui.rect) && e.stop===false){
					e.stop = true;
					e.mouseDownYccEvent = mouseDownYccEvent;
					e.mouseUpYccEvent = mouseUpYccEvent;
					e.target = ui;
					e.targetDeltaPosition = new Ycc.Math.Dot(e.x-ui.rect.x,e.y-ui.rect.y);
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
	Ycc.Layer.prototype._setCtxProps = function () {
		var self = this;
		var ctxConfig = this.ctxConfig;
		ctxConfig["font"] = [ctxConfig.fontStyle,ctxConfig.fontVariant,ctxConfig.fontWeight,ctxConfig.fontSize,ctxConfig.fontFamily].join(" ");
		for(var key in self.ctxConfig){
			if(!self.ctxConfig.hasOwnProperty(key)) continue;
			self.ctx[key] = self.ctxConfig[key];
		}
	};
	
	
	/**
	 * 清除图层
	 */
	Ycc.Layer.prototype.clear = function () {
		this.ctx.clearRect(0,0,this.width,this.height);
	};
	
	
	/**
	 * 渲染图层至舞台
	 */
	Ycc.Layer.prototype.renderToStage = function () {
		if(this.show)
			this.yccInstance.ctx.drawImage(this.canvasDom,0,0,this.width,this.height);
	};
	
	/**
	 * 添加一个UI图形至图层
	 * @param ui {Ycc.UI}	UI图形
	 */
	Ycc.Layer.prototype.addUI = function (ui) {
		ui.init(this);
		this.uiList.push(ui);
	};
	
	/**
	 * 删除图层内的某个UI图形
	 * @param ui
	 */
	Ycc.Layer.prototype.removeUI = function (ui) {
		var index = this.uiList.indexOf(ui);
		if(index!==-1){
			this.uiList.splice(index,1);
		}
	};
	
	/**
	 * 渲染Layer。
	 * <br>注意：并没有渲染至舞台。
	 */
	Ycc.Layer.prototype.render = function () {
		for(var i=0;i<this.uiList.length;i++){
			this.uiList[i].render();
		}
	};
	
	/**
	 * 重绘图层。
	 * <br>注意：并没有渲染至舞台。
	 */
	Ycc.Layer.prototype.reRender = function () {
		this.clear();
		for(var i=0;i<this.uiList.length;i++){
			this.uiList[i].computeUIProps();
			this.uiList[i].render();
		}
	}
	
	
})(window.Ycc);;/**
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
	 * 将可显示的所有图层渲染至舞台。
	 */
	Ycc.LayerManager.prototype.renderAllLayerToStage = function () {
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			// 该图层是否可见
			if(layer.show)
				this.yccInstance.ctx.drawImage(layer.canvasDom,layer.x,layer.y,layer.width,layer.height);
		}
	};
	
	/**
	 * 重新将所有图层绘制至舞台。不显示的图层也会更新。
	 */
	Ycc.LayerManager.prototype.reRenderAllLayerToStage = function () {
		this.yccInstance.clearStage();
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			layer.reRender();
			// 该图层是否可见
			if(layer.show)
				this.yccInstance.ctx.drawImage(layer.canvasDom,layer.x,layer.y,layer.width,layer.height);
		}
	};
	
	
	
	/**
	 * 依次合并图层。队列后面的图层将被绘制在前面图层之上。
	 * @param layerArray {Layer[]}	图层队列
	 * @return {*}
	 */
	Ycc.LayerManager.prototype.mergeLayers = function (layerArray) {
		var len = layerArray.length;
		if(len===0) return null;
		var resLayer = new Ycc.Layer(this.yccInstance,{name:"合并图层"});
		for(var i = 0;i<len;i++){
			var layer = layerArray[i];
			resLayer.ctx.drawImage(layer.canvasDom,0,0,layer.width,layer.height);
			layer = null;
		}
		this.yccInstance.layerList = [];
		this.yccInstance.layerList.push(resLayer);
		return resLayer;
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
	};
	
	
	
})(window.Ycc);;/**
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
	
	
	
	
	
	
})(window.Ycc);;/**
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
	

	
	
	















})(window.Ycc);;/**
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
		 * UI的唯一ID
		 * @type {number}
		 */
		this.uid = uid++;
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
	Ycc.UI.Base.prototype.constructor = Ycc.UI.Base;
	
	
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
	}



})(window.Ycc);;/**
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
	 * @param option.fill=true {boolean}	填充or描边
	 * @param option.color=black {string} 圆的颜色
	 * @param option.point {Ycc.Math.Dot} 圆心位置
	 * @param option.r=black {number} 圆的半径
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Ellipse = function Ellipse(option) {
		Ycc.UI.Base.call(this,option);
		
		this.point = new Ycc.Math.Dot();
		this.width = 20;
		this.height = 10;
		this.angle = 0;
		
		// centrePoint,width,height,rotateAngle,fill
		
		this.color = "black";
		this.fill = false;
		
		this.extend(option);
	};
	Ycc.UI.Ellipse.prototype = new Ycc.UI.Base();
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
		this.renderRectBgColor();
		
		var width = this.width,
			rotateAngle=this.angle,
			height=this.height;
		this.ctx.save();
		var r = (width > height) ? width : height;
		// 计算压缩比例
		var ratioX = width / r;
		var ratioY = height / r;
		// 默认旋转中心位于画布左上角，需要改变旋转中心点
		this.ctx.translate(this.point.x,this.point.y);
		this.ctx.rotate(parseInt(rotateAngle)*Math.PI/180);
		// 再变换回原来的旋转中心点
		this.ctx.translate(-this.point.x,-this.point.y);
		// this.ctx.scale(1, 1);
		this.ctx.scale(ratioX, ratioY);
		this.ctx.beginPath();
		this.ctx.arc(this.point.x / ratioX,  this.point.y/ ratioY, r/2, 0, 2 * Math.PI, false);
		this.ctx.closePath();
		
		this.ctx.fillStyle = this.ctx.strokeStyle = this.color;
		if(!this.fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		
		this.ctx.restore();
	};
	
	
	
	
	
})(window.Ycc);;/**
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
	 * 		<br> none -- 无填充方式。左上角对齐，超出隐藏，不修改rect大小。
	 * 		<br> repeat -- 重复。左上角对齐，重复平铺图片，不修改rect大小，超出隐藏。
	 * 		<br> scale -- 缩放。左上角对齐，缩放至整个rect区域，不修改rect大小。
	 * 		<br> auto -- 自动。左上角对齐，rect大小自动适配图片。若图片超出rect，会动态修改rect大小。
	 * 		<br> scale9Grid -- 9宫格模式填充。左上角对齐，中间区域将拉伸，不允许图片超出rect区域大小，不会修改rect大小。
	 * @param option.res	{Image}	需要填充的图片资源。注：必须已加载完成。
	 * @param option.scale9GridRect	{Ycc.Math.Rect}	9宫格相对于res图片的中间区域，当且仅当fillMode为scale9Grid有效。
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Image = function (option) {
		Ycc.UI.Base.call(this,option);
		
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
		 * 9宫格相对于res图片的中间区域，当且仅当fillMode为scale9Grid有效。
		 * @type {Ycc.Math.Rect}
		 */
		this.scale9GridRect=null;
		

		this.extend(option);
	};
	Ycc.UI.Image.prototype = new Ycc.UI.Base();
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
	 * 绘制
	 */
	Ycc.UI.Image.prototype.render = function () {
		this.renderRectBgColor();
		
		var rect = this.rect;
		var img = this.res;
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.rect(rect.x,rect.y,rect.width,rect.height);
		this.ctx.closePath();
		this.ctx.fillStyle = this.rectBgColor;
		this.ctx.fill();
		this.ctx.restore();


		if(this.fillMode === "none")
			this.ctx.drawImage(this.res,0,0,rect.width,rect.height,rect.x,rect.y,rect.width,rect.height);
		else if(this.fillMode === "scale")
			this.ctx.drawImage(this.res,0,0,img.width,img.height,rect.x,rect.y,rect.width,rect.height);
		else if(this.fillMode === "auto"){
			this.ctx.drawImage(this.res,0,0,img.width,img.height,rect.x,rect.y,rect.width,rect.height);
		}else if(this.fillMode === "repeat"){
			// x,y方向能容纳的img个数
			var wCount = parseInt(rect.width/img.width)+1;
			var hCount = parseInt(rect.height/img.height)+1;

			for(var i=0;i<wCount;i++){
				for(var j=0;j<hCount;j++){
					var xRest = img.width;
					var yRest = img.height;
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
		
		
	};
	
	
	
})(window.Ycc);;/**
 * @file    Ycc.UI.Line.class.js
 * @author  xiaohei
 * @date    2017/11/17
 * @description  Ycc.UI.Line.class文件
 */


(function (Ycc) {
	
	/**
	 * 线段。可设置属性如下
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.start	{Ycc.Math.Dot}	起点
	 * @param option.end	{Ycc.Math.Dot}	终点
	 * @param option.width=1	{number}	线条宽度
	 * @param option.color="black"	{string}	线条颜色
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Line = function Line(option) {
		Ycc.UI.Base.call(this,option);
		
		this.start = new Ycc.Math.Dot(0,0);
		this.end = new Ycc.Math.Dot(0,0);
		this.width = 1;
		this.color = "black";
		
		this.extend(option);
	};
	Ycc.UI.Line.prototype = new Ycc.UI.Base();
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
		this.renderRectBgColor();
		
		this.ctx.save();
		this.ctx.strokeStyle = this.color;
		this.ctx.strokeWidth = this.width;
		
		this.ctx.beginPath();
		this.ctx.moveTo(this.start.x, this.start.y);
		this.ctx.lineTo(this.end.x, this.end.y);
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
	};
	
	
	
	
	
})(window.Ycc);;/**
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
	Ycc.UI.MultiLineText.prototype = new Ycc.UI.Base();
	Ycc.UI.MultiLineText.prototype.constructor = Ycc.UI.MultiLineText;
	
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.MultiLineText.prototype.computeUIProps = function () {
		var self = this;
		// 文本行
		var lines = this.content.split(/(?:\r\n|\r|\n)/);
		// 待显示的文本行
		this.displayLines = getRenderLines();
		if(config.overflow === "auto"){
			config.rect.height = config.lineHeight*renderLines.length;
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
		this.renderRectBgColor();
		
		var self = this;
		
		self.ctx = ctx || self.ctx;
		
		if(!self.ctx){
			console.error("[Ycc error]:","ctx is null !");
			return;
		}
		
		
		// 引用
		var config = this;
		
		this.ctx.save();
		this.ctx.fillStyle = config.color;
		this.ctx.strokeStyle = config.color;
		
		// 绘制
		for(var i = 0;i<self.displayLines.length;i++){
			var x = config.rect.x;
			var y = config.rect.y + i*config.lineHeight;
			if(y+config.lineHeight>config.rect.y+config.rect.height){
				break;
			}
			this.baseUI.text([x,y],self.displayLines[i],config.fill);
		}
		this.ctx.restore();
	};
	
	
	
})(window.Ycc);;/**
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
	Ycc.UI.Rect.prototype = new Ycc.UI.Base();
	Ycc.UI.Rect.prototype.constructor = Ycc.UI.Rect;
	
	/**
	 * 绘制
	 */
	Ycc.UI.Rect.prototype.render = function () {
		this.renderRectBgColor();
		
		var rect = this.rect;

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
	
	
	
	
})(window.Ycc);;/**
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
		
		/**
		 * 控制点的大小
		 * @type {number}
		 */
		this.ctrlSize = 6;
		
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
		
		this.extend(option);
		
		this._initUI();
	};
	Ycc.UI.CropRect.prototype = new Ycc.UI.Base();
	Ycc.UI.CropRect.prototype.constructor = Ycc.UI.CropRect;
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 */
	Ycc.UI.CropRect.prototype.computeUIProps = function () {
		var rect = this.rect;
		this.ctrlRect1 = (new Ycc.Math.Rect(rect.x,rect.y,this.ctrlSize,this.ctrlSize));
		this.ctrlRect2 = (new Ycc.Math.Rect(rect.x+rect.width-this.ctrlSize,rect.y,this.ctrlSize,this.ctrlSize));
		this.ctrlRect3 = (new Ycc.Math.Rect(rect.x,rect.y+rect.height-this.ctrlSize,this.ctrlSize,this.ctrlSize));
		this.ctrlRect4 = (new Ycc.Math.Rect(rect.x+rect.width-this.ctrlSize,rect.y+rect.height-this.ctrlSize,this.ctrlSize,this.ctrlSize));
	};
	
	/**
	 * 初始化UI
	 * @private
	 */
	Ycc.UI.CropRect.prototype._initUI = function () {
		this.userData = this.userData?this.userData:{};
		this.addListener("dragstart",function (e) {
			this.userData.ctrlStart = 0;
			this.userData.dragStartPosition = new Ycc.Math.Rect(this.rect);
			var dot = new Ycc.Math.Dot(e);
			for(var i=1;i<=4;i++){
				if(dot.isInRect(this["ctrlRect"+i])){
					this.userData.ctrlStart = i;
					return null;
				}
			}
		});
		
		this.addListener("dragging",function (e) {
			var r = this.userData.dragStartPosition;
			var x,y,width,height;
			// 控制点的拖拽事件
			if(this.userData.ctrlStart<=4&&this.userData.ctrlStart>=1){
				if(this.userData.ctrlStart===1 ){
					x = e.x;
					y = e.y;
					width = r.width-(e.x-r.x);
					height = r.height-(e.y-r.y);
					if(x<=r.x+r.width-this.ctrlSize*2)
						this.rect.x = x;
					if(y<=r.y+r.height-this.ctrlSize*2)
						this.rect.y = y;
					
				}
				if(this.userData.ctrlStart===2){
					x = r.x;
					y = e.y;
					width = e.x-r.x;
					height = r.height-(e.y-r.y);
					this.rect.x = x;
					if(y<=r.y+r.height-this.ctrlSize*2)
						this.rect.y = y;
				}
				if(this.userData.ctrlStart===3){
					x = e.x;
					y = r.y;
					width = r.width-(e.x-r.x);
					height = e.y - r.y;
					if(x<=r.x+r.width-this.ctrlSize*2)
						this.rect.x = x;
					this.rect.y = y;
				}
				if(this.userData.ctrlStart===4){
					this.rect.x = r.x;
					this.rect.y = r.y;
					this.rect.width = (e.x-r.x);
					this.rect.height = (e.y-r.y);
				}
				
				
				if(width>=this.ctrlSize*2)
					this.rect.width = width;
				if(height>=this.ctrlSize*2)
					this.rect.height = height;
				
			}else{
				// 选框的拖拽事件
				this.rect.x = e.x-e.mouseDownYccEvent.targetDeltaPosition.x;
				this.rect.y = e.y-e.mouseDownYccEvent.targetDeltaPosition.y;
			}
			if(this.rect.width<=this.ctrlSize*2){
				this.rect.width = this.ctrlSize*2;
			}
			if(this.rect.height<=this.ctrlSize*2){
				this.rect.height = this.ctrlSize*2;
			}

			/**
			 * @todo 此处是否在UI内渲染，有待考虑
			 */
			this.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
		});
	};
	
	/**
	 * 绘制
	 */
	Ycc.UI.CropRect.prototype.render = function () {
		this.renderRectBgColor();
		
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
	};
	
	
	
	
})(window.Ycc);;/**
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
		
		/**
		 * 区域内显示的文本
		 * @type {string}
		 */
		this.displayContent = "";
		
		this.content = "";
		this.fontSize = "16px";
		this.fill = true;
		this.color = "black";
		/**
		 * @todo  未实现
		 * @type {string}
		 */
		this.xAlign = "left";
		this.yAlign = "center";
		this.overflow = "auto";

		this.extend(option);
	};
	Ycc.UI.SingleLineText.prototype = new Ycc.UI.Base();
	Ycc.UI.SingleLineText.prototype.constructor = Ycc.UI.SingleLineText;
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.SingleLineText.prototype.computeUIProps = function () {
		var self = this;
		
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
	};
	/**
	 * 渲染至ctx
	 * @param ctx
	 */
	Ycc.UI.SingleLineText.prototype.render = function (ctx) {
		this.renderRectBgColor();
		
		var self = this;

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
		
		x = option.rect.x;
		y = option.rect.y;
		
		if(fontSize>option.rect.height){
			return console.warn("[Ycc warning] : ","行高不够，或者文字太大！",option);
		}
		// 上下居中
		if(option.yAlign==="center"){
			y = y+option.rect.height/2-fontSize/2;
		}
		
		this.ctx.save();
		this.ctx.fillStyle = option.color;
		this.ctx.strokeStyle = option.color;
		this.baseUI.text([x,y],self.displayContent,option.fill);
		this.ctx.restore();
	};
	
	
	
})(window.Ycc);