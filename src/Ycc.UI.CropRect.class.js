/**
 * @file    Ycc.UI.CropRect.class.js
 * @author  xiaohei
 * @date    2017/11/29
 * @description  Ycc.UI.CropRect.class文件
 */



(function (Ycc) {
	
	/**
	 * 裁剪框
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.fill=true {boolean}	填充or描边
	 * @constructor
	 * @extends Ycc.UI.Base
	 */
	Ycc.UI.CropRect = function CropRect(option) {
		Ycc.UI.Base.call(this,option);
		
		/**
		 * 控制点的大小
		 * @type {number}
		 */
		this.ctrlSize = 6;
		
		/**
		 * 拖拽是否允许超出舞台
		 * @type {boolean}
		 */
		this.enableDragOut = false;
		
		/**
		 * 是否填充
		 * @type {boolean}
		 */
		this.fill = true;
		
		/**
		 * 左上角 的控制点
		 * @type {Ycc.Math.Rect}
		 */
		this.ctrlRect1 = new Ycc.Math.Rect();
		/**
		 * 右上角 的控制点
		 * @type {Ycc.Math.Rect}
		 */
		this.ctrlRect2 = new Ycc.Math.Rect();
		/**
		 * 左下角 的控制点
		 * @type {Ycc.Math.Rect}
		 */
		this.ctrlRect3 = new Ycc.Math.Rect();
		/**
		 * 右下角 的控制点
		 * @type {Ycc.Math.Rect}
		 */
		this.ctrlRect4 = new Ycc.Math.Rect();
		
		/**
		 * 选框选择后，下方按钮的配置项
		 * @type {Ycc.UI.SingleLineText[]}
		 */
		this.btns = [];
		
		/**
		 * 下方按钮的高度
		 * @type {number}
		 */
		this.btnHeight = 38;
		
		
		this.extend(option);
		
		this._initUI();
	};
	Ycc.UI.CropRect.prototype = new Ycc.UI.Base();
	Ycc.UI.CropRect.prototype.constructor = Ycc.UI.CropRect;
	
	
	/**
	 * 是否显示框选后的操作按钮
	 * @param show {Boolean}	`true`--显示 `false`--隐藏
	 */
	Ycc.UI.CropRect.prototype.showBtns = function (show) {
		if(this.btns.length>0){
			for(var i =0;i<this.btns.length;i++){
				if(Ycc.utils.isObj(this.btns[i])){
					this.btns[i].show = show;
				}
			}
			this.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
		}
	};
	
	/**
	 * 设置区块的操作按钮
	 * @param btns
	 */
	Ycc.UI.CropRect.prototype.setCtrlBtns = function (btns) {
		this.btns = btns;
		var self = this;
		
		// 添加文字按钮到图层
		if(this.btns.length!==0){
			this.btns.forEach(function (btn) {
				self.belongTo.addUI(btn);
			})
		}
		
	};
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 */
	Ycc.UI.CropRect.prototype.computeUIProps = function () {
		// 设置画布属性再计算，否则计算内容长度会有偏差
		this.belongTo._setCtxProps(this);
		
		var rect = this.rect;
		var totalW = 0;
		// 计算控制点的属性
		this.ctrlRect1 = (new Ycc.Math.Rect(rect.x,rect.y,this.ctrlSize,this.ctrlSize));
		this.ctrlRect2 = (new Ycc.Math.Rect(rect.x+rect.width-this.ctrlSize,rect.y,this.ctrlSize,this.ctrlSize));
		this.ctrlRect3 = (new Ycc.Math.Rect(rect.x,rect.y+rect.height-this.ctrlSize,this.ctrlSize,this.ctrlSize));
		this.ctrlRect4 = (new Ycc.Math.Rect(rect.x+rect.width-this.ctrlSize,rect.y+rect.height-this.ctrlSize,this.ctrlSize,this.ctrlSize));
	
		// 计算操作按钮的属性
		if(this.btns.length===0) return;
		for(var i=0;i<this.btns.length;i++){
			var ui = this.btns[i];
			ui.overflow="auto";
			ui.xAlign="center";
			
			ui.rect.width=parseInt(this.ctx.measureText(ui.content).width+20);
			ui.rect.height = this.btnHeight;
			ui.rect.x=this.rect.x+totalW;
			ui.rect.y=this.rect.y+this.rect.height+2;
			totalW += ui.rect.width+1;
		}
	};
	
	/**
	 * 初始化UI
	 * @private
	 */
	Ycc.UI.CropRect.prototype._initUI = function () {
		var self = this;
		this.userData = this.userData?this.userData:{};
		this.addListener("dragstart",function (e) {
			self.showBtns(false);
			// 标识第几个变换控制点
			this.userData.ctrlStart = 0;
			// 拖拽开始时选框的位置
			this.userData.dragStartPosition = new Ycc.Math.Rect(this.rect);
			// 拖拽开始时鼠标的位置
			this.userData.dragStartMousePosition = new Ycc.Math.Dot(e);
			var dot = new Ycc.Math.Dot(e);
			for(var i=1;i<=4;i++){
				if(dot.isInRect(this["ctrlRect"+i])){
					this.userData.ctrlStart = i;
					return null;
				}
			}
		});
		
		this.addListener("dragging",function (e) {
			// 拖拽开始的起点位置
			var r = this.userData.dragStartPosition;
			// 拖拽开始时鼠标的位置
			var m = this.userData.dragStartMousePosition;
			// 选框位置信息的暂存值
			var x,y,width,height;
			// 控制点的拖拽事件
			if(this.userData.ctrlStart<=4&&this.userData.ctrlStart>=1){
				// 拖动左上角控制点
				if(this.userData.ctrlStart===1 ){
					x = e.x-(m.x-r.x);
					y = e.y-(m.y-r.y);
					width = r.width-(e.x-r.x);
					height = r.height-(e.y-r.y);
					if(x<=r.x+r.width-this.ctrlSize*2)
						this.rect.x = x;
					if(y<=r.y+r.height-this.ctrlSize*2)
						this.rect.y = y;
					
				}
				// 拖动右上角控制点
				if(this.userData.ctrlStart===2){
					x = r.x;
					y = e.y-(m.y-r.y);
					width = e.x-r.x+(r.width+r.x-m.x);
					height = r.height-(e.y-r.y);
					this.rect.x = x;
					if(y<=r.y+r.height-this.ctrlSize*2)
						this.rect.y = y;
				}
				// 拖动左下角控制点
				if(this.userData.ctrlStart===3){
					x = e.x-(m.x-r.x);
					y = r.y;
					width = r.width-(e.x-r.x);
					height = e.y - r.y + (r.height+r.y-m.y);
					if(x<=r.x+r.width-this.ctrlSize*2)
						this.rect.x = x;
					this.rect.y = y;
				}
				// 拖动右下角控制点
				if(this.userData.ctrlStart===4){
					this.rect.x = r.x;
					this.rect.y = r.y;
					this.rect.width = (e.x-r.x)+(r.x+r.width-m.x);
					this.rect.height = (e.y-r.y)+(r.y+r.height-m.y);
				}
				
				
				if(width>=this.ctrlSize*2)
					this.rect.width = width;
				if(height>=this.ctrlSize*2)
					this.rect.height = height;
				
			}else{
				// 选框的拖拽事件
				this.rect.x = e.x-e.mouseDownYccEvent.targetDeltaPosition.x;
				this.rect.y = e.y-e.mouseDownYccEvent.targetDeltaPosition.y;
			}
			
			// 处理选择器的最小宽度
			if(this.rect.width<=this.ctrlSize*2){
				this.rect.width = this.ctrlSize*2;
			}
			// 处理选择器的最小高度
			if(this.rect.height<=this.ctrlSize*2){
				this.rect.height = this.ctrlSize*2;
			}
			
			// 处理不允许拖拽出舞台
			if(!this.enableDragOut){
				var stageW = this.belongTo.yccInstance.getStageWidth();
				var stageH = this.belongTo.yccInstance.getStageHeight();
				if(this.rect.x<=0) this.rect.x=0;
				if(this.rect.y<=0) this.rect.y=0;
				if(this.rect.x+this.rect.width>=stageW){
					this.rect.x = stageW-this.rect.width;
				}
				if(this.rect.y+this.rect.height>=stageH){
					this.rect.y = stageH-this.rect.height;
				}
				
			}
			
			/**
			 * @todo 此处是否在UI内渲染，有待考虑
			 */
			this.belongTo.yccInstance.layerManager.reRenderAllLayerToStage();
		});
		
		this.addListener("dragend",function (e) {
			self.showBtns(true);
		});
	};
	
	/**
	 * 绘制
	 */
	Ycc.UI.CropRect.prototype.render = function () {
		this.renderRectBgColor();
		
		var rect = this.rect;
		
		this.ctx.save();
		this.ctx.fillStyle = this.fillStyle;
		this.ctx.strokeStyle = this.strokeStyle;
		
		this.ctx.beginPath();
		this.ctx.rect(rect.x,rect.y,rect.width,rect.height);
		this.ctx.closePath();
		if(!this.fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		
		
		this.ctx.beginPath();
		this.ctx.rect(this.ctrlRect1.x,this.ctrlRect1.y,this.ctrlRect1.width,this.ctrlRect1.height);
		this.ctx.rect(this.ctrlRect2.x,this.ctrlRect2.y,this.ctrlRect2.width,this.ctrlRect2.height);
		this.ctx.rect(this.ctrlRect3.x,this.ctrlRect3.y,this.ctrlRect3.width,this.ctrlRect3.height);
		this.ctx.rect(this.ctrlRect4.x,this.ctrlRect4.y,this.ctrlRect4.width,this.ctrlRect4.height);
		this.ctx.closePath();
		this.ctx.fill();
		this.ctx.restore();
	};
	
	
	
	
})(window.Ycc);