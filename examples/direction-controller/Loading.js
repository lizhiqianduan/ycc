/**
 * @file    Loading.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  Loading文件
 */

function Loading(){
	this.layer = ycc.layerManager.newLayer();
	
	this.layer.addUI(new Ycc.UI.Rect({
		rect:new Ycc.Math.Rect(0,0,stageW,stageH),
		color:"rgba(0,0,0,0.1)"
	}));
	this.layer.addUI(new Ycc.UI.SingleLineText({
		content:"正在加载...",
		rect:new Ycc.Math.Rect(0,stageH/2,stageW,20),
		xAlign:"center"
	}));
	
	this.hidden = function(){
		this.layer.show = false;
	};
	
	this.show = function(){
		this.layer.show = true;
	};
}