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
		
	};
	
	/**
	 * 并发加载资源
	 * @param resArr
	 * @param [resArr.name] 	资源名称，方便查找
	 * @param resArr.url  		资源的url
	 * @param [resArr.type]  	资源类型 image,audio，默认为image
	 * @param [resArr.res]  	资源加载完成后，附加给该字段
	 * @param endCb				资源加载结束的回调
	 * @param [progressCb]		资源加载进度的回调
	 * @param [endResArr] 		用于存储加载已结束的音频，一般不用传值
	 * @param [endResMap] 		用于存储加载已结束的音频map，一般不用传值。注：map的key是根据name字段生成的
	 */
	Ycc.Loader.prototype.loadResParallel = function (resArr, endCb, progressCb,endResArr,endResMap) {
		endResArr = endResArr || [];
		endResMap = endResMap || {};
		
		for(var i=0;i<resArr.length;i++){
			var curRes = resArr[i];
			var successEvent = "load";
			var errorEvent = "error";
			curRes.type = curRes.type || 'image';
			
			if(curRes.type==='image'){
				curRes.res = new Image();
				curRes.res.src = curRes.url;
			}
			if(curRes.type==='audio'){
				successEvent = 'loadedmetadata';
				curRes.res = new Audio();
				curRes.res.src = curRes.url;
				curRes.res.preload = "load";
			}
			
			curRes.res.addEventListener(successEvent,listener(curRes,i,true));
			curRes.res.addEventListener(errorEvent,listener(curRes,i,false));
			
			
			function listener(curRes,index,error) {
				return function () {
					endResArr.push(curRes);
					if(typeof curRes.name!=='undefined') endResMap[curRes.name] = curRes.res;
					Ycc.utils.isFn(progressCb) && progressCb(curRes,error,index);
					if(resArr.length===endResArr.length){
						endCb(endResArr,endResMap);
					}
				};
			}
		}
	};
	

	/**
	 * 依次加载资源
	 * @param resArr
	 * @param [resArr.name] 	资源名称，方便查找
	 * @param resArr.url  		资源的url
	 * @param [resArr.type]  	资源类型 image,audio
	 * @param [resArr.res]  	资源加载完成后，附加给该字段
	 * @param endCb				资源加载结束的回调
	 * @param [progressCb]		资源加载进度的回调
	 * @param [endResArr] 		用于存储加载已结束的音频，一般不用传值
	 * @param [endResMap] 		用于存储加载已结束的音频map，一般不用传值。注：map的key是根据name字段生成的
	 */
	Ycc.Loader.prototype.loadResOneByOne = function (resArr, endCb, progressCb,endResArr,endResMap) {
		endResArr = endResArr || [];
		endResMap = endResMap || {};
		if(resArr.length===endResArr.length){
			endCb(endResArr,endResMap);
			return;
		}
		var self = this;
		// 当前加载的下标
		var index = endResArr.length;
		var curRes = resArr[index];
		var successEvent = "load";
		var errorEvent = "error";
		curRes.type = curRes.type || 'image';
		
		if(curRes.type==='image'){
			curRes.res = new Image();
			curRes.res.src = curRes.url;
		}
		if(curRes.type==='audio'){
			successEvent = 'loadedmetadata';
			curRes.res = new Audio();
			curRes.res.src = curRes.url;
			curRes.res.preload = "load";
		}
		
		
		curRes.res.addEventListener(successEvent,function () {
			endResArr.push(curRes);
			if(typeof curRes.name!=='undefined') endResMap[curRes.name] = curRes.res;

			Ycc.utils.isFn(progressCb) && progressCb(curRes,true,index);
			self.loadResOneByOne(resArr,endCb,progressCb,endResArr,endResMap);
		});
		curRes.res.addEventListener(errorEvent,function () {
			endResArr.push(curRes);
			if(typeof curRes.name!=='undefined') endResMap[curRes.name] = curRes.res;
			Ycc.utils.isFn(progressCb) && progressCb(curRes,true,index);
			self.loadResOneByOne(resArr,endCb,progressCb,endResArr,endResMap);
		});

		
	};
	
	/**
	 * 获取资源
	 * @param resArr
	 * @param name
	 */
	Ycc.Loader.prototype.getResByName = function (name,resArr) {
		for(var i=0;i<resArr.length;i++){
			if(resArr[i].name===name)
				return resArr[i];
		}
		return null;
	};
	
	
})(window.Ycc);