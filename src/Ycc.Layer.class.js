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
	 	

		
		var defaultConfig = {
			name:"",
			type:"ui",
			
			// 图层在舞台的渲染位置
			x:0,
			y:0,
			
			// 图层的高宽
			width:yccInstance.getStageWidth(),
			height:yccInstance.getStageHeight(),
			show:true,
			enableEventManager:false,
			enableFrameEvent:false,
			ctxConfig:{
				fontStyle:"normal",
				fontVariant:"normal",
				fontWeight:"normal",
				fontSize:"16px",
				fontFamily:"微软雅黑",
				font:"16px 微软雅黑",
				textBaseline:"top",
				fillStyle:"red",
				strokeStyle:"blue"
			}
		};
		// 深拷贝
		var config = Ycc.utils.extend(defaultConfig,option,true);
		
		var canvasDom = document.createElement("canvas");
		canvasDom.width = config.width;
		canvasDom.height = config.height;
		
		 /**
		  * 配置项
		  */
		this.option = config;

		/**
		 * 存储图层中的所有UI。UI的顺序，即为图层中的渲染顺序。
		 * @type {Ycc.UI[]}
		 */
		this.uiList = [];
		
		/**
		 * 绘图环境的默认属性配置项
		 * @type {ctxConfig|{}}
		 */
		this.ctxConfig = config.ctxConfig;
		/**
		 * 初始化配置项
		 */
		this.config = config;
		
		/**
		 * ycc实例的引用
		 */
		this.yccInstance = yccInstance;
		/**
		 * 虚拟canvas元素的引用
		 * @type {Element}
		 */
		this.canvasDom = canvasDom;
		
		/**
		 * 画布属性的双向绑定
		 */
		this.canvasDom._props = {};
		
		/**
		 * 当前图层的绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = this.canvasDom.getContext('2d');
		
		/**
		 * 图层id
		 */
		this.id = layerIndex++;
		
		/**
		 * 图层类型。
		 * `ui`表示用于绘图的图层。`tool`表示辅助的工具图层。`text`表示文字图层。
		 * 默认为`ui`。
		 */
		this.type = config.type;
		
		/**
		 * 图层中的文字。仅当图层type为text时有值。
		 * @type {string}
		 */
		this.textValue = "";
		
		/**
		 * 图层名称
		 * @type {string}
		 */
		this.name = config.name?config.name:"图层_"+this.type+"_"+this.id;
		
		/**
		 * 图层位置的x坐标。默认与舞台左上角重合
		 * @type {number}
		 */
		this.x = config.x;
		
		/**
		 * 图层位置的Y坐标。默认与舞台左上角重合
		 * @type {number}
		 */
		this.y = config.y;
		
		/**
		 * 图层宽
		 * @type {number}
		 */
		this.width = config.width;
		/**
		 * 图层高
		 * @type {number}
		 */
		this.height = config.height;
		
		/**
		 * 图层是否显示
		 */
		this.show = config.show;
		
		/**
		 * 是否监听舞台的事件。用于控制舞台事件是否广播至图层。默认关闭
		 * @type {boolean}
		 */
		this.enableEventManager = config.enableEventManager;
		
		/**
		 * 是否接收每帧更新的通知
		 * @type {boolean}
		 */
		this.enableFrameEvent = config.enableFrameEvent;
		
		/**
		 * 若接收通知，此函数为接收通知的回调函数。当且仅当enableFrameEvent为true时生效
		 * @type {function}
		 */
		this.onFrameComing = function () {};
		
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
		// 初始化画布的属性
		if(!this.ctxConfig || !Ycc.utils.isObj(this.ctxConfig))
			return null;
		// 设置画布的所有属性
		self._setCtxProps();
		self._initEvent();
		//双向绑定ctx的属性
		var ctxConfig = this.ctxConfig;
		for(var key in ctxConfig){
			if(!ctxConfig.hasOwnProperty(key)) continue;
			Object.defineProperty(this.ctx.canvas._props,key,{
				enumerable : true,
				configurable : true,
				set : (function(k){
					return function (newValue) {
						// 修改_props的属性后自动设置画布的属性
						self.ctxConfig[k] = newValue;
						self._setCtxProps();
					};
				})(key),
				get:(function(k){
					return function () {
						return self.ctxConfig[k];
					};
				})(key)
			})
		}
		
		
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
		
		this.addListener("click",function (e) {
			// 如果鼠标已经改变了位置，那么click事件不触发
			if(mouseHasMove) return;
			defaultMouseListener(e);
		});
		
		this.addListener("mousedown",function (e) {
			mouseHasMove = false;
			mouseDownYccEvent = e;
			defaultMouseListener(e);
		});

		this.addListener("mouseup",function (e) {
			mouseUpYccEvent = e;
			defaultMouseListener(e);
		});
		
		this.addListener("mousemove",function (e) {
			// 判断是否真的移动
			if(mouseDownYccEvent && e.x===mouseDownYccEvent.x&&e.y===mouseDownYccEvent.y) return;
			// 解决webkit内核mouseup自动触发mousemove的BUG
			if(mouseUpYccEvent && e.x===mouseUpYccEvent.x&&e.y===mouseUpYccEvent.y) return;
			mouseHasMove = true;
			defaultMouseListener(e);
		});
		
		/**
		 * 默认的事件监听器。默认鼠标事件触发点位于rect内，事件才转发给UI。
		 * @param e	{Ycc.Event}	ycc事件
		 */
		function defaultMouseListener(e) {
			if(e.stop) return;
			for(var i = 0;i<self.uiList.length;i++){
				var ui = self.uiList[i];
				// 图层内部UI的相对坐标
				var layerX = e.x - ui.belongTo.x;
				var layerY = e.y - ui.belongTo.y;
				var dot = new Ycc.Math.Dot(layerX,layerY);
				// 如果位于rect内，并且事件未被阻止，触发事件,并阻止继续传递
				if(dot.isInRect(ui.option.rect) && e.stop===false){
					e.stop = true;
					e.mouseDownYccEvent = mouseDownYccEvent;
					e.mouseUpYccEvent = mouseUpYccEvent;
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
	Ycc.Layer.prototype._setCtxProps = function () {
		var self = this;
		var ctxConfig = this.ctxConfig;
		ctxConfig["font"] = [ctxConfig.fontStyle,ctxConfig.fontVariant,ctxConfig.fontWeight,ctxConfig.fontSize,ctxConfig.fontFamily].join(" ");
		for(var key in self.ctxConfig){
			if(!self.ctxConfig.hasOwnProperty(key)) continue;
			self.ctx[key] = self.ctxConfig[key];
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
			this.yccInstance.ctx.drawImage(this.canvasDom,0,0,this.width,this.height);
	};
	
	/**
	 * 添加一个UI图形至图层
	 * @param ui {Ycc.UI}	UI图形
	 */
	Ycc.Layer.prototype.addUI = function (ui) {
		ui.init(this);
		ui.render();
		this.uiList.push(ui);
	};
	
	
	
})(window.Ycc);