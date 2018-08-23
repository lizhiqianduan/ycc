/**
 * @file    Ycc.UI.SingleLineText.class.js
 * @author  xiaohei
 * @date    2017/11/15
 * @description  Ycc.UI.SingleLineText.class文件
 */




(function (Ycc) {
	
	/**
	 * 绘制单行文本
	 * @constructor
	 * @extends Ycc.UI.Base
	 * @param option	{object}		所有可配置的配置项
	 * @param option.content=""	{string}	内容
	 * @param option.color=black	{string}	颜色
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.overflow=auto	{string}	水平方向超出rect之后的显示方式
	 * 		<br> `hidden` -- 直接隐藏
	 * 		<br> `auto`	-- 修改rect大小，完全显示
	 * @return {Ycc.UI}
	 */

	Ycc.UI.SingleLineText = function SingleLineText(option) {
		Ycc.UI.Base.call(this,option);
		this.yccClass = Ycc.UI.SingleLineText;
		
		/**
		 * 区域内显示的文本
		 * @type {string}
		 */
		this.displayContent = "";
		
		/**
		 * 期望绘制的文本内容
		 * @type {string}
		 */
		this.content = "";

		/**
		 * 文字大小
		 * @type {string}
		 */
		this.fontSize = "16px";
		
		/**
		 * 文字描边or填充
		 * @type {boolean}
		 */
		this.fill = true;
		
		/**
		 * 文字颜色
		 * @type {string}
		 */
		this.color = "black";

		/**
		 * 文字在区域内x方向的排列方式。 `left` or `center`
		 * @type {string}
		 */
		this.xAlign = "left";
		
		/**
		 * 文字在区域内y方向的排列方式
		 * @type {string}
		 */
		this.yAlign = "center";
		
		/**
		 * 文字超出后的处理方式。 `auto` or `hidden`
		 * @type {string}
		 */
		this.overflow = "auto";

		this.extend(option);
	};
	Ycc.UI.SingleLineText.prototype = new Ycc.UI.Base();
	Ycc.UI.SingleLineText.prototype.constructor = Ycc.UI.SingleLineText;
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.SingleLineText.prototype.computeUIProps = function () {
		var self = this;
		
		// 设置画布属性再计算，否则计算内容长度会有偏差
		self.belongTo._setCtxProps(self);
		
		// 内容的长度
		var contentWidth = this.ctx.measureText(this.content).width;
		
		this.displayContent = this.content;
		
		// 长度超长时的处理
		if(contentWidth>this.rect.width){
			if(this.overflow === "hidden"){
				self.displayContent = self.getMaxContentInWidth(this.content,this.rect.width);
			}else if(this.overflow === "auto"){
				this.rect.width = contentWidth;
			}
		}
		
		if(this.overflow === "hidden"){
			if(contentWidth>this.rect.width)
				self.displayContent = self.getMaxContentInWidth(this.content,this.rect.width);
		}else if(this.overflow === "auto"){
			if(contentWidth>this.rect.width){
				this.rect.width = contentWidth;
			}
			if(parseInt(this.fontSize)>this.rect.height){
				this.rect.height = parseInt(this.fontSize);
			}
			
		}
	};
	/**
	 * 渲染至ctx
	 * @param ctx
	 */
	Ycc.UI.SingleLineText.prototype.render = function (ctx) {
		var self = this;
		
		// 设置画布属性再计算，否则计算内容长度会有偏差
		self.belongTo._setCtxProps(self);

		self.ctx = ctx || self.ctx;
		
		if(!self.ctx){
			console.error("[Ycc error]:","ctx is null !");
			return;
		}
		
		
		
		// 文字的绘制起点
		var x,y;
		// 字体大小
		var fontSize = parseInt(self.fontSize);
		// 配置项
		var option = this;
		// 绝对坐标
		var rect = this.getAbsolutePosition();
		x = rect.x;
		
		if(this.xAlign==="center"){
			var textWidth = this.ctx.measureText(this.displayContent).width;
			x+=(rect.width-textWidth)/2;
		}
		
		y = rect.y;
		
		if(fontSize>rect.height){
			return console.warn("[Ycc warning] : ","行高不够，或者文字太大！",option);
		}
		// 上下居中
		if(option.yAlign==="center"){
			y = y+rect.height/2-fontSize/2;
		}
		
		this.ctx.save();
		this.ctx.fillStyle = option.color;
		this.ctx.strokeStyle = option.color;
		// this.baseUI.text([x,y],self.displayContent,option.fill);
		this.ctx.fillText(self.displayContent,x,y);
		this.ctx.restore();
	};
	
	
	
})(window.Ycc);