/**
 * @file    Ycc.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description  Ycc.class文件
 *
 */




(function (win) {
	
	/**
	 * 应用启动入口类，每个实例都与一个舞台绑定。
	 * 每个舞台都是一个canvas元素，该元素会被添加至HTML结构中。
	 *
	 * @param canvasDom		canvas的HTML元素。即，显示舞台
	 * @param [config]		canvas初始化的属性。字体大小、填充颜色、线条颜色、默认背景等。
	 * @constructor
	 */
	win.Ycc = function Ycc(canvasDom,config){
		/**
		 * canvas的Dom对象
		 */
		this.canvasDom = canvasDom;
		
		/**
		 * 显示舞台
		 */
		this.stage = canvasDom;
		/**
		 * 绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = this.canvasDom.getContext("2d");
		/**
		 * 可绘图区的宽
		 */
		this.ctxWidth = this.canvasDom.width;
		/**
		 * 可绘图区的高
		 */
		this.ctxHeight = this.canvasDom.height;
		
		/**
		 * Layer对象数组。包含所有的图层
		 * @type {Array}
		 */
		this.layerList = [];

		/**
		 * 实例的配置管理模块
		 * @type {Ycc.Config}
		 */
		this.config = new Ycc.Config(this,config);
		
		/**
		 * 实例的快照管理模块
		 * @type {Ycc.PhotoManager}
		 */
		this.photoManager = Ycc.PhotoManager?new Ycc.PhotoManager(this):null;
		
		/**
		 * ycc的图层管理器
		 * @type {null}
		 */
		this.layerManager = Ycc.LayerManager?new Ycc.LayerManager(this):null;
		
		/**
		 * 舞台的事件
		 */
		this.stageEventManager = new Ycc.EventManager(this.stage);
		
		
		this.init();
	};
	
	/**
	 * 类初始化
	 */
	win.Ycc.prototype.init = function () {
		var self = this;
		// 填充背景
		this.ctx.fillStyle = this.config.canvasBgColor;
		this.ctx.fillRect(0,0,this.ctxWidth,this.ctxHeight);
		
		// 使用ctxProps，初始化画布属性
		for(var key in this.config.ctxProps){
			this.ctx[key] = this.config.ctxProps[key];
		}
		
		
		// 将舞台的事件广播给所有的图层。注意，应倒序。
		for(var key in this.stageEventManager){
			if(key.indexOf("on")===0){
				console.log(key);
				this.stageEventManager[key] = function (e) {
					for(var i=self.layerList.length-1;i>=0;i--){
						var layer = self.layerList[i];
						layer.eventManager.mouseDownEvent = self.stageEventManager.mouseDownEvent;
						layer.eventManager["on"+e.type](e);
					}
				}
			}
		}
	};
	
	/**
	 * 清除
	 */
	win.Ycc.prototype.clearStage = function () {
		this.ctx.clearRect(0,0,this.ctxWidth,this.ctxHeight);
	};
	

	
	
	
})(window);;/**
 * @file        Ycc.utils.js
 * @author      xiaohei
 * @desc
 *  整个程序公用的基础工具模块
 *
 * @requires    Ycc.init
 */

(function(Ycc){
    Ycc.utils = {};

    // 继承
    Ycc.utils.inherits = function(FatherConstructor,SonConstructor){
        var that = this;
        function Son(){
            if(that.isFn(SonConstructor)){
                SonConstructor.call(this,"");
            }
            FatherConstructor.call(this,"");
        }

        Son.prototype = FatherConstructor.prototype;
        return Son;
    };


    //合并两个对象
    Ycc.utils.extend = function(target_obj, obj2,isDeepClone) {
        var newobj = {};
        if(isDeepClone)
            obj2 = deepClone(obj2);
        for (var i in target_obj) {
            newobj[i] = target_obj[i];
            if (obj2 && obj2[i] != null) {
                newobj[i] = obj2[i];
            }
        }
        return newobj;
    };

    Ycc.utils.isString = function(str) {
        return typeof(str) === "string";
    };

    Ycc.utils.isNum = function(str) {
        return typeof(str) === "number";

    };

    Ycc.utils.isObj = function(str) {
        return typeof(str) === "object";
    };

    Ycc.utils.isFn = function(str) {
        return typeof(str) == "function";
    };

    Ycc.utils.isArray = function(str) {
        return Object.prototype.toString.call(str) === '[object Array]';
    };

//检测是否是一个点[x,y]
    Ycc.utils.isDot = function(dot) {
        return this.isArray(dot) && dot.length==2;
    };

//检测是否是点列[[],[],...]
    Ycc.utils.isDotList = function(Dots) {
        if (Dots && (this.isArray(Dots))) {
            for (var i = 0; i < Dots.length; i++) {
                if (!this.isDot(Dots[i])) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }

    };
    /*
     * 两点对应坐标相加,维数不限
     * [1,2]+[3,4] = [4,6]
     *
     */
    Ycc.utils.dotAddDot = function(dot1, dot2) {
//        var isArray = this.isArray;
        if (!this.isArray(dot1) || !this.isArray(dot2)) {
            console.log('%c Function addOffset params wrong', 'color:red');
            return dot1;
        }
        if (dot1.length !== dot2.length) {
            console.log('%c Function addOffset params arr.length must equal offset.length', 'color:red');
            return dot1;
        }
        var tp = dot1.slice(0);
        for (var i = 0; i < dot2.length; i++) {
            tp[i] += dot2[i];
        }
        return tp;
    };

    /*
     * 将传入的点匹配到table表的坐标轴上
     * @param dots : 二维数组点列[[],[]...]
     * @param cellW : 单元格宽
     * @param cellH : 单元格高
     * return 一个新数组
     * */
    Ycc.utils.dotsMatchAxis = function(dots,cellW,cellH){
        var dots1 = dots.slice(0);
        for(var j = 0;j<dots.length;j++){
            dots1[j][0] *=cellW;
            dots1[j][1] *=cellH;
        }
        return dots1;
    };

    Ycc.utils.deepClone = function(arrOrObj){
        
        return (Ycc.utils.isArray(arrOrObj))? deepCopy(arrOrObj):deepExtend(arrOrObj);
        function deepExtend(obj){
            var tempObj = {};
            for(var i in obj){
                tempObj[i] = obj[i];
                if(Ycc.utils.isArray(obj[i])){
                    tempObj[i] = deepCopy(obj[i]);
                }else if(Ycc.utils.isObj(obj[i])){
                    tempObj[i] = deepExtend(obj[i]);
                }else{
                    tempObj[i] = obj[i];
                }
            }
            return tempObj;
        }
        function deepCopy(arr){
            var newArr = [];
            var v = null;
            for(var i=0;i<arr.length;i++){
                v = arr[i];
                if(Ycc.utils.isArray(v))
                    newArr.push(deepCopy(v));
                else if(Ycc.utils.isObj(v))
                    newArr.push(deepExtend(v));
                else{
                    newArr.push(v);
                }
            }
            return newArr;
        }
    }


})(Ycc);

;/**
 * @file    Ycc.Config.class.js
 * @author  xiaohei
 * @date    2017/10/9
 * @description  Ycc.Config.class文件。
 * 	Ycc实例的默认配置类。所有ycc实例都默认使用该配置类。
 *
 */



(function (Ycc) {
	
	/**
	 * Ycc的配置类
	 * @param yccInstance	{Ycc}			ycc的引用
	 * @param [config]		{Ycc.Config}	初始化时的配置项
	 * @constructor
	 */
	Ycc.Config = function (yccInstance,config) {
		
		config = config?config:{};
		
		/**
		 * ycc的引用
		 * @type {Ycc}
		 */
		this.yccInstance = yccInstance;

		/**
		 * 画布属性的配置项，包含所有的画布属性。
		 * 键为画布的属性名；值为画布属性值。供ycc.init()方法使用
		 * @type {Object}
		 */
		this.ctxProps = new Object({
			lineWidth:3,
			strokeStyle:"red",
			fillStyle:"red",
			font:"32px arial"
		});
		
		/**
		 * canvas的背景色。默认为透明
		 * @type {String}
		 */
		this.canvasBgColor = config.canvasBgColor||"transparent";
		
		/**
		 * canvas的宽度
		 */
		this.width = config.width || 800;
		this.height = config.height || 600;
		
		
		// 可选config
		if(config && config.ctxProps){
			for(var key in this.ctxProps){
				if(config.ctxProps[key])
					this.ctxProps[key] = config.ctxProps[key];
			}
		}
	};
	
	
})(window.Ycc);;/**
 * @file 	ycc.ui.js
 * @author	xiaohei
 * @date	2016/4/1
 *
 * @desc
 * 控制所有的绘图基本操作，保存所有的绘图步骤，并提供回退、前进、清空、快照等方法。
 * 不管理图形颜色、阴影、文字等内容。
 * 所有图形绘制都为同步操作
 *
 * @requires Ycc
 * @requires Ycc.utils
 * */

(function(Ycc){
	// 检查依赖项
	if(!Ycc || !Ycc.utils){
		return console.error("Error: Ycc.ui needs module `Ycc` and `Ycc.utils`!");
	}
	// 方法别名
	var isObj 		= Ycc.utils.isObj,
		isArr 		= Ycc.utils.isArray,
		isString	= Ycc.utils.isString,
		isNum 		= Ycc.utils.isNum,
		extend 		= Ycc.utils.extend;
	
	/*******************************************************************************
	 * 定义所需要的类
	 ******************************************************************************/

	/**
	 * UI类，提供绘图基本的原子图形和组合图形。
	 * 每个UI类的对象都跟一个canvas绑定。
	 *
	 * @param canvasDom	{HTMLElement}
	 * @constructor
	 */
	Ycc.UI = function(canvasDom){

		/**
		 * 保存的快照，每个元素都是`getImageData`的返回值
		 * @type {Array}
		 * @private
		 */
		this._photos = [];
		
		
		/**
		 * 当前绘图环境
		 */
		this.ctx = canvasDom.getContext('2d');
		
		/**
		 * 当前绘图环境的宽
		 */
		this.ctxWidth = canvasDom.width;

		/**
		 * 当前绘图环境的高
		 */
		this.ctxHeight = canvasDom.height;
	};

	
	
	
	
	/*******************************************************************************
	 * 定义UI类的基础图形
	 ******************************************************************************/
	/**
	 * 文字
	 * @param positionDot
	 * @param content
	 * @param [fill]
	 * @returns {Ycc.UI}
	 */
	Ycc.UI.prototype.text = function (positionDot,content,fill) {
		this.ctx.save();
		if(fill)
			this.ctx.fillText(content,positionDot[0],positionDot[1]);
		else
			this.ctx.strokeText(content,positionDot[0],positionDot[1]);
		this.ctx.restore();
		return this;
	};
	
	/**
	 * 画线
	 * @param dot1
	 * @param dot2
	 * @returns {Ycc.UI}
	 */
	Ycc.UI.prototype.line = function (dot1, dot2) {
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.moveTo(dot1[0], dot1[1]);
		this.ctx.lineTo(dot2[0], dot2[1]);
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
		return this;
	};
	
	
	/**
	 * 矩形
	 * @param left_top_dot
	 * @param right_bottom_dot
	 * @param fill
	 */
	Ycc.UI.prototype.rect=function (left_top_dot,right_bottom_dot,fill){
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.rect(left_top_dot[0],left_top_dot[1],right_bottom_dot[0]-left_top_dot[0],right_bottom_dot[1]-left_top_dot[1]);
		this.ctx.closePath();
		
		if(!fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		this.ctx.restore();
		return this;
	};
	
	/**
	 * 椭圆
	 * @param centrePoint	{Dot}		椭圆中心点
	 * @param width			{Number}	长半轴
	 * @param height		{Number}	短半轴
	 * @param rotateAngle	{Number}	旋转角
	 * @param fill			{Boolean}	是否填充
	 */
	Ycc.UI.prototype.ellipse = function(centrePoint,width,height,rotateAngle,fill) {
		
		this.ctx.save();
		var r = (width > height) ? width : height;
		// 计算压缩比例
		var ratioX = width / r;
		var ratioY = height / r;
		// 默认旋转中心位于画布左上角，需要改变旋转中心点
		this.ctx.translate(centrePoint[0],centrePoint[1]);
		this.ctx.rotate(parseInt(rotateAngle)*Math.PI/180);
		// 再变换回原来的旋转中心点
		this.ctx.translate(-centrePoint[0],-centrePoint[1]);
		this.ctx.scale(ratioX, ratioY);
		this.ctx.beginPath();
		this.ctx.arc(centrePoint[0] / ratioX,  centrePoint[1]/ ratioY, r, 0, 2 * Math.PI, false);
		this.ctx.closePath();
		
		if(!fill)
			this.ctx.stroke();
		else
			this.ctx.fill();

		this.ctx.restore();
		return this;
	};
	
	/**
	 * 圆弧
	 * @param centrePoint			圆心
	 * @param r						半径
	 * @param startAngle			起始角
	 * @param endAngle				结束角
	 * @param [counterclockwise]	方向
	 */
	Ycc.UI.prototype.circleArc = function (centrePoint, r,startAngle,endAngle,counterclockwise) {
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.arc(
			centrePoint[0],
			centrePoint[1],
			r,
			startAngle/180*Math.PI,
			endAngle/180*Math.PI,
			counterclockwise
		);
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.restore();
		return this;
		
	};
	
	/**
	 * 扇形
	 * @param centrePoint			圆心
	 * @param r						半径
	 * @param startAngle			起始角
	 * @param endAngle				结束角
	 * @param [fill]				是否填充
	 * @param [counterclockwise]	方向
	 */
	Ycc.UI.prototype.sector = function (centrePoint, r,startAngle,endAngle,fill,counterclockwise) {
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.lineTo(centrePoint[0],centrePoint[1]);
		this.ctx.arc(centrePoint[0],centrePoint[1],r,startAngle*Math.PI/180,endAngle*Math.PI/180,counterclockwise);
		this.ctx.lineTo(centrePoint[0],centrePoint[1]);
		this.ctx.closePath();
		if(!fill)
			this.ctx.stroke();
		else
			this.ctx.fill();
		this.ctx.restore();
		return this;
	};
	
	/**
	 * 根据多个点画折线，可以用此方法实现跟随鼠标
	 * @param pointList		{Array}		Dot数组，即二维数组
	 */
	Ycc.UI.prototype.foldLine = function (pointList) {
		if(pointList.length<2) return console.error("Error: 参数错误！");

		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.moveTo(pointList[0][0],pointList[0][1]);
		for(var i =0;i<pointList.length;i++){
			this.ctx.lineTo(pointList[i][0],pointList[i][1]);
		}
		this.ctx.stroke();
		this.ctx.restore();
		return this;
	};
	
	/**
	 * 圆
	 * @param centrePoint	圆心
	 * @param r				半径
	 * @param fill			是否填充
	 */
	Ycc.UI.prototype.circle = function(centrePoint, r, fill) {
		this.ellipse(centrePoint,r,r,0,fill);
		return this;
	};
	
	/**
	 * 绘制图片
	 * @param img				{Image}		图片路径
	 * @param left_top_dot		{Array}		左上角坐标
	 */
	Ycc.UI.prototype.image = function (img,left_top_dot){
		var self = this;
		left_top_dot = left_top_dot || [0,0];

		self.ctx.save();
		self.ctx.beginPath();
		self.ctx.drawImage(img, left_top_dot[0], left_top_dot[1]); // 设置对应的图像对象，以及它在画布上的位置
		self.ctx.closePath();
		self.ctx.restore();
		return this;
	};
	
	/*******************************************************************************
	 * 定义UI类的控制方法
	 ******************************************************************************/
	/**
	 * 缩放绘图，对之后的所有操作都有效
	 * @param scaleX
	 * @param scaleY
	 * @returns {Ycc.UI}
	 */
	Ycc.UI.prototype.scale = function (scaleX, scaleY) {
		this.ctx.scale(scaleX,scaleY);
		return this;
	};

	/**
	 * 清除画布
	 */
	Ycc.UI.prototype.clear=function () {
		var defaultSet = {
			//默认填充颜色
			fillStyle:"#fff"
		};
		this.ctx.fillStyle = defaultSet.fillStyle;
		
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.rect(0,0,this.ctxWidth,this.ctxHeight);
		this.ctx.fill();
		this.ctx.closePath();
		this.ctx.restore();
		return this;
	};
	
	
	















})(window.Ycc);;/**
 * @file    Ycc.Loader.class.js
 * @author  xiaohei
 * @date    2017/10/9
 * @description  Ycc.Loader.class文件
 */



(function (Ycc) {
	
	/**
	 * ycc实例的资源加载类
	 * @constructor
	 */
	Ycc.Loader = function () {
	
	};
	
	
	/**
	 * 加载单个图片资源
	 * @param imageSrc	{String}	图片的路径
	 * @param endCb		{Function}	加载成功的回调
	 */
	Ycc.Loader.prototype.loadImage = function (imageSrc,endCb) {
		var img = new Image();
		img.src = imageSrc;
		img.onload = function () {
			Ycc.utils.isFn(endCb) && endCb(img);
		}
	};
	
	/**
	 * 加载图片资源列表
	 * @param imagesSrc		{Object}	资源列表。键为资源名称；值为资源路径
	 * @param progressCb	{function}	加载进度的回调，每加载成功一个资源都会调用一次
	 * @param endCb			{function}	全部加载完成的回调
	 */
	Ycc.Loader.prototype.loadImageList = function (imagesSrc,endCb,progressCb) {
		// 已加载图片的个数
		var loadedNum = 0;
		// 记录加载的资源
		var res = {};
		// 资源的名称
		var keys = Object.keys(imagesSrc);
		for(var i =0;i<keys.length;i++){
			var src = imagesSrc[keys[i]];
			this.loadImage(src,(function (key) {
				return function (img) {
					res[key] = img;
					loadedNum++;
					Ycc.utils.isFn(progressCb)&&progressCb(img);
					if(loadedNum===keys.length){
						Ycc.utils.isFn(endCb)&&endCb(res);
					}
				}
				
			})(keys[i]));
		}
		
	}
	
	
	
})(window.Ycc);;/**
 * @file    Ycc.Layer.class.js
 * @author  xiaohei
 * @date    2017/10/23
 * @description  Ycc.LayerManager.class文件
 */


(function (Ycc) {
	
	var layerIndex = 0;
	
	/**
	 * 图层类。
	 * 每新建一个图层，都会新建一个canvas元素。
	 * 每个图层都跟这个canvas元素绑定。
	 * @param yccInstance
	 * @param config
	 * @constructor
	 */
	function Layer(yccInstance,config){
		var defaultConfig = {
			name:"",
			width:yccInstance.ctxWidth,
			height:yccInstance.ctxHeight,
			bgColor:"transparent",
			show:true
		};
		// 浅拷贝
		config = Ycc.utils.extend(defaultConfig,config);
		
		var canvasDom = document.createElement("canvas");
		canvasDom.width = config.width;
		canvasDom.height = config.height;
		
		
		/**
		 * ycc实例的引用
		 */
		this.yccInstance = yccInstance;
		/**
		 * 虚拟canvas元素的引用
		 * @type {Element}
		 */
		this.canvasDom = canvasDom;
		
		/**
		 * 当前图层的绘图环境
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = this.canvasDom.getContext('2d');
		
		/**
		 * 图层id
		 */
		this.id = layerIndex++;

		/**
		 * 图层名称
		 * @type {string}
		 */
		this.name = config.name?config.name:"图层"+this.id;
		
		/**
		 * 图层宽
		 * @type {number}
		 */
		this.width = config.width;
		/**
		 * 图层高
		 * @type {number}
		 */
		this.height = config.height;
		/**
		 * 图层背景色
		 * @type {string}
		 */
		this.bgColor = config.bgColor;
		
		/**
		 * 图层是否显示
		 */
		this.show = config.show;
		
		/**
		 * 实例的图形管理模块
		 * @type {Ycc.UI}
		 */
		this.ui = Ycc.UI?new Ycc.UI(this.canvasDom):null;
		
		/**
		 * 实例的事件管理模块
		 * @type {Ycc.EventManager}
		 */
		this.eventManager = Ycc.EventManager?new Ycc.EventManager(this.canvasDom):null;
	}
	
	// todo
	Layer.prototype.init = function () {
	
	};
	
	/**
	 * 清除图层
	 */
	Layer.prototype.clear = function () {
		this.ctx.clearRect(0,0,this.width,this.height);
	};
	
	
	/**
	 * 渲染图层至舞台
	 */
	Layer.prototype.renderToStage = function () {
		if(this.show)
			this.yccInstance.ctx.drawImage(this.canvasDom,0,0,this.width,this.height);
	};
	
	
	
	
	
	/**
	 * Ycc的图层管理类。每个图层管理器都与一个canvas舞台绑定。
	 *
	 * @constructor
	 */
	Ycc.LayerManager = function (yccInstance) {
		
		/**
		 * ycc实例
		 */
		this.yccInstance = yccInstance;
		
	};
	
	Ycc.LayerManager.prototype.init = function () {
	
	};
	
	
	/**
	 * 新建图层
	 * @param config
	 */
	Ycc.LayerManager.prototype.newLayer = function (config) {
		var layer = new Layer(this.yccInstance,config);
		this.yccInstance.layerList.push(layer);
		return layer;
	};
	
	/**
	 * 删除图层。
	 * @param layer
	 */
	Ycc.LayerManager.prototype.deleteLayer = function (layer) {
		var layerList = this.yccInstance.layerList;
		for(var i = 0;i<layerList.length;i++){
			if(layerList[i].id === layer.id){
				this.yccInstance.layerList.splice(i,1);
				return layer;
			}
		}
		return layer;
	};
	
	
	/**
	 * 将可显示的所有图层渲染至舞台。
	 */
	Ycc.LayerManager.prototype.renderAllLayerToStage = function () {
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			// 该图层是否可见
			if(layer.show)
				this.yccInstance.ctx.drawImage(layer.canvasDom,0,0,layer.width,layer.height);
		}
	};
	
	
	
})(window.Ycc);;/**
 * @file    Ycc.EventManager.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description  Ycc.EventManager.class文件。
 * 	Ycc实例的事件管理类
 * @requires Ycc.utils
 */


(function (Ycc) {
	

	/**
	 * 空函数
	 */
	var noop = function () {};
	
	/**
	 * 事件的数据结构类
	 * @param type {String}	事件类型
	 * @constructor
	 */
	var YccEvent = function (type) {
		/**
		 * 事件类型
		 * @type {string}
		 */
		this.type = type?type:"";
		/**
		 * 鼠标或点击位置
		 * @type {number}
		 */
		this.x=0;
		/**
		 * 鼠标或点击位置
		 * @type {number}
		 */
		this.y=0;
		/**
		 * ycc事件所对应的原始事件
		 */
		this.originEvent = null;
		
	};
	
	
	
	
	
	
	
	
	/**
	 * Ycc实例的事件管理类。
	 * 此类会托管原生的事件，剔除多余事件属性，保留必要属性。
	 * 还会根据情况生成一些其他事件，方便使用。
	 * 每个EventManager都跟一个canvas元素绑定。
	 * @param canvasDom	{HTMLElement}
	 * @constructor
	 */
	Ycc.EventManager = function (canvasDom) {
		/**
		 * Ycc实例
		 * @type {HTMLElement}
		 */
		this.canvasDom = canvasDom;
		
		/**
		 * 鼠标是否按下的标识
		 * @type {boolean}
		 */
		this.mouseDown = false;

		/**
		 * 鼠标按下时的YccEvent
		 * @type {YccEvent}
		 */
		this.mouseDownEvent = null;

		/**
		 * 鼠标是否正在移动的标识
		 * @type {boolean}
		 */
		this.mouseMoving = false;
		
		
		
		
		// 初始化
		this.init();
	};
	

	
	Ycc.EventManager.prototype.init = function () {
		var self = this;
		// canvas元素
		var dom = this.canvasDom;

		// 托管的事件类型
		var proxyEventTypes = ["mousemove","mousedown","mouseup","click"];
		// var proxyEventTypes = ["mousedown"];
		
		for(var i = 0;i<proxyEventTypes.length;i++){
			var type = proxyEventTypes[i];
			dom.addEventListener(type,filterOriginEvent(type,self));
		}
	};
	
	// 托管的原生事件
	/**
	 * 托管原生的鼠标移动事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.onmousemove = function (e) {};
	/**
	 * 托管原生的鼠标按下事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.onmousedown = function (e) {};
	/**
	 * 托管原生的鼠标抬起事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.onmouseup = function (e) {};
	/**
	 * 托管原生的鼠标点击事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.onclick = function (e) {};
	
	
	// 由原生事件组合的自定义事件
	/**
	 * 自定义鼠标拖拽事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.ondragging = function (e) {};
	/**
	 * 自定义鼠标拖拽结束事件
	 * @param e {YccEvent}	ycc事件对象
	 * @type {Function}
	 */
	Ycc.EventManager.prototype.ondragend = function (e) {};
	



	/**
	 * 代理原生事件
	 * @param _type					原生js的事件类型
	 * @param eventManagerInstance	事件管理模块的实例
	 * @returns {Function}
	 */
	function filterOriginEvent(_type,eventManagerInstance) {
		
		/**
		 * @param e 原生js的事件实例
		 */
		return function (e) {
			
			// ycc事件实例
			var yccEvent = new YccEvent();
			yccEvent.type = _type;
			yccEvent.originEvent = e;
			yccEvent.x = e.clientX - eventManagerInstance.canvasDom.getBoundingClientRect().left;
			yccEvent.y = e.clientY - eventManagerInstance.canvasDom.getBoundingClientRect().top;
			
			/**
			 * 鼠标按下事件
			 */
			if(_type === "mousedown"){
				// 修改标识、初始化
				eventManagerInstance.mouseDown = true;
				eventManagerInstance.mouseMoving = false;
				eventManagerInstance.mouseDownEvent = yccEvent;
				// 触发ycc托管的事件
				Ycc.utils.isFn(eventManagerInstance["on"+_type])&&eventManagerInstance["on"+_type](yccEvent);
				return null;
			}
			
			/**
			 * 鼠标移动事件
			 */
			if(_type === "mousemove"){
				// 修改标识
				eventManagerInstance.mouseMoving = true;
				eventManagerInstance["on"+_type](yccEvent);
				// 实测某些浏览器坐标位置没改变，移动事件仍然触发。此处进行过滤
				if(eventManagerInstance.mouseDown && (yccEvent.x!==eventManagerInstance.mouseDownEvent.x ||  yccEvent.y!==eventManagerInstance.mouseDownEvent.y)){
					yccEvent.type = "dragging";
					yccEvent.originEvent = e;
					// 触发ycc自定义事件
					Ycc.utils.isFn(eventManagerInstance["on"+yccEvent.type])&&eventManagerInstance["on"+yccEvent.type](yccEvent);
				}
				// 触发ycc托管的事件
				Ycc.utils.isFn(eventManagerInstance["on"+_type])&&eventManagerInstance["on"+_type](yccEvent);
				return null;
			}
			
			/**
			 * 鼠标抬起事件
			 */
			if(_type === "mouseup"){
				// 修改标识
				eventManagerInstance.mouseDown = false;
				eventManagerInstance.mouseMoving = false;
				// 触发ycc托管的事件
				Ycc.utils.isFn(eventManagerInstance["on"+_type])&&eventManagerInstance["on"+_type](yccEvent);
				return null;
			}
			
			/**
			 * 鼠标点击事件
			 */
			if(_type === "click"){
				// 修改标识
				eventManagerInstance.mouseDown = false;
				eventManagerInstance.mouseMoving = false;
				// 触发ycc托管的事件
				Ycc.utils.isFn(eventManagerInstance["on"+_type])&&eventManagerInstance["on"+_type](yccEvent);
				return null;
			}
			

			

		};
	}
	
	
	
	
	
})(window.Ycc);;/**
 * @file    Ycc.PhotoManager.class.js
 * @author  xiaohei
 * @date    2017/9/30
 * @description		Ycc.PhotoManager.class文件。
 * 	Ycc实例的快照管理类
 *
 */



(function (Ycc){
	/**
	 * 照片数据结构类
	 * @param imageData
	 * @constructor
	 */
	var Photo = function(imageData) {
		this.imageData = imageData;
		this.createTime = new Date();
		this.id = this.createTime.getTime();
	};
	
	
	/**
	 * Ycc实例的快照管理类
	 * @param yccInstance
	 * @constructor
	 */
	Ycc.PhotoManager = function (yccInstance) {

		this.yccInstance = yccInstance;

		this.ctx = yccInstance.ctx;
		
		this._photos = [];
	};
	
	/**
	 * 保存快照，即保存当前的原子图形渲染步骤
	 */
	Ycc.PhotoManager.prototype.takePhoto = function () {
		this._photos.push(new Photo(this.ctx.getImageData(0,0,this.yccInstance.ctxWidth,this.yccInstance.ctxHeight)));
		return this;
	};
	
	/**
	 * 获取保存的历史照片
	 * @returns {Array}
	 */
	Ycc.PhotoManager.prototype.getHistoryPhotos = function () {
		return this._photos;
	};
	/**
	 * 显示照片
	 * @param photo		{Photo}
	 * @returns 		{Photo}
	 */
	Ycc.PhotoManager.prototype.showPhoto = function (photo) {
		this.ctx.putImageData(photo.imageData,0,0);
		return photo;
	};
	
	
	/**
	 * 显示最后一次保存的快照
	 * @returns {boolean}
	 */
	Ycc.PhotoManager.prototype.showLastPhoto = function () {
		var len = this._photos.length;
		var photo = false;
		if(len>=1){
			photo = this._photos[len-1];
			this.showPhoto(photo);
		}
		return photo;
	};
	
	/**
	 * 删除照片
	 * @param photoId	照片的id
	 * @returns {*}
	 */
	Ycc.PhotoManager.prototype.delPhotoById = function (photoId) {
		var tempPhotos = this._photos.slice(0);
		for(var i=0;i<tempPhotos.length;i++){
			if(tempPhotos[i].id === photoId){
				tempPhotos.splice(i+1,1);
				this._photos = tempPhotos;
				return tempPhotos[i];
			}
		}
		return false;
	};
	
	
	
	
	
	
})(window.Ycc);