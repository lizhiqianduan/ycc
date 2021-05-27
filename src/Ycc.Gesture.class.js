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
	 * @param option.useMulti {boolean} 是否启用多点触控。对于无多点触控的项目，关闭多点触控，可节省性能消耗。默认启用
	 * @extends Ycc.Listener
	 * @constructor
	 */
	Ycc.Gesture = function (option) {
		Ycc.Listener.call(this);
		this.yccClass = Ycc.Gesture;
		option = option||{};
		/**
		 *
		 * @type {{useMulti: boolean, target: null}}
		 */
		this.option = {
			target:null,
			useMulti:true
		};
		// 合并参数
		Ycc.utils.extend(this.option,option);
		
		/**
		 * 长按事件的定时器id
		 * @type {null}
		 * @private
		 */
		this._longTapTimeout = null;

		/**
		 * 多点触摸是否正处于接触中
		 * @type {Bolean}
		 * @private
		 */
		this.ismutiltouching = false;
		
		this._init();
	};
	Ycc.Gesture.prototype = new Ycc.Listener();
	
	
	
	
	Ycc.Gesture.prototype._init = function () {
		if(Ycc.utils.isMobile()){
			console.log('mobile gesture init...');
			this._initForMobile();
		}else{
			console.log('pc gesture init...');
			this._initForPC();
		}
	};
	
	/**
	 * 初始化移动端的手势
	 * @private
	 */
	Ycc.Gesture.prototype._initForMobile = function () {
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

			self.triggerListener('tap',self._createEventData(life.startTouchEvent,'tap'));
			self.triggerListener('log','tap triggered');

			// 触发拖拽开始事件
			self.triggerListener('dragstart',self._createEventData(life.startTouchEvent,'dragstart'));

			// 多个触摸点的情况
			if(tracer.currentLifeList.length>1){
				self.ismutiltouching = true;
				// 判断是否启用多点触控
				if(!self.option.useMulti) return;

				self.triggerListener('log','multi touch start ...');
				self.triggerListener('multistart',tracer.currentLifeList);
				
				prevent.tap = false;
				prevent.swipe = false;
				clearTimeout(this._longTapTimeout);
				// 缩放、旋转只取最先接触的两个点即可
				preLife = tracer.currentLifeList[0];
				curLife = tracer.currentLifeList[1];
				return this;
			}
			self.ismutiltouching = false;
			// 只有一个触摸点的情况
			prevent.tap = false;
			prevent.swipe = false;
			//长按事件
			this._longTapTimeout = setTimeout(function () {
				self.triggerListener('longtap',self._createEventData(life.startTouchEvent,'longtap'));
			},750);
		};
		tracer.onlifechange = function (life) {
			// 只要存在移动的接触点，就触发dragging事件
			life.moveTouchEventList.forEach(function (moveEvent) {
				self.triggerListener('dragging',self._createEventData(moveEvent,'dragging'));
			});
			
			if(tracer.currentLifeList.length>1){
				self.ismutiltouching = true;

				// 判断是否启用多点触控
				if(!self.option.useMulti) return;
				prevent.tap=true;
				prevent.swipe=true;
				self.triggerListener('log','multi touch move ...');
				self.triggerListener('multichange',preLife,curLife);
				
				var rateAndAngle = self.getZoomRateAndRotateAngle(preLife,curLife);
				
				if(Ycc.utils.isNum(rateAndAngle.rate)){
					self.triggerListener('zoom',self._createEventData(preLife.startTouchEvent,'zoom'),rateAndAngle.rate);
					self.triggerListener('log','zoom triggered',rateAndAngle.rate);
				}
				if(Ycc.utils.isNum(rateAndAngle.angle)){
					self.triggerListener('rotate',self._createEventData(preLife.startTouchEvent,'rotate'),rateAndAngle.angle);
					self.triggerListener('log','rotate triggered',rateAndAngle.angle);
				}
				return this;
			}
			
			// 只有一个触摸点的情况
			if(life.moveTouchEventList.length>0){
				self.ismutiltouching = false;
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
			self.triggerListener('dragend',self._createEventData(life.endTouchEvent,'dragend'));
			self.ismutiltouching = true;

			// 若某个触摸结束，当前触摸点个数为1，说明之前的操作为多点触控。这里发送多点触控结束事件
			if(tracer.currentLifeList.length===1){
				self.ismutiltouching = false;
				return self.triggerListener('multiend',preLife,curLife);
			}
			
			if(tracer.currentLifeList.length===0){
				self.ismutiltouching = false;
				
				// 开始和结束时间在300ms内，认为是tap事件
				if(!prevent.tap && life.endTime-life.startTime<300){
					// 取消长按事件
					clearTimeout(this._longTapTimeout);
					
					// 两次点击在300ms内，并且两次点击的范围在10px内，则认为是doubletap事件
					if(preLife && life.endTime-preLife.endTime<300 && Math.abs(preLife.endTouchEvent.pageX-life.endTouchEvent.pageX)<10&& Math.abs(preLife.endTouchEvent.pageY-life.endTouchEvent.pageY)<10){
						self.triggerListener('doubletap',self._createEventData(life.endTouchEvent,'doubletap'));
						self.triggerListener('log','doubletap triggered');
						preLife = null;
						return this;
					}
					preLife=life;
					return this;
				}
				
				// 如果触摸点按下期间存在移动行为，且移动范围大于30px，触摸时间在200ms内，则认为该操作是swipe
				if(!prevent.swipe && life.endTime-life.startTime<300 ){
					var firstMove = life.startTouchEvent;
					var lastMove = Array.prototype.slice.call(life.moveTouchEventList,-1)[0];
					if(Math.abs(lastMove.pageX-firstMove.pageX)>30 || Math.abs(lastMove.pageY-firstMove.pageY)>30){
						var dir = self._getSwipeDirection(firstMove.pageX,firstMove.pageY,lastMove.pageX,lastMove.pageY);
						var type = 'swipe'+dir;
						self.triggerListener('log',type);
						life.endTouchEvent.swipeDirection = dir;
						// 触发swipeXXX
						self.triggerListener(type,self._createEventData(life.endTouchEvent,type));
						// 触发swipe
						self.triggerListener('swipe',self._createEventData(life.endTouchEvent,'swipe'));
						console.log('swipe',type);
					}
					return this;
				}
			}
		};
		
	};
	
	/**
	 * pc端的初始化，pc端只有一个鼠标，操作相对简单
	 * @private
	 */
	Ycc.Gesture.prototype._initForPC = function () {
		var self = this;
		
		// 鼠标按下的yccEvent
		var mouseDownEvent = null;
		// 鼠标抬起的yccEvent
		var mouseUpEvent = null;
		// 拖动是否触发的标志
		var dragStartFlag = false;
		// 记录上一次点击事件，用于判断doubletap
		var preTap = null;
		// 记录长按的计时ID，用于判断longtap
		var longTapTimeoutID = -1;

		// 拖拽过程中的生命周期ID
		var identifier = 0;
		
		/**
		 * 需求实现：
		 * 1、事件传递给所有图层
		 * 2、事件传递给最上层UI
		 * 3、记录按下时鼠标的位置，及按下时鼠标所指的UI
		 * */
		this.option.target.addEventListener('mousedown',function (e) {
			// console.log(e.type,'...');
			e.identifier=++identifier;
			mouseDownEvent = self._createEventData(e);
			longTapTimeoutID = setTimeout(function () {
				console.log('longtap',Date.now(),'...');
				self.triggerListener('log','long tap ...');
				self.triggerListener('longtap',self._createEventData(mouseDownEvent,'longtap'));
			},750);
		});
		
		/**
		 * 需求实现：
		 * 1、事件传递给所有图层
		 * 2、事件传递给最上层UI
		 * 3、如果move时，鼠标为按下状态，触发一次所有图层的dragstart事件
		 * 4、如果move时，鼠标为按下状态，触发一次 鼠标按下时UI 的dragstart事件
		 * 5、如果move时，鼠标为按下状态，触发所有图层的dragging事件
		 * 6、如果move时，鼠标为按下状态，触发 鼠标按下时UI 的dragging事件
		 * */
		this.option.target.addEventListener('mousemove',function (e) {
			// console.log(e.type,'....',self);
			self.triggerListener('mousemove',self._createEventData(e,'mousemove'));
			
			// 如果鼠标正处于按下状态，则模拟触发dragging事件
			if(mouseDownEvent){
				// 判断是否真的移动，是否真的存在拖拽
				if(mouseDownEvent && e.clientX===mouseDownEvent.clientX&&e.clientY===mouseDownEvent.clientY) return;
				// 解决webkit内核mouseup自动触发mousemove的BUG
				if(mouseUpEvent && e.clientX===mouseDownEvent.clientX&&e.clientY===mouseDownEvent.clientY) return;
				
				// 取消长按事件
				clearTimeout(longTapTimeoutID);
				
				// dragging之前，触发一次dragstart事件
				if(!dragStartFlag){
					self.triggerListener('dragstart',self._createEventData(mouseDownEvent,'dragstart'));
					// 设置标志位
					dragStartFlag = true;
				}
				e.identifier=identifier;
				self.triggerListener('dragging',self._createEventData(e,'dragging'));
			}else{
				// 取消长按事件
				clearTimeout(longTapTimeoutID);
			}
			
		});
		
		/**
		 * 需求实现：
		 * 1、事件传递给所有图层
		 * 2、事件传递给 鼠标按下时所指的UI
		 * 3、清除按下时鼠标的位置，及按下时鼠标所指的UI
		 * */
		this.option.target.addEventListener('mouseup',function (e) {
			// console.log(e.type,'...');
			e.identifier=identifier;
			
			mouseUpEvent = self._createEventData(e);
			
			// 如果存在拖拽标志位，抬起鼠标时需要发送dragend事件
			if(dragStartFlag){
				// 取消长按事件
				clearTimeout(longTapTimeoutID);
				self.triggerListener('dragend',self._createEventData(e,'dragend'));
				
				// 如果鼠标按下期间存在移动行为，且移动范围大于30px，按下时间在300ms内，则认为该操作是swipe
				if(dragStartFlag&&mouseUpEvent.createTime-mouseDownEvent.createTime<300 ){
					if(Math.abs(mouseUpEvent.pageX-mouseDownEvent.pageX)>30 || Math.abs(mouseUpEvent.pageY-mouseDownEvent.pageY)>30){
						var dir = self._getSwipeDirection(mouseDownEvent.pageX,mouseDownEvent.pageY,mouseUpEvent.pageX,mouseUpEvent.pageY);
						var type = 'swipe'+dir;
						self.triggerListener('log',type);
						mouseDownEvent.swipeDirection = dir;
						// 触发swipeXXX
						self.triggerListener(type,self._createEventData(mouseDownEvent,type));
						// 触发swipe
						self.triggerListener('swipe',self._createEventData(mouseDownEvent,'swipe'));

						console.log('swipe',type);
						// self.triggerListener('log',type);
						// self.triggerListener(type,self._createEventData(mouseDownEvent,type));
					}
				}
				
				dragStartFlag = false;
				mouseDownEvent = null;
				return null;
			}
			
			//不存在拖拽事件，且开始按下鼠标和结束时间在300ms内，认为是tap事件
			if(!dragStartFlag&&mouseDownEvent && mouseUpEvent.createTime-mouseDownEvent.createTime<300){
				// 取消长按事件
				clearTimeout(longTapTimeoutID);

				var curTap = self._createEventData(mouseDownEvent,'tap');
				self.triggerListener('tap',curTap);
				self.triggerListener('log','tap triggered');
				
				// 两次点击在300ms内，并且两次点击的范围在10px内，则认为是doubletap事件
				if(preTap && curTap.createTime-preTap.createTime<300 && Math.abs(preTap.pageX-curTap.pageX)<10&& Math.abs(preTap.pageY-curTap.pageY)<10){
					self.triggerListener('doubletap',self._createEventData(curTap,'doubletap'));
					self.triggerListener('log','doubletap triggered');
					preTap = null;
					return this;
				}
				preTap=curTap;
				mouseDownEvent = null;
				return this;
			}
			
			
			
			
			
		});
		
		// 若鼠标超出舞台，给所有图层广播一个mouseup事件，解决拖拽超出舞台的问题。
		// this.option.target.addEventListener("mouseout",function (e) {
		// 	var yccEvent = new Ycc.Event({
		// 		type:"mouseup",
		// 		x:parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
		// 		y:parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top)
		// 	});
		// 	if(yccEvent.x>parseInt(this.width)) yccEvent.x = parseInt(this.width);
		// 	if(yccEvent.x<0) yccEvent.x=0;
		// 	if(yccEvent.y>parseInt(this.height)) yccEvent.y = parseInt(this.height);
		// 	if(yccEvent.y<0) yccEvent.y=0;
		//
		// 	for(var i=self.layerList.length-1;i>=0;i--){
		// 		var layer = self.layerList[i];
		// 		if(!layer.enableEventManager) continue;
		// 		layer.triggerListener(yccEvent.type,yccEvent);
		// 	}
		// });
	};
	
	/**
	 * 构造筛选事件中的有用信息
	 * @param event	{MouseEvent | TouchEvent}	鼠标事件或者触摸事件
	 * @param [type] {String} 事件类型，可选
	 * @return {{target: null, clientX: number, clientY: number, pageX: number, pageY: number, screenX: number, screenY: number, force: number}}
	 * @private
	 */
	Ycc.Gesture.prototype._createEventData = function (event,type) {
		
		var data={
			/**
			 * 事件类型
			 */
			type:"",
			/**
			 * 事件触发对象
			 */
			target:null,
			
			/**
			 * 事件的生命周期ID，只在拖拽过程中存在，存在时此值大于-1
			 * PC端表示mousedown直至mouseup整个周期
			 * mobile端表示touchstart直至touchend整个周期
			 */
			identifier:-1,
			
			clientX:0,
			clientY:0,
			pageX:0,
			pageY:0,
			screenX:0,
			screenY:0,
			force:1,
			
			/**
			 * 手势滑动方向，此属性当且仅当type为swipe时有值
			 */
			swipeDirection:'',

			/**
			 * 创建时间
			 */
			createTime:Date.now()
		};

		data = Ycc.utils.extend(data,event);
		data.type=type;
		return data;
	};
	
	
	/**
	 * 获取某个触摸点的swipe方向
	 * @private
	 */
	Ycc.Gesture.prototype._getSwipeDirection = function (x1,y1,x2,y2) {
		return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'left' : 'right') : (y1 - y2 > 0 ? 'up' : 'down');
	};
	
	/**
	 * 获取缩放比例
	 * @param preLife
	 * @param curLife
	 * @return {number}
	 * @private
	 */
	Ycc.Gesture.prototype.getZoomRateAndRotateAngle = function (preLife, curLife) {
		this.triggerListener('log','preLife');
		this.triggerListener('log',preLife);
		this.triggerListener('log','curLife');
		this.triggerListener('log',curLife);
		
		var x0=preLife.startTouchEvent.pageX,
			y0=preLife.startTouchEvent.pageY,
			x1=curLife.startTouchEvent.pageX,
			y1=curLife.startTouchEvent.pageY;
		
		var preMoveTouch = preLife.moveTouchEventList.length>0?preLife.moveTouchEventList[preLife.moveTouchEventList.length-1]:preLife.startTouchEvent;
		var curMoveTouch = curLife.moveTouchEventList.length>0?curLife.moveTouchEventList[curLife.moveTouchEventList.length-1]:curLife.startTouchEvent;
		var x0move=preMoveTouch.pageX,
			y0move=preMoveTouch.pageY,
			x1move=curMoveTouch.pageX,
			y1move=curMoveTouch.pageY;
		
		var vector0 = new Ycc.Math.Vector(x1-x0,y1-y0),
			vector1 = new Ycc.Math.Vector(x1move-x0move,y1move-y0move);
		
		var angle = Math.acos(vector1.dot(vector0)/(vector1.getLength()*vector0.getLength()))/Math.PI*180;
		return {
			rate:vector1.getLength()/vector0.getLength(),
			angle:angle*(vector1.cross(vector0).z>0?-1:1)
		};//(new Ycc.Math.Vector(x1move-x0move,y1move-y0move).getLength())/(new Ycc.Math.Vector(x1-x0,y1-y0).getLength());
	};


	/**
	 * 设置是否启用多点触控
	 * @param enable
	 */
	Ycc.Gesture.prototype.enableMutiTouch = function (enable) {
		this.option.useMulti = false;
	};


})(Ycc);
