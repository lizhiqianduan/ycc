/**
 * @file    Ycc.UI.Image.class.js
 * @author  xiaohei
 * @date    2017/11/22
 * @description  Ycc.UI.Image.class文件
 */



(function (Ycc) {
	
	
	/**
	 * 图片UI
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.fillMode=none {string} 填充方式
	 * 		<br> none -- 无填充方式。左上角对齐，超出隐藏，不修改rect大小。
	 * 		<br> repeat -- 重复。左上角对齐，重复平铺图片，不修改rect大小，超出隐藏。
	 * 		<br> scale -- 缩放。左上角对齐，缩放至整个rect区域，不修改rect大小。
	 * 		<br> auto -- 自动。左上角对齐，rect大小自动适配图片。若图片超出rect，会动态修改rect大小。
	 * @param option.res	{Image}	需要填充的图片资源。注：必须已加载完成。
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.Image = function (option) {
		Ycc.UI.Base.call(this);
		
		/**
		 * 配置项
		 */
		this.option = Ycc.utils.extend({
			rect:null,
			rectBgColor:"transparent",
			fillMode:"none",
			res:null
		},option);
	};
	Ycc.UI.Image.prototype = new Ycc.UI.Base();
	Ycc.UI.Image.prototype.constructor = Ycc.UI.Image;
	
	
	
	/**
	 * 绘制
	 */
	Ycc.UI.Image.prototype.render = function () {
		var rect = this.option.rect;
		var img = this.option.res;
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.rect(rect.x,rect.y,rect.width,rect.height);
		this.ctx.closePath();
		this.ctx.fillStyle = this.option.rectBgColor;
		this.ctx.fill();
		this.ctx.restore();


		if(this.option.fillMode === "none")
			this.ctx.drawImage(this.option.res,0,0,rect.width,rect.height,rect.x,rect.y,rect.width,rect.height);
		else if(this.option.fillMode === "scale")
			this.ctx.drawImage(this.option.res,0,0,img.width,img.height,rect.x,rect.y,rect.width,rect.height);
		else if(this.option.fillMode === "auto"){
			rect.width = img.width;
			rect.height = img.height;
			this.ctx.drawImage(this.option.res,0,0,img.width,img.height,rect.x,rect.y,rect.width,rect.height);
		}else if(this.option.fillMode === "repeat"){
			// x,y方向能容纳的img个数
			var wCount = parseInt(rect.width/img.width)+1;
			var hCount = parseInt(rect.height/img.height)+1;
			var xRest = img.width;
			var yRest = img.height;
			for(var i=0;i<wCount;i++){
				for(var j=0;j<hCount;j++){
					if(i===wCount-1)
						xRest = rect.width-i*img.width;
					if(j===hCount-1)
						yRest = rect.width-j*img.height;

					this.ctx.drawImage(this.option.res,
						0,0,
						xRest,yRest,
						rect.x+img.width*i,rect.y+img.height*j,
						xRest,yRest);
				}
			}
		}
		
		
	};
	
	
	
})(window.Ycc);