/**
 * @file    Ycc.Loader.class.js
 * @author  xiaohei
 * @date    2017/10/9
 * @description  Ycc.Loader.class文件
 */



(function (Ycc) {
	
	/**
	 * ycc实例的资源加载类
	 * @param yccInstance
	 * @constructor
	 */
	Ycc.Loader = function (yccInstance) {
		/**
		 * ycc的引用
		 * @type {Ycc}
		 */
		this.yccInstance = yccInstance;
		
	};
	
	
	/**
	 * 加载单个图片资源
	 * @param imageSrc
	 * @param endCb
	 */
	Ycc.Loader.prototype.loadImage = function (imageSrc,endCb) {
		var img = new Image();
		img.src = imageSrc;
		img.onload = function () {
			Ycc.utils.isFn(endCb) && endCb(img);
		}
	};
	
	/**
	 * 加载图片资源列表
	 * @param imagesSrc	{Object}	资源列表。键为资源名称；值为资源路径
	 * @param progressCb
	 * @param endCb
	 */
	Ycc.Loader.prototype.loadImageList = function (imagesSrc,progressCb,endCb) {
		// 已加载图片的个数
		var loadedNum = 0;
		// 记录加载的资源
		var res = {};
		// 资源的名称
		var keys = Object.keys(imagesSrc);
		for(var i =0;i<keys.length;i++){
			var src = imagesSrc[keys[i]];
			this.loadImage(src,(function (key) {
				return function (img) {
					res[key] = img;
					loadedNum++;
					Ycc.utils.isFn(progressCb)&&progressCb(img);
					if(loadedNum===keys.length){
						Ycc.utils.isFn(endCb)&&endCb(res);
					}
				}
				
			})(keys[i]));
		}
		
	}
	
	
	
})(window.Ycc);