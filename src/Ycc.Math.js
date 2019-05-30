/**
 * @file    Ycc.Math.js
 * @author  xiaohei
 * @date    2017/11/2
 * @description  Ycc.Math文件
 */


(function (Ycc) {
	
	var extend = Ycc.utils.extend;
	
	/**
	 * 数学表达式模块
	 * @constructor
	 */
	Ycc.Math = function () {};
	
	/**
	 * 点
	 * @param x	{number} x坐标
	 * @param y {number} y坐标
	 * @constructor
	 *//**
	 * 点
	 * @param [dot] {object}
	 * @param dot.x {number} x坐标
	 * @param dot.y {number} y坐标
	 * @constructor
	 */
	Ycc.Math.Dot = function (dot) {
		/**
		 * x坐标
		 * @type {number}
		 */
		this.x = 0;
		/**
		 * y坐标
		 * @type {number}
		 */
		this.y = 0;
		
		var len = arguments.length;
		if(len===1){
			this.x = dot.x;
			this.y = dot.y;
		}else if(len===2){
			this.x = arguments[0];
			this.y = arguments[1];
		}
		
	};
	
	/**
	 * 点是否在某个区域内
	 * @param rect	{Ycc.Math.Rect}	区域
	 */
	Ycc.Math.Dot.prototype.isInRect = function (rect) {
		return this.x>=rect.x&&this.x<=rect.x+rect.width  && this.y>=rect.y && this.y<=rect.y+rect.height;
	};
	
	/**
	 * 判读两点位置是否相同
	 * @param dot
	 * @return {boolean}
	 */
	Ycc.Math.Dot.prototype.isEqual = function (dot) {
		return this.x===dot.x && this.y===dot.y;
	};
	
	/**
	 * 点的加法/点的偏移量
	 * @param dot {Ycc.Math.Dot} 加的点
	 * @return {Ycc.Math.Dot} 返回一个新的点
	 */
	Ycc.Math.Dot.prototype.plus = function (dot) {
		return new Ycc.Math.Dot(this.x+dot.x,this.y+dot.y);
	};
	
	/**
	 * 将当前点绕另外一个点旋转一定度数
	 * @param rotation	旋转角度
	 * @param anchorDot	锚点坐标
	 * @return 旋转后的点
	 */
	Ycc.Math.Dot.prototype.rotate = function (rotation,anchorDot) {
		anchorDot=anchorDot||new Ycc.Math.Dot(0,0);
		var dotX = this.x,dotY=this.y,anchorX=anchorDot.x,anchorY=anchorDot.y;
		var dx = (dotX - anchorX)*Math.cos(rotation/180*Math.PI) - (dotY - anchorY)*Math.sin(rotation/180*Math.PI)+anchorX;
		var dy = (dotY - anchorY)*Math.cos(rotation/180*Math.PI) + (dotX - anchorX)*Math.sin(rotation/180*Math.PI)+anchorY;
		return new Ycc.Math.Dot(dx,dy);
	};
	
	/**
	 * 判断三点是否共线
	 * @param dot1
	 * @param dot2
	 * @param dot3
	 */
	Ycc.Math.Dot.threeDotIsOnLine = function (dot1,dot2,dot3) {
		// 存在位置相同点肯定共线
		if(dot1.isEqual(dot2) || dot1.isEqual(dot3) || dot2.isEqual(dot3))
			return true;
		// 三个点x一样
		if(dot1.x===dot2.x&&dot2.x===dot3.x)
			return true;
		var k1 = Math.abs(dot1.y-dot2.y)/Math.abs(dot1.x-dot2.x);
		var k2 = Math.abs(dot1.y-dot3.y)/Math.abs(dot1.x-dot3.x);
		return k1===k2;
	};
	
	
	
	
	/**
	 * 区域
	 * @param startDot {Dot}
	 * @param width
	 * @param height
	 * @constructor
	 *//**
	 * 区域
	 * @param x
	 * @param y
	 * @param width
	 * @param height
	 * @constructor
	 *//**
	 * 区域
	 * @param rect
	 * @param rect.x
	 * @param rect.y
	 * @param rect.width
	 * @param rect.height
	 * @constructor
	 */
	Ycc.Math.Rect = function (rect) {
		/**
		 * 构造器的引用
		 * @type {function}
		 */
		this.yccClass = Ycc.Math.Rect;
		
		/**
		 * 左上角x坐标
		 * @type {number}
		 */
		this.x = 0;
		/**
		 * 左上角y坐标
		 * @type {number}
		 */
		this.y = 0;
		/**
		 * 区域宽
		 * @type {number}
		 */
		this.width = 0;
		/**
		 * 区域高
		 * @type {number}
		 */
		this.height = 0;
		
		var len = arguments.length;
		if(len===1){
			this.x = rect.x;
			this.y = rect.y;
			this.width = rect.width;
			this.height = rect.height;
		}else if(len===3){
			this.x = arguments[0].x;
			this.y = arguments[0].y;
			this.width = arguments[1];
			this.height = arguments[2];
		}else if(len === 4){
			this.x = arguments[0];
			this.y = arguments[1];
			this.width = arguments[2];
			this.height = arguments[3];
		}
		
		
		this.toPositive();
	};
	
	/**
	 * 将矩形的长和宽转换为正数
	 */
	Ycc.Math.Rect.prototype.toPositive = function () {
		var x0 = this.x,
			y0 = this.y,
			x1 = this.x + this.width,
			y1 = this.y + this.height;
		this.x = x0<x1?x0:x1;
		this.y = y0<y1?y0:y1;
		this.width = Math.abs(this.width);
		this.height = Math.abs(this.height);
	};
	
	/**
	 * 获取区域的顶点列表
	 * @return {Ycc.Math.Dot[]}
	 */
	Ycc.Math.Rect.prototype.getVertices = function () {
		return [
			new Ycc.Math.Dot(this.x,this.y),
			new Ycc.Math.Dot(this.x+this.width,this.y),
			new Ycc.Math.Dot(this.x+this.width,this.y+this.height),
			new Ycc.Math.Dot(this.x,this.y+this.height),
			new Ycc.Math.Dot(this.x,this.y)
		];
	};
	
	/**
	 * 根据顶点更新数值
	 * @param vertices
	 * @return {*}
	 */
	Ycc.Math.Rect.prototype.updateByVertices = function (vertices) {
		if(!Ycc.utils.isArray(vertices))
			return console.error('参数必须是数组！');
		this.x = vertices[0].x;
		this.y = vertices[0].y;
		this.width = vertices[1].x-this.x;
		this.height = vertices[2].y-this.y;
	};
	
	
	
	
	/**
	 * 向量构造函数
	 * @constructor
	 */
	Ycc.Math.Vector = function () {
		this.x = 0;
		this.y = 0;
		this.z = 0;
		
		if(arguments.length===3 || arguments.length===2){
			this.x=arguments[0]||0;
			this.y=arguments[1]||0;
			this.z=arguments[2]||0;
		}
		
		if(arguments.length===1){
			if(!Ycc.utils.isObj(arguments[0])) console.error('constructor need a objec as param!');
			this.x=arguments[0].x||0;
			this.y=arguments[0].y||0;
			this.z=arguments[0].z||0;
		}
	};
	
	/**
	 * 向量的点乘法
	 * @param v2 {Ycc.Math.Vector} 点乘向量
	 * @return {number}
	 */
	Ycc.Math.Vector.prototype.dot = function (v2) {
		return this.x*v2.x+this.y*v2.y+this.z*v2.z;
	};
	
	
	/**
	 * 向量的叉乘法
	 * @param v2 {Ycc.Math.Vector} 叉乘向量
	 * @return {number}
	 */
	Ycc.Math.Vector.prototype.cross = function (v2) {
		var res = new Ycc.Math.Vector();
		res.x = this.y*v2.z-v2.y*this.z;
		res.y = v2.x*this.z-this.x*v2.z;
		res.z = this.x*v2.y-v2.x*this.y;
		return res;
	};
	
	
	/**
	 * 获取向量的模长
	 * @return {number}
	 */
	Ycc.Math.Vector.prototype.getLength = function () {
		return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z,2);
	};
	
	
	/**
	 * 矩阵的构造方法。
	 * @param data	{array}		矩阵所有行拼接的数组
	 * @param m		{number}	行数
	 * @param n		{number}	列数
	 * @constructor
	 */
	Ycc.Math.Matrix = function (data,m,n) {
		this.data 	= data;
		this.m 		= m;
		this.n		= n;
	};
	
	/**
	 * 矩阵点乘法
	 * @param M	{Ycc.Math.Matrix}	另一个矩阵
	 */
	Ycc.Math.Matrix.prototype.dot = function (M) {
		if(M.m!==this.n || M.n!==this.m)
			return console.error('两个矩阵的行数和列数不对应，不能相乘！');
		
		var N = new Ycc.Math.Matrix([],this.m,this.m);
		// 循环行
		for(var i=1;i<=this.m;i++){
			// 循环矩阵赋值
			for(var k=1;k<=this.m;k++){
				var temp =0;
				// 循环列
				for(var j=1;j<=this.n;j++){
					temp += this.get(i,j)*M.get(j,k);
				}
				N.set(i,k,temp);
			}
			
		}
		return N;
	};
	
	/**
	 * 获取矩阵i行j列的元素。
	 * 注：i，i下标从1开始
	 * @param i
	 * @param j
	 * @return {number}
	 */
	Ycc.Math.Matrix.prototype.get = function (i, j) {
		return this.data[(i-1)*this.n+j-1];
	};
	
	/**
	 * 设置矩阵i行j列的元素为val
	 * 注：i，i下标从1开始
	 * @param i
	 * @param j
	 * @param val
	 */
	Ycc.Math.Matrix.prototype.set = function (i, j, val) {
		this.data[(i-1)*this.n+j-1] = val;
	};
	
	
})(Ycc);