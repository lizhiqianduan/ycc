/**
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
	
	/**
	 *
	 * @private
	 * @TODO 触点个数判断
	 */
	Ycc.Gesture.prototype._init = function () {
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
			// 多个触摸点的情况
			if(tracer.currentLifeList.length>1){
				prevent.tap=false;
				preLife = tracer.currentLifeList[0];
				curLife = tracer.currentLifeList[1];
				return this;
			}
			
			// 只有一个触摸点的情况
			prevent.tap = false;
			prevent.swipe = false;
			
			//长按事件
			this._longTapTimeout = setTimeout(function () {
				self.triggerListener('longtap',life.startTouchEvent);
			},750);
		};
		tracer.onlifechange = function (life) {
			if(tracer.currentLifeList.length>1){
				prevent.tap=true;
				prevent.swipe=true;
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
			
			if(tracer.currentLifeList.length===0){
				
				// 开始和结束时间在300ms内，认为是tap事件
				if(!prevent.tap && life.endTime-life.startTime<300){
					self.triggerListener('tap',life.endTouchEvent);
					// 取消长按事件
					clearTimeout(this._longTapTimeout);
					
					// 两次点击在300ms内，并且两次点击的范围在10px内，则认为是doubletap事件
					if(preLife && life.endTime-preLife.endTime<300 && Math.abs(preLife.endTouchEvent.pageX-life.endTouchEvent.pageX)<10&& Math.abs(preLife.endTouchEvent.pageY-life.endTouchEvent.pageY)<10){
						self.triggerListener('doubletap',life.endTouchEvent);
						preLife = null;
						return this;
					}
					preLife=life;
					return this;
				}
				
				console.log('swipe');
				// 如果触摸点按下期间存在移动行为，且移动范围大于30px，触摸时间在200ms内，则认为该操作是swipe
				if(!prevent.swipe && life.endTime-life.startTime<300 ){
					var firstMove = life.startTouchEvent;
					var lastMove = Array.prototype.slice.call(life.moveTouchEventList,-1)[0];
					if(Math.abs(lastMove.pageX-firstMove.pageX)>30 || Math.abs(lastMove.pageY-firstMove.pageY)>30){
						
						self.triggerListener('log','swipe'+self._getSwipeDirection(life));
						self.triggerListener('swipe'+self._getSwipeDirection(life),life.endTouchEvent);
					}
					return this;
				}
			}
		};
		
	};
	
	/**
	 * 获取某个触摸点的swipe方向
	 * @param life
	 * @private
	 */
	Ycc.Gesture.prototype._getSwipeDirection = function (life) {
		var x1=life.startTouchEvent.pageX,
			x2=life.endTouchEvent.pageX,
			y1=life.startTouchEvent.pageY,
			y2=life.endTouchEvent.pageY;
		return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'left' : 'right') : (y1 - y2 > 0 ? 'up' : 'down');
	};


})(window.Ycc);
