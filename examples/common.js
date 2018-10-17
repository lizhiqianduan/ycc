/**
 * @file    common.js
 * @author  xiaohei
 * @date    2018/8/22
 * @description  common文件
 */


var _hmt = _hmt || [];
(function() {
	if(location.host.indexOf('lizhiqianduan')===-1) return;
	var hm = document.createElement("script");
	hm.src = "https://hm.baidu.com/hm.js?5d5e740cad9b7cb184c47bca24da2053";
	var s = document.getElementsByTagName("script")[0];
	s.parentNode.insertBefore(hm, s);
})();


function logger(text){
	console.log('logger--> '+text);
	document.getElementById('log-con').innerHTML+=text+'<br>';
}