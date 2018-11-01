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
		
		var timer = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
		
		// 初始帧数量设为0
		self.frameAllCount = 0;

		// timer兼容
		timer || (timer = function(e) {
				return window.setTimeout(e, 1e3 / 60);
			}
		);
		// 启动时间
		self.startTime = performance.now();
		// 启动心跳
		self._timerId = timer.call(window, cb);
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
			if(tickTime > frameTime){
				// 总帧数加1
				self.frameAllCount++;
				// 执行所有自定义的帧监听函数
				self.broadcastFrameEvent();
				// 执行所有图层的帧监听函数
				self.broadcastToLayer();
				// 两帧的时间差
				self.deltaTime = performance.now()-self.lastFrameTime;
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