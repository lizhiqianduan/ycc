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
		this.yccClass = Ycc.Loader;
		
		/**
		 * 保存加载之后的所有图片资源。键为资源名称；值为Image元素
		 * @type {{}}
		 */
		this.imageRes = {};
		
		/**
		 * 是否缓存图片。
		 * imageRes中key相同时，不会重复加载。
		 * @type {boolean}
		 */
		this.cache = true;
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
			if(self.cache){
				var img = self.imageRes[keys[i]];
				if(img){
					imageOnload(img);
					continue;
				}
			}
			
			
			this._loadImage(src,(function (key) {
				return function (img) {
					self.imageRes[key] = img;
					imageOnload(img);
				}
				
			})(keys[i]));
		}
		
		function imageOnload(img) {
			loadedNum++;
			Ycc.utils.isFn(progressCb)&&progressCb(img);
			if(loadedNum===keys.length){
				Ycc.utils.isFn(endCb)&&endCb(self.imageRes);
			}
		}
	};

	/**
	 * 依次加载图片
	 * @param imageArr
	 * @param imageArr.name
	 * @param imageArr.url
	 * @param imageArr.img
	 * @param endCb
	 * @param progressCb
	 */
	Ycc.Loader.prototype.loadImgOneByOne = function (imageArr, endCb, progressCb) {
		
		if(imageArr.length===0){
			endCb();
			return;
		}
		var self = this;
		var img = new Image();
		imageArr[0].img = img;
		img.src = imageArr[0].url;
		img.onload = function () {
			Ycc.utils.isFn(progressCb) && progressCb(imageArr[0],true);
			self.loadImgOneByOne(imageArr.slice(1),endCb,progressCb);
		};
		img.onerror = function () {
			Ycc.utils.isFn(progressCb) && progressCb(imageArr[0],false);
			self.loadImgOneByOne(imageArr.slice(1),endCb,progressCb);
		};
		
	};
	
	/**
	 * 是否使用缓存
	 * @param b {boolean}
	 */
	Ycc.Loader.prototype.useCache = function (b) {
		this.cache = b;
	};
	
	
	
})(window.Ycc);