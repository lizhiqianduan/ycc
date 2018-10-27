/**
 * @file    Ycc.UI.ImageFrameAnimation.js
 * @author  xiaohei
 * @date    2018/9/29
 * @description  Ycc.UI.ImageFrameAnimation文件
 */


(function (Ycc) {
	/**
	 * 图片序列帧动画的UI
	 * @param option				{object}		所有可配置的配置项
	 * @param option.rect			{Ycc.Math.Rect}	容纳区。会将显示区的内容缩放至这个区域。
	 * @param option.res			{Image}			需要填充的图片资源。注：必须已加载完成。
	 * @param option.frameSpace		{Number}		序列帧播放的帧间隔。默认为1，即每帧都更换图片
	 * @param option.firstFrameRect	{Number}		首帧的显示区。该区域相对于原始图片，且之后帧显示区将按照这个区域的width递推
	 * @param option.frameRectCount	{Number}		帧显示区的递推个数。该个数相对于原始图片，表示之后帧显示区的递推个数
	 * @param option.autoplay		{Boolean}		自动播放
	 * @param option.mirror			{Number}		将图片镜像绘制方式
	 * 		<br> 0		--		无
	 * 		<br> 1		--		上下颠倒
	 * 		<br> 2		--		左右翻转
	 * 		<br> 3		--		上下左右颠倒
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.ImageFrameAnimation = function ImageFrameAnimation(option) {
		Ycc.UI.Base.call(this,option);
		this.yccClass = Ycc.UI.ImageFrameAnimation;
		
		
		/**
		 * 需要填充的图片资源。注：必须已加载完成。
		 * @type {Image}
		 */
		this.res = null;
		
		/**
		 * 序列帧播放的帧间隔。默认为1，即每帧都更换图片
		 * @type {number}
		 */
		this.frameSpace = 1;
		
		/**
		 * 首帧的显示区
		 * @type {null|Ycc.Math.Rect}
		 */
		this.firstFrameRect = null;
		
		/**
		 * 动画开始时系统的总帧数
		 * @type {number}
		 */
		this.startFrameCount = 0;
		
		/**
		 * 帧显示区的递推个数
		 * @type {number}
		 */
		this.frameRectCount = 1;
		
		/**
		 * 是否自动播放
		 * @type {boolean}
		 */
		this.autoplay = false;
		
		/**
		 * 是否真正播放
		 * @type {boolean}
		 */
		this.isRunning = false;
		
		/**
		 * 图片颠倒方式
		 * 		<br> 0		--		无
		 * 		<br> 1		--		左右颠倒
		 * 		<br> 2		--		上下翻转
		 * 		<br> 3		--		上下左右颠倒
		 * @type {number}
		 */
		this.mirror = 0;
		
		
		
		this.extend(option);
		
		// 初始化
		this.isRunning = this.autoplay;
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.ImageFrameAnimation.prototype,Ycc.UI.Base.prototype);
	Ycc.UI.ImageFrameAnimation.prototype.constructor = Ycc.UI.ImageFrameAnimation;
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.ImageFrameAnimation.prototype.computeUIProps = function () {
	
	};
	
	/**
	 * 处理镜像
	 * @param rect {Ycc.Math.Rect} 计算之后的图片容纳区
	 * @private
	 */
	Ycc.UI.ImageFrameAnimation.prototype._processMirror = function (rect) {
		if(this.mirror===1){
			this.ctx.scale(-1, 1);
			this.ctx.translate(-rect.x*2-rect.width,0);
		}
		if(this.mirror===2){
			this.ctx.scale(1, -1);
			this.ctx.translate(0,-rect.y*2-rect.height);
		}
		if(this.mirror===3){
			this.ctx.scale(-1, -1);
			this.ctx.translate(-rect.x*2-rect.width,-rect.y*2-rect.height);
		}
		
	};
	
	/**
	 * 绘制
	 */
	Ycc.UI.ImageFrameAnimation.prototype.render = function () {
		
		// 绝对坐标
		var rect = this.getAbsolutePosition();
		// 获取当前显示第几个序列图，由于默认播放第一帧图片，这里直接渲染第二帧图片
		var index = parseInt((this.belongTo.yccInstance.ticker.frameAllCount-this.startFrameCount)/this.frameSpace)%this.frameRectCount+1;
		// 若没开始播放，默认只绘制第一个序列帧
		if(!this.isRunning || index>=this.frameRectCount)
			index=0;
		// 绘制
		this.ctx.save();
		this.scaleAndRotate();

		// 处理镜像属性
		this._processMirror(rect);

		this.ctx.drawImage(this.res,
			this.firstFrameRect.x+this.firstFrameRect.width*index,this.firstFrameRect.y,this.firstFrameRect.width,this.firstFrameRect.height,
			rect.x,rect.y,rect.width,rect.height);
		this.ctx.restore();
	};
	
	
	/**
	 * 开始播放
	 */
	Ycc.UI.ImageFrameAnimation.prototype.start = function () {
		this.startFrameCount = this.belongTo.yccInstance.ticker.frameAllCount;
		this.isRunning = true;
	};
	
	/**
	 * 停止播放
	 */
	Ycc.UI.ImageFrameAnimation.prototype.stop = function () {
		this.isRunning = false;
	};
	
	
	
})(window.Ycc);

