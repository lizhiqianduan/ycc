/**
 * @file    Ycc.EventManager.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description  Ycc.EventManager.class文件。
 * 	Ycc实例的事件管理类
 * @requires Ycc.utils
 */


(function (Ycc) {
	

	/**
	 * 空函数
	 */
	var noop = function () {};
	
	/**
	 * 事件的数据结构类
	 * @param type {String}	事件类型
	 * @constructor
	 */
	var YccEvent = function (type) {
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
		
	};
	
	
	
	
	
	
	
	
	/**
	 * Ycc实例的事件管理类。
	 * 此类会托管原生的事件，剔除多余事件属性，保留必要属性。
	 * 还会根据情况生成一些其他事件，方便使用。
	 * 每个EventManager都跟一个canvas元素绑定。
	 * @param canvasDom	{HTMLElement}
	 * @constructor
	 */
	Ycc.EventManager = function (canvasDom) {
		/**
		 * Ycc实例
		 * @type {HTMLElement}
		 */
		this.canvasDom = canvasDom;
		
		/**
		 * 鼠标是否按下的标识
		 * @type {boolean}
		 */
		this.mouseDown = false;

		/**
		 * 鼠标按下时的YccEvent
		 * @type {YccEvent}
		 */
		this.mouseDownEvent = null;

		/**
		 * 鼠标是否正在移动的标识
		 * @type {boolean}
		 */
		this.mouseMoving = false;
		
		
		
		
		// 初始化
		this.init();
	};
	

	
	Ycc.EventManager.prototype.init = function () {
		var self = this;
		// canvas元素
		var dom = this.canvasDom;

		// 托管的事件类型
		var proxyEventTypes = ["mousemove","mousedown","mouseup","click"];
		// var proxyEventTypes = ["mousedown"];
		
		for(var i = 0;i<proxyEventTypes.length;i++){
			var type = proxyEventTypes[i];
			dom.addEventListener(type,filterOriginEvent(type,self));
		}
	};
	
	// 托管的原生事件
	/**
	 * 托管原生的鼠标移动事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.onmousemove = function (e) {};
	/**
	 * 托管原生的鼠标按下事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.onmousedown = function (e) {};
	/**
	 * 托管原生的鼠标抬起事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.onmouseup = function (e) {};
	/**
	 * 托管原生的鼠标点击事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.onclick = function (e) {};
	
	
	// 由原生事件组合的自定义事件
	/**
	 * 自定义鼠标拖拽事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.ondragging = function (e) {};
	/**
	 * 自定义鼠标拖拽结束事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.ondragend = function (e) {};
	



	/**
	 * 代理原生事件
	 * @param _type					原生js的事件类型
	 * @param eventManagerInstance	事件管理模块的实例
	 * @returns {Function}
	 */
	function filterOriginEvent(_type,eventManagerInstance) {
		
		/**
		 * @param e 原生js的事件实例
		 */
		return function (e) {
			
			// ycc事件实例
			var yccEvent = new YccEvent();
			yccEvent.type = _type;
			yccEvent.originEvent = e;
			yccEvent.x = e.clientX - eventManagerInstance.canvasDom.getBoundingClientRect().left;
			yccEvent.y = e.clientY - eventManagerInstance.canvasDom.getBoundingClientRect().top;
			
			/**
			 * 鼠标按下事件
			 */
			if(_type === "mousedown"){
				// 修改标识、初始化
				eventManagerInstance.mouseDown = true;
				eventManagerInstance.mouseMoving = false;
				eventManagerInstance.mouseDownEvent = yccEvent;
				// 触发ycc托管的事件
				Ycc.utils.isFn(eventManagerInstance["on"+_type])&&eventManagerInstance["on"+_type](yccEvent);
				return null;
			}
			
			/**
			 * 鼠标移动事件
			 */
			if(_type === "mousemove"){
				// 修改标识
				eventManagerInstance.mouseMoving = true;
				eventManagerInstance["on"+_type](yccEvent);
				// 实测某些浏览器坐标位置没改变，移动事件仍然触发。此处进行过滤
				if(eventManagerInstance.mouseDown && (yccEvent.x!==eventManagerInstance.mouseDownEvent.x ||  yccEvent.y!==eventManagerInstance.mouseDownEvent.y)){
					yccEvent.type = "dragging";
					yccEvent.originEvent = e;
					// 触发ycc自定义事件
					Ycc.utils.isFn(eventManagerInstance["on"+yccEvent.type])&&eventManagerInstance["on"+yccEvent.type](yccEvent);
				}
				// 触发ycc托管的事件
				Ycc.utils.isFn(eventManagerInstance["on"+_type])&&eventManagerInstance["on"+_type](yccEvent);
				return null;
			}
			
			/**
			 * 鼠标抬起事件
			 */
			if(_type === "mouseup"){
				// 修改标识
				eventManagerInstance.mouseDown = false;
				eventManagerInstance.mouseMoving = false;
				// 触发ycc托管的事件
				Ycc.utils.isFn(eventManagerInstance["on"+_type])&&eventManagerInstance["on"+_type](yccEvent);
				return null;
			}
			
			/**
			 * 鼠标点击事件
			 */
			if(_type === "click"){
				// 修改标识
				eventManagerInstance.mouseDown = false;
				eventManagerInstance.mouseMoving = false;
				// 触发ycc托管的事件
				Ycc.utils.isFn(eventManagerInstance["on"+_type])&&eventManagerInstance["on"+_type](yccEvent);
				return null;
			}
			

			

		};
	}
	
	
	
	
	
})(window.Ycc);