/**
 * @author  xiaohei
 * @date    2017/9/28
 * @description  ycc.plugin.editor文件
 * 	用ycc库做一个简单的编辑器插件
 * 	依赖Ycc库
 */


(function (Ycc) {
	if(!Ycc)
		return console.error("Error: need library `Ycc` import!");

	// 模块名
	var moduleName = "editor";
	
	if(Ycc.prototype[moduleName])
		return console.error("Error: Ycc plugin name `editor` is already exists!");
	
	Ycc.prototype[moduleName] = moduleConstructor;
	
	function moduleConstructor() {
	
	}
	
})(window.Ycc);


