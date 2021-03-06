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
		 * 该图层渲染的ui总数(只在渲染之后赋值）
		 * @type {number}
		 */
		this.uiCountRendered = 0;
		
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
		 * 是否使用独立的缓存canvas
		 * @type {boolean}
		 */
		this.useCache = false;
		
		/**
		 * 图层的缓存绘图环境
		 */
		this.ctxCache = null;
		
		/**
		 * 缓存时drawImage所绘制的最小区域
		 * @type {Ycc.Math.Rect}
		 */
		this.ctxCacheRect = null;
		
		/**
		 * 是否以红色方框框选缓存的最小区域，调试时可使用
		 * @type {boolean}
		 */
		this.renderCacheRect = false;
		
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
		 * 图层是否幽灵，幽灵状态的图层，getUIFromPointer 会直接跳过整个图层
		 * @type {boolean}
		 */
		this.ghost = false;
		
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
		// useCache参数判断
		this.ctxCache = this.useCache?this.yccInstance.createCacheCtx({
			width:this.width*this.yccInstance.dpi,
			height:this.height*this.yccInstance.dpi
		}):this.ctx;
		
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
	 * @param props 属性map
	 * @param ctx	绘图环境，可选参数，默认为上屏canvas的绘图环境
	 * @private
	 */
	Ycc.Layer.prototype._setCtxProps = function (props,ctx) {
		var self = this;
		ctx = ctx || self.ctx;
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
		// dpi兼容
		ctxConfig.fontSize=parseInt(ctxConfig.fontSize)*this.yccInstance.getSystemInfo().devicePixelRatio+'px';
		ctxConfig.font = [ctxConfig.fontStyle,ctxConfig.fontVariant,ctxConfig.fontWeight,ctxConfig.fontSize,ctxConfig.fontFamily].join(" ");
		for(var key in ctxConfig){
			if(!ctxConfig.hasOwnProperty(key)) continue;
			ctx[key] = ctxConfig[key];
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
		// 更新缓存
		this.updateCache();
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
	 * @deprecated
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
		var index = this.uiList.indexOf(beforeUI);
		if(!beforeUI||index===-1){
			this.uiList.push(ui);
			ui._onAdded&&ui._onAdded();
			return ui;
		}
		this.uiList.splice(index,0,ui);
		ui._onAdded&&ui._onAdded();

		// 更新缓存
		this.updateCache();
		return ui;
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
		// 更新缓存
		this.updateCache();
		return true;
	};
	
	/**
	 * 渲染Layer中的所有UI，
	 * <br>直接将UI的离屏canvas绘制至上屏canvas。
	 *
	 * @param forceUpdate {boolean}	是否强制更新
	 * 若强制更新，所有图层会强制更新缓存
	 * 若非强制更新，对于使用缓存的图层，只会绘制缓存至舞台
	 */
	Ycc.Layer.prototype.render = function (forceUpdate) {
		this.reRender(forceUpdate);
	};
	
	/**
	 * 重绘图层。
	 * <br>直接将UI的离屏canvas绘制至上屏canvas。
	 *
	 * @param forceUpdate {boolean}	是否强制更新
	 * 若强制更新，所有图层会强制更新缓存
	 * 若非强制更新，对于使用缓存的图层，只会绘制缓存至舞台
	 */
	Ycc.Layer.prototype.reRender = function (forceUpdate) {
		if(!this.show) return;
		if(this.useCache){
			return this.renderCacheToStage(forceUpdate);
		}
		// 绘制所有UI至上屏ctx
		this.renderAllToCtx(this.ctx);
	};
	
	/**
	 * 绘制缓存区域至上屏canvas
	 * @param forceUpdate {boolean}	是否强制更新，若为true，绘制之前先重新绘制缓存
	 */
	Ycc.Layer.prototype.renderCacheToStage = function (forceUpdate) {
		if(!this.useCache) return;
		// 若强制更新，则先更新离屏canvas的缓存
		if(forceUpdate) this.updateCache();
		
		var dpi = this.yccInstance.dpi;
		if(!this.ctxCacheRect){
			this.ctx.drawImage(this.ctxCache.canvas,0,0);
		}else{
			var x = this.ctxCacheRect.x*dpi,
				y=this.ctxCacheRect.y*dpi,
				width=this.ctxCacheRect.width*dpi,
				height=this.ctxCacheRect.height*dpi;
			this.ctx.drawImage(this.ctxCache.canvas,x,y,width,height,x,y,width,height);
		}
		
		// 兼容wx端，wx端多一个draw API
		this.ctx.draw && this.ctx.draw();
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
				// 幽灵状态的UI不予获取
				if(child.ghost) return -1;
				
				// 跳过不可见的UI，返回-1阻止继续遍历其子UI
				if(uiIsShow&&!child.show) return -1;

				// 如果位于rect内，并且层级更深，则暂存，此处根据绝对坐标比较
				if(child.containDot(dot) && level>=tempLevel){
					temp = child;
					tempLevel=level;
				}
			});
		}
		return temp;
	};
	
	/**
	 * 获取图层中某个点所对应的所有UI，无论显示不显示，无论是否是幽灵，都会获取。
	 * @param dot {Ycc.Math.Dot}	点坐标，为舞台的绝对坐标
	 * @return {Ycc.UI[]}
	 */
	Ycc.Layer.prototype.getUIListFromPointer = function (dot) {
		var self = this;
		var uiList = [];
		for(var i=0;i<this.uiList.length;i++){
			// 按树的层次向下遍历
			this.uiList[i].itor().depthDown(function (child, level) {
				// 如果位于rect内，并且层级更深，则暂存，此处根据绝对坐标比较
				if(child.containDot(dot)) uiList.push(child);
			});
		}
		return uiList;
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
	
	/**
	 * 绘制所有UI至某个绘图环境
	 * @param ctx
	 */
	Ycc.Layer.prototype.renderAllToCtx = function (ctx) {
		var self = this;
		self.uiCountRecursion=0;
		self.uiCountRendered=0;
		for(var i=0;i<this.uiList.length;i++){
			if(!this.uiList[i].show) continue;
			//this.uiList[i].__render();
			// 按树的层次向下渲染
			this.uiList[i].itor().depthDown(function (ui, level) {
				//console.log(level,ui);
				self.uiCountRecursion++;
				// UI显示
				if(ui.show){
					var renderError = ui.__render();
					// 若使用了缓存，需要计算缓存的最小绘制区域
					if(self.useCache) self._mergeCtxCacheRect(ui.getAbsolutePositionRect());
					if(!renderError) self.uiCountRendered++;
					// else console.log(renderError,111);
				}else
					return -1;
			});
			// 触发此UI所有子UI渲染完成后的回调
			this.uiList[i]._onChildrenRendered&&this.uiList[i]._onChildrenRendered();
		}
		var rect = this.ctxCacheRect;
		if(this.useCache&&rect&&this.renderCacheRect){
			var dpi = this.yccInstance.dpi;
			var stageW = this.yccInstance.getStageWidth()/dpi;
			var stageH = this.yccInstance.getStageHeight()/dpi;
			
			var x = rect.x<0?0:rect.x,y=rect.y<0?0:rect.y,width=rect.width>stageW?stageW:rect.width,height=rect.height>stageH?stageH:rect.height;
			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle='red';
			ctx.strokeWidth=2;
			ctx.rect(x*dpi,y*dpi,width*dpi,height*dpi);
			ctx.closePath();
			ctx.stroke();
			ctx.restore();
		}
		
		// 兼容wx端，wx端多一个draw API
		ctx.draw && ctx.draw();
	};
	
	/**
	 * 合并需要合并的最小区域
	 * @param absolutePositionRect	当前UI的绝对坐标范围
	 * @private
	 */
	Ycc.Layer.prototype._mergeCtxCacheRect = function (absolutePositionRect) {
		var ycc = this.yccInstance;
		
		if(!this.ctxCacheRect)
			return this.ctxCacheRect = new Ycc.Math.Rect(absolutePositionRect);
		
		var stageW = ycc.getStageWidth();
		var stageH = ycc.getStageHeight();
		var dpi = ycc.dpi;
		
		var rect = this.ctxCacheRect;
		
		var x1 = rect.x+rect.width;
		var y1 = rect.y+rect.height;
		
		var x2 = absolutePositionRect.x+absolutePositionRect.width;
		var y2 = absolutePositionRect.y+absolutePositionRect.height;
		
		// x、y取最小
		rect.x=rect.x<absolutePositionRect.x?rect.x:absolutePositionRect.x;
		rect.y=rect.y<absolutePositionRect.y?rect.y:absolutePositionRect.y;
		// 高宽取最大
		rect.width = x1<x2?(x2-rect.x):(x1-rect.x);
		rect.height = y1<y2?(y2-rect.y):(y1-rect.y);
		
		// 再次计算
		rect.x = rect.x<0?0:rect.x;
		rect.y = rect.y<0?0:rect.y;
		rect.width = rect.x+rect.width>stageW/dpi?stageW/dpi-rect.x:rect.width;
		rect.height = rect.y+rect.height>stageH/dpi?stageH/dpi-rect.y:rect.height;
		return rect;
	};
	
	/**
	 * 更新图层的缓存绘图环境
	 */
	Ycc.Layer.prototype.updateCache = function () {
		// 判断是否使用缓存
		if(!this.useCache) return;

		this.clearCache();
		this.renderAllToCtx(this.ctxCache);
		
	};
	
	/**
	 * 清空缓存画布、缓存区域
	 */
	Ycc.Layer.prototype.clearCache = function () {
		var w = this.ctxCache.canvas.width;
		this.ctxCache.canvas.width = w;
		// 清空缓存区域
		this.ctxCacheRect = null;
	};
	
})(Ycc);