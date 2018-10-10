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
			new Ycc.Math.Dot(this.x,this,y),
			new Ycc.Math.Dot(this.x+this.width,this,y),
			new Ycc.Math.Dot(this.x+this.width,this,y+this.height),
			new Ycc.Math.Dot(this.x,this,y+this.height)
		];
	};
	
	Ycc.Math.Rect.prototype.createByVertices = function (vertices) {
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
	
	
})(window.Ycc);