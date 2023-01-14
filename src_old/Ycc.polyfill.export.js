/**
 * @file    Ycc.polyfill.export.js
 * @author  xiaohei
 * @date    2018/12/11
 * @description  Ycc.polyfill.export文件
 *
 * 导出兼容文件，兼容npm模块的加载模式
 */


;if(typeof exports==="object"&&typeof module!=="undefined"){
	module.exports=Ycc;
}else if(typeof define==="function"){
	define("Ycc",Ycc)
}else{
	var g;
	if(typeof window!=="undefined"){g=window}
	else if(typeof global!=="undefined"){g=global}
	else if(typeof self!=="undefined"){g=self}
	else{g=this}
	g.Ycc = Ycc;
}