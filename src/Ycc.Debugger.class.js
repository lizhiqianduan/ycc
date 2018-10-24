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
		 * @type {null}
		 */
		this.deltaTime = null;
		/**
		 * 信息面板显示的UI 帧间隔期望值
		 * @type {null}
		 */
		this.deltaTimeExpect = null;
		/**
		 * 信息面板显示的UI 总帧数
		 * @type {null}
		 */
		this.frameAllCount = null;
		/**
		 * 信息面板显示的UI 帧间隔平均值
		 * @type {null}
		 */
		this.deltaTimeAverage = null;
	};
	
	
	/**
	 * 创建左上角的信息面板
	 * @return {{deltaTime: Ycc.UI.SingleLineText, deltaTimeExpect: Ycc.UI.SingleLineText, frameAllCount: Ycc.UI.SingleLineText, deltaTimeAverage: Ycc.UI.SingleLineText}}
	 */
	Ycc.Debugger.prototype.createDebugInfoUI=function(){
		var rect = new Ycc.UI.Rect({
			fill:true,
			rect:new Ycc.Math.Rect(10,10,200,100),
			color:'rgba(255,255,0,0.5)'
		});
		
		var fontSize = '12px';
		var color = 'green';
		
		
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
		
		
		rect.addChild(this.deltaTime);
		rect.addChild(this.deltaTimeExpect);
		rect.addChild(this.frameAllCount);
		rect.addChild(this.deltaTimeAverage);
		
		return rect;
	};
	
	
	/**
	 * 更新面板的调试信息
	 */
	Ycc.Debugger.prototype.updateInfo = function () {
		if(!this.deltaTime) return;
		this.deltaTime.content="帧间隔 "+this.yccInstance.ticker.deltaTime.toFixed(2);
		this.deltaTimeExpect.content="期望值 "+this.yccInstance.ticker.deltaTimeExpect.toFixed(2);
		this.frameAllCount.content="总帧数 "+this.yccInstance.ticker.frameAllCount.toFixed(2);
		this.deltaTimeAverage.content="帧间隔平均值 "+(this.yccInstance.ticker.deltaTimeTotalValue/this.yccInstance.ticker.frameAllCount).toFixed(2);
	};
	
	
	
	
	
	
	
	
})(window.Ycc);