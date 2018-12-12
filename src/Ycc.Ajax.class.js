/**
 * @file    Ycc.Ajax.class.js
 * @author  xiaohei
 * @date    2018/10/31
 * @description  Ycc.Ajax.class文件
 */



(function (Ycc) {
	
	/**
	 * 异步加载类
	 * @constructor
	 */
	Ycc.Ajax = function () {
		this.yccClass = Ycc.Ajax;
	};
	
	

	/**
	 * ajax get请求
	 * @param url
	 * @param successCb			成功的回调函数
	 * @param errorCb			失败的回调函数
	 * @param responseType
	 */
	/**
	 * ajax get请求
	 * @param option
	 * @param option.url
	 * @param option.successCb
	 * @param option.successCb
	 * @param option.responseType
	 */
	Ycc.Ajax.prototype.get = function (option) {
		var self = this;
		
		var url='',
			successCb,
			errorCb,
			responseType='json';
		if(arguments.length===1){
			url='';
			successCb=option.successCb;
			errorCb=option.errorCb;
			responseType='json';
		}else {
			url=arguments[0];
			successCb=arguments[1];
			errorCb=arguments[2];
			responseType=arguments[3];
		}
		
		
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = responseType;
		
		// Decode asynchronously
		request.onload = function() {
			successCb.call(self,request.response);
		};
		
		request.onerror = function (e) {
			errorCb.call(self,e);
		};
		request.send();
	};
	
	
	
	
})(Ycc);