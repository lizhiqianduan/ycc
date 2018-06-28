/**
 * @file    Ycc.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description  Ycc.class文件
 *
 */




(function (win) {
	
	/**
	 * 应用启动入口类，每个实例都与一个canvas绑定。
	 * 该canvas元素会被添加至HTML结构中，作为应用的显示舞台。
	 * @param config {Object} 整个ycc的配置项
	 * @param config.debug.drawContainer {Boolean} 是否显示所有UI的容纳区域
	 * @constructor
	 */
	win.Ycc = function Ycc(config){
		/**
		 * canvas的Dom对象
		 */
		this.canvasDom = null;
		
		/**
		 * 绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = null;
		
		/**
		 * Layer对象数组。包含所有的图层
		 * @type {Array}
		 */
		this.layerList = [];

		/**
		 * 实例的快照管理模块
		 * @type {Ycc.PhotoManager}
		 */
		this.photoManager = null;
		
		/**
		 * ycc的图层管理器
		 * @type {null}
		 */
		this.layerManager = null;
		
		/**
		 * 系统心跳管理器
		 */
		this.ticker = null;
		
		/**
		 * 资源加载器
		 * @type {Ycc.Loader}
		 */
		this.loader = new Ycc.Loader();
		
		/**
		 * 基础绘图UI。这些绘图操作会直接作用于舞台。
		 * @type {Ycc.UI}
		 */
		this.baseUI = null;
		
		/**
		 * 整个ycc的配置项
		 * @type {*|{}}
		 */
		this.config = config || {
			debug:{
				drawContainer:false
			}
		};
		
		/**
		 * 是否移动端
		 * @type {boolean}
		 */
		this.isMobile = Ycc.utils.isMobile();
	};
	
	/**
	 * 获取舞台的宽
	 */
	win.Ycc.prototype.getStageWidth = function () {
		return this.ctx.canvas.width;
	};
	
	/**
	 * 获取舞台的高
	 */
	win.Ycc.prototype.getStageHeight = function () {
		return this.ctx.canvas.height;
	};
	
	/**
	 * 绑定canvas元素，一个canvas绑定一个ycc实例
	 * @param canvasDom		canvas的HTML元素。即，显示舞台
	 */
	win.Ycc.prototype.bindCanvas = function (canvasDom) {
		canvasDom._ycc = this;
		
		this.canvasDom = canvasDom;
		
		this.ctx = this.canvasDom.getContext("2d");
		
		this.layerList = [];
		
		this.photoManager = new Ycc.PhotoManager(this);
		
		this.layerManager = new Ycc.LayerManager(this);
		
		this.ticker = new Ycc.Ticker(this);
		
		this.baseUI = new Ycc.UI(this.ctx.canvas);
		
		this.init();
		
		return this;
	};
	
	/**
	 * 类初始化
	 */
	win.Ycc.prototype.init = function () {
		if(this.isMobile)
			this._initMobileStageEvent();
		else
			this._initStageEvent();
	};
	
	/**
	 * 初始化舞台的事件监听器
	 * 所有鼠标事件均由舞台转发，转发的坐标均为绝对坐标。
	 * `layer`和`ui`可以调用各自的`transformToLocal`方法，将绝对坐标转换为自己的相对坐标。
	 * @private
	 */
	win.Ycc.prototype._initStageEvent = function () {
		var self = this;
		// 代理的原生鼠标事件
		/*var proxyEventTypes = ["mousemove","mousedown","mouseup","click","mouseenter","mouseout"];
		for(var i = 0;i<proxyEventTypes.length;i++){
			this.ctx.canvas.addEventListener(proxyEventTypes[i],function (e) {
				
				// 当前鼠标在canvas中的绝对位置
				var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
					y=parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
				
				// 鼠标所指的顶层UI
				var ui = self.getUIFromPointer(new Ycc.Math.Dot(x,y));
				
				// 将事件传递给图层，只传递给开启了事件系统的图层
				triggerLayerEvent(e.type,{
					type:e.type,
					x:x,
					y:y
				});
				
				// 将事件传递给UI
				ui&&ui.triggerListener(e.type,new Ycc.Event({
					type:e.type,
					x:x,
					y:y,
					target:ui
				}));
				
				
				// 设置全局鼠标按下标志
				if(e.type==="mousedown"){
					Ycc.Event.mouseDownEvent = new Ycc.Event({x:x,y:y,type:e.type,target:ui});
					if(ui) Ycc.Event.mouseDownEvent.targetDeltaPosition = new Ycc.Math.Dot(x-ui.getAbsolutePosition().x,y-ui.getAbsolutePosition().y);
					Ycc.Event.mouseUpEvent = null;
					Ycc.Event.dragStartFlag = false;
				}
				if(e.type==="mouseup"){
					Ycc.Event.mouseDownEvent = null;
					Ycc.Event.mouseUpEvent = new Ycc.Event({x:x,y:y,type:e.type});
					if(Ycc.Event.dragStartFlag){
						Ycc.Event.dragStartFlag = false;
						triggerLayerEvent('dragend',{
							type:"dragend",
							x:e.x,
							y:e.y
						});
						// 触发顶层UI dragend
						// 将事件传递给UI，需判断是否有顶层UI
						Ycc.Event.mouseDownEvent&&Ycc.Event.mouseDownEvent.target&&Ycc.Event.mouseDownEvent.target.triggerListener("dragend",new Ycc.Event({
							type:"dragend",
							x:e.x,
							y:e.y,
							target:Ycc.Event.mouseDownEvent.target,
							targetDeltaPosition:Ycc.Event.mouseDownEvent.targetDeltaPosition
						}));
					}
				}
				
				// 模拟触发dragging事件
				if(e.type==="mousemove" && Ycc.Event.mouseDownEvent){
					// 判断是否真的移动
					if(Ycc.Event.mouseDownEvent && e.x===Ycc.Event.mouseDownEvent.x&&e.y===Ycc.Event.mouseDownEvent.y) return;
					// 解决webkit内核mouseup自动触发mousemove的BUG
					if(Ycc.Event.mouseUpEvent && e.x===Ycc.Event.mouseDownEvent.x&&e.y===Ycc.Event.mouseDownEvent.y) {
						return;
					}
					
					// dragging之前，触发一次dragstart事件
					if(!Ycc.Event.dragStartFlag){
						// 触发图层dragstart
						triggerLayerEvent('dragstart',{
							type:"dragstart",
							x:Ycc.Event.mouseDownEvent.x,
							y:Ycc.Event.mouseDownEvent.y
						});
						// 触发顶层UI dragstart
						// 将事件传递给UI，需判断是否有顶层UI
						Ycc.Event.mouseDownEvent&&Ycc.Event.mouseDownEvent.target&&Ycc.Event.mouseDownEvent.target.triggerListener("dragstart",new Ycc.Event({
							type:"dragstart",
							x:Ycc.Event.mouseDownEvent.x,
							y:Ycc.Event.mouseDownEvent.y,
							target:ui,
							targetDeltaPosition:Ycc.Event.mouseDownEvent.targetDeltaPosition
						}));
						
						Ycc.Event.dragStartFlag = true;
					}
					
					// 触发图层的dragging事件，只传递给开启了事件系统的图层
					triggerLayerEvent("dragging",{
						type:"dragging",
						x:x,
						y:y
					});
					// 触发顶层UI dragging
					// 将事件传递给UI，需判断是否有顶层UI
					Ycc.Event.mouseDownEvent&&Ycc.Event.mouseDownEvent.target&&Ycc.Event.mouseDownEvent.target.triggerListener("dragging",new Ycc.Event({
						type:"dragging",
						x:x,
						y:y,
						target:Ycc.Event.mouseDownEvent.target,
						targetDeltaPosition:Ycc.Event.mouseDownEvent.targetDeltaPosition
					}));

				}
				
				
				
			});
		}
		
		// 处理UI的mouseover、mouseout事件
		this.ctx.canvas.addEventListener("mousemove",function (e) {
			// 坐标
			var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left);
			var y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
			var event;
			// 鼠标所指的最上层的UI
			var ui=null;
			
			for(var i=self.layerList.length-1;i>=0;i--){
				var layer = self.layerList[i];
				ui = layer.getUIFromPointer(new Ycc.Math.Dot(x,y));
				if(ui===null) continue;
				if(ui!==null) break;
			}
			if(ui!==null){
				if(ui===this.___overUI){
					event = new Ycc.Event({
						type:'mouseover',
						x:x,
						y:y
					});
					ui.triggerListener("mouseover",event);
				}else{
					event = new Ycc.Event({
						type:'mouseout',
						x:x,
						y:y
					});
					this.___overUI&&this.___overUI.triggerListener("mouseout",event);
					this.___overUI=ui;
				}
			}else{
				if(this.___overUI){
					event = new Ycc.Event({
						type:'mouseout',
						x:x,
						y:y
					});
					this.___overUI.triggerListener("mouseout",event);
					this.___overUI = null;
				}
			}
		});
		
		// 若鼠标超出舞台，给所有图层广播一个mouseup事件，解决拖拽超出舞台的问题。
		this.ctx.canvas.addEventListener("mouseout",function (e) {
			var yccEvent = new Ycc.Event({
				type:"mouseup",
				x:parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
				y:parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top)
			});
			if(yccEvent.x>parseInt(this.width)) yccEvent.x = parseInt(this.width);
			if(yccEvent.x<0) yccEvent.x=0;
			if(yccEvent.y>parseInt(this.height)) yccEvent.y = parseInt(this.height);
			if(yccEvent.y<0) yccEvent.y=0;
			
			for(var i=self.layerList.length-1;i>=0;i--){
				var layer = self.layerList[i];
				if(!layer.enableEventManager) continue;
				layer.triggerListener(yccEvent.type,yccEvent);
			}
		});*/
		
		
		
		
		
		
		///// 重构事件系统 /////////////////////////////////////////////////////////////////
		// 鼠标按下的yccEvent
		var mouseDownEvent = null;
		// 鼠标抬起的yccEvent
		var mouseUpEvent = null;
		// 拖动是否触发的标志
		var dragStartFlag = false;
		
		/**
		 * 需求实现：
		 * 1、事件传递给所有图层
		 * 2、事件传递给最上层UI
		 * 3、记录按下时鼠标的位置，及按下时鼠标所指的UI
		 * */
		this.ctx.canvas.addEventListener('mousedown',function (e) {
			console.log(e.type,'...');
			// 当前鼠标在canvas中的绝对位置
			var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
				y=parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
			
			
			// 将事件传递给图层，只传递给开启了事件系统的图层
			triggerLayerEvent(e.type,{
				type:e.type,
				x:x,
				y:y
			});
			
			// 将事件传递给UI
			// 鼠标所指的顶层UI
			var ui = self.getUIFromPointer(new Ycc.Math.Dot(x,y));
			if(ui){
				ui.triggerListener(e.type,new Ycc.Event({
					type:e.type,
					x:x,
					y:y,
					target:ui
				}));
			}
			mouseDownEvent = new Ycc.Event({x:x,y:y,type:e.type,target:ui});
			
			/*Ycc.Event.mouseDownEvent = new Ycc.Event({x:x,y:y,type:e.type,target:ui});
			if(ui) Ycc.Event.mouseDownEvent.targetDeltaPosition = new Ycc.Math.Dot(x-ui.getAbsolutePosition().x,y-ui.getAbsolutePosition().y);
			Ycc.Event.mouseUpEvent = null;
			Ycc.Event.dragStartFlag = false;*/
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
		this.ctx.canvas.addEventListener('mousemove',function (e) {
			console.log(e.type,'...');
			// 坐标
			var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left);
			var y = parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
			
			// 将事件传递给图层，只传递给开启了事件系统的图层
			triggerLayerEvent(e.type,{
				type:e.type,
				x:x,
				y:y
			});
			
			// 将事件传递给最上层的UI
			var ui= self.getUIFromPointer(new Ycc.Math.Dot(x,y));
			// 触发最上层ui的mousemove事件
			ui&&ui.triggerListener("mousemove",new Ycc.Event({
				type:"mousemove",
				x:x,
				y:y,
				target:ui
			}));
			
			// 如果鼠标正处于按下状态，则模拟触发dragging事件
			if(mouseDownEvent){
				// 判断是否真的移动
				if(mouseDownEvent && e.x===mouseDownEvent.x&&e.y===mouseDownEvent.y) return;
				// 解决webkit内核mouseup自动触发mousemove的BUG
				if(mouseUpEvent && e.x===mouseDownEvent.x&&e.y===mouseDownEvent.y) return;
				
				// dragging之前，触发一次dragstart事件
				if(!dragStartFlag){
					// 触发图层dragstart
					triggerLayerEvent('dragstart',{
						type:"dragstart",
						x:mouseDownEvent.x,
						y:mouseDownEvent.y
					});
					// 触发顶层UI dragstart
					// 将事件传递给UI，需判断是否有顶层UI
					mouseDownEvent.target&&mouseDownEvent.target.triggerListener("dragstart",new Ycc.Event({
						type:"dragstart",
						x:mouseDownEvent.x,
						y:mouseDownEvent.y,
						target:mouseDownEvent.target
					}));
					// 设置标志位
					dragStartFlag = true;
				}
				
				// 触发图层的dragging事件，只传递给开启了事件系统的图层
				triggerLayerEvent("dragging",{
					type:"dragging",
					x:x,
					y:y
				});
				// 触发顶层UI dragging
				// 将事件传递给UI，需判断是否有顶层UI
				mouseDownEvent.target&&mouseDownEvent.target.triggerListener("dragging",new Ycc.Event({
					type:"dragging",
					x:x,
					y:y,
					target:mouseDownEvent.target
				}));
			}
			
		});
		
		/**
		 * 需求实现：
		 * 1、事件传递给所有图层
		 * 2、事件传递给 鼠标按下时所指的UI
		 * 3、清除按下时鼠标的位置，及按下时鼠标所指的UI
		 * */
		this.ctx.canvas.addEventListener('mouseup',function (e) {
			console.log(e.type,'...');
			// 当前鼠标在canvas中的绝对位置
			var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
				y=parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
			
			// 此处的UI为鼠标按下时的UI
			var ui = mouseDownEvent.target;
			
			// 将事件传递给图层，只传递给开启了事件系统的图层
			triggerLayerEvent(e.type,{
				type:e.type,
				x:x,
				y:y
			});
			
			// 将事件传递给UI
			ui&&ui.triggerListener(e.type,new Ycc.Event({
				type:e.type,
				x:x,
				y:y,
				target:ui
			}));
			
			mouseDownEvent = null;
			mouseUpEvent = new Ycc.Event({x:x,y:y,type:e.type});
			
			// 如果存在拖拽标志位，抬起鼠标时需要发送dragend事件
			if(dragStartFlag){
				dragStartFlag = false;
				triggerLayerEvent('dragend',{
					type:"dragend",
					x:e.x,
					y:e.y
				});
				// 触发UI的dragend
				// 将事件传递给UI，需判断是否有顶层UI
				ui&&ui.triggerListener("dragend",new Ycc.Event({
					type:"dragend",
					x:e.x,
					y:e.y,
					target:ui
				}));
			}
		});

		this.ctx.canvas.addEventListener('click',function (e) {
			console.log(e.type,'...');
			// 当前鼠标在canvas中的绝对位置
			var x = parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
				y=parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top);
			
			// 鼠标所指的顶层UI
			var ui = self.getUIFromPointer(new Ycc.Math.Dot(x,y));
			
			// 将事件传递给图层，只传递给开启了事件系统的图层
			triggerLayerEvent(e.type,{
				type:e.type,
				x:x,
				y:y
			});
			
			// 将事件传递给UI
			ui&&ui.triggerListener(e.type,new Ycc.Event({
				type:e.type,
				x:x,
				y:y,
				target:ui
			}));
		});
		// 若鼠标超出舞台，给所有图层广播一个mouseup事件，解决拖拽超出舞台的问题。
		this.ctx.canvas.addEventListener("mouseout",function (e) {
			var yccEvent = new Ycc.Event({
				type:"mouseup",
				x:parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
				y:parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top)
			});
			if(yccEvent.x>parseInt(this.width)) yccEvent.x = parseInt(this.width);
			if(yccEvent.x<0) yccEvent.x=0;
			if(yccEvent.y>parseInt(this.height)) yccEvent.y = parseInt(this.height);
			if(yccEvent.y<0) yccEvent.y=0;
			
			for(var i=self.layerList.length-1;i>=0;i--){
				var layer = self.layerList[i];
				if(!layer.enableEventManager) continue;
				layer.triggerListener(yccEvent.type,yccEvent);
			}
		});
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		////重构结束////////////////////////////////////////////////////
		
		
		/**
		 * 触发图层事件
 		 * @param type	事件类型字符串
		 * @param eventOpt	事件初始构造对象
		 */
		function triggerLayerEvent(type,eventOpt){
			eventOpt=eventOpt||{};
			for(var i=self.layerList.length-1;i>=0;i--){
				var layer = self.layerList[i];
				if(!layer.enableEventManager) continue;
				layer.enableEventManager&&layer.triggerListener(type,new Ycc.Event(eventOpt));
			}
		}
		
	};
	
	/**
	 * 初始化舞台移动端的事件监听器
	 * 所有事件均由舞台转发，转发的坐标均为绝对坐标。
	 * @todo 移动端事件系统
	 * @private
	 */
	win.Ycc.prototype._initMobileStageEvent = function () {
		var self = this;
		var tracer = new win.Ycc.TouchLifeTracer({target:self.ctx.canvas});
		win.tracer = tracer;
	};
	
	
	/**
	 * 清除
	 */
	win.Ycc.prototype.clearStage = function () {
		this.ctx.clearRect(0,0,this.getStageWidth(),this.getStageHeight());
	};
	
	/**
	 * 根据ycc.layerList重复舞台
	 */
	win.Ycc.prototype.reRenderStage = function () {
		this.clearStage();
		this.layerManager.renderAllLayerToStage();
	};
	
	/**
	 * 根据id查找图层
	 * @param id 图层id
	 * @return {Ycc.Layer}
	 */
	win.Ycc.prototype.findLayerById = function (id) {
		for(var i =0;i<this.layerList.length;i++){
			var layer = this.layerList[i];
			if(layer.id===id)
				return layer;
		}
		return null;
	};
	
	/**
	 * 根据id查找UI
	 * @param id UI的id
	 * @return {Ycc.UI}
	 */
	win.Ycc.prototype.findUiById = function (id) {
		for(var i =0;i<this.layerList.length;i++){
			var layer = this.layerList[i];
			for(var j=0;j<layer.uiList.length;j++){
				var ui = layer.uiList[j];
				if(ui.id===id)
					return ui;
			}
		}
		return null;
	};
	
	/**
	 * 获取舞台中某个点所对应的最上层UI。
	 * @param dot {Ycc.Math.Dot}	点坐标，为舞台的绝对坐标
	 * @param uiIsShow {Boolean}	是否只获取显示在舞台上的UI，默认为true
	 * @return {UI}
	 */
	win.Ycc.prototype.getUIFromPointer = function (dot,uiIsShow) {
		var self = this;
		uiIsShow = Ycc.utils.isBoolean(uiIsShow)?uiIsShow:true;
		for(var j=self.layerList.length-1;j>=0;j--){
			var layer = self.layerList[j];
			if(uiIsShow&&!layer.show) continue;
			for(var i =layer.uiList.length-1;i>=0;i--){
				var ui = layer.uiList[i];
				if(uiIsShow&&!ui.show) continue;
				// 如果位于rect内，此处应该根据绝对坐标比较
				if(dot.isInRect(ui.getAbsolutePosition())){
					return ui;
				}
			}
		}
		return null;
	};
})(window);