/**
 * @file    Ycc.Debugger.class.js
 * @author  xiaohei
 * @date    2018/10/24
 * @description  Ycc.Debugger.class文件
 */


(function (Ycc) {
	
	/**
	 * ycc的调试模块
	 * @constructor
	 */
	Ycc.Debugger = function (yccInstance) {
		this.yccClass = Ycc.Debugger;
		
		/**
		 * ycc的实例
		 */
		this.yccInstance = yccInstance;
		/**
		 * 信息面板显示的UI 帧间隔
		 * @type {Ycc.UI}
		 */
		this.deltaTime = null;
		/**
		 * 信息面板显示的UI 帧间隔期望值
		 * @type {Ycc.UI}
		 */
		this.deltaTimeExpect = null;
		/**
		 * 信息面板显示的UI 总帧数
		 * @type {Ycc.UI}
		 */
		this.frameAllCount = null;
		/**
		 * 信息面板显示的UI 帧间隔平均值
		 * @type {Ycc.UI}
		 */
		this.deltaTimeAverage = null;
		
		/**
		 * 当前帧渲染耗时
		 * @type {Ycc.UI}
		 */
		this.renderTime = null;
		
		/**
		 * 当前帧渲染的所有UI个数
		 * @type {Ycc.UI}
		 */
		this.renderUiCount = null;
		
		this.totalJSHeapSize = null;
		
		this.usedJSHeapSize = null;
		
		this.jsHeapSizeLimit = null;
		
		
		/**
		 * 调试面板所显示的字段
		 * @type {Array[]}
		 * {name,cb,ui}
		 */
		this.fields = [];
		
		/**
		 * 调试面板的容纳区
		 * @type {Ycc.UI.Rect}
		 */
		this.rect = new Ycc.UI.Rect({
			name:'debuggerRect',
			rect:new Ycc.Math.Rect(10,10,200,140),
			color:'rgba(255,255,0,0.5)'
		});
		
		/**
		 * 调试面板的图层
		 */
		this.layer = yccInstance.layerManager.newLayer({
			name:"debug图层"
		});
		
		
		this.init();
	};
	
	
	Ycc.Debugger.prototype.init = function () {
		var self = this;
		this.yccInstance.ticker.addFrameListener(function () {
			self.updateInfo();
		});
	};
	
	/**
	 * 显示调试面板
	 */
	Ycc.Debugger.prototype.showDebugPanel = function () {
		var layer = this.layer;
		if(layer.uiList.indexOf(this.rect)===-1)
			layer.addUI(this.rect);
	};
	
	
	
	/**
	 * 更新面板的调试信息
	 */
	Ycc.Debugger.prototype.updateInfo = function () {
		
		// 强制使debug面板置顶
		var layerList = this.yccInstance.layerList;
		var index = layerList.indexOf(this.layer);
		if(index+1!==layerList.length){
			layerList.splice(index,1);
			layerList.push(this.layer);
		}
		
		this.rect.rect.height = this.fields.length*20;
		this.fields.forEach(function (field) {
			field.ui.content = field.name+' '+field.cb();
		});
		
	};
	
	
	/**
	 * 添加一个信息项
	 * @param name
	 * @param cb()	{function}
	 *  cb必须返回一个值，这个值将直接填入
	 *
	 */
	Ycc.Debugger.prototype.addField = function (name, cb) {
		var index = this.fields.length;
		var ui  = new Ycc.UI.SingleLineText({
			content:"usedJSHeapSize "+cb(),
			fontSize:'12px',
			rect:new Ycc.Math.Rect(0,20*index,100,20),
			color:'green'
		});
		this.fields.push({name:name,cb:cb,ui:ui});
		this.rect.addChild(ui);
	};
	
	
	/**
	 * 将调试面板添加至某个图层
	 * @param layer {Ycc.Layer}
	 */
	Ycc.Debugger.prototype.addToLayer = function (layer) {
		if(layer.uiList.indexOf(this.rect)===-1)
			layer.addUI(this.rect);
	};
	
	/**
	 * 更新某个调试字段的回调函数
	 * @param name
	 * @param cb
	 */
	Ycc.Debugger.prototype.updateField = function (name,cb) {
		for(var i=0;i<this.fields.length;i++){
			if(this.fields[i].name===name){
				this.fields[i].cb=null;
				this.fields[i].cb=cb;
				return;
			}
		}
	};
	
	
	
	
	
})(window.Ycc);