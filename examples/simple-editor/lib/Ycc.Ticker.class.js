/**
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
	
	
	
	
	
	
})(window.Ycc);