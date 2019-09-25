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
			// 总的心跳数加1
			self.timerTickCount++;
			if(self.timerTickCount - self.lastFrameTickerCount === self.tickerSpace){
				// 设置 总帧数加1
				self.frameAllCount++;
				// 设置 两帧的时间差
				self.deltaTime = performance.now()-self.lastFrameTime;
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
	
	
	
	
	
	
})(Ycc);