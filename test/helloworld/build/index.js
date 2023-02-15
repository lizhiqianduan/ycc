"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/tools/global-cache/index.ts
  var GLOBAL_CACHE = {};
  var _a;
  GLOBAL_CACHE = JSON.parse((_a = localStorage.getItem("ycc_global")) != null ? _a : "{}");
  function SetGlobal(key, value) {
    GLOBAL_CACHE[key] = value;
    localStorage.setItem("ycc_global", JSON.stringify(GLOBAL_CACHE));
  }

  // src/tools/math/index.ts
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
     * 两个点之间的距离
     * @param dot
     * @returns
     */
    distance(dot) {
      return new YccMathVector(dot.x - this.x, dot.y - this.y).getLength();
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
     * 点的减法
     * @param dot
     */
    sub(dot) {
      return new YccMathDot(this.x - dot.x, this.y - dot.y);
    }
    /**
     * 缩放比例
     * @param x x轴的缩放
     * @param y y轴的缩放
     */
    divide(x, y = 1) {
      return new YccMathDot(Math.floor(this.x / x), Math.floor(this.y / y));
    }
    /**
     * 适配dpi，去除dpi的影响，转换为物理像素
     * @param dpi
     * @returns
     */
    dpi(dpi = 1) {
      return this.divide(1 / dpi, 1 / dpi);
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
     * 更新方块的位置，返回一个新的方块
     * @param x
     * @param y
     */
    moveBy(x = 0, y = 0) {
      return new YccMathRect(this.x + x, this.y + y, this.width, this.height);
    }
    /**
     * 更新方块的尺寸，返回一个新的方块
     * @param x
     * @param y
     */
    sizeBy(x = 0, y = 0) {
      return new YccMathRect(this.x, this.y, this.width + x, this.height + y);
    }
    /**
     * 缩放方块的尺寸，返回一个新的方块
     * @param x
     * @param y
     * @returns
     */
    scaleBy(x = 1, y = 1, withPos) {
      return new YccMathRect(withPos ? this.x * x : this.x, withPos ? this.y * y : this.y, this.width * x, this.height * y);
    }
    /**
     * 获取区域的顶点列表
     * @return {YccMathDot[]}
     */
    getCoordinates() {
      return [
        new YccMathDot(this.x, this.y),
        new YccMathDot(this.x + this.width, this.y),
        new YccMathDot(this.x + this.width, this.y + this.height),
        new YccMathDot(this.x, this.y + this.height),
        new YccMathDot(this.x, this.y)
      ];
    }
    /**
     * 适配dpi，去除dpi的影响，使用物理像素
     * @param dpi
     */
    dpi(dpi = 1) {
      return new YccMathRect(this.x * dpi, this.y * dpi, this.width * dpi, this.height * dpi);
    }
    /**
     * 根据向量更新区域
     * @param vertices
     */
    updateByVertices(vertices) {
      if (vertices.length !== 2) {
        console.error("\u6570\u7EC4\u53C2\u6570\u6709\u95EE\u9898\uFF01");
        return this;
      }
      this.x = vertices[0].x;
      this.y = vertices[0].y;
      this.width = vertices[1].x - this.x;
      this.height = vertices[2].y - this.y;
      return this;
    }
  };
  var YccMathVector = class {
    constructor(x, y, z) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
      this.z = z != null ? z : 0;
    }
    /**
       * 向量的点乘法
       * @param v2 {Ycc.Math.Vector} 点乘向量
       * @return {number}
       */
    dot(v2) {
      return this.x * v2.x + this.y * v2.y + this.z * v2.z;
    }
    /**
       * 向量的叉乘法
       * @param v2 {Ycc.Math.Vector} 叉乘向量
       * @return {number}
       */
    cross(v2) {
      const res = new YccMathVector();
      res.x = this.y * v2.z - v2.y * this.z;
      res.y = v2.x * this.z - this.x * v2.z;
      res.z = this.x * v2.y - v2.x * this.y;
      return res;
    }
    /**
     * 获取向量的模长
     * @return {number}
     */
    getLength() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
  };

  // src/tools/common/utils.ts
  var isNum = function(str) {
    return typeof str === "number";
  };
  var isFn = function(str) {
    return typeof str === "function";
  };
  var isMobile = function() {
    const userAgentInfo = navigator.userAgent;
    const Agents = [
      "Android",
      "iPhone",
      "SymbianOS",
      "Windows Phone",
      "iPad",
      "iPod"
    ];
    let flag = false;
    for (let v = 0; v < Agents.length; v++) {
      if (userAgentInfo.indexOf(Agents[v]) > 0) {
        flag = true;
        break;
      }
    }
    return flag;
  };
  var getSystemInfo = () => {
    var _a2;
    const dpi = (_a2 = window.devicePixelRatio) != null ? _a2 : 1;
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      dpi,
      renderWidth: window.innerWidth * dpi,
      renderHeight: window.innerWidth * dpi
    };
  };

  // src/tools/polyfill/index.ts
  function createCanvas(options) {
    var _a2;
    const canvas = document.createElement("canvas");
    const dpi = (_a2 = options.dpi) != null ? _a2 : 2;
    canvas.width = options.width * dpi;
    canvas.height = options.height * dpi;
    canvas.style.width = options.width.toString() + "px";
    canvas.style.display = "block";
    return canvas;
  }
  function createImage() {
    const img = new Image();
    return img;
  }

  // src/YccStage.ts
  var createStage = () => {
    const stageInfo = getSystemInfo();
    const stageCanvas = createCanvasByStage(stageInfo);
    const stageCanvasCtx = stageCanvas.getContext("2d");
    const stage = {
      stageCanvas,
      stageCanvasCtx,
      stageInfo,
      defaultLayer: createLayer({ name: "\u821E\u53F0\u9ED8\u8BA4\u56FE\u5C42" })(stageInfo)
    };
    return { stage, bindYcc };
    function bindYcc(ycc) {
      ycc.stage = stage;
      stage.yccInstance = ycc;
    }
  };
  var createCanvasByStage = (stageInfo) => {
    return createCanvas(__spreadValues({}, stageInfo));
  };
  var getElementByPointer = (dot) => {
    const layers = getAllLayer();
    for (let index = layers.length - 1; index >= 0; index--) {
      const layer = layers[index];
      const uiList = layer.uiList;
      for (let i = uiList.length - 1; i >= 0; i--) {
        const ui = uiList[i];
        if (ui.isContainDot(dot.dpi(ui.getDpi())))
          return ui;
      }
    }
  };
  var getElementByName = function(name) {
    const layers = getAllLayer();
    for (let index = 0; index < layers.length; index++) {
      const layer = layers[index];
      const uiList = layer.uiList;
      for (let i = 0; i < uiList.length; i++) {
        const ui = uiList[i];
        if (ui.props.name === name)
          return ui;
      }
    }
  };
  var clearStage = (withLayerCanvas = true) => {
    return (stage) => {
      const dpi = stage.stageInfo.dpi;
      stage.stageCanvasCtx.clearRect(0, 0, stage.stageInfo.width * dpi, stage.stageInfo.height * dpi);
      if (withLayerCanvas) {
        getAllLayer().forEach((layer) => {
          layer.ctx.clearRect(0, 0, stage.stageInfo.width * dpi, stage.stageInfo.height * dpi);
        });
      }
      return stage.yccInstance;
    };
  };
  var renderAll = (stage) => {
    const { dpi } = stage.stageInfo;
    getAllLayer().forEach((layer) => {
      layer.uiList.forEach((ui) => {
        ui.renderBg();
        ui.render();
        ui.renderAnchor();
      });
      stage.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, stage.stageInfo.width * dpi, stage.stageInfo.height * dpi, 0, 0, stage.stageInfo.width * dpi, stage.stageInfo.height * dpi);
    });
  };

  // src/YccLayer.ts
  var layerIndex = 0;
  var layerList = [];
  var addUI = function(ui) {
    return function(layer) {
      layer.uiList.push(ui);
      return ui;
    };
  };
  function createLayer(option) {
    return (stageInfo) => {
      var _a2, _b, _c, _d, _e;
      const layer = {
        /**
           * 图层的位置
           */
        position: (_a2 = option == null ? void 0 : option.position) != null ? _a2 : new YccMathDot(0, 0),
        /**
           * 存储图层中的所有UI。UI的顺序，即为图层中的渲染顺序。
           */
        uiList: [],
        /**
           * 当前图层的绘图环境
           * @type {CanvasRenderingContext2D}
           */
        ctx: createCanvasByStage(stageInfo).getContext("2d"),
        /**
           * 图层id
           */
        id: layerIndex++,
        /**
           * 图层类型。
           * `ui`表示用于绘图的图层。`tool`表示辅助的工具图层。`text`表示文字图层。
           * 默认为`ui`。
           */
        type: (_b = option == null ? void 0 : option.type) != null ? _b : "ui",
        /**
           * 图层名称
           * @type {string}
           */
        name: (_c = option == null ? void 0 : option.name) != null ? _c : "\u56FE\u5C42_ui_" + layerIndex.toString(),
        /**
           * 图层是否显示
           */
        show: (_d = option == null ? void 0 : option.show) != null ? _d : true,
        /**
           * 图层是否幽灵，幽灵状态的图层，getElementFromPointer 会直接跳过整个图层
           * @type {boolean}
           */
        ghost: (_e = option == null ? void 0 : option.show) != null ? _e : true
      };
      layerList.push(layer);
      return layer;
    };
  }
  function getAllLayer() {
    return layerList;
  }

  // src/ui/YccUI.ts
  var YccUI = class {
    /**
      * UI的构造函数
      * @param {Partial<YccUIProps>} option
      */
    constructor(option = {}) {
      this.initProps = option;
    }
    /**
      * 初始化UI属性
      * @param option
      */
    _extendOption(option) {
      return Object.assign(this.props, option);
    }
    /**
     * 当UI被添加至图层后，会立即触发此hook函数
     * 当子类有特殊的计算属性时，需重写此方法，在添加至图层时提前计算ui的属性，比如，`ImageUI`
     */
    created(layer) {
      this.props = this.getDefaultProps();
      this.props = this._extendOption(this.initProps);
      this.props.belongTo = layer;
    }
    /**
      * 将此UI添加至舞台的某个图层
      * @param layer
      */
    addToStage(stage, layer) {
      this.created(layer);
      this.props.$stage = stage;
      addUI(this)(layer);
      return this;
    }
    /**
      * 判断UI是否可绘制
      * 存在`belongTo`且存在`coordinates`则认为此UI可绘制
      * @overwrite 若UI有特殊的渲染过程，则子类需重写此方法
      */
    isDrawable() {
      if (!this.props.belongTo) {
        console.log("\u8BE5UI\u672A\u52A0\u5165\u56FE\u5C42");
        return false;
      }
      if (!this.props.$stage.yccInstance) {
        console.log("\u56FE\u5C42\u8FD8\u672A\u52A0\u5165\u821E\u53F0");
        return false;
      }
      if (this.props.coordinates.length === 0) {
        console.log("\u8BE5UI\u672A\u8BBE\u7F6E\u5750\u6807");
        return false;
      }
      if (this.props.coordinates.length < 2) {
        console.log("\u8BE5UI\u5750\u6807\u672A\u6B63\u786E\u8BBE\u7F6E");
        return false;
      }
      return true;
    }
    /**
     * 将
     * 适配dpi
     */
    dpiAdaptation() {
      const { dpi } = getSystemInfo();
      console.log(dpi);
    }
    /**
      * 根据coordinates绘制路径
      * 只绘制路径，不填充、不描边
      * 此过程只会发生在图层的离屏canvas中
      */
    renderPath() {
      if (!this.isDrawable())
        return;
      const ctx = this.props.belongTo.ctx;
      const { worldCoordinates } = this.getWorldContainer();
      const start = worldCoordinates[0];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      for (let i = 0; i < worldCoordinates.length - 1; i++) {
        const dot = worldCoordinates[i];
        ctx.lineTo(dot.x, dot.y);
      }
      ctx.closePath();
    }
    /**
      * 获取能容纳多边形的最小矩形框，返回的坐标已经经过dpi处理，是可直接绘制`stage坐标`
      * @param {YccMathRect} rect 相对坐标，相对于`anchor`，可直接传递子ui的`props.rect`属性，用于子UI获取容纳区
      * @returns {worldCoordinates,worldRect}
      */
    getWorldContainer(rect) {
      if (!this.props.belongTo) {
        console.log("\u8BE5UI\u672A\u52A0\u5165\u56FE\u5C42");
        return;
      }
      const dpi = this.getDpi();
      const dpiPosition = this.props.belongTo.position.dpi(dpi);
      const dpiAnchor = this.props.anchor.dpi(dpi);
      const dpiCoordinates = this.props.coordinates.map((item) => item.dpi(dpi));
      const dpiRect = rect == null ? void 0 : rect.dpi(dpi);
      const renderPosition = dpiPosition;
      const renderAnchor = dpiAnchor.plus(dpiPosition);
      const renderCoordinates = dpiCoordinates.map((item) => item.plus(renderAnchor));
      const renderRect = dpiRect == null ? void 0 : dpiRect.moveBy(renderAnchor.x, renderAnchor.y);
      const worldPosition = renderPosition;
      const worldAnchor = renderAnchor;
      const worldCoordinates = renderCoordinates.map(
        (item) => {
          return item.rotate(this.props.rotation, worldAnchor);
        }
      );
      const start = worldCoordinates[0];
      let minx = start.x;
      let miny = start.y;
      let maxx = start.x;
      let maxy = start.y;
      for (let i = 0; i < worldCoordinates.length; i++) {
        const dot = worldCoordinates[i];
        if (dot.x < minx)
          minx = dot.x;
        if (dot.x >= maxx)
          maxx = dot.x;
        if (dot.y < miny)
          miny = dot.y;
        if (dot.y >= maxy)
          maxy = dot.y;
      }
      return {
        // renderPosition与worldPosition一致，因为：Layer不存在变换
        dpi: {
          dpiAnchor,
          dpiPosition,
          dpiCoordinates,
          dpiRect
        },
        render: {
          renderPosition,
          renderAnchor,
          renderCoordinates,
          renderRect
        },
        /**
         * `worldRect`是不存在的，因为存在旋转/变换，旋转后的图形无法用`rect`表达，只能由`renderRect`推导出来
         */
        worldRect: null,
        worldPosition,
        worldAnchor,
        worldCoordinates,
        worldContainerRect: new YccMathRect(minx, miny, maxx - minx, maxy - miny)
      };
    }
    /**
      * 重载基类的包含某个点的函数，用于点击事件等的响应
      * 两种方法：
      * 方法一：经过该点的水平射线与多边形的焦点数，即Ray-casting Algorithm
      * 方法二：某个点始终位于多边形逆时针向量的左侧、或者顺时针方向的右侧即可判断，算法名忘记了
      * 此方法采用方法一，并假设该射线平行于x轴，方向为x轴正方向
      * @param dot {Ycc.Math.Dot} 需要判断的点，绝对坐标（world坐标）
      * @param noneZeroMode {Number} 是否noneZeroMode 1--启用 2--关闭 默认启用
      *   从这个点引出一根“射线”，与多边形的任意若干条边相交，计数初始化为0，若相交处被多边形的边从左到右切过，计数+1，若相交处被多边形的边从右到左切过，计数-1，最后检查计数，如果是0，点在多边形外，如果非0，点在多边形内
      * @return {boolean}
      */
    isContainDot(dot, noneZeroMode) {
      if (!this.props.belongTo) {
        console.log("\u8BE5UI\u672A\u52A0\u5165\u56FE\u5C42");
        return;
      }
      const coordinates = this.getWorldContainer().worldCoordinates;
      noneZeroMode = noneZeroMode != null ? noneZeroMode : 1;
      const _dot = dot;
      const x = _dot.x;
      const y = _dot.y;
      let crossNum = 0;
      let leftCount = 0;
      let rightCount = 0;
      for (let i = 0; i < coordinates.length - 1; i++) {
        const start = coordinates[i];
        const end = coordinates[i + 1];
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
     * 获取绘图环境
     */
    getContext() {
      var _a2;
      return (_a2 = this.props.belongTo) == null ? void 0 : _a2.ctx;
    }
    /**
     * 获取dpi
     * @returns
     */
    getDpi() {
      return getSystemInfo().dpi;
    }
    /**
     * 获取当前实例
     * @returns
     */
    getYcc() {
      return this.props.$stage.yccInstance;
    }
    /**
     * 绘制ui的背景，多用于调试
     * @returns
     */
    renderBg(bgStyle = { color: "#ccc", withBorder: true, borderColor: "red", borderWidth: 4 }) {
      if (!this.isDrawable() || !this.props.show)
        return;
      const ctx = this.getContext();
      ctx.save();
      this.renderPath();
      ctx.fillStyle = bgStyle.color;
      ctx.strokeStyle = bgStyle.borderColor;
      ctx.lineWidth = bgStyle.borderWidth;
      ctx.fill();
      if (bgStyle.withBorder)
        ctx.stroke();
      ctx.restore();
    }
    /**
     * 绘制UI的锚点，多用于调试
     */
    renderAnchor() {
      if (!this.isDrawable() || !this.props.show)
        return;
      const ctx = this.getContext();
      const world = this.getWorldContainer();
      ctx.save();
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(world.worldAnchor.x + 16, world.worldAnchor.y);
      ctx.lineTo(world.worldAnchor.x - 16, world.worldAnchor.y);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(world.worldAnchor.x, world.worldAnchor.y + 16);
      ctx.lineTo(world.worldAnchor.x, world.worldAnchor.y - 16);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(world.worldAnchor.x, world.worldAnchor.y, 16, 0, 360);
      ctx.closePath();
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    }
  };
  function getYccUICommonProps() {
    return {
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
      strokeStyle: "black"
    };
  }

  // src/ui/TextUI.ts
  var TextUI = class extends YccUI {
    getDefaultProps() {
      return __spreadProps(__spreadValues({}, getYccUICommonProps()), {
        value: "",
        /**
         * 此属性只在绘制后生效
         */
        coordinates: [
          new YccMathDot(0),
          new YccMathDot(0)
        ],
        style: {
          fontSize: 16
        }
      });
    }
    /**
     * 绘制函数
     */
    render() {
      var _a2, _b, _c;
      if (!this.isDrawable() || !this.props.show)
        return;
      const ctx = this.getContext();
      const dpi = this.getDpi();
      const fontSize = (_a2 = this.props.style.fontSize) != null ? _a2 : 16;
      ctx.save();
      ctx.fillStyle = (_c = (_b = this.props.style) == null ? void 0 : _b.color) != null ? _c : this.props.fillStyle;
      ctx.textBaseline = "top";
      ctx.font = `${fontSize * dpi}px Arial`;
      this.props.coordinates = new YccMathRect(0, 0, ctx.measureText(this.props.value).width / dpi, fontSize).getCoordinates();
      const transformed = this.getWorldContainer();
      ctx.fillText(this.props.value, transformed.worldAnchor.x, transformed.worldAnchor.y);
      ctx.restore();
    }
  };

  // src/tools/ticker/frame.ts
  function createFrame(lastFrame) {
    const now = performance.now();
    if (lastFrame) {
      const deltaTime = now - lastFrame.createTime;
      const fps = parseInt(`${1e3 / deltaTime}`);
      const frameCount = lastFrame.frameCount + 1;
      return {
        createTime: now,
        isRendered: false,
        tickerCount: 0,
        deltaTime,
        frameCount,
        fps
      };
    } else {
      return {
        createTime: now,
        isRendered: false,
        deltaTime: 0,
        tickerCount: 0,
        frameCount: 1,
        fps: 60
      };
    }
  }

  // src/tools/ticker/index.ts
  function createTicker() {
    const startTime = Date.now();
    const ticker = {
      startTime,
      frameListenerList: [],
      frameAllCount: 0,
      isRunning: false,
      timerTickCount: 0,
      timerId: -1
    };
    return { ticker, bindYcc };
    function bindYcc(ycc) {
      ycc.$ticker = ticker;
      ticker.ycc = ycc;
    }
  }
  var addFrameListener = function(listener) {
    return function(ticker) {
      ticker.frameListenerList.push(listener);
      return ticker;
    };
  };
  function startTicker(ticker, frameRate = 60) {
    const self = ticker;
    if (self.isRunning)
      return self;
    const tickerSpace = parseInt(`${60 / frameRate}`) || 1;
    let timer = ticker.ycc.stage.stageCanvas.requestAnimationFrame ? ticker.ycc.stage.stageCanvas.requestAnimationFrame : requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
    self.startTime = Date.now();
    timer || (timer = function(callback) {
      return setTimeout(function() {
        callback(Date.now());
      }, 1e3 / 60);
    });
    ticker.timerId = timer(cb);
    self.isRunning = true;
    return ticker;
    function cb(curTime) {
      var _a2, _b, _c, _d;
      self.timerTickCount++;
      if (self.timerTickCount - ((_b = (_a2 = self.lastFrame) == null ? void 0 : _a2.tickerCount) != null ? _b : 0) === tickerSpace) {
        self.frameAllCount++;
        self.currentFrame = createFrame(self.lastFrame);
        self.currentFrame.deltaTime = curTime - ((_d = (_c = self.lastFrame) == null ? void 0 : _c.createTime) != null ? _d : 0);
        self.currentFrame.fps = frameRate;
        self.currentFrame.frameCount = self.frameAllCount;
        self.currentFrame.tickerCount = self.timerTickCount;
        _broadcastFrameEvent(self.currentFrame);
        self.lastFrame = self.currentFrame;
      }
      ticker.timerId = timer(cb);
    }
    function _broadcastFrameEvent(frame) {
      for (let i = 0; i < self.frameListenerList.length; i++) {
        const listener = self.frameListenerList[i];
        isFn(listener) && listener(frame);
      }
    }
  }

  // src/tools/gesture/YccTouchLife.ts
  function syncTouches(touches) {
    const copedList = [];
    for (let index = 0; index < touches.length; index++) {
      const touch = touches[index];
      const coped = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        pageX: touch.pageX,
        pageY: touch.pageY,
        identifier: touch.identifier,
        force: touch.force
      };
      copedList.push(coped);
    }
    return copedList;
  }
  var _TouchLife = class {
    constructor(option) {
      /**
       * 存活时间
       */
      this.lifeTime = 0;
      var _a2, _b, _c;
      this.id = _TouchLife.cacheId++;
      this.startTouchEvent = (_a2 = option == null ? void 0 : option.startTouchEvent) != null ? _a2 : null;
      this.endTouchEvent = (_b = option == null ? void 0 : option.endTouchEvent) != null ? _b : null;
      this.moveTouchEventList = (_c = option == null ? void 0 : option.moveTouchEventList) != null ? _c : [];
    }
    /**
     * 获取生命周期开始和结束时的距离
     */
    getDistance() {
      var _a2, _b, _c, _d;
      if (this.endTouchEvent && this.startTouchEvent) {
        return new YccMathVector(
          ((_a2 = this.endTouchEvent) == null ? void 0 : _a2.triggerTouch.pageX) - ((_b = this.startTouchEvent) == null ? void 0 : _b.triggerTouch.pageX),
          ((_c = this.endTouchEvent) == null ? void 0 : _c.triggerTouch.pageY) - ((_d = this.startTouchEvent) == null ? void 0 : _d.triggerTouch.pageY)
        ).getLength();
      } else {
        return 0;
      }
    }
    addStart(ev) {
      ev.lifeId = this.id;
      this.startTouchEvent = ev;
      return this;
    }
    addEnd(ev) {
      ev.lifeId = this.id;
      this.endTouchEvent = ev;
      this.lifeTime = ev.triggerTime - this.startTouchEvent.triggerTime;
      return this;
    }
    addMove(ev) {
      ev.lifeId = this.id;
      this.moveTouchEventList.push(ev);
      return this;
    }
  };
  var TouchLife = _TouchLife;
  /**
   * 自增ID记录
   */
  TouchLife.cacheId = 0;
  var TouchLifeTracer = class {
    constructor(target, frameTickerSync) {
      this.frameTickerSync = frameTickerSync;
      this.target = target;
      this._lifeList = [];
      this.currentLifeList = [];
      this.targetTouches = [];
      this.touches = [];
      this.changedTouches = [];
      this.onlifestart = (life) => {
      };
      this.onlifechange = (life) => {
      };
      this.onlifeend = (life) => {
      };
      this.init();
    }
    init() {
      if (!this.target.addEventListener) {
        console.error("addEventListener undefined");
        return;
      }
      this.target.addEventListener("touchstart", this.touchstart.bind(this));
      this.target.addEventListener("touchend", this.touchend.bind(this));
      if (this.frameTickerSync) {
        addFrameListener((frame) => {
          if (TouchLifeTracer.touchmoveEventCache) {
            this.touchmoveTrigger(TouchLifeTracer.touchmoveEventCache, frame);
            TouchLifeTracer.touchmoveEventCache = void 0;
          }
        })(this.frameTickerSync);
        this.target.addEventListener("touchmove", this.touchmoveSync.bind(this));
      }
    }
    /**
       * 添加生命周期
       * @param life {TouchLife}  生命周期
       * @return {*}
       */
    addLife(life) {
      this._lifeList.push(life);
    }
    /**
     * 根据identifier查找生命周期，此方法只能在生命周期内使用
     * @param identifier
     * @return {*}
     */
    findCurrentLifeByTouchID(identifier) {
      var _a2;
      for (let i = 0; i < this.currentLifeList.length; i++) {
        const life = this.currentLifeList[i];
        if (((_a2 = life.startTouchEvent) == null ? void 0 : _a2.triggerTouch.identifier) === identifier) {
          return life;
        }
      }
    }
    /**
     * 根据touchID删除当前触摸的生命周期
     * @param identifier
     * @return {boolean}
     */
    deleteCurrentLifeByTouchID(identifier) {
      var _a2;
      for (let i = 0; i < this.currentLifeList.length; i++) {
        const life = this.currentLifeList[i];
        if (((_a2 = life.startTouchEvent) == null ? void 0 : _a2.triggerTouch.identifier) === identifier) {
          this.currentLifeList.splice(i, 1);
          return true;
        }
      }
      return false;
    }
    /**
     * 寻找移动过的接触点
     */
    indexOfTouchFromMoveTouchEventList(moveTouchEventList, touch) {
      for (let i = 0; i < moveTouchEventList.length; i++) {
        if (touch.identifier === moveTouchEventList[i].triggerTouch.identifier) {
          return i;
        }
      }
      return -1;
    }
    touchstart(e) {
      const self = this;
      if (e.preventDefault)
        e.preventDefault();
      const life = new TouchLife();
      self.addLife(life.addStart({
        triggerTime: Date.now(),
        triggerTouch: syncTouches(e.touches)[0],
        type: "touchstart"
      }));
      self.currentLifeList.push(life);
      if (self.onlifestart)
        self.onlifestart(life);
    }
    /**
     * 没有帧同步时，立即触发
     * @param e
     */
    touchmove(e) {
      this.touchmoveTrigger(e);
    }
    /**
     * 存在帧同步时，不立即触发，仅记录
     */
    touchmoveSync(e) {
      TouchLifeTracer.touchmoveEventCache = e;
    }
    touchmoveTrigger(e, frame) {
      const self = this;
      if (e.preventDefault)
        e.preventDefault();
      const changedTouches = syncTouches(e.changedTouches);
      for (let i = 0; i < changedTouches.length; i++) {
        const touch = changedTouches[i];
        const life = self.findCurrentLifeByTouchID(touch.identifier);
        if (!life)
          continue;
        if (!life.moveTouchEventList[life.moveTouchEventList.length - 1]) {
          life.addMove({
            triggerTime: Date.now(),
            triggerTouch: touch,
            type: "touchmove"
          });
          if (self.onlifechange)
            self.onlifechange(life);
          continue;
        }
        const lastMoveEvent = life.moveTouchEventList[life.moveTouchEventList.length - 1];
        const lastMove = new YccMathDot(life.moveTouchEventList[life.moveTouchEventList.length - 1].triggerTouch.pageX, life.moveTouchEventList[life.moveTouchEventList.length - 1].triggerTouch.pageY);
        const curMove = new YccMathDot(touch.pageX, touch.pageY);
        if (lastMove.distance(curMove) > 1 && Date.now() - lastMoveEvent.triggerTime > 16) {
          life.addMove({
            triggerTime: Date.now(),
            triggerTouch: touch,
            type: "touchmove"
          });
          if (self.onlifechange)
            self.onlifechange(life);
        }
      }
    }
    touchend(e) {
      const self = this;
      if (e.preventDefault)
        e.preventDefault();
      const touch = syncTouches(e.changedTouches)[0];
      const life = self.findCurrentLifeByTouchID(touch.identifier);
      life.addEnd({
        triggerTime: Date.now(),
        triggerTouch: touch,
        type: "touchend"
      });
      self.deleteCurrentLifeByTouchID(touch.identifier);
      if (self.onlifeend)
        self.onlifeend(life);
    }
  };

  // src/tools/gesture/index.ts
  var YccGesture = class {
    constructor(option) {
      /**
       * 默认的事件监听函数
       * @param data
       */
      this.events = {
        tap: function(data) {
        },
        dragstart: function(data) {
        },
        dragging: function(data) {
        },
        dragend: function(data) {
        },
        longtap: function(data) {
        },
        multistart: function(data) {
        },
        multichange: function(data) {
        },
        multiend: function(data) {
        },
        zoom: function(data) {
        },
        rotate: function(data) {
        },
        log: function(data) {
        },
        swipe: function(data) {
        },
        doubletap: function(data) {
        }
      };
      this.option = {
        target: option.target,
        useMulti: true,
        frameTickerSync: option.frameTickerSync
      };
      this._longTapTimeout = 0;
      this.ismutiltouching = false;
      this.touchLifeTracer = null;
      this._init();
    }
    _init() {
      if (isMobile()) {
        console.log("mobile gesture init...");
        this._initForMobile();
      } else {
        console.log("pc gesture init...");
      }
    }
    /**
       * 向外部触发事件
       * @param type
       * @param data
       */
    triggerListener(type, data, data2) {
      const event = {
        type,
        data
      };
      this.events[type](event);
    }
    /**
     * 构造筛选事件中的有用信息
     * @param event  {MouseEvent | TouchEvent}  鼠标事件或者触摸事件
     * @param [type] {String} 事件类型，可选
     * @return {{target: null, clientX: number, clientY: number, pageX: number, pageY: number, screenX: number, screenY: number, force: number}}
     * @private
     */
    _createEventData(event, type) {
      let data = {
        /**
           * 事件类型
           */
        type: "",
        /**
           * 事件触发对象
           */
        target: null,
        /**
           * 事件的生命周期ID，只在拖拽过程中存在，存在时此值大于-1
           * PC端表示mousedown直至mouseup整个周期
           * mobile端表示touchstart直至touchend整个周期
           */
        identifier: -1,
        // x、y兼容微信端，web端其值等于pageX、pageY
        x: 0,
        y: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        screenX: 0,
        screenY: 0,
        force: 1,
        /**
           * 手势滑动方向，此属性当且仅当type为swipe时有值
           */
        swipeDirection: "",
        /**
           * 缩放比例 仅当事件为zoom时可用
           */
        zoomRate: 1,
        /**
           * 旋转角度 仅当事件为rotate时可用
           */
        angle: 0,
        /**
           * 创建时间
           */
        createTime: Date.now()
      };
      data = Object.assign(data, event);
      data.type = type;
      return data;
    }
    /**
     * 获取缩放比例
     * @param preLife
     * @param curLife
     * @return {number}
     * @private
     */
    getZoomRateAndRotateAngle(preLife, curLife) {
      const x0 = preLife.startTouchEvent.triggerTouch.pageX;
      const y0 = preLife.startTouchEvent.triggerTouch.pageY;
      const x1 = curLife.startTouchEvent.triggerTouch.pageX;
      const y1 = curLife.startTouchEvent.triggerTouch.pageY;
      const preMoveTouch = preLife.moveTouchEventList.length > 0 ? preLife.moveTouchEventList[preLife.moveTouchEventList.length - 1] : preLife.startTouchEvent;
      const curMoveTouch = curLife.moveTouchEventList.length > 0 ? curLife.moveTouchEventList[curLife.moveTouchEventList.length - 1] : curLife.startTouchEvent;
      const x0move = preMoveTouch.triggerTouch.pageX;
      const y0move = preMoveTouch.triggerTouch.pageY;
      const x1move = curMoveTouch.triggerTouch.pageX;
      const y1move = curMoveTouch.triggerTouch.pageY;
      const vector0 = new YccMathVector(x1 - x0, y1 - y0);
      const vector1 = new YccMathVector(x1move - x0move, y1move - y0move);
      const angle = Math.acos(vector1.dot(vector0) / (vector1.getLength() * vector0.getLength())) / Math.PI * 180;
      return {
        rate: vector1.getLength() / vector0.getLength(),
        angle: angle * (vector1.cross(vector0).z > 0 ? -1 : 1)
      };
    }
    /**
     * 获取某个触摸点的swipe方向
     * @private
     */
    _getSwipeDirection(x1, y1, x2, y2) {
      return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? x1 - x2 > 0 ? "left" : "right" : y1 - y2 > 0 ? "up" : "down";
    }
    /**
     * 是否处于多点触控中
     */
    isMutilTouching() {
      if (this.touchLifeTracer) {
        return this.touchLifeTracer.currentLifeList.length >= 2;
      }
      return false;
    }
    /**
     * 初始化移动端的手势
     * @private
     */
    _initForMobile() {
      const self = this;
      const tracer = new TouchLifeTracer(this.option.target, this.option.frameTickerSync);
      this.touchLifeTracer = tracer;
      let preLife, curLife;
      const prevent = {
        tap: false,
        swipe: false
      };
      tracer.onlifestart = function(life) {
        self.triggerListener("tap", {
          position: new YccMathDot(life.startTouchEvent.triggerTouch.pageX, life.startTouchEvent.triggerTouch.pageY)
        });
        self.triggerListener("dragstart", {
          position: new YccMathDot(life.startTouchEvent.triggerTouch.pageX, life.startTouchEvent.triggerTouch.pageY),
          life
        });
        if (tracer.currentLifeList.length > 1) {
          self.ismutiltouching = true;
          if (!self.option.useMulti)
            return;
          self.triggerListener("multistart", tracer.currentLifeList);
          prevent.tap = false;
          prevent.swipe = false;
          clearTimeout(self._longTapTimeout);
          preLife = tracer.currentLifeList[0];
          curLife = tracer.currentLifeList[1];
          return this;
        }
        self.ismutiltouching = false;
        prevent.tap = false;
        prevent.swipe = false;
        self._longTapTimeout = setTimeout(function() {
          self.triggerListener("longtap", {
            position: new YccMathDot(life.startTouchEvent.triggerTouch.pageX, life.startTouchEvent.triggerTouch.pageY)
          });
        }, 750);
      };
      tracer.onlifechange = function(life) {
        life.moveTouchEventList.forEach(function(moveEvent) {
          self.triggerListener("dragging", {
            position: new YccMathDot(moveEvent.triggerTouch.pageX, moveEvent.triggerTouch.pageY),
            life
          });
        });
        if (tracer.currentLifeList.length > 1) {
          self.ismutiltouching = true;
          if (!self.option.useMulti)
            return;
          prevent.tap = true;
          prevent.swipe = true;
          self.triggerListener("multichange", preLife, curLife);
          const rateAndAngle = self.getZoomRateAndRotateAngle(preLife, curLife);
          if (isNum(rateAndAngle.rate)) {
            const e = self._createEventData(preLife.startTouchEvent, "zoom");
            e.zoomRate = rateAndAngle.rate;
            self.triggerListener("zoom", self._createEventData(e, "zoom"));
          }
          if (isNum(rateAndAngle.angle)) {
            const e = self._createEventData(preLife.startTouchEvent, "rotate");
            e.angle = rateAndAngle.angle;
            self.triggerListener("rotate", self._createEventData(e, "rotate"));
          }
          return this;
        }
        if (life.moveTouchEventList.length > 0) {
          self.ismutiltouching = false;
          const firstMove = life.startTouchEvent.triggerTouch;
          const lastMove = Array.prototype.slice.call(life.moveTouchEventList, -1)[0];
          if (Math.abs(lastMove.pageX - firstMove.pageX) > 10 || Math.abs(lastMove.pageY - firstMove.pageY) > 10) {
            clearTimeout(self._longTapTimeout);
          }
        }
      };
      tracer.onlifeend = function(life) {
        var _a2, _b;
        self.triggerListener("dragend", {
          position: new YccMathDot((_a2 = life.endTouchEvent) == null ? void 0 : _a2.triggerTouch.pageX, (_b = life.endTouchEvent) == null ? void 0 : _b.triggerTouch.pageY),
          life
        });
        self.ismutiltouching = true;
        if (tracer.currentLifeList.length === 1) {
          self.ismutiltouching = false;
          self.triggerListener("multiend", preLife, curLife);
          return;
        }
        if (tracer.currentLifeList.length === 0) {
          clearTimeout(self._longTapTimeout);
          if (life.getDistance() > 10) {
            if (life.lifeTime > 300) {
              return this;
            } else {
              const firstMove = life.startTouchEvent.triggerTouch;
              const lastMove = life.endTouchEvent.triggerTouch;
              if (Math.abs(lastMove.pageX - firstMove.pageX) > 30 || Math.abs(lastMove.pageY - firstMove.pageY) > 30) {
                const dir = self._getSwipeDirection(firstMove.pageX, firstMove.pageY, lastMove.pageX, lastMove.pageY);
                self.triggerListener("swipe", {
                  dir
                });
              }
              return this;
            }
          } else {
            if (life.lifeTime < 300) {
              if (preLife && life.endTouchEvent.triggerTime - preLife.endTouchEvent.triggerTime < 300 && Math.abs(preLife.endTouchEvent.triggerTouch.pageX - life.endTouchEvent.triggerTouch.pageX) < 10 && Math.abs(preLife.endTouchEvent.triggerTouch.pageY - life.endTouchEvent.triggerTouch.pageY) < 10) {
                self.triggerListener("doubletap", {
                  position: new YccMathDot(life.endTouchEvent.triggerTouch.pageX, life.endTouchEvent.triggerTouch.pageY)
                });
                preLife = null;
                return this;
              }
              preLife = life;
              return this;
            }
          }
        }
      };
    }
  };

  // src/Ycc.ts
  var createApp = (resources) => {
    const stageCreator = createStage();
    const tickerCreateor = createTicker();
    const ycc = {
      stage: stageCreator.stage,
      $ticker: tickerCreateor.ticker,
      $gesture: new YccGesture({ target: stageCreator.stage.stageCanvas, frameTickerSync: tickerCreateor.ticker }),
      appenv: "h5",
      $resouces: resources
    };
    stageCreator.bindYcc(ycc);
    tickerCreateor.bindYcc(ycc);
    return ycc;
  };

  // src/ui/ImageUI.ts
  var ImageUI = class extends YccUI {
    getDefaultProps() {
      const rect = new YccMathRect(0, 0, 60, 60);
      return __spreadProps(__spreadValues({}, getYccUICommonProps()), {
        resName: "",
        rect,
        fillMode: "none",
        mirror: 0,
        /**
         * 顶点转换
         */
        coordinates: rect.getCoordinates()
      });
    }
    /**
     * 添加至图层时，重新计算属性
     * @param layer
     * @returns
     */
    created(layer) {
      super.created(layer);
      this.props.coordinates = this.props.rect.getCoordinates();
      if (this.props.fillMode === "auto") {
        const img = this.getRes();
        this.props.rect.width = img.width;
        this.props.rect.height = img.height;
        this.props.coordinates = this.props.rect.getCoordinates();
      }
    }
    /**
     * 获取资源
     * @returns
     */
    getRes() {
      var _a2;
      const ycc = this.getYcc();
      return (_a2 = ycc.$resouces) == null ? void 0 : _a2.resMap[this.props.resName].element;
    }
    /**
     * 处理镜像
     * @param renderRect {YccMathRect} 计算之后的图片容纳区
     * @private
     */
    _processMirror(renderRect) {
      const mirror = this.props.mirror;
      const ctx = this.getContext();
      const { x, y, width, height } = renderRect;
      if (mirror === 1) {
        ctx.scale(-1, 1);
        ctx.translate(-x * 2 - width, 0);
      }
      if (mirror === 2) {
        ctx.scale(1, -1);
        ctx.translate(0, -y * 2 - height);
      }
      if (mirror === 3) {
        ctx.scale(-1, -1);
        ctx.translate(-x * 2 - width, -y * 2 - height);
      }
    }
    /**
     * 绘制函数
     */
    render() {
      if (!this.isDrawable() || !this.props.show)
        return;
      const ctx = this.getContext();
      const dpi = this.getDpi();
      this.props.coordinates = this.props.rect.getCoordinates();
      const img = this.getRes();
      if (!img)
        return;
      const renderImgWidth = img.width;
      const renderImgHeight = img.height;
      const imgWidth = renderImgWidth / dpi;
      const imgHeight = renderImgHeight / dpi;
      const transformed = this.getWorldContainer(this.props.rect);
      const worldAnchor = transformed.worldAnchor;
      const rect = this.props.rect;
      const renderRect = transformed.render.renderRect;
      ctx.save();
      ctx.translate(worldAnchor.x, worldAnchor.y);
      ctx.rotate(this.props.rotation * Math.PI / 180);
      ctx.translate(-worldAnchor.x, -worldAnchor.y);
      this._processMirror(renderRect);
      if (this.props.fillMode === "none") {
        ctx.drawImage(img, 0, 0, rect.width, rect.height, renderRect.x, renderRect.y, renderRect.width, renderRect.height);
      } else if (this.props.fillMode === "scale") {
        ctx.drawImage(img, 0, 0, img.width, img.height, renderRect.x, renderRect.y, renderRect.width, renderRect.height);
      } else if (this.props.fillMode === "auto") {
        ctx.drawImage(img, 0, 0, img.width, img.height, renderRect.x, renderRect.y, renderRect.width, renderRect.height);
      } else if (this.props.fillMode === "repeat") {
        const { x, y } = renderRect;
        const wCount = Math.ceil(rect.width / imgWidth);
        const hCount = Math.ceil(rect.height / imgHeight);
        for (let i = 0; i < wCount; i++) {
          for (let j = 0; j < hCount; j++) {
            let xRest = renderImgWidth;
            let yRest = renderImgHeight;
            if (i === wCount - 1) {
              xRest = renderRect.width - i * renderImgWidth;
            }
            if (j === hCount - 1) {
              yRest = renderRect.height - j * renderImgHeight;
            }
            ctx.drawImage(
              img,
              0,
              0,
              xRest,
              yRest,
              x + renderImgWidth * i,
              y + renderImgHeight * j,
              xRest,
              yRest
            );
          }
        }
      } else if (this.props.fillMode === "scale9Grid") {
        if (!this.props.scale9GridRect)
          return;
        const rect2 = this.props.rect;
        const centerRect = this.props.scale9GridRect;
        const grid = [];
        const dpi2 = this.getDpi();
        let src, dest;
        grid[0] = {};
        grid[0].src = new YccMathRect(0, 0, centerRect.x, centerRect.y);
        grid[0].dest = new YccMathRect(rect2.x, rect2.y, centerRect.x, centerRect.y);
        grid[2] = {};
        grid[2].src = new YccMathRect(centerRect.x + centerRect.width, 0, imgWidth - centerRect.x - centerRect.width, centerRect.y);
        grid[2].dest = new YccMathRect(rect2.width - grid[2].src.width + rect2.x, rect2.y, grid[2].src.width, grid[2].src.height);
        grid[6] = {};
        grid[6].src = new YccMathRect(0, centerRect.y + centerRect.height, centerRect.x, imgHeight - centerRect.y - centerRect.height);
        grid[6].dest = new YccMathRect(rect2.x, rect2.y + rect2.height - grid[6].src.height, grid[6].src.width, grid[6].src.height);
        grid[8] = {};
        grid[8].src = new YccMathRect(centerRect.x + centerRect.width, centerRect.y + centerRect.height, imgWidth - centerRect.x - centerRect.width, imgHeight - centerRect.y - centerRect.height);
        grid[8].dest = new YccMathRect(rect2.width - grid[8].src.width + rect2.x, rect2.y + rect2.height - grid[8].src.height, grid[8].src.width, grid[8].src.height);
        grid[1] = {};
        grid[1].src = new YccMathRect(centerRect.x, 0, centerRect.width, centerRect.y);
        grid[1].dest = new YccMathRect(grid[0].dest.x + grid[0].dest.width, rect2.y, rect2.width - grid[0].dest.width - grid[2].dest.width, centerRect.y);
        grid[3] = {};
        grid[3].src = new YccMathRect(grid[0].src.x, centerRect.y, grid[0].src.width, centerRect.height);
        grid[3].dest = new YccMathRect(grid[0].dest.x, grid[0].dest.y + grid[0].dest.height, grid[0].dest.width, rect2.height - grid[0].dest.height - grid[6].dest.height);
        grid[5] = {};
        grid[5].src = new YccMathRect(grid[2].src.x, centerRect.y, grid[2].src.width, centerRect.height);
        grid[5].dest = new YccMathRect(grid[2].dest.x, grid[3].dest.y, grid[2].dest.width, grid[3].dest.height);
        grid[7] = {};
        grid[7].src = new YccMathRect(grid[1].src.x, grid[6].src.y, centerRect.width, grid[6].src.height);
        grid[7].dest = new YccMathRect(grid[1].dest.x, grid[6].dest.y, grid[1].dest.width, grid[6].dest.height);
        grid[4] = {};
        grid[4].src = new YccMathRect(centerRect.x, centerRect.y, centerRect.width, centerRect.height);
        grid[4].dest = new YccMathRect(grid[1].dest.x, grid[5].dest.y, grid[1].dest.width, grid[5].dest.height);
        for (let k = 0; k < grid.length; k++) {
          if (!grid[k])
            continue;
          src = grid[k].src.scaleBy(dpi2, dpi2, true);
          dest = grid[k].dest.scaleBy(dpi2, dpi2, true);
          ctx.drawImage(
            img,
            // 源
            src.x,
            src.y,
            src.width,
            src.height,
            // 目标
            dest.x + worldAnchor.x,
            dest.y + worldAnchor.y,
            dest.width,
            dest.height
          );
        }
      }
      ctx.restore();
    }
  };

  // src/ui/LineUI.ts
  var LineUI = class extends YccUI {
    getDefaultProps() {
      return __spreadProps(__spreadValues({}, getYccUICommonProps()), {
        dots: [],
        /**
         * 此属性只在绘制后生效
         */
        coordinates: [
          new YccMathDot(0),
          new YccMathDot(0)
        ],
        style: {
          color: "red"
        }
      });
    }
    /**
     * 绘制函数
     */
    render() {
      var _a2, _b;
      if (!this.isDrawable() || !this.props.show)
        return;
      if (this.props.dots.length < 2)
        return;
      const ctx = this.getContext();
      const dpi = this.getDpi();
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = (_b = (_a2 = this.props.style) == null ? void 0 : _a2.color) != null ? _b : this.props.strokeStyle;
      ctx.textBaseline = "top";
      const transformed = this.getWorldContainer();
      const dots = this.props.dots.map((dot) => dot.dpi(dpi).plus(transformed.render.renderAnchor));
      ctx.moveTo(dots[0].x, dots[0].y);
      for (let index = 0; index < dots.length; index++) {
        const dot = dots[index];
        ctx.lineTo(dot.x, dot.y);
      }
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    }
  };

  // src/ui/PolygonUI.ts
  var PolygonUI = class extends YccUI {
    getDefaultProps() {
      return __spreadValues({}, getYccUICommonProps());
    }
    /**
     * 绘制函数
     */
    render() {
      if (!this.isDrawable() || !this.props.show)
        return;
      const ctx = this.getContext();
      ctx.save();
      this.renderPath();
      ctx.fillStyle = "#000";
      this.props.fill ? ctx.fill() : ctx.stroke();
      ctx.restore();
    }
  };

  // src/tools/loader/index.ts
  var ParallelLoader = class {
    constructor(resArr) {
      this.load = (endCb, progressCb) => {
        const { resArr } = this;
        this.endCb = endCb;
        this.progressCb = progressCb;
        const endResArr = [];
        const endResMap = {};
        let endLen = 0;
        let successCnt = 0;
        for (let i = 0; i < resArr.length; i++) {
          const curRes = resArr[i];
          if (curRes.type === "image") {
            curRes.element = createImage();
          }
          if (curRes.type === "audio") {
            curRes.element = new Audio();
          }
          console.log(curRes.type);
          loadResource(curRes, (res) => {
            if (progressCb)
              progressCb(res, i);
            endResArr.push(res);
            endResMap[res.name] = res;
            endLen++;
            if (res.success)
              successCnt++;
            if (endLen === resArr.length) {
              if (endCb) {
                endCb({
                  totalCnt: resArr.length,
                  successCnt,
                  resArr: endResArr,
                  resMap: endResMap
                });
              }
            }
          });
        }
        return this;
      };
      this.end = (endCb) => {
        this.endCb = endCb;
        return this;
      };
      this.progress = (progressCb) => {
        this.progressCb = progressCb;
        return this;
      };
      this.resArr = resArr;
    }
  };
  function loadResource(res, endCb) {
    if (res.element instanceof HTMLImageElement) {
      loadImage(res, endCb);
    }
    if (res.element instanceof Audio) {
      loadAudio(res, endCb);
    }
  }
  function loadImage(res, endCb) {
    var _a2;
    res.success = false;
    if (!(res.element instanceof HTMLImageElement)) {
      endCb(res);
      return;
    }
    res.type = "image";
    if (res.element.setAttribute != null) {
      res.element.setAttribute("src", res.url);
      res.element.setAttribute("crossOrigin", (_a2 = res.crossOrigin) != null ? _a2 : "");
    }
    res.element.onload = (e) => {
      res.success = true;
      endCb(res);
    };
    res.element.onerror = (e) => {
      res.errorMsg = e.toString();
      endCb(res);
    };
  }
  function loadAudio(res, endCb) {
    var _a2;
    res.success = false;
    if (!(res.element instanceof Audio)) {
      endCb(res);
      return;
    }
    res.type = "audio";
    if (res.element.setAttribute != null) {
      res.element.setAttribute("src", res.url);
      res.element.setAttribute("crossOrigin", (_a2 = res.crossOrigin) != null ? _a2 : "");
      res.element.setAttribute("preload", "load");
    }
    res.element.onloadedmetadata = (e) => {
      res.success = true;
      endCb(res);
    };
    res.element.onerror = (e) => {
      res.errorMsg = e.toString();
      endCb(res);
    };
  }

  // test/helloworld/src/app.ts
  function setup(resources) {
    const ycc = createApp(resources);
    initUI(ycc);
    eventListener(ycc);
    tickerRender(ycc);
  }
  function loadResources(cb) {
    const resources = [
      {
        name: "test",
        type: "image",
        url: "https://smartedu.jnei.cn/upload/files/upload/ce155375-3dc3-479e-b4d4-8690cc906d40_WechatIMG15%402x.a69e9004.png",
        crossOrigin: "*"
      },
      {
        name: "radius",
        type: "image",
        url: "https://bpic.588ku.com/element_origin_min_pic/01/01/71/9556f3fa9fc2b12.jpg",
        crossOrigin: "*"
      }
    ];
    new ParallelLoader(resources).load((result) => {
      console.log("\u8D44\u6E90\u52A0\u8F7D\u7ED3\u675F", resources, result);
      cb(result);
    });
  }
  function tickerRender(ycc) {
    addFrameListener((frame) => {
      render(frame);
    })(ycc.$ticker);
    startTicker(ycc.$ticker, 30);
    function render(frame) {
      clearStage()(ycc.stage);
      const TestImage = getElementByName("TestImage");
      TestImage.props.rotation++;
      const DebugUI = getElementByName("debug");
      DebugUI.props.value = `\u5E27\u95F4\u9694\uFF1A${frame.deltaTime.toFixed(2)}ms \u5E73\u5747\uFF1A${((Date.now() - ycc.$ticker.startTime) / ycc.$ticker.frameAllCount).toFixed(2)} \u5FC3\u8DF3\u6570\uFF1A${ycc.$ticker.timerTickCount} \u5E27\u6570\uFF1A${ycc.$ticker.frameAllCount}`;
      renderAll(ycc.stage);
    }
  }
  function eventListener(ycc) {
    ycc.$gesture.events.tap = (e) => {
      const ui = getElementByPointer(e.data.position);
      console.log("\u70B9\u51FBui\uFF1A", ui);
    };
    ycc.$gesture.events.dragend = (e) => {
      console.log("dragend\uFF1A", e);
    };
    ycc.$gesture.events.dragging = (e) => {
      getElementByName("line01").props.dots = e.data.life.moveTouchEventList.map((item) => new YccMathDot(item.triggerTouch.pageX, item.triggerTouch.pageY));
    };
    ycc.$gesture.events.dragstart = (e) => {
      console.log("dragstart\uFF1A", e);
    };
  }
  function initUI(ycc) {
    var _a2;
    const stage = ycc.stage;
    (_a2 = document.getElementById("canvas")) == null ? void 0 : _a2.appendChild(stage.stageCanvas);
    const dpi = stage.stageInfo.dpi;
    const layer = {
      test1: createLayer({ name: "t1" })(stage.stageInfo),
      test2: createLayer({ name: "t2" })(stage.stageInfo)
    };
    new LineUI({
      name: "line01",
      dots: [
        new YccMathDot(10, 10),
        new YccMathDot(100, 100)
      ]
    }).addToStage(stage, stage.defaultLayer);
    new PolygonUI({
      name: "TestPolygon",
      anchor: new YccMathDot(200, 200),
      coordinates: [
        new YccMathDot(0, 0),
        new YccMathDot(200, 0),
        new YccMathDot(0, 200),
        new YccMathDot(0, 0)
      ]
    }).addToStage(stage, layer.test1);
    new TextUI({
      value: "sfsdfsdf",
      anchor: new YccMathDot(200, 10),
      style: {
        fontSize: 16,
        color: "red"
      }
    }).addToStage(stage, layer.test2);
    new ImageUI({
      name: "TestImage",
      anchor: new YccMathDot(50, 50),
      // rotation: 30,
      mirror: 1,
      resName: "radius",
      fillMode: "scale9Grid",
      scale9GridRect: new YccMathRect(30, 30, 256 / dpi - 30 * 2, 256 / dpi - 30 * 2),
      rect: new YccMathRect(-10, -30, 180, 180)
    }).addToStage(stage, stage.defaultLayer);
    new TextUI({
      name: "debug",
      value: "",
      style: {
        fontSize: 12
      }
    }).addToStage(stage, stage.defaultLayer);
  }

  // test/helloworld/bootstrap.ts
  SetGlobal("env", "h5");
  SetGlobal("frameRate", 60);
  loadResources(setup);
})();
//# sourceMappingURL=index.js.map
