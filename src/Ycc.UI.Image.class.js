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
	 * 		<br> none 			-- 无填充方式。左上角对齐，超出隐藏，不修改rect大小。
	 * 		<br> repeat 		-- 重复。左上角对齐，重复平铺图片，不修改rect大小，超出隐藏。
	 * 		<br> scale 			-- 缩放。左上角对齐，缩放至整个rect区域，不修改rect大小。
	 * 		<br> scaleRepeat 	-- 先缩放再重复。左上角对齐，缩放至某个rect区域，再重复填充整个rect区域，不修改rect大小。
	 * 		<br> auto 			-- 自动。左上角对齐，rect大小自动适配图片。若图片超出rect，会动态修改rect大小。
	 * 		<br> scale9Grid 	-- 9宫格模式填充。左上角对齐，中间区域将拉伸，不允许图片超出rect区域大小，不会修改rect大小。
	 * @param option.res	{Image}		需要填充的图片资源。注：必须已加载完成。
	 * @param option.mirror	{Number}	将图片镜像绘制方式
	 * 		<br> 0		--		无
	 * 		<br> 1		--		上下颠倒
	 * 		<br> 2		--		左右翻转
	 * 		<br> 3		--		上下左右颠倒
	 * @param option.scale9GridRect	{Ycc.Math.Rect}	9宫格相对于res图片的中间区域，当且仅当fillMode为scale9Grid有效。
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.Image = function Image(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.Image;
		
		/**
		 * 填充方式
		 * 		<br> none -- 无填充方式。左上角对齐，超出隐藏，不修改rect大小。
		 * 		<br> repeat -- 重复。左上角对齐，重复平铺图片，不修改rect大小，超出隐藏。
		 * 		<br> scale -- 缩放。左上角对齐，缩放至整个rect区域，不修改rect大小。
		 * 		<br> auto -- 自动。左上角对齐，rect大小自动适配图片。若图片超出rect，会动态修改rect大小。
		 * 		<br> scale9Grid -- 9宫格模式填充。左上角对齐，中间区域将拉伸，不允许图片超出rect区域大小，不会修改rect大小。		 *
		 * @type {string}
		 */
		this.fillMode = "none";

		/**
		 * 需要填充的图片资源。注：必须已加载完成。
		 * @type {Image}
		 */
		this.res = null;
		
		/**
		 * 图片颠倒方式
		 * 		<br> 0		--		无
		 * 		<br> 1		--		左右颠倒
		 * 		<br> 2		--		上下翻转
		 * 		<br> 3		--		上下左右颠倒
		 * @type {number}
		 */
		this.mirror = 0;
		
		/**
		 * 9宫格相对于res图片的中间区域，当且仅当fillMode为scale9Grid有效。
		 * @type {Ycc.Math.Rect}
		 */
		this.scale9GridRect=null;
		
		/**
		 * 缩放重复模式下，原始图片的缩放区域，当且仅当fillMode为scaleRepeat有效。
		 * @type {null}
		 */
		this.scaleRepeatRect = null;
		

		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Image.prototype,Ycc.UI.Polygon.prototype);
	Ycc.UI.Image.prototype.constructor = Ycc.UI.Image;
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Image.prototype.computeUIProps = function () {
		if(this.fillMode === "auto"){
			this.rect.width = this.res.width;
			this.rect.height = this.res.height;
		}
		// 计算多边形坐标
		this.coordinates= this.rect.getVertices();
		// 计算相对位置
		this.x=this.rect.x,this.y=this.rect.y;

	};
	
	/**
	 * 处理镜像
	 * @param rect {Ycc.Math.Rect} 计算之后的图片容纳区
	 * @private
	 */
	Ycc.UI.Image.prototype._processMirror = function (rect) {
		var ctx = this.ctxCache;
		if(this.mirror===1){
			ctx.scale(-1, 1);
			ctx.translate(-rect.x*2-rect.width,0);
		}
		if(this.mirror===2){
			ctx.scale(1, -1);
			ctx.translate(0,-rect.y*2-rect.height);
		}
		if(this.mirror===3){
			ctx.scale(-1, -1);
			ctx.translate(-rect.x*2-rect.width,-rect.y*2-rect.height);
		}
		
	};
	
	/**
	 * 绘制
	 */
	Ycc.UI.Image.prototype.render = function () {
		var ctx = this.ctxCache;
		
		ctx.save();
		// this.scaleAndRotate();
		
		var rect = this.getAbsolutePositionRect();//this.rect;
		var img = this.res;
		// 局部变量
		var i,j,wCount,hCount,xRest,yRest;
		var x = rect.x*this.dpi;
		var y = rect.y*this.dpi;
		var width = rect.width*this.dpi;
		var height = rect.height*this.dpi;
		var imgWidth = img.width*this.dpi;
		var imgHeight = img.height*this.dpi;
		
		// 坐标系旋转
		var absoluteAnchor = this.transformToAbsolute({x:this.anchorX,y:this.anchorY});
		ctx.translate(absoluteAnchor.x,absoluteAnchor.y);
		ctx.rotate(this.rotation*Math.PI/180);
		ctx.translate(-absoluteAnchor.x,-absoluteAnchor.y);
		
		this._processMirror(rect);
		if(this.fillMode === "none")
			ctx.drawImage(this.res,0,0,rect.width,rect.height,rect.x,rect.y,rect.width,rect.height);
		else if(this.fillMode === "scale")
			ctx.drawImage(this.res,0,0,img.width,img.height,rect.x,rect.y,rect.width,rect.height);
		else if(this.fillMode === "auto"){
			ctx.drawImage(this.res,0,0,img.width,img.height,rect.x,rect.y,rect.width,rect.height);
		}else if(this.fillMode === "repeat"){
			// x,y方向能容纳的img个数
			wCount = parseInt(width/imgWidth)+1;
			hCount = parseInt(height/imgHeight)+1;

			for(i=0;i<wCount;i++){
				for(j=0;j<hCount;j++){
					xRest = img.width;
					yRest = img.height;
					if(i===wCount-1)
						xRest = rect.width-i*img.width;
					if(j===hCount-1)
						yRest = rect.height-j*img.height;
					if(i===wCount-1)
						console.log('剩余量',i,j,xRest,yRest);
					ctx.drawImage(this.res,
						0,0,
						xRest,yRest,
						x+imgWidth*i,y+imgHeight*j,
						xRest*this.dpi,yRest*this.dpi);
				}
			}
		}else if(this.fillMode === "scaleRepeat"){
			// x,y方向能容纳的img个数
			wCount = parseInt(rect.width/this.scaleRepeatRect.width)+1;
			hCount = parseInt(rect.height/this.scaleRepeatRect.height)+1;
			
			for(i=0;i<wCount;i++){
				for(j=0;j<hCount;j++){
					xRest = this.scaleRepeatRect.width;
					yRest = this.scaleRepeatRect.height;
					if(i===wCount-1)
						xRest = rect.width-i*this.scaleRepeatRect.width;
					if(j===hCount-1)
						yRest = rect.height-j*this.scaleRepeatRect.height;
					this.ctx.drawImage(this.res,
						0,0,
						img.width,img.height,
						rect.x+this.scaleRepeatRect.width*i,rect.y+this.scaleRepeatRect.height*j,
						xRest,yRest);
				}
			}
		}else if(this.fillMode === "scale9Grid"){
			var centerRect = this.scale9GridRect;
			
			var grid = [];

			var src,dest;
			
			// 第1块
			grid[0]={};
			grid[0].src = new Ycc.Math.Rect(0,0,centerRect.x,centerRect.y);
			grid[0].dest = new Ycc.Math.Rect(rect.x,rect.y,centerRect.x,centerRect.y);
			
			// 第3块
			grid[2]={};
			grid[2].src = new Ycc.Math.Rect(centerRect.x+centerRect.width,0,img.width-centerRect.x-centerRect.width,centerRect.y);
			grid[2].dest = new Ycc.Math.Rect(rect.width-grid[2].src.width+rect.x,rect.y,grid[2].src.width,grid[2].src.height);
			
			// 第7块
			grid[6]={};
			grid[6].src = new Ycc.Math.Rect(0,centerRect.y+centerRect.height,centerRect.x,img.height-centerRect.y-centerRect.height);
			grid[6].dest = new Ycc.Math.Rect(rect.x,rect.y+rect.height-grid[6].src.height,grid[6].src.width,grid[6].src.height);
			
			// 第9块
			grid[8]={};
			grid[8].src = new Ycc.Math.Rect(centerRect.x+centerRect.width,centerRect.y+centerRect.height,img.width-centerRect.x-centerRect.width,img.height-centerRect.y-centerRect.height);
			grid[8].dest = new Ycc.Math.Rect(rect.width-grid[8].src.width+rect.x,rect.y+rect.height-grid[8].src.height,grid[8].src.width,grid[8].src.height);
			
			
			// 第2块
			grid[1]={};
			grid[1].src = new Ycc.Math.Rect(centerRect.x,0,centerRect.width,centerRect.y);
			grid[1].dest = new Ycc.Math.Rect(grid[0].dest.x+grid[0].dest.width,rect.y,rect.width-grid[0].dest.width-grid[2].dest.width,centerRect.y);
			
			// 第4块
			grid[3]={};
			grid[3].src = new Ycc.Math.Rect(grid[0].src.x,centerRect.y,grid[0].src.width,centerRect.height);
			grid[3].dest = new Ycc.Math.Rect(grid[0].dest.x,grid[0].dest.y+grid[0].dest.height,grid[0].dest.width,rect.height-grid[0].dest.height-grid[6].dest.height);
			
			// 第6块
			grid[5]={};
			grid[5].src = new Ycc.Math.Rect(grid[2].src.x,centerRect.y,grid[2].src.width,centerRect.height);
			grid[5].dest = new Ycc.Math.Rect(grid[2].dest.x,grid[3].dest.y,grid[2].dest.width,grid[3].dest.height);
			
			// 第8块
			grid[7]={};
			grid[7].src = new Ycc.Math.Rect(grid[1].src.x,grid[6].src.y,centerRect.width,grid[6].src.height);
			grid[7].dest = new Ycc.Math.Rect(grid[1].dest.x,grid[6].dest.y,grid[1].dest.width,grid[6].dest.height);
			
			// 第5块
			grid[4]={};
			grid[4].src = new Ycc.Math.Rect(centerRect.x,centerRect.y,centerRect.width,centerRect.height);
			grid[4].dest = new Ycc.Math.Rect(grid[1].dest.x,grid[5].dest.y,grid[1].dest.width,grid[5].dest.height);
			
			
			
			for(var k=0;k<grid.length;k++){
				if(!grid[k]) continue;
				src = grid[k].src;
				dest = grid[k].dest;
				ctx.drawImage(this.res,
					// 源
					src.x,src.y,src.width,src.height,
					// 目标
					dest.x,dest.y,dest.width,dest.height
				);
				
			}
			
		}
		ctx.restore();
		
	};
	
	
	
})(Ycc);