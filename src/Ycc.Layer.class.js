/**
 * @file    Ycc.Layer.class.js
 * @author  xiaohei
 * @date    2017/11/16
 * @description  Ycc.Layer.class文件
 * @requires Ycc.Listener
 */



(function (Ycc) {
	
	
	var layerIndex = 0;
	
	/**
	 * 图层类。
	 * 每新建一个图层，都会新建一个canvas元素。
	 * 每个图层都跟这个canvas元素绑定。
	 * @param yccInstance	{Ycc} ycc实例
	 * @param option		{object} 配置项
	 * @param option.enableEventManager		{boolean} 是否监听舞台事件
	 *
	 * @constructor
	 * @extends Ycc.Listener
	 */
	Ycc.Layer = function(yccInstance,option){
	 	Ycc.Listener.call(this);

	 	option = option || {};
		
		/**
		 * 类型
		 */
	 	this.yccClass = Ycc.Layer;
	 	
		/**
		 * 存储图层中的所有UI。UI的顺序，即为图层中的渲染顺序。
		 * @type {Ycc.UI[]}
		 */
		this.uiList = [];
		
		/**
		 * 该图层ui的总数（只在渲染之后赋值）
		 * @type {number}
		 */
		this.uiCountRecursion = 0;
		
		/**
		 * ycc实例的引用
		 */
		this.yccInstance = yccInstance;
		
		/**
		 * 当前图层的绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = null;
		
		/**
		 * 图层id
		 */
		this.id = layerIndex++;
		
		/**
		 * 图层类型。
		 * `ui`表示用于绘图的图层。`tool`表示辅助的工具图层。`text`表示文字图层。
		 * 默认为`ui`。
		 */
		this.type = "ui";
		
		/**
		 * 图层中的文字。仅当图层type为text时有值。
		 * @type {string}
		 */
		this.textValue = "";
		
		/**
		 * 图层名称
		 * @type {string}
		 */
		this.name = option.name?option.name:"图层_"+this.type+"_"+this.id;
		
		/**
		 * 图层位置的x坐标。默认与舞台左上角重合
		 * @type {number}
		 */
		this.x = 0;
		
		/**
		 * 图层位置的Y坐标。默认与舞台左上角重合
		 * @type {number}
		 */
		this.y = 0;
		
		/**
		 * 图层宽
		 * @type {number}
		 */
		this.width = yccInstance.getStageWidth();
		/**
		 * 图层高
		 * @type {number}
		 */
		this.height = yccInstance.getStageHeight();
		
		/**
		 * 图层是否显示
		 */
		this.show = true;
		
		/**
		 * 是否监听舞台的事件。用于控制舞台事件是否广播至图层。默认关闭
		 * @type {boolean}
		 */
		this.enableEventManager = false;
		
		/**
		 * 是否接收每帧更新的通知。默认为false
		 * @type {boolean}
		 */
		this.enableFrameEvent = false;
		
		/**
		 * 若接收通知，此函数为接收通知的回调函数。当且仅当enableFrameEvent为true时生效
		 * @type {function}
		 */
		this.onFrameComing = function () {};
		
		
		
		// 覆盖参数
		Ycc.utils.extend(this,option);
		// 初始化
		this.init();
	};
	Ycc.Layer.prototype = new Ycc.Listener();
	Ycc.Layer.prototype.constructor = Ycc.Layer;
	
	
	/**
	 * 释放layer的内存，等待GC
	 * 将所有引用属性置为null
	 * @param layer
	 */
	Ycc.Layer.release = function (layer) {
		Ycc.Listener.release(layer);
		
		/**
		 * 类型
		 */
		layer.yccClass = null;
		
		/**
		 * 存储图层中的所有UI。UI的顺序，即为图层中的渲染顺序。
		 * @type {Ycc.UI[]}
		 */
		layer.uiList = null;
		
		/**
		 * ycc实例的引用
		 */
		layer.yccInstance = null;
		/**
		 * 图层是否显示
		 */
		layer.show = false;
		
		/**
		 * 是否监听舞台的事件。用于控制舞台事件是否广播至图层。默认关闭
		 * @type {boolean}
		 */
		layer.enableEventManager = false;
		
		/**
		 * 是否接收每帧更新的通知。默认为false
		 * @type {boolean}
		 */
		layer.enableFrameEvent = false;
		
		/**
		 * 若接收通知，此函数为接收通知的回调函数。当且仅当enableFrameEvent为true时生效
		 * @type {function}
		 */
		layer.onFrameComing = null;
	};
	
	
	
	
	
	
	
	
	/**
	 * 初始化
	 * @return {null}
	 */
	Ycc.Layer.prototype.init = function () {
		var self = this;
		
		// 初始化图层属性
		this.ctx = this.yccInstance.ctx;
		
		// 初始化画布属性
		self._setCtxProps();
		// 初始化图层事件
		// self._initEvent();
	};
	
	/**
	 * 事件的初始化。此方法已废弃，改由舞台转发事件
	 * <br> 注：如果鼠标按下与抬起的位置有变动，默认不会触发click事件。
	 * @private
	 */
	Ycc.Layer.prototype._initEvent = function () {
		var self = this;
		// 记录鼠标按下的事件
		var mouseDownYccEvent = null;
		// 记录鼠标抬起的事件
		var mouseUpYccEvent = null;
		// 鼠标是否已经移动
		var mouseHasMove = false;
		// 是否有拖拽事件触发的标志位
		var dragFlag = false;
		
		this.addListener("click",function (e) {
			// 如果鼠标已经改变了位置，那么click事件不触发
			if(mouseHasMove) return;
			defaultMouseListener(e);
		});
		
		this.addListener("mousedown",function (e) {
			mouseHasMove = false;
			dragFlag = false;
			mouseDownYccEvent = e;
			defaultMouseListener(e);
		});

		this.addListener("mouseup",function (e) {
			if(dragFlag){
				var dragendEvent = new Ycc.Event({
					type:"dragend",
					x:e.x,
					y:e.y,
					mouseDownYccEvent:mouseDownYccEvent
				});
				self.triggerListener("dragend",dragendEvent);
				if(mouseDownYccEvent&&mouseDownYccEvent.target){
					self.target = mouseDownYccEvent.target;
					self.target.triggerListener("dragend",dragendEvent);
				}
			}
			e.mouseDownYccEvent = mouseDownYccEvent = null;
			mouseUpYccEvent = e;
			
			defaultMouseListener(e);
		});
		
		this.addListener("mousemove",mouseMoveListener);
		
		
		/**
		 * 图层中鼠标移动的监听器
		 * @param e	{Ycc.Event}
		 */
		function mouseMoveListener(e) {
			// 判断事件是否已经被阻止
			if(e.stop) return;
			// 判断是否真的移动
			if(mouseDownYccEvent && e.x===mouseDownYccEvent.x&&e.y===mouseDownYccEvent.y) return;
			// 解决webkit内核mouseup自动触发mousemove的BUG
			if(mouseUpYccEvent && e.x===mouseUpYccEvent.x&&e.y===mouseUpYccEvent.y) {
				return;
			}

			// 设置已经移动的标志位
			mouseHasMove = true;
			
			// 如果鼠标已经按下，则表示拖拽事件。
			if(mouseDownYccEvent){
				// 1.拖拽之前，触发一次dragstart事件
				if(!dragFlag){
					var dragStartEvent = new Ycc.Event({
						type:"dragstart",
						x:mouseDownYccEvent.x,
						y:mouseDownYccEvent.y,
						mouseDownYccEvent:mouseDownYccEvent
					});
					
					// 先触发图层的拖拽事件，该事件没有target属性
					self.triggerListener(dragStartEvent.type,dragStartEvent);
					if(mouseDownYccEvent.target){
						dragStartEvent.target = mouseDownYccEvent.target;
						dragStartEvent.target.triggerListener(dragStartEvent.type,dragStartEvent);
					}
				}

				// 2.修改拖拽已经发生的标志位
				dragFlag = true;
				// 3.触发dragging事件
				var draggingEvent = new Ycc.Event({
					type:"dragging",
					x:e.x,
					y:e.y,
					mouseDownYccEvent:mouseDownYccEvent
				});
				// 先触发图层的拖拽事件，该事件没有target属性
				self.triggerListener(draggingEvent.type,draggingEvent);
				if(mouseDownYccEvent.target){
					draggingEvent.target = mouseDownYccEvent.target;
					draggingEvent.target.triggerListener(draggingEvent.type,draggingEvent);
				}
				// 触发拖拽事件时，不再触发鼠标的移动事件，所以此处直接返回
				return null;
			}
			
			// 下面处理普通的鼠标移动事件
			for(var i = self.uiList.length-1;i>=0;i--){
				var ui = self.uiList[i];
				// 图层内部UI的相对坐标
				var dot = new Ycc.Math.Dot(e.x - ui.belongTo.x,e.y - ui.belongTo.y);
				// 如果位于rect内，触发事件,并阻止继续传递
				if(dot.isInRect(ui.rect)){
					e.stop = true;
					e.mouseDownYccEvent = mouseDownYccEvent;
					e.mouseUpYccEvent = mouseUpYccEvent;
					e.target = ui;
					ui.triggerListener(e.type,e);
					break;
				}
			}
		}
		
		
		/**
		 * 默认的事件监听器。默认鼠标事件触发点位于rect内，事件才转发给UI。
		 * @todo 其他事件需要考虑图层坐标
		 * @param e	{Ycc.Event}	ycc事件，e中的坐标值x、y为绝对坐标
		 */
		function defaultMouseListener(e) {
			if(e.stop) return;
			for(var i = self.uiList.length-1;i>=0;i--){
				var ui = self.uiList[i];
				var dot = new Ycc.Math.Dot(e.x,e.y);
				// 如果位于rect内，并且事件未被阻止，触发事件,并阻止继续传递
				if(ui.rect && dot.isInRect(ui.getAbsolutePosition()) && e.stop===false){
					e.stop = true;
					e.mouseDownYccEvent = mouseDownYccEvent;
					e.mouseUpYccEvent = mouseUpYccEvent;
					e.target = ui;
					e.targetDeltaPosition = new Ycc.Math.Dot(e.x-ui.getAbsolutePosition().x,e.y-ui.getAbsolutePosition().y);
					ui.triggerListener(e.type,e);
					break;
				}
			}
		}
		
		/**
		 * 直接将事件转发给UI。不做任何处理。
		 * @param e
		 */
		function broadcastDirect(e) {
			e.mouseDownYccEvent = mouseDownYccEvent;
			for(var i = 0;i<self.uiList.length;i++){
				var ui = self.uiList[i];
				ui.triggerListener(e.type,e);
			}
		}
		
	};
	
	/**
	 * 设置画布所有的属性
	 */
	Ycc.Layer.prototype._setCtxProps = function (props) {
		var self = this;
		var ctxConfig = {
			fontStyle:"normal",
			fontVariant:"normal",
			fontWeight:"normal",
			fontSize:"16px",
			fontFamily:"微软雅黑",
			font:"16px 微软雅黑",
			textBaseline:"hanging",
			fillStyle:"red",
			strokeStyle:"blue"
		};
		ctxConfig = Ycc.utils.extend(ctxConfig,props);
		
		ctxConfig.font = [ctxConfig.fontStyle,ctxConfig.fontVariant,ctxConfig.fontWeight,ctxConfig.fontSize,ctxConfig.fontFamily].join(" ");
		for(var key in ctxConfig){
			if(!ctxConfig.hasOwnProperty(key)) continue;
			self.ctx[key] = ctxConfig[key];
		}
	};
	
	
	/**
	 * 清除图层
	 */
	Ycc.Layer.prototype.clear = function () {
		this.ctx.clearRect(0,0,this.width,this.height);
	};
	
	
	/**
	 * 清空图层内的所有UI
	 */
	Ycc.Layer.prototype.removeAllUI = function () {
		this.uiList.forEach(function (ui) {
			Ycc.UI.release(ui);
		});
		this.uiList.length=0;
	};
	
	
	/**
	 * 删除自身
	 */
	Ycc.Layer.prototype.removeSelf = function () {
		this.removeAllUI();
		this.yccInstance.layerManager.deleteLayer(this);
		Ycc.Layer.release(this);
	};
	
	
	/**
	 * 渲染图层至舞台
	 */
	Ycc.Layer.prototype.renderToStage = function () {
		if(this.show)
			this.yccInstance.ctx.drawImage(this.ctx.canvas,0,0,this.width,this.height);
	};
	
	/**
	 * 添加一个UI图形至图层，如果设置了beforUI，该UI会被添加至该UI之前
	 * @param ui {Ycc.UI}	UI图形
	 * @param beforeUI {Ycc.UI|null}	UI图形
	 */
	Ycc.Layer.prototype.addUI = function (ui,beforeUI) {
		var self = this;
		// 遍历所有节点，初始化
		ui.itor().each(function (child) {
			child.init(self);
		});
		if(!beforeUI)
			return this.uiList.push(ui);
		var index = this.uiList.indexOf(beforeUI);
		if(index===-1)
			return this.uiList.push(ui);
		this.uiList.splice(index,0,ui);
	};
	
	/**
	 * 删除图层内的某个UI图形，及其子UI
	 * @param ui
	 */
	Ycc.Layer.prototype.removeUI = function (ui) {
		if(!ui) return false;
		var index = this.uiList.indexOf(ui);
		if(index===-1) return false;
		
		Ycc.UI.release(ui);
		this.uiList[index]=null;
		this.uiList.splice(index,1);
		return true;
	};
	
	/**
	 * 渲染Layer。
	 * <br>注意：并没有渲染至舞台。
	 */
	Ycc.Layer.prototype.render = function () {
		for(var i=0;i<this.uiList.length;i++){
			if(!this.uiList[i].show) continue;
			this.uiList[i].render();
		}
	};
	
	/**
	 * 重绘图层。
	 * <br>注意：并没有渲染至舞台。
	 */
	Ycc.Layer.prototype.reRender = function () {
		// this.clear();
		var self = this;
		self.uiCountRecursion=0;
		for(var i=0;i<this.uiList.length;i++){
			if(!this.uiList[i].show) continue;
			//this.uiList[i].__render();
			// 按树的层次向下渲染
			this.uiList[i].itor().depthDown(function (ui, level) {
				//console.log(level,ui);
				self.uiCountRecursion++;
				if(ui.show)
					ui.__render();
				else
					return -1;
			});
		}
		// 兼容wx端，wx端多一个draw API
		self.ctx.draw && self.ctx.draw();
	};
	
	/**
	 * 获取图层中某个点所对应的最上层UI，最上层UI根据层级向下遍历，取层级最深的可见UI。
	 * @param dot {Ycc.Math.Dot}	点坐标，为舞台的绝对坐标
	 * @param uiIsShow {Boolean}	是否只获取显示在舞台上的UI，默认为true
	 * @return {UI}
	 */
	Ycc.Layer.prototype.getUIFromPointer = function (dot,uiIsShow) {
		uiIsShow = Ycc.utils.isBoolean(uiIsShow)?uiIsShow:true;
		var self = this;
		var temp = null;
		/*for(var i =self.uiList.length-1;i>=0;i--){
			var ui = self.uiList[i];
			if(uiIsShow&&!ui.show) continue;
			// 右子树优先寻找
			ui.itor().rightChildFirst(function (child) {
				console.log(child);
				// 跳过不可见的UI
				if(uiIsShow&&!child.show) return false;
				
				// 如果位于rect内，此处根据绝对坐标比较
				if(dot.isInRect(child.getAbsolutePosition())){
					console.log(child,222);
					temp = child;
					return true;
				}
			});
		}*/
		
		
		var tempLevel = 0;
		for(var i=0;i<this.uiList.length;i++){
			var ui = self.uiList[i];
			if(uiIsShow&&!ui.show) continue;
			//this.uiList[i].__render();
			// 按树的层次向下遍历
			this.uiList[i].itor().depthDown(function (child, level) {
				// 跳过不可见的UI，返回-1阻止继续遍历其子UI
				if(uiIsShow&&!child.show) return -1;

				// 如果位于rect内，并且层级更深，则暂存，此处根据绝对坐标比较
				if(dot.isInRect(child.getAbsolutePosition()) && level>=tempLevel){
					temp = child;
					tempLevel=level;
				}
			});
		}
		return temp;
	};
	
	
	/**
	 * 根据图层坐标，将图层内某个点的相对坐标（相对于图层），转换为舞台的绝对坐标
	 * @param dotOrArr	{Ycc.Math.Dot | Ycc.Math.Dot[]}
	 * @return {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 */
	Ycc.Layer.prototype.transformToAbsolute = function (dotOrArr) {
		var res = null;
		if(Ycc.utils.isArray(dotOrArr)){
			res = [];
			for(var i=0;i<dotOrArr.length;i++){
				var resDot = new Ycc.Math.Dot(0,0);
				var dot = dotOrArr[i];
				resDot.x=this.x+dot.x;
				resDot.y=this.y+dot.y;
				res.push(resDot);
			}
			return res;
		}
		res = new Ycc.Math.Dot(0,0);
		res.x = this.x+(dotOrArr.x);
		res.y = this.y+(dotOrArr.y);
		return res;
	};
	
	/**
	 * 根据图层坐标，将某个点的绝对坐标，转换为图层内的相对坐标
	 * @param dotOrArr	{Ycc.Math.Dot | Ycc.Math.Dot[]}
	 * @return {Ycc.Math.Dot | Ycc.Math.Dot[]}
	 */
	Ycc.Layer.prototype.transformToLocal = function (dotOrArr) {
		var res = null;
		if(Ycc.utils.isArray(dotOrArr)){
			res = [];
			for(var i=0;i<dotOrArr.length;i++){
				var resDot = new Ycc.Math.Dot(0,0);
				var dot = dotOrArr[i];
				resDot.x=dot.x-this.x;
				resDot.y=dot.y-this.y;
				res.push(resDot);
			}
			return res;
		}
		res = new Ycc.Math.Dot(0,0);
		res.x = (dotOrArr.x)-this.x;
		res.y = (dotOrArr.y)-this.y;
		return res;
	};
	
})(Ycc);