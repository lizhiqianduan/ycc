/**
 * @file    Loading.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  Loading文件
 */

function Loading(){
	/**
	 * 正在加载下方的进度
	 * @type {string}
	 */
	this.textUI = new Ycc.UI.SingleLineText({
		content:'',
		fontSize:'12px',
		rect:new Ycc.Math.Rect(0,stageH/2+20,stageW,20),
		xAlign:"center",
		color:'red'
	});
	
	this.layer = ycc.layerManager.newLayer();
	
	this.layer.addUI(new Ycc.UI.Rect({
		rect:new Ycc.Math.Rect(0,0,stageW,stageH),
		color:"gray"
	}));
	this.layer.addUI(new Ycc.UI.SingleLineText({
		content:"正在加载...",
		rect:new Ycc.Math.Rect(0,stageH/2,stageW,20),
		xAlign:"center",
		color:'red'
	}));
	this.layer.addUI(this.textUI);
	
	this.hidden = function(){
		this.layer.show = false;
	};
	
	this.show = function(){
		this.layer.show = true;
	};
	
	this.updateText = function (text) {
		this.textUI.content = text;
		ycc.layerManager.reRenderAllLayerToStage();
	};
}