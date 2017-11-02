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
		this.frameRate = 100;
		
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
		
		/**
		 * 总心跳次数
		 * @type {number}
		 */
		this.timerTickCount = 0;
		
	};
	
	
	/**
	 * 定时器开始
	 */
	Ycc.Timer.prototype.start = function () {
		var self = this;
		// 每帧理论的间隔时间
		var frameDeltaTime = 1000/self.frameRate;
		
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
		timer.call(window, cb);
		
		
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

			// 判断是否刷新帧 todo:耗时操作时的帧处理
			if(tickTime>frameTime){
				// 总帧数加1
				self.frameAllCount++;
				// 设置实时帧率
				self.realTimeFrameRate = self.frameAllCount*1000/(curTime-self.startTime);
				// 执行所有自定义的帧监听函数
				self.broadcastFrameEvent();
				// 执行所有图层的帧监听函数
				self.broadcastToLayer();
				
				console.log("总帧率： ",self.realTimeFrameRate);
				
				// 设置上一帧刷新时间
				self.lastFrameTime = Date.now();
			}
			
			// 递归调用心跳函数
			timer.call(window,cb);
		}
		
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