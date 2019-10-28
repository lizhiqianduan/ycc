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
		
		/**
		 * 保存渲染时间，主要是reReader方法的耗时，开发者可以在每次reRender调用后获取该值
		 * @type {number}
		 * @readonly
		 */
		this.renderTime = 0;
		
		/**
		 * 保存最大的渲染时间，主要是reReader方法的耗时，开发者可以在每次reRender调用后获取该值
		 * @type {number}
		 * @readonly
		 */
		this.maxRenderTime = 0;
		
		/**
		 * 保存渲染的UI个数，主要是reReader方法中的UI个数，开发者可以在每次reRender调用后获取该值
		 * @type {number}
		 * @readonly
		 */
		this.renderUiCount = 0;
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
	 * 删除所有图层
	 */
	Ycc.LayerManager.prototype.deleteAllLayer = function () {
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			layer.removeAllUI();
			Ycc.Layer.release(layer);
			layer = null;
		}
		this.yccInstance.layerList=[];
	};
	
	
	
	/**
	 * 重新将所有图层绘制至舞台。不显示的图层也会更新。
	 * @param forceUpdate {boolean}	是否强制更新
	 * 若强制更新，所有图层会强制更新缓存
	 * 若非强制更新，对于使用缓存的图层，只会绘制缓存至舞台
	 */
	Ycc.LayerManager.prototype.reRenderAllLayerToStage = function (forceUpdate) {
		var t1 = Date.now();
		this.renderUiCount = 0;
		this.yccInstance.clearStage();
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			// 该图层是否可见
			if(!layer.show) continue;
			layer.reRender(forceUpdate);
			this.renderUiCount+=layer.uiCountRendered;
		}

		this.renderTime = Date.now()-t1;
		this.maxRenderTime=this.renderTime>this.maxRenderTime?this.renderTime:this.maxRenderTime;
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
	
	
	/**
	 * 根据json数组绘制所有图层
	 * @param jsonArray {Array} json数组，示例：[{option,ui[]}]
	 * @return {*}
	 */
	Ycc.LayerManager.prototype.renderAllLayerByJsonArray = function (jsonArray) {
		if(!Ycc.utils.isArray(jsonArray)){
			return console.error('jsonArray is not an Array!',jsonArray);
		}
		
		var self = this;
		for(var i=0;i<jsonArray.length;i++){
			var layerConfig = jsonArray[i];
			if(!Ycc.utils.isObj(layerConfig)){
				return console.error('item in jsonArray should be an Object!',layerConfig);
			}
			
			var layer = self.newLayer(layerConfig.option);
			
			for(var j=0;j<layerConfig.ui.length;j++){
				var uiConfig = layerConfig.ui[j];
				layer.addUI(new Ycc.UI[uiConfig.type](uiConfig.option));
			}
			
			layer.render();
			
		}
		
	};
	
	
	
})(Ycc);