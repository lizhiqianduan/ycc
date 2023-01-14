/**
 * @file    Ycc.UI.Rect.class.js
 * @author  xiaohei
 * @date    2017/11/17
 * @description  Ycc.UI.Rect.class文件
 */



(function (Ycc) {
	
	/**
	 * 方块
	 * @param option	{object}		所有可配置的配置项
	 * @param option.rect	{Ycc.Math.Rect}	容纳区。会根据属性设置动态修改。
	 * @param option.fill=true {boolean}	填充or描边
	 * @param option.color=black {string} 方块颜色
	 * @constructor
	 * @extends Ycc.UI.Polygon
	 */
	Ycc.UI.Rect = function Rect(option) {
		Ycc.UI.Polygon.call(this,option);
		this.yccClass = Ycc.UI.Rect;
		
		/**
		 * 配置项
		 */
		// this.option = Ycc.utils.extend({
		// 	rect:null,
		// 	fill:true,
		// 	color:"black"
		// },option);
		
		this.fill = true;
		this.color = "black";
		this.extend(option);
	};
	// 继承prototype
	Ycc.utils.mergeObject(Ycc.UI.Rect.prototype,Ycc.UI.Polygon.prototype);
	
	
	/**
	 * 计算UI的各种属性。此操作必须在绘制之前调用。
	 * <br> 计算与绘制分离的好处是，在绘制UI之前就可以提前确定元素的各种信息，从而判断是否需要绘制。
	 * @override
	 */
	Ycc.UI.Rect.prototype.computeUIProps = function () {
		// 计算多边形坐标
		this.coordinates = this.rect.getVertices();
		// 赋值位置信息
		this.x = this.rect.x,this.y=this.rect.y;
		
		// this._setCtxProps(this);
	};
	
	
	/**
	 * 绘制
	 */
	Ycc.UI.Rect.prototype.render = function (ctx) {
		var self = this;
		ctx = ctx || self.ctxCache;
		if(!ctx){
			console.error("[Ycc error]:","ctx is null !");
			return;
		}
		
		
		ctx.save();
		ctx.fillStyle = this.color;
		ctx.strokeStyle = this.color;
		this.renderPath(ctx);
		this.fill?ctx.fill():ctx.stroke();
		ctx.restore();
	};
	
	
	
	
})(Ycc);