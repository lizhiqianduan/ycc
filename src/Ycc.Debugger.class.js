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
		 *
		 * @type {Array[]}
		 * {name,cb}
		 */
		this.fields = [];
		
		/**
		 * 调试面板的容纳区
		 * @type {Ycc.UI.Rect}
		 */
		this.rect = new Ycc.UI.Rect({
			name:'debuggerRect'
			rect:new Ycc.Math.Rect(10,10,200,140),
			color:'rgba(255,255,0,0.5)'
		});
		
	};
	
	
	/**
	 * 创建左上角的信息面板
	 * @return {{deltaTime: Ycc.UI.SingleLineText, deltaTimeExpect: Ycc.UI.SingleLineText, frameAllCount: Ycc.UI.SingleLineText, deltaTimeAverage: Ycc.UI.SingleLineText}}
	 */
	Ycc.Debugger.prototype.createDebugInfoUI=function(){

		var ycc = this.yccInstance;
		
		// 容纳区
		var rect = new Ycc.UI.Rect({
			rect:new Ycc.Math.Rect(10,10,200,140),
			color:'rgba(255,255,0,0.5)'
		});
		
		// 字体样式
		var fontSize = '12px';
		var color = 'green';
		
		// 第一行
		this.deltaTime = new Ycc.UI.SingleLineText({
			content:"帧间隔 "+ycc.ticker.deltaTime,
			fontSize:fontSize,
			rect:new Ycc.Math.Rect(0,0,100,20),
			color:color
		});
		this.deltaTimeExpect = new Ycc.UI.SingleLineText({
			content:"期望值 "+ycc.ticker.deltaTimeExpect,
			fontSize:fontSize,
			rect:new Ycc.Math.Rect(100,0,100,20),
			color:color
		});
		
		// 第二行
		this.frameAllCount = new Ycc.UI.SingleLineText({
			content:"总帧数 "+ycc.ticker.frameAllCount,
			fontSize:fontSize,
			rect:new Ycc.Math.Rect(0,20,100,20),
			color:color
		});
		this.deltaTimeAverage  = new Ycc.UI.SingleLineText({
			content:"帧间隔平均值 "+ycc.ticker.deltaTimeTotalValue/ycc.ticker.frameAllCount,
			fontSize:fontSize,
			rect:new Ycc.Math.Rect(100,20,100,20),
			color:color
		});
		
		// 第三行
		this.renderUiCount = new Ycc.UI.SingleLineText({
			content:"UI数量 "+ycc.layerManager.renderUiCount,
			fontSize:fontSize,
			rect:new Ycc.Math.Rect(0,40,100,20),
			color:color
		});
		this.renderTime  = new Ycc.UI.SingleLineText({
			content:"UI渲染时间 "+ycc.layerManager.renderTime,
			fontSize:fontSize,
			rect:new Ycc.Math.Rect(100,40,100,20),
			color:color
		});
		
		// 第四行
		this.totalJSHeapSize = new Ycc.UI.SingleLineText({
			content:"totalJSHeapSize "+ycc.layerManager.renderUiCount,
			fontSize:fontSize,
			rect:new Ycc.Math.Rect(0,60,100,20),
			color:color
		});

		// 第五行
		this.usedJSHeapSize  = new Ycc.UI.SingleLineText({
			content:"usedJSHeapSize "+ycc.layerManager.renderTime,
			fontSize:fontSize,
			rect:new Ycc.Math.Rect(0,80,100,20),
			color:color
		});
		
		// 第六行
		this.jsHeapSizeLimit = new Ycc.UI.SingleLineText({
			content:"jsHeapSizeLimit "+ycc.layerManager.renderUiCount,
			fontSize:fontSize,
			rect:new Ycc.Math.Rect(0,100,100,20),
			color:color
		});
		
		
		rect.addChild(this.deltaTime);
		rect.addChild(this.deltaTimeExpect);
		
		rect.addChild(this.frameAllCount);
		rect.addChild(this.deltaTimeAverage);
		
		rect.addChild(this.renderUiCount);
		rect.addChild(this.renderTime);
		
		// rect.addChild(this.totalJSHeapSize);
		// rect.addChild(this.usedJSHeapSize);
		//
		// rect.addChild(this.jsHeapSizeLimit);
		
		return rect;
	};
	
	
	/**
	 * 更新面板的调试信息
	 */
	Ycc.Debugger.prototype.updateInfo = function () {
		var self = this;
		/*this.deltaTime.content="帧间隔 "+ycc.ticker.deltaTime.toFixed(2);
		this.deltaTimeExpect.content="期望值 "+ycc.ticker.deltaTimeExpect.toFixed(2);
		this.frameAllCount.content="总帧数 "+ycc.ticker.frameAllCount;
		this.deltaTimeAverage.content="帧间隔平均值 "+(ycc.ticker.deltaTimeTotalValue/ycc.ticker.frameAllCount).toFixed(2);
		this.renderUiCount.content="UI数量 "+ycc.layerManager.renderUiCount;
		this.renderTime.content="UI渲染时间 "+ycc.layerManager.renderTime;
		this.totalJSHeapSize.content="totalJSHeapSize "+performance.memory.totalJSHeapSize;
		this.usedJSHeapSize.content="usedJSHeapSize "+performance.memory.usedJSHeapSize;
		this.jsHeapSizeLimit.content="jsHeapSizeLimit "+performance.memory.jsHeapSizeLimit;*/
		this.rect.rect.height = this.fields.length*20;
		this.fields.forEach(function (field) {
			self['field_'+field.name].content = field.name+' '+field.cb();
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
		this['field_'+name]  = new Ycc.UI.SingleLineText({
			content:"usedJSHeapSize "+cb(),
			fontSize:'12px',
			rect:new Ycc.Math.Rect(0,20*index,100,20),
			color:'green'
		});
		this.fields.push({name:name,cb:cb});
		this.rect.addChild(this['field_'+name]);
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
				this.fields[i].cb=cb;
				return;
			}
		}
	};
	
	
	
	
	
})(window.Ycc);