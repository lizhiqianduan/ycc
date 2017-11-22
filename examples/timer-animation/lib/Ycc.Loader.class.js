/**
 * @file    Ycc.Loader.class.js
 * @author  xiaohei
 * @date    2017/10/9
 * @description  Ycc.Loader.class文件
 */



(function (Ycc) {
	
	/**
	 * ycc实例的资源加载类
	 * @constructor
	 */
	Ycc.Loader = function () {
		/**
		 * 保存加载之后的所有图片资源。键为资源名称；值为Image元素
		 * @type {{}}
		 */
		this.imageRes = {};
	};
	
	
	/**
	 * 加载单个图片资源
	 * @param imageSrc	{String}	图片的路径
	 * @param endCb		{Function}	加载成功的回调
	 * @private
	 */
	Ycc.Loader.prototype._loadImage = function (imageSrc,endCb) {
		var img = new Image();
		img.src = imageSrc;
		img.onload = function () {
			Ycc.utils.isFn(endCb) && endCb(img);
		}
	};
	
	/**
	 * 加载图片资源列表
	 * @param imagesSrc		{Object}	资源列表。键为资源名称；值为资源路径
	 * @param progressCb	{function}	加载进度的回调，每加载成功一个资源都会调用一次
	 * @param endCb			{function}	全部加载完成的回调
	 */
	Ycc.Loader.prototype.loadImageList = function (imagesSrc,endCb,progressCb) {
		var self = this;
		// 已加载图片的个数
		var loadedNum = 0;
		// 资源的名称
		var keys = Object.keys(imagesSrc);
		for(var i =0;i<keys.length;i++){
			var src = imagesSrc[keys[i]];
			this._loadImage(src,(function (key) {
				return function (img) {
					self.imageRes[key] = img;
					loadedNum++;
					Ycc.utils.isFn(progressCb)&&progressCb(img);
					if(loadedNum===keys.length){
						Ycc.utils.isFn(endCb)&&endCb(self.imageRes);
					}
				}
				
			})(keys[i]));
		}
	}
	
	
	
})(window.Ycc);