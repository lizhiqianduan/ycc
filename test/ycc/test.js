"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b ||= {})
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

  // ycc/YccMath.ts
  var YccMathDot = class {
    constructor(x, y) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
    }
    isEqual(dot) {
      return this.x === dot.x && this.y === dot.y;
    }
    /**
     * 点是否在某个区域内
     */
    isInRect(rect) {
      return this.x >= rect.x && this.x <= rect.x + rect.width && this.y >= rect.y && this.y <= rect.y + rect.height;
    }
    /**
     * 点的加法/点的偏移量
     * @param dot {YccMathDot} 加的点
     * @return {YccMathDot} 返回一个新的点
     */
    plus(dot) {
      return new YccMathDot(this.x + dot.x, this.y + dot.y);
    }
    /**
     * 将当前点绕另外一个点旋转一定度数
     * @param rotation  旋转角度
     * @param anchorDot  锚点坐标
     * @return 旋转后的点
     */
    rotate(rotation, anchorDot) {
      anchorDot = anchorDot != null ? anchorDot : new YccMathDot(0, 0);
      const dotX = this.x;
      const dotY = this.y;
      const anchorX = anchorDot.x;
      const anchorY = anchorDot.y;
      const dx = (dotX - anchorX) * Math.cos(rotation / 180 * Math.PI) - (dotY - anchorY) * Math.sin(rotation / 180 * Math.PI) + anchorX;
      const dy = (dotY - anchorY) * Math.cos(rotation / 180 * Math.PI) + (dotX - anchorX) * Math.sin(rotation / 180 * Math.PI) + anchorY;
      return new YccMathDot(dx, dy);
    }
    /**
     * 判断三点是否共线
     * @param dot1
     * @param dot2
     * @param dot3
     */
    static threeDotIsOnLine(dot1, dot2, dot3) {
      if (dot1.isEqual(dot2) || dot1.isEqual(dot3) || dot2.isEqual(dot3)) {
        return true;
      }
      if (dot1.x === dot2.x && dot2.x === dot3.x) {
        return true;
      }
      const k1 = Math.abs(dot1.y - dot2.y) / Math.abs(dot1.x - dot2.x);
      const k2 = Math.abs(dot1.y - dot3.y) / Math.abs(dot1.x - dot3.x);
      return k1 === k2;
    }
  };
  var YccMathRect = class {
    constructor(x, y, width, height) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
      this.width = width != null ? width : 0;
      this.height = height != null ? height : 0;
    }
    /**
     * 将矩形的长和宽转换为正数
     */
    toPositive() {
      const x0 = this.x;
      const y0 = this.y;
      const x1 = this.x + this.width;
      const y1 = this.y + this.height;
      this.x = x0 < x1 ? x0 : x1;
      this.y = y0 < y1 ? y0 : y1;
      this.width = Math.abs(this.width);
      this.height = Math.abs(this.height);
    }
    /**
     * 获取区域的顶点列表
     * @return {YccMathDot[]}
     */
    getVertices() {
      return [
        new YccMathDot(this.x, this.y),
        new YccMathDot(this.x + this.width, this.y),
        new YccMathDot(this.x + this.width, this.y + this.height),
        new YccMathDot(this.x, this.y + this.height),
        new YccMathDot(this.x, this.y)
      ];
    }
    /**
     * 根据向量更新顶点数值
     * @param vertices
     */
    updateByVertices(vertices) {
      if (vertices.length !== 2) {
        console.error("\u6570\u7EC4\u53C2\u6570\u6709\u95EE\u9898\uFF01");
        return false;
      }
      this.x = vertices[0].x;
      this.y = vertices[0].y;
      this.width = vertices[1].x - this.x;
      this.height = vertices[2].y - this.y;
      return true;
    }
  };

  // ycc/YccLayer.class.ts
  var YccLayer = class {
    constructor(stage, option) {
      /**
       * 相对于舞台的位置，以左上角为准
       */
      this.position = new YccMathDot();
      this.stage = stage;
      this.uiList = [];
      this.ctx = stage.createCanvasByStage().getContext("2d");
      this.id = layerIndex++;
      this.type = "ui";
      this.name = (option == null ? void 0 : option.name) != null ? option == null ? void 0 : option.name : "\u56FE\u5C42_" + this.type + "_" + this.id.toString();
      this.show = true;
      this.ghost = false;
      this.enableEventManager = false;
      this.enableFrameEvent = false;
      this.onFrameComing = function() {
      };
    }
    /**
    * 添加一个UI图形至图层
    */
    addUI(ui) {
      ui.props.belongTo = this;
      this.uiList.push(ui);
      return ui;
    }
  };
  var layerIndex = 0;
  var layerList = [];
  function createLayer(stage, opt) {
    const layer = new YccLayer(stage, opt);
    layerList.push(layer);
    return layer;
  }
  function getAllLayer() {
    return layerList;
  }

  // ycc/YccPolyfill.class.ts
  var YccPolyfill = class {
    constructor(ycc) {
      this.yccInstance = ycc;
    }
    /**
     *
     * @returns
     */
    _createImage() {
      if (this.yccInstance.config.appenv === "wxapp") {
        return this.yccInstance.stage.stageCanvas.createImage();
      }
      return new Image();
    }
    /**
    * 新创建canvas
    * @param options
    * @param options.width
    * @param options.height
    * @param options.dpi 像素比
    */
    createCanvas(options) {
      const canvas = document.createElement("canvas");
      const dpi = 1;
      canvas.width = options.width * dpi;
      canvas.height = options.height * dpi;
      canvas.style.width = options.width.toString() + "px";
      canvas.style.display = "block";
      return canvas;
    }
  };

  // ycc/YccStage.class.ts
  var YccStage = class {
    constructor(ycc) {
      /**
       * 舞台的终端设备信息
       */
      this.stageInfo = this.getSystemInfo();
      this.yccInstance = ycc;
      this.stageCanvas = this.createCanvasByStage();
      this.stageCanvasCtx = this.stageCanvas.getContext("2d");
      this.defaultLayer = createLayer(this, { name: "\u821E\u53F0\u9ED8\u8BA4\u56FE\u5C42", enableFrameEvent: true });
    }
    /**
     * 清空舞台
     * @param withLayerCanvas 是否连带图层的canvas一起清空
     */
    clearStage(withLayerCanvas = true) {
      this.stageCanvasCtx.clearRect(0, 0, this.stageInfo.width, this.stageInfo.height);
      if (withLayerCanvas) {
        getAllLayer().forEach((layer) => {
          layer.ctx.clearRect(0, 0, this.stageInfo.width, this.stageInfo.height);
        });
      }
    }
    /**
     * 根据舞台信息，创建一个覆盖全舞台的canvas
     */
    createCanvasByStage() {
      return this.yccInstance.polyfill.createCanvas(__spreadValues({}, this.stageInfo));
    }
    /**
     *
     * @param dot
     * @param uiIsShow
     * @returns
     */
    // getUIFromPointer (dot: YccMathDot, uiIsShow: boolean) {
    //   const self = this.ycc
    //   uiIsShow = isBoolean(uiIsShow) ? uiIsShow : true
    //   // 从最末一个图层开始寻找
    //   for (let j = self.layerList.length - 1; j >= 0; j--) {
    //     const layer = self.layerList[j]
    //     // 幽灵图层，直接跳过
    //     if (layer.ghost) continue
    //     if (uiIsShow && !layer.show) continue
    //     const ui = layer.getUIFromPointer(dot, uiIsShow)
    //     if (ui) { return ui }
    //   }
    //   return null
    // }
    /**
     * 获取系统信息：dpi、高、宽，等
     * @returns
     */
    getSystemInfo() {
      var _a;
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        dpi: (_a = window.devicePixelRatio) != null ? _a : 1
      };
    }
    /**
     * 绘制所有图层的所有元素
     */
    renderAll() {
      getAllLayer().forEach((layer) => {
        layer.uiList.forEach((ui) => {
          ui.render();
        });
        this.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, this.stageInfo.width, this.stageInfo.height, 0, 0, this.stageInfo.width, this.stageInfo.height);
      });
    }
  };

  // ycc/YccUtils.ts
  var isFn = function(str) {
    return typeof str === "function";
  };

  // ycc/YccTicker.class.ts
  var Frame = class {
    constructor(ticker) {
      this.createTime = Date.now();
      this.deltaTime = ticker.deltaTime;
      this.fps = parseInt(`${1e3 / this.deltaTime}`);
      this.frameCount = ticker.frameAllCount;
      this.isRendered = false;
    }
  };
  var YccTicker = class {
    constructor(yccInstance) {
      this.yccInstance = yccInstance;
      this.currentFrame = void 0;
      this.startTime = Date.now();
      this.lastFrameTime = this.startTime;
      this.lastFrameTickerCount = 0;
      this.deltaTime = 0;
      this.deltaTimeExpect = 0;
      this.deltaTimeRatio = 1;
      this.frameListenerList = [];
      this.defaultFrameRate = 60;
      this.defaultDeltaTime = 1e3 / this.defaultFrameRate;
      this.tickerSpace = 1;
      this.frameAllCount = 0;
      this.timerTickCount = 0;
      this._timerId = 0;
      this._isRunning = false;
    }
    /**
       * 定时器开始
       * @param [frameRate] 心跳频率，即帧率
       * 可取值有[60,30,20,15]
       */
    start(frameRate) {
      let timer = this.yccInstance.stage.stageCanvas.requestAnimationFrame ? this.yccInstance.stage.stageCanvas.requestAnimationFrame : requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
      const self = this;
      self.currentFrame = void 0;
      self.timerTickCount = 0;
      self.lastFrameTickerCount = 0;
      frameRate = frameRate || self.defaultFrameRate;
      self.tickerSpace = parseInt(`${60 / frameRate}`) || 1;
      self.deltaTimeExpect = 1e3 / frameRate;
      self.frameAllCount = 0;
      self.startTime = Date.now();
      if (self._isRunning)
        return this;
      timer || (timer = function(callback) {
        return setTimeout(function() {
          callback(Date.now());
        }, 1e3 / 60);
      });
      self._timerId = timer(cb);
      self._isRunning = true;
      function cb(curTime) {
        self.timerTickCount++;
        if (self.timerTickCount - self.lastFrameTickerCount === self.tickerSpace) {
          self.frameAllCount++;
          self.deltaTime = curTime - self.lastFrameTime;
          self.deltaTimeRatio = self.deltaTime / self.deltaTimeExpect;
          self.lastFrameTime += self.deltaTime;
          self.lastFrameTickerCount = self.timerTickCount;
          self.currentFrame = new Frame(self);
          self._broadcastFrameEvent(self.currentFrame);
        }
        self._timerId = timer(cb);
      }
      return this;
    }
    /**
       * 停止心跳
       */
    stop() {
      let stop = this.yccInstance.stage.stageCanvas.cancelAnimationFrame ? this.yccInstance.stage.stageCanvas.cancelAnimationFrame : cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame;
      stop || (stop = function(id) {
        clearTimeout(id);
      });
      stop(this._timerId);
      this._isRunning = false;
      this.currentFrame = void 0;
    }
    /**
       * 给每帧添加自定义的监听函数
       * @param listener
       */
    addFrameListener(listener) {
      this.frameListenerList.push(listener);
      return this;
    }
    /**
       * 移除某个监听函数
       * @param listener
       */
    removeFrameListener(listener) {
      const index = this.frameListenerList.indexOf(listener);
      if (index !== -1) {
        this.frameListenerList.splice(index, 1);
      }
      return this;
    }
    /**
       * 执行所有自定义的帧监听函数
       */
    _broadcastFrameEvent(frame) {
      for (let i = 0; i < this.frameListenerList.length; i++) {
        const listener = this.frameListenerList[i];
        isFn(listener) && listener(frame);
      }
    }
    // /**
    //    * 执行所有图层的监听函数
    //    */
    // broadcastToLayer (frame: Frame) {
    //   for (let i = 0; i < this.yccInstance.layerList.length; i++) {
    //     const layer = this.yccInstance.layerList[i]
    //     layer.show && layer.enableFrameEvent && layer.onFrameComing(frame)
    //   }
    // }
  };

  // ycc/YccUI.class.ts
  var YccUI = class {
    /**
     * UI的构造函数
     * @param {Partial<YccUIProps>} option
     */
    constructor(option = {}) {
      this.props = this._extendOption(option);
    }
    /**
     * 初始化UI属性
     * @param option
     */
    _extendOption(option) {
      const defaultProps = {
        anchor: new YccMathDot(0, 0),
        coordinates: [],
        fill: true,
        fillStyle: "black",
        ghost: false,
        lineWidth: 1,
        opacity: 1,
        rotation: 0,
        show: true,
        stopEventBubbleUp: true,
        strokeStyle: "black",
        worldCoordinates: []
      };
      return Object.assign(defaultProps, option);
    }
    /**
     * 将此UI添加至图层
     * @param layer
     */
    addToLayer(layer) {
      layer.addUI(this);
      return this;
    }
    /**
     * 根据coordinates绘制路径
     * 只绘制路径，不填充、不描边
     * 继承的子类若不是多边形，需要重载此方法
     * 此过程只会发生在图层的离屏canvas中
     */
    renderPath() {
      if (!this.props.belongTo) {
        console.log("\u8BE5UI\u672A\u52A0\u5165\u56FE\u5C42");
        return;
      }
      if (this.props.coordinates.length === 0) {
        console.log("\u8BE5UI\u672A\u8BBE\u7F6E\u5750\u6807");
        return;
      }
      const ctx = this.props.belongTo.ctx;
      const start = this.props.coordinates[0].plus(this.props.belongTo.position).rotate(this.props.rotation, this.props.anchor.plus(this.props.belongTo.position).plus(this.props.coordinates[0]));
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      for (let i = 0; i < this.props.coordinates.length - 1; i++) {
        const dot = this.props.coordinates[i].plus(this.props.belongTo.position).rotate(this.props.rotation, this.props.anchor.plus(this.props.belongTo.position).plus(this.props.coordinates[i]));
        ctx.lineTo(dot.x, dot.y);
      }
      ctx.closePath();
    }
    /**
     * 获取能容纳多边形的最小矩形框
     * @returns {YccMathRect}
     */
    getWorldContainer() {
      if (!this.props.belongTo) {
        console.log("\u8BE5UI\u672A\u52A0\u5165\u56FE\u5C42");
        return;
      }
      const start = this.props.coordinates[0].plus(this.props.belongTo.position).rotate(this.props.rotation, this.props.anchor.plus(this.props.belongTo.position).plus(this.props.coordinates[0]));
      let minx = start.x;
      let miny = start.y;
      let maxx = start.x;
      let maxy = start.y;
      for (let i = 0; i < this.props.coordinates.length - 1; i++) {
        const dot = this.props.coordinates[i].plus(this.props.belongTo.position).rotate(this.props.rotation, this.props.anchor.plus(this.props.belongTo.position).plus(this.props.coordinates[i]));
        if (dot.x < minx)
          minx = dot.x;
        if (dot.x >= maxx)
          maxx = dot.x;
        if (dot.y < miny)
          miny = dot.y;
        if (dot.y >= maxy)
          maxy = dot.y;
      }
      return new YccMathRect(minx, miny, maxx - minx, maxy - miny);
    }
    /**
     * 重载基类的包含某个点的函数，用于点击事件等的响应
     * 两种方法：
     * 方法一：经过该点的水平射线与多边形的焦点数，即Ray-casting Algorithm
     * 方法二：某个点始终位于多边形逆时针向量的左侧、或者顺时针方向的右侧即可判断，算法名忘记了
     * 此方法采用方法一，并假设该射线平行于x轴，方向为x轴正方向
     * @param dot {Ycc.Math.Dot} 需要判断的点，绝对坐标
     * @param noneZeroMode {Number} 是否noneZeroMode 1--启用 2--关闭 默认启用
     *   从这个点引出一根“射线”，与多边形的任意若干条边相交，计数初始化为0，若相交处被多边形的边从左到右切过，计数+1，若相交处被多边形的边从右到左切过，计数-1，最后检查计数，如果是0，点在多边形外，如果非0，点在多边形内
     * @return {boolean}
     */
    isContainDot(dot, noneZeroMode) {
      if (!this.props.belongTo) {
        console.log("\u8BE5UI\u672A\u52A0\u5165\u56FE\u5C42");
        return;
      }
      noneZeroMode = noneZeroMode != null ? noneZeroMode : 1;
      const _dot = dot;
      const x = _dot.x;
      const y = _dot.y;
      let crossNum = 0;
      let leftCount = 0;
      let rightCount = 0;
      for (let i = 0; i < this.props.coordinates.length - 1; i++) {
        const start = this.props.coordinates[i].plus(this.props.belongTo.position).rotate(this.props.rotation, this.props.anchor.plus(this.props.belongTo.position).plus(this.props.coordinates[i]));
        const end = this.props.coordinates[i + 1].plus(this.props.belongTo.position).rotate(this.props.rotation, this.props.anchor.plus(this.props.belongTo.position).plus(this.props.coordinates[i + 1]));
        if (start.x === end.x) {
          if (x > start.x)
            continue;
          if (end.y > start.y && y >= start.y && y <= end.y) {
            leftCount++;
            crossNum++;
          }
          if (end.y < start.y && y >= end.y && y <= start.y) {
            rightCount++;
            crossNum++;
          }
          continue;
        }
        const k = (end.y - start.y) / (end.x - start.x);
        const x0 = (y - start.y) / k + start.x;
        if (x > x0)
          continue;
        if (end.x > start.x && x0 >= start.x && x0 <= end.x) {
          crossNum++;
          if (k >= 0)
            leftCount++;
          else
            rightCount++;
        }
        if (end.x < start.x && x0 >= end.x && x0 <= start.x) {
          crossNum++;
          if (k >= 0)
            rightCount++;
          else
            leftCount++;
        }
      }
      return noneZeroMode === 1 ? leftCount - rightCount !== 0 : crossNum % 2 === 1;
    }
    /**
     * 渲染至ctx，若UI的渲染过程不同，则此处的render方法需重写
     * @overwrite
     */
    render() {
      console.log("render ui");
      if (!this.props.belongTo) {
        console.log("\u8BE5UI\u672A\u52A0\u5165\u56FE\u5C42");
        return;
      }
      if (!this.props.coordinates) {
        console.log("\u672A\u8BBE\u7F6E\u591A\u8FB9\u5F62\u7684\u9876\u70B9\u5750\u6807\uFF01");
        return;
      }
      if (!this.props.show)
        return;
      const ctx = this.props.belongTo.ctx;
      ctx.save();
      ctx.fillStyle = this.props.fillStyle;
      ctx.strokeStyle = this.props.strokeStyle;
      this.renderPath();
      this.props.fill ? ctx.fill() : ctx.stroke();
      ctx.restore();
    }
  };

  // ycc/Ycc.class.ts
  var Ycc = class {
    constructor(config) {
      var _a, _b;
      this.config = {
        appenv: (_a = config == null ? void 0 : config.appenv) != null ? _a : "h5",
        debugDrawContainer: (_b = config == null ? void 0 : config.debugDrawContainer) != null ? _b : false
      };
      this.polyfill = new YccPolyfill(this);
      this.stage = new YccStage(this);
    }
    /**
     * 启动
     */
    bootstrap() {
      this.created();
    }
    /**
     * 应用的入口
     * @overwrite
     */
    created() {
    }
    /**
     * 渲染函数
     * @overwrite
     */
    render() {
    }
  };

  // test/ycc/test.ts
  var App = class extends Ycc {
    constructor() {
      super(...arguments);
      /**
       * 应用的状态
       */
      this.$state = { testUI: void 0 };
    }
    created() {
      var _a;
      (_a = document.getElementById("canvas")) == null ? void 0 : _a.appendChild(this.stage.stageCanvas);
      this.$state.testUI = new YccUI({
        coordinates: [
          new YccMathDot(10, 10),
          new YccMathDot(200, 10),
          new YccMathDot(10, 200),
          new YccMathDot(10, 10)
        ]
      }).addToLayer(this.stage.defaultLayer);
      new YccTicker(this).addFrameListener((frame) => {
        this.render();
      }).start(60);
    }
    render() {
      this.stage.clearStage();
      this.$state.testUI.props.belongTo.position.x++;
      this.$state.testUI.props.belongTo.position.y++;
      this.stage.renderAll();
    }
  };
  new App().bootstrap();
})();
//# sourceMappingURL=test.js.map
