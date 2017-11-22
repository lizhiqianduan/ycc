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
		 * 实例的全局配置项
		 */
		this.config = config?config:{};
		
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
		 * 系统心跳管理器
		 */
		this.ticker = Ycc.Ticker?new Ycc.Ticker(this):null;
		
		/**
		 * 基础绘图UI。这些绘图操作会直接作用于舞台。
		 * @type {Ycc.UI}
		 */
		this.baseUI = new Ycc.UI(this.stage);
		
		this.init();
	};
	
	/**
	 * 获取舞台的宽
	 */
	win.Ycc.prototype.getStageWidth = function () {
		return this.stage.width;
	};
	
	/**
	 * 获取舞台的高
	 */
	win.Ycc.prototype.getStageHeight = function () {
		return this.stage.height;
	};
	
	/**
	 * 类初始化
	 */
	win.Ycc.prototype.init = function () {
		var self = this;
		// 代理的原生鼠标事件，默认每个图层都触发
		var proxyEventTypes = ["mousemove","mousedown","mouseup","click","mouseenter","mouseout"];
		for(var i = 0;i<proxyEventTypes.length;i++){
			this.stage.addEventListener(proxyEventTypes[i],function (e) {
				var yccEvent = new Ycc.Event(e.type);
				yccEvent.originEvent = e;
				yccEvent.x = parseInt(e.clientX - self.stage.getBoundingClientRect().left);
				yccEvent.y = parseInt(e.clientY - self.stage.getBoundingClientRect().top);
				for(var i=self.layerList.length-1;i>=0;i--){
					var layer = self.layerList[i];
					if(!layer.enableEventManager) continue;
					layer.triggerListener(e.type,yccEvent);
				}
			})
		}
	};
	
	/**
	 * 清除
	 */
	win.Ycc.prototype.clearStage = function () {
		this.ctx.clearRect(0,0,this.getStageWidth(),this.getStageHeight());
	};
	
	/**
	 * 根据ycc.layerList重复舞台
	 */
	win.Ycc.prototype.reRenderStage = function () {
		this.clearStage();
		this.layerManager.renderAllLayerToStage();
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


	/**
     * 合并两个对象。只会保留targetObj中存在的字段。
	 * @param targetObj    目标对象
	 * @param obj2  待合入的对象
	 * @param isDeepClone   是否进行深拷贝
	 * @return {{}} 新的对象
	 */
    Ycc.utils.extend = function(targetObj, obj2,isDeepClone) {
        var newobj = {};
        if(isDeepClone)
            obj2 = Ycc.utils.deepClone(obj2);
        for (var i in targetObj) {
			if(!targetObj.hasOwnProperty(i)) continue;
            newobj[i] = targetObj[i];
            if (obj2 && obj2[i] != null) {
                newobj[i] = obj2[i];
            }
        }
        return newobj;
    };
	
	/**
     * 判断字符串
	 * @param str
	 * @return {boolean}
	 */
	Ycc.utils.isString = function(str) {
        return typeof(str) === "string";
    };
	
	/**
     * 判断数字
	 * @param str
	 * @return {boolean}
	 */
    Ycc.utils.isNum = function(str) {
        return typeof(str) === "number";

    };
	
	/**
     * 判断对象
	 * @param str
	 * @return {boolean}
	 */
	Ycc.utils.isObj = function(str) {
        return typeof(str) === "object";
    };
	/**
     * 判断函数
	 * @param str
	 * @return {boolean}
	 */
	Ycc.utils.isFn = function(str) {
        return typeof(str) === "function";
    };
	
	/**
     * 判断数组
	 * @param str
	 * @return {boolean}
	 */
    Ycc.utils.isArray = function(str) {
        return Object.prototype.toString.call(str) === '[object Array]';
    };
	
	
	/**
     * 深拷贝某个对象或者数组
	 * @param arrOrObj
	 * @return {*}
	 */
	Ycc.utils.deepClone = function(arrOrObj){
        
        return (Ycc.utils.isArray(arrOrObj))? deepCopy(arrOrObj):deepExtend(arrOrObj);
        function deepExtend(obj){
            var tempObj = {};
            for(var i in obj){
                if(!obj.hasOwnProperty(i)) continue;
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
	 * 定义UI类的基础图形，不带rect容器的图形
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
	
	
	
	/**
	 * 给定宽度，获取能容纳的最长字符串
	 * @param content {string}
	 * @param width {number}
	 * @return {string}
	 * @private
	 */
	Ycc.UI.prototype._getMaxLenContent = function (content,width) {
		var out = content;
		var outW = 0;
		
		if(this.ctx.measureText(content).width<=width)
			return content;
		for(var i = 0;i<content.length;i++){
			out = content.slice(0,i);
			outW = this.ctx.measureText(out).width;
			if(outW>width){
				return content.slice(0,i-1);
			}
		}
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
		/**
		 * 保存加载之后的所有图片资源。键为资源名称；值为Image元素
		 * @type {{}}
		 */
		this.imageRes = {};
	};
	
	
	/**
	 * 加载单个图片资源
	 * @param imageSrc	{String}	图片的路径
	 * @param endCb		{Function}	加载成功的回调
	 * @private
	 */
	Ycc.Loader.prototype._loadImage = function (imageSrc,endCb) {
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
		var self = this;
		// 已加载图片的个数
		var loadedNum = 0;
		// 资源的名称
		var keys = Object.keys(imagesSrc);
		for(var i =0;i<keys.length;i++){
			var src = imagesSrc[keys[i]];
			this._loadImage(src,(function (key) {
				return function (img) {
					self.imageRes[key] = img;
					loadedNum++;
					Ycc.utils.isFn(progressCb)&&progressCb(img);
					if(loadedNum===keys.length){
						Ycc.utils.isFn(endCb)&&endCb(self.imageRes);
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
	
	/**
	 * Ycc的图层管理类。每个图层管理器都与一个canvas舞台绑定。
	 * @param yccInstance {Ycc}		ycc实例
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
		var layer = new Ycc.Layer(this.yccInstance,config);
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
				this.yccInstance.ctx.drawImage(layer.canvasDom,layer.x,layer.y,layer.width,layer.height);
		}
	};
	
	/**
	 * 重新将所有图层绘制至舞台。不显示的图层也会更新。
	 */
	Ycc.LayerManager.prototype.reRenderAllLayerToStage = function () {
		this.yccInstance.clearStage();
		for(var i=0;i<this.yccInstance.layerList.length;i++){
			var layer = this.yccInstance.layerList[i];
			layer.reRender();
			// 该图层是否可见
			if(layer.show)
				this.yccInstance.ctx.drawImage(layer.canvasDom,layer.x,layer.y,layer.width,layer.height);
		}
	};
	
	
	
	/**
	 * 依次合并图层。队列后面的图层将被绘制在前面图层之上。
	 * @param layerArray {Layer[]}	图层队列
	 * @return {*}
	 */
	Ycc.LayerManager.prototype.mergeLayers = function (layerArray) {
		var len = layerArray.length;
		if(len===0) return null;
		var resLayer = new Ycc.Layer(this.yccInstance,{name:"合并图层"});
		for(var i = 0;i<len;i++){
			var layer = layerArray[i];
			resLayer.ctx.drawImage(layer.canvasDom,0,0,layer.width,layer.height);
			layer = null;
		}
		this.yccInstance.layerList = [];
		this.yccInstance.layerList.push(resLayer);
		return resLayer;
	};
	
	/**
	 * 只允许某一个图层接收舞台事件
	 * @param layer	{Layer}		允许接收事件的图层
	 */
	Ycc.LayerManager.prototype.enableEventManagerOnly = function (layer) {
		if(!layer) return false;
		for(var i=0;i<this.yccInstance.layerList.length;i++) {
			this.yccInstance.layerList[i].enableEventManager = false;
		}
		layer.enableEventManager = true;
	};
	
	
	
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
	 * @param yccInstance {Ycc}
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
		this._photos.push(new Photo(this.ctx.getImageData(0,0,this.yccInstance.getStageWidth(),this.yccInstance.getStageHeight())));
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