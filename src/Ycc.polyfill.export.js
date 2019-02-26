/**
 * @file    Ycc.polyfill.export.js
 * @author  xiaohei
 * @date    2018/12/11
 * @description  Ycc.polyfill.export文件
 *
 * 导出兼容文件，兼容npm模块的加载模式
 */

;if("undefined"!== typeof module && "undefined" !== typeof window) {
	window.Ycc = Ycc;
}
