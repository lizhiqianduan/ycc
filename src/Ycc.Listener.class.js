/**
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

		var ls = this.listeners[type];
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
	
	
	
	
	
})(window.Ycc);