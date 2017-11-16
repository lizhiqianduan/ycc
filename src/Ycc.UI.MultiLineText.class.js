/**
 * @file    Ycc.UI.MultiLineText.class.js
 * @author  xiaohei
 * @date    2017/11/16
 * @description  Ycc.UI.MultiLineText.class文件
 */




(function (Ycc) {
	
	/**
	 * 多行文本UI
	 * @constructor
	 * @extends Ycc.UI.Base
	 * @param option	{object}		配置项
	 * @param option.content	{string}	内容
	 * @param [option.color=black]	{string}	颜色
	 * @param option.rect	{Ycc.Math.Rect}	文字的绘制区域。若超出长度，此区域会被修改
	 * @param [option.wordBreak=break-all]	{string}	水平方向文字超出换行
	 * 		<br>`break-all`		超出即换行
	 * 		<br>`break-word`		在单词处换行
	 * 		<br>`no-break`		不换行，超出即隐藏
	 * 		<br>默认为`no-break`
	 * @param [option.overflow=auto]	{string}	垂直方向超出rect之后的显示方式
	 * 		<br> `hidden` -- 直接隐藏
	 * 		<br> `auto`	-- 修改rect大小，完全显示
	 */
	Ycc.UI.MultiLineText = function (option) {
		Ycc.UI.Base.call(this);
		
		/**
		 * 配置项
		 */
		this.option = Ycc.utils.extend({
			content:"",
			fontSize:"16px",
			lineHeight:24,
			fill:true,
			color:"black",
			rect:null,
			wordBreak:"break-all",
			overflow:"auto"
		},option);
		
		/**
		 * 显示在文本框中的文本行。私有属性，不允许修改。
		 * @type {string[]}
		 */
		this.displayLines = [];
		
		
	};
	Ycc.UI.MultiLineText.prototype = new Ycc.UI.Base();
	Ycc.UI.MultiLineText.prototype.constructor = Ycc.UI.MultiLineText;
	/**
	 * 渲染至ctx
	 * @param ctx
	 */
	Ycc.UI.MultiLineText.prototype.render = function (ctx) {
		var self = this;
		
		self.ctx = ctx || self.ctx;
		
		if(!self.ctx){
			console.error("[Ycc error]:","ctx is null !");
			return;
		}
		
		
		// 修改引用
		var config = this.option;
		var lines = config.content.split(/(?:\r\n|\r|\n)/);
		
		this.ctx.save();
		this.ctx.fillStyle = config.color;
		this.ctx.strokeStyle = config.color;
		
		// 存储需要实时绘制的每行文字
		var renderLines = getRenderLines();
		self.displayLines = renderLines;
		if(config.overflow==="auto"){
			config.rect.height = config.lineHeight*renderLines.length;
		}
		// 绘制
		for(var i = 0;i<renderLines.length;i++){
			var x = config.rect.x;
			var y = config.rect.y + i*config.lineHeight;
			if(y+config.lineHeight>config.rect.y+config.rect.height){
				break;
			}
			this.baseUI.text([x,y],renderLines[i],config.fill);
		}
		this.ctx.restore();
		
		
		/**
		 * 获取需要实际绘制的文本行数组
		 */
		function getRenderLines(){
			switch (config.wordBreak){
				case "no-break":
				case "break-all":
					return getBreakAllRenderLines();
					break;
				case "break-word":
					return getBreakWordRenderLines();
					break;
				default:
					return getBreakAllRenderLines();
			}
			
			/**
			 * 获取break-all时的绘制文本行
			 */
			function getBreakAllRenderLines(){
				var res = [];
				for(var i = 0;i<lines.length;i++){
					var line = lines[i];
					var _lines = dealLine(line);
					res = res.concat(_lines);
				}
				return res;
				
				/**
				 * 递归处理单行超长的情况
				 * @param line
				 */
				function dealLine(line){
					var subLines = [];
					var lineW = self.ctx.measureText(line).width;
					// 若没有超长
					if(lineW<=config.rect.width){
						subLines.push(line);
						return subLines;
					}
					
					for(var j=0;j<line.length;j++){
						var part = line.slice(0,j+1);
						var partW = self.ctx.measureText(part).width;
						if(partW>config.rect.width){
							var subLine = line.slice(0,j-1);
							subLines.push(subLine);
							var restLine = line.slice(j-1);
							// 递归处理剩下的字符串
							subLines = subLines.concat(dealLine(restLine));
							return subLines;
						}
					}
				}
			}
			
			/**
			 * 获取break-word时的绘制文本行
			 */
			
			function getBreakWordRenderLines(){
				var res = [];
				for(var i = 0;i<lines.length;i++){
					var line = lines[i];
					var _lines = dealLine(line);
					res = res.concat(_lines);
				}
				return res;
				
				/**
				 * 递归处理单行超长的情况
				 * @param line
				 */
				function dealLine(line){
					var subLines = [];
					var lineW = self.ctx.measureText(line).width;
					// 若没有超长
					if(lineW<=config.rect.width){
						subLines.push(line);
						return subLines;
					}
					// 记录最后一次空格出现的位置
					var spacePosition = 0;
					for(var j=0;j<line.length;j++){
						var part = line.slice(0,j+1);
						var partW = self.ctx.measureText(part).width;
						var curChar = line[j];
						if(curChar===" ")
							spacePosition = j;
						if(partW>config.rect.width){
							var subLine = "";
							var restLine = "";
							// 若当前字符为空格
							if(curChar===" " || spacePosition===0){
								subLine = line.slice(0,j);
								subLines.push(subLine);
								restLine = line.slice(j);
								// 递归处理剩下的字符串
								subLines = subLines.concat(dealLine(restLine));
								return subLines;
							}
							
							// 当前字符不为空格
							subLine = line.slice(0,spacePosition);
							subLines.push(subLine);
							restLine = line.slice(spacePosition);
							// 递归处理剩下的字符串
							subLines = subLines.concat(dealLine(restLine));
							return subLines;
							
						}
					}
				}
			}
		}
	};
	
	
	
})(window.Ycc);