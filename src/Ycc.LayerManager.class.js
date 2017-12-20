/**
 * @file    Ycc.Layer.class.js
 * @author  xiaohei
 * @date    2017/10/23
 * @description  Ycc.LayerManager.class文件
 */


(function (Ycc) {
	
	/**
	 * Ycc的图层管理类。每个图层管理器都与一个canvas舞台绑定。
	 * @param yccInstance {Ycc}		ycc实例
	 * @constructor
	 */
	Ycc.LayerManager = function (yccInstance) {
		
		/**
		 * ycc实例
		 */
		this.yccInstance = yccInstance;
		
	};
	
	Ycc.LayerManager.prototype.init = function () {
	
	};
	
	
	/**
	 * 新建图层
	 * @param config
	 */
	Ycc.LayerManager.prototype.newLayer = function (config) {
		var layer = new Ycc.Layer(this.yccInstance,config);
		this.yccInstance.layerList.push(layer);
		return layer;
	};
	
	/**
	 * 删除图层。
	 * @param layer
	 */
	Ycc.LayerManager.prototype.deleteLayer = function (layer) {
		var layerList = this.yccInstance.layerList;
		for(var i = 0;i<layerList.length;i++){
			if(layerList[i].id === layer.id){
				this.yccInstance.layerList.splice(i,1);
				return layer;
			}
		}
		return layer;
	};
	
	
	/**
	 * 将可显示的所有图层渲染至舞台。
	 */
	Ycc.LayerManager.prototype.renderAllLayerToStage = function () {
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			// 该图层是否可见
			if(layer.show)
				this.yccInstance.ctx.drawImage(layer.canvasDom,layer.x,layer.y,layer.width,layer.height);
		}
	};
	
	/**
	 * 重新将所有图层绘制至舞台。不显示的图层也会更新。
	 */
	Ycc.LayerManager.prototype.reRenderAllLayerToStage = function () {
		this.yccInstance.clearStage();
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			layer.reRender();
			// 该图层是否可见
			if(layer.show)
				this.yccInstance.ctx.drawImage(layer.canvasDom,layer.x,layer.y,layer.width,layer.height);
		}
	};
	
	
	
	/**
	 * 依次合并图层。队列后面的图层将被绘制在前面图层之上。
	 * @param layerArray {Layer[]}	图层队列
	 * @return {*}
	 */
	Ycc.LayerManager.prototype.mergeLayers = function (layerArray) {
		var len = layerArray.length;
		if(len===0) return null;
		var resLayer = new Ycc.Layer(this.yccInstance,{name:"合并图层"});
		for(var i = 0;i<len;i++){
			var layer = layerArray[i];
			resLayer.ctx.drawImage(layer.canvasDom,0,0,layer.width,layer.height);
			layer = null;
		}
		this.yccInstance.layerList = [];
		this.yccInstance.layerList.push(resLayer);
		return resLayer;
	};
	
	/**
	 * 只允许某一个图层接收舞台事件
	 * @param layer	{Layer}		允许接收事件的图层
	 */
	Ycc.LayerManager.prototype.enableEventManagerOnly = function (layer) {
		if(!layer) return false;
		for(var i=0;i<this.yccInstance.layerList.length;i++) {
			this.yccInstance.layerList[i].enableEventManager = false;
		}
		layer.enableEventManager = true;
		return this;
	};
	
	/**
	 * 允许所有图层接收舞台事件
	 * @param enable
	 * @return {Ycc.LayerManager}
	 */
	Ycc.LayerManager.prototype.enableEventManagerAll = function (enable) {
		for(var i=0;i<this.yccInstance.layerList.length;i++) {
			this.yccInstance.layerList[i].enableEventManager = enable;
		}
		return this;
	};
	
	
	
})(window.Ycc);