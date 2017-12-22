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
	 * @constructor
	 */
	win.Ycc = function Ycc(){
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
	 * 绑定canvas元素
	 * @param canvasDom		canvas的HTML元素。即，显示舞台
	 */
	win.Ycc.prototype.bindCanvas = function (canvasDom) {
		this.canvasDom = canvasDom;
		
		this.ctx = this.canvasDom.getContext("2d");
		
		this.layerList = [];
		
		this.photoManager = new Ycc.PhotoManager(this);
		
		this.layerManager = new Ycc.LayerManager(this);
		
		this.ticker = new Ycc.Ticker(this);
		
		this.baseUI = new Ycc.UI(this.ctx.canvas);
		
		this.init();
	};
	
	/**
	 * 类初始化
	 */
	win.Ycc.prototype.init = function () {
		this._initStageEvent();
	};
	
	/**
	 * 初始化舞台的事件监听器
	 * @private
	 */
	win.Ycc.prototype._initStageEvent = function () {
		var self = this;
		// 代理的原生鼠标事件，默认每个图层都触发
		var proxyEventTypes = ["mousemove","mousedown","mouseup","click","mouseenter","mouseout"];
		for(var i = 0;i<proxyEventTypes.length;i++){
			this.ctx.canvas.addEventListener(proxyEventTypes[i],function (e) {
				var yccEvent = new Ycc.Event({
					type:e.type,
					x:parseInt(e.clientX - self.ctx.canvas.getBoundingClientRect().left),
					y:parseInt(e.clientY - self.ctx.canvas.getBoundingClientRect().top)
				});
				for(var i=self.layerList.length-1;i>=0;i--){
					var layer = self.layerList[i];
					if(!layer.enableEventManager) continue;
					layer.triggerListener(e.type,yccEvent);
				}
			})
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
		})
		
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
})(window);