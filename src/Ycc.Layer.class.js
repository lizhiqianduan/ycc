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
	 * @constructor
	 * @extends Ycc.Listener
	 */
	Ycc.Layer = function(yccInstance,option){
	 	Ycc.Listener.call(this);

	 	option = option || {};

		/**
		 * 存储图层中的所有UI。UI的顺序，即为图层中的渲染顺序。
		 * @type {Ycc.UI[]}
		 */
		this.uiList = [];
		
		/**
		 * ycc实例的引用
		 */
		this.yccInstance = yccInstance;
		/**
		 * 虚拟canvas元素的引用
		 * @type {Element}
		 */
		this.canvasDom = null;
		
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
		
		
		
		// 合并参数
		Ycc.utils.mergeObject(this,option);
		// 初始化
		this.init();
	};
	Ycc.Layer.prototype = new Ycc.Listener();
	Ycc.Layer.prototype.constructor = Ycc.Layer;
	
	/**
	 * 初始化
	 * @return {null}
	 */
	Ycc.Layer.prototype.init = function () {
		var self = this;
		var canvasDom = document.createElement("canvas");
		canvasDom.width = this.width;
		canvasDom.height = this.height;
		
		// 初始化图层属性
		this.ctx = canvasDom.getContext('2d');
		this.canvasDom = canvasDom;
		
		// 初始化画布属性
		self._setCtxProps();
		// 初始化图层事件
		self._initEvent();
	};
	
	/**
	 * 事件的初始化。
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
				var dragendEvent = new Ycc.Event("dragend");
				dragendEvent.x = e.x;
				dragendEvent.y = e.y;
				dragendEvent.mouseDownYccEvent = mouseDownYccEvent;
				self.triggerListener("dragend",dragendEvent);
				if(mouseDownYccEvent.target){
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
					var dragStartEvent = new Ycc.Event("dragstart");
					dragStartEvent.x = mouseDownYccEvent.x;
					dragStartEvent.y = mouseDownYccEvent.y;
					dragStartEvent.mouseDownYccEvent = mouseDownYccEvent;
					
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
				var draggingEvent = new Ycc.Event("dragging");
				draggingEvent.x = e.x;
				draggingEvent.y = e.y;
				draggingEvent.mouseDownYccEvent = mouseDownYccEvent;
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
		 * @param e	{Ycc.Event}	ycc事件
		 */
		function defaultMouseListener(e) {
			if(e.stop) return;
			for(var i = self.uiList.length-1;i>=0;i--){
				var ui = self.uiList[i];
				// 图层内部UI的相对坐标
				var layerX = e.x - ui.belongTo.x;
				var layerY = e.y - ui.belongTo.y;
				var dot = new Ycc.Math.Dot(layerX,layerY);
				// 如果位于rect内，并且事件未被阻止，触发事件,并阻止继续传递
				if(ui.rect && dot.isInRect(ui.rect) && e.stop===false){
					e.stop = true;
					e.mouseDownYccEvent = mouseDownYccEvent;
					e.mouseUpYccEvent = mouseUpYccEvent;
					e.target = ui;
					e.targetDeltaPosition = new Ycc.Math.Dot(e.x-ui.rect.x,e.y-ui.rect.y);
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
			textBaseline:"top",
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
	 * 渲染图层至舞台
	 */
	Ycc.Layer.prototype.renderToStage = function () {
		if(this.show)
			this.yccInstance.ctx.drawImage(this.ctx.canvas,0,0,this.width,this.height);
	};
	
	/**
	 * 添加一个UI图形至图层
	 * @param ui {Ycc.UI}	UI图形
	 */
	Ycc.Layer.prototype.addUI = function (ui) {
		ui.init(this);
		this.uiList.push(ui);
	};
	
	/**
	 * 删除图层内的某个UI图形
	 * @param ui
	 */
	Ycc.Layer.prototype.removeUI = function (ui) {
		var index = this.uiList.indexOf(ui);
		if(index!==-1){
			this.uiList.splice(index,1);
		}
	};
	
	/**
	 * 渲染Layer。
	 * <br>注意：并没有渲染至舞台。
	 */
	Ycc.Layer.prototype.render = function () {
		for(var i=0;i<this.uiList.length;i++){
			this.uiList[i].render();
		}
	};
	
	/**
	 * 重绘图层。
	 * <br>注意：并没有渲染至舞台。
	 */
	Ycc.Layer.prototype.reRender = function () {
		this.clear();
		for(var i=0;i<this.uiList.length;i++){
			this.uiList[i].computeUIProps();
			this.uiList[i].render();
		}
	}
	
	
})(window.Ycc);