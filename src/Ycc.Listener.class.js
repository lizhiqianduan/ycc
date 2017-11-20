/**
 * @file    Ycc.Listener.class.js
 * @author  xiaohei
 * @date    2017/11/16
 * @description  Ycc.Listener.class文件
 */




(function (Ycc) {
	
	
	Ycc.Listener = function () {
		/**
		 * 所有的监听器。key为type，val为listener数组。
		 * @type {{}}
		 */
		this.listeners = {};
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
		this.listeners[type].push(listener);
	};
	
	/**
	 * 触发某一类型的监听器
	 * @param type
	 * @param data
	 */
	Ycc.Listener.prototype.triggerListener = function (type,data) {
		Ycc.utils.isFn(this["on"+type]) && this["on"+type].call(this,data);
		
		var ls = this.listeners[type];
		if(!ls || !Ycc.utils.isArray(ls)) return;
		for(var i=0;i<ls.length;i++){
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
	
	
	
	
	
})(window.Ycc);