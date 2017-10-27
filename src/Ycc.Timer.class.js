/**
 * @file    Ycc.Timer.class.js
 * @author  xiaohei
 * @date    2017/10/26
 * @description  Ycc.Timer.class文件
 */



(function (Ycc) {
	
	
	/**
	 * 定时器类
	 * @param yccInstance
	 * @constructor
	 */
	Ycc.Timer = function (yccInstance) {
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
		this.frameRate = 30;
		
		/**
		 * 实时帧率
		 * @type {number}
		 */
		this.realTimeFrameRate = this.frameRate;
		
		/**
		 * 总帧数
		 * @type {number}
		 */
		this.frameAllCount = 0;
		
	};
	
	
	/**
	 * 定时器开始
	 */
	Ycc.Timer.prototype.start = function () {
		var self = this;
		self.frameAllCount = 0;
		self.startTime = Date.now();
		
		function cb() {
			self.frameAllCount++;

			var curTime = Date.now();
			var deltaTime = curTime - self.lastFrameTime;
			self.lastFrameTime = curTime;
			// 实时帧率
			self.realTimeFrameRate = 1000/(deltaTime);
			
			// todo:控制帧率
			if(self.realTimeFrameRate>self.frameRate){
			
			}
			
			
			
			
			console.log(self.realTimeFrameRate);
			
			self.broadcastFrameEvent();
			self.broadcastToLayer();
			
			
			timer.call(window,cb);
		}
		var timer = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
		timer || (timer = function(e) {
				return window.setTimeout(e, 1e3 / self.frameRate);
			}
		);
		timer.call(window, cb);
	};
	
	/**
	 * 给每帧添加自定义的监听函数
	 * @param listener
	 */
	Ycc.Timer.prototype.addFrameListener = function (listener) {
		this.frameListenerList.push(listener);
	};
	
	
	/**
	 * 执行所有自定义的帧监听函数
	 */
	Ycc.Timer.prototype.broadcastFrameEvent = function () {
		for(var i =0;i<this.frameListenerList.length;i++){
			var listener = this.frameListenerList[i];
			Ycc.utils.isFn(listener) && listener();
		}
	};
	
	/**
	 * 执行所有图层的监听函数
	 */
	Ycc.Timer.prototype.broadcastToLayer = function () {
		for(var i = 0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			layer.show && layer.enableFrameEvent && layer.update();
		}
	};
	
	
	
	
	
	
})(window.Ycc);