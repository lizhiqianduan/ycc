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
			longTap:false
		};
		tracer.onlifestart = function (life) {
			// 多个触摸点的情况
			if(tracer.currentLifeList.length>1){
				prevent.tap=false;
				preLife = tracer.currentLifeList[0];
				curLife = tracer.currentLifeList[1];
				return this;
			}
			
			// 一个触摸点的情况
			prevent.tap = false;
			prevent.longTap = false;
			curLife = life;
			
			//长按事件
			setTimeout(function () {
				if(!prevent.longTap)
					self.triggerListener('longtap',life.startTouchEvent);
			},750);
		};
		tracer.onlifechange = function (life) {
			if(tracer.currentLifeList.length>1){
				prevent.tap=true;
				prevent.longTap=true;
				return this;
			}
			
			// 只有一个触摸点的情况
			if(life.moveTouchEventList.length>0){
				var firstMove = life.startTouchEvent;
				var lastMove = Array.prototype.slice.call(life.moveTouchEventList,-1)[0];
				self.triggerListener('log',Math.abs(lastMove.pageX-firstMove.pageX));
				if(Math.abs(lastMove.pageX-firstMove.pageX)>10 || Math.abs(lastMove.pageY-firstMove.pageY)>10){
					prevent.tap=true;
					prevent.longTap=true;
				}
			}
			
		};
		tracer.onlifeend = function (life) {
			if(!prevent.tap && life.endTime-life.startTime<300)
				self.triggerListener('tap',life.endTouchEvent);
		};
		
	};


})(window.Ycc);
