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

  // src/tools/YccGlobalCache.ts
  var GLOBAL_CACHE = {};
  var _a;
  GLOBAL_CACHE = JSON.parse((_a = localStorage.getItem("ycc_global")) != null ? _a : "{}");
  function YccGlobal(key) {
    return GLOBAL_CACHE[key];
  }
  function SetGlobal(key, value) {
    GLOBAL_CACHE[key] = value;
    localStorage.setItem("ycc_global", JSON.stringify(GLOBAL_CACHE));
  }

  // src/tools/YccPolyfill.ts
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
  function createImage(ycc) {
    if (YccGlobal("env") === "wxapp") {
      if (!ycc) {
        console.error("ycc\u5B9E\u4F8B\u5FC5\u4F20");
        return new HTMLImageElement();
      }
      return ycc.stage.stageCanvas.createImage();
    }
    const img = new Image();
    return img;
  }

  // src/tools/YccLoader.ts
  var ParallelLoader = class {
    constructor(ycc, resArr) {
      this.bind = (ycc) => {
        this.ycc = ycc;
        return this;
      };
      this.load = (endCb, progressCb) => {
        const { ycc, resArr } = this;
        this.endCb = endCb;
        this.progressCb = progressCb;
        const endResArr = [];
        const endResMap = {};
        let endLen = 0;
        let successCnt = 0;
        for (let i = 0; i < resArr.length; i++) {
          const curRes = resArr[i];
          if (curRes.type === "image") {
            curRes.element = createImage(ycc);
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
      this.ycc = ycc;
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

  // src/tools/YccMath.ts
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
      * 将此UI添加至图层
      * @param layer
      */
    addToLayer(layer) {
      layer.addUI(this);
      this.created(layer);
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
      if (!this.props.belongTo.stage.yccInstance) {
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
      const { dpi } = this.props.belongTo.stage.getSystemInfo();
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
        const start = coordinates[i].rotate(this.props.rotation, this.props.anchor.plus(this.props.belongTo.position));
        const end = coordinates[i + 1].rotate(this.props.rotation, this.props.anchor.plus(this.props.belongTo.position));
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
      var _a2, _b;
      return (_b = (_a2 = this.props.belongTo) == null ? void 0 : _a2.stage.getSystemInfo().dpi) != null ? _b : 1;
    }
    /**
     * 获取当前实例
     * @returns
     */
    getYcc() {
      var _a2;
      return (_a2 = this.props.belongTo) == null ? void 0 : _a2.stage.yccInstance;
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

  // src/YccLayer.ts
  var YccLayer = class {
    constructor(stage, option) {
      /**
       * 相对于舞台的位置，以左上角为准
       * @attention 此坐标为实际的物理像素
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

  // src/YccStage.ts
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
      const dpi = this.stageInfo.dpi;
      this.stageCanvasCtx.clearRect(0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi);
      if (withLayerCanvas) {
        getAllLayer().forEach((layer) => {
          layer.ctx.clearRect(0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi);
        });
      }
    }
    /**
     * 根据舞台信息，创建一个覆盖全舞台的canvas
     */
    createCanvasByStage() {
      return createCanvas(__spreadValues({}, this.stageInfo));
    }
    /**
     * 根据ui的名称获取舞台上的ui
     * @param name
     * @returns
     */
    getElementByName(name) {
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
      var _a2;
      const dpi = (_a2 = window.devicePixelRatio) != null ? _a2 : 1;
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        dpi,
        renderWidth: window.innerWidth * dpi,
        renderHeight: window.innerWidth * dpi
      };
    }
    /**
     * 绘制所有图层的所有元素
     */
    renderAll() {
      const { dpi } = this.stageInfo;
      getAllLayer().forEach((layer) => {
        layer.uiList.forEach((ui) => {
          ui.renderBg();
          this.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi);
          ui.render();
          ui.renderAnchor();
          this.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi);
        });
        this.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi);
      });
    }
  };

  // src/Ycc.ts
  var Ycc = class {
    constructor(config) {
      const defaultConfig = {
        appenv: "h5",
        debugDrawContainer: false
      };
      this.$config = Object.assign(defaultConfig, config);
      this.stage = new YccStage(this);
    }
    /**
     * 启动
     * @param {Resource[]} resources 已加载完成的资源
     */
    bootstrap(resources2) {
      this.$resouces = resources2;
      this.created();
    }
    /**
     * 根据资源名称获取资源
     * @param resName
     */
    getRes(resName) {
      const res = this.$resouces.resMap[resName];
      return res;
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

  // src/tools/YccUtils.ts
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

  // src/tools/YccTicker.ts
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
      const ycc = this.getYcc();
      return ycc.$resouces.resMap[this.props.resName].element;
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

  // src/tools/YccTouchLife.ts
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
      var _a2, _b, _c;
      this.id = _TouchLife.cacheId++;
      this.startTouchEvent = (_a2 = option == null ? void 0 : option.startTouchEvent) != null ? _a2 : null;
      this.endTouchEvent = (_b = option == null ? void 0 : option.endTouchEvent) != null ? _b : null;
      this.moveTouchEventList = (_c = option == null ? void 0 : option.moveTouchEventList) != null ? _c : [];
    }
    addStart(ev) {
      ev.lifeId = this.id;
      this.startTouchEvent = ev;
      return this;
    }
    addEnd(ev) {
      ev.lifeId = this.id;
      this.endTouchEvent = ev;
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
    constructor(target) {
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
      this.target.addEventListener("touchmove", this.touchmove.bind(this));
      this.target.addEventListener("touchend", this.touchend.bind(this));
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
      console.log("touchstart", life);
      if (self.onlifestart)
        self.onlifestart(life);
    }
    touchmove(e) {
      const self = this;
      if (e.preventDefault)
        e.preventDefault();
      const changedTouches = syncTouches(e.changedTouches);
      for (let i = 0; i < changedTouches.length; i++) {
        const touch = changedTouches[i];
        const life = self.findCurrentLifeByTouchID(touch.identifier);
        life.addMove({
          triggerTime: Date.now(),
          triggerTouch: touch,
          type: "touchmove"
        });
        if (self.onlifechange)
          self.onlifechange(life);
      }
    }
    touchend(e) {
      const self = this;
      if (e.preventDefault)
        e.preventDefault();
      const touch = e.changedTouches[0];
      const life = self.findCurrentLifeByTouchID(touch.identifier);
      life.addEnd({
        triggerTime: Date.now(),
        triggerTouch: __spreadValues({}, touch),
        type: "touchend"
      });
      self.deleteCurrentLifeByTouchID(touch.identifier);
      if (self.onlifeend)
        self.onlifeend(life);
    }
  };

  // src/tools/YccGesture.ts
  var YccGesture = class {
    constructor(option) {
      this.option = {
        target: option.target,
        useMulti: option.useMulti
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
      console.log(type, data, data2);
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
     * 初始化移动端的手势
     * @private
     */
    _initForMobile() {
      const self = this;
      const tracer = new TouchLifeTracer(this.option.target);
      this.touchLifeTracer = tracer;
      let preLife, curLife;
      const prevent = {
        tap: false,
        swipe: false
      };
      tracer.onlifestart = function(life) {
        self.triggerListener("tap", self._createEventData(life.startTouchEvent, "tap"));
        self.triggerListener("dragstart", self._createEventData(life.startTouchEvent, "dragstart"));
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
          self.triggerListener("longtap", self._createEventData(life.startTouchEvent, "longtap"));
        }, 750);
      };
      tracer.onlifechange = function(life) {
        life.moveTouchEventList.forEach(function(moveEvent) {
          self.triggerListener("dragging", self._createEventData(moveEvent, "dragging"));
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
            prevent.tap = true;
            clearTimeout(self._longTapTimeout);
          }
        }
      };
      tracer.onlifeend = function(life) {
        self.triggerListener("dragend", self._createEventData(life.endTouchEvent.triggerTouch, "dragend"));
        self.ismutiltouching = true;
        if (tracer.currentLifeList.length === 1) {
          self.ismutiltouching = false;
          self.triggerListener("multiend", preLife, curLife);
          return;
        }
        if (tracer.currentLifeList.length === 0) {
          self.ismutiltouching = false;
          if (!prevent.tap && life.endTime - life.startTime < 300) {
            clearTimeout(self._longTapTimeout);
            if (preLife && life.endTime - preLife.endTime < 300 && Math.abs(preLife.endTouchEvent.triggerTouch.pageX - life.endTouchEvent.triggerTouch.pageX) < 10 && Math.abs(preLife.endTouchEvent.triggerTouch.pageY - life.endTouchEvent.triggerTouch.pageY) < 10) {
              self.triggerListener("doubletap", self._createEventData(life.endTouchEvent.triggerTouch, "doubletap"));
              self.triggerListener("log", "doubletap triggered");
              preLife = null;
              return this;
            }
            preLife = life;
            return this;
          }
          if (!prevent.swipe && life.endTime - life.startTime < 300) {
            const firstMove = life.startTouchEvent.triggerTouch;
            const lastMove = Array.prototype.slice.call(life.moveTouchEventList, -1)[0];
            if (Math.abs(lastMove.pageX - firstMove.pageX) > 30 || Math.abs(lastMove.pageY - firstMove.pageY) > 30) {
              const dir = self._getSwipeDirection(firstMove.pageX, firstMove.pageY, lastMove.pageX, lastMove.pageY);
              const type = "swipe" + dir;
              self.triggerListener("log", type);
              self.triggerListener(type, self._createEventData(__spreadProps(__spreadValues({}, life.endTouchEvent), { dir }), type));
              self.triggerListener("swipe", self._createEventData(__spreadProps(__spreadValues({}, life.endTouchEvent), { dir }), "swipe"));
              console.log("swipe", type);
            }
            return this;
          }
        }
      };
    }
  };

  // test/helloworld/src/app.ts
  var App = class extends Ycc {
    created() {
      var _a2;
      (_a2 = document.getElementById("canvas")) == null ? void 0 : _a2.appendChild(this.stage.stageCanvas);
      new LineUI({
        dots: [
          new YccMathDot(10, 10),
          new YccMathDot(100, 100)
        ]
      }).addToLayer(this.stage.defaultLayer);
      const gesture = new YccGesture({ target: this.stage.stageCanvas, useMulti: true });
      console.log(gesture);
      new PolygonUI({
        name: "TestPolygon",
        anchor: new YccMathDot(200, 200),
        coordinates: [
          new YccMathDot(0, 0),
          new YccMathDot(200, 0),
          new YccMathDot(0, 200),
          new YccMathDot(0, 0)
        ]
      }).addToLayer(this.stage.defaultLayer);
      new TextUI({
        value: "sfsdfsdf",
        anchor: new YccMathDot(200, 10),
        style: {
          fontSize: 16,
          color: "red"
        }
      }).addToLayer(this.stage.defaultLayer);
      new ImageUI({
        name: "TestImage",
        anchor: new YccMathDot(50, 50),
        // rotation: 30,
        mirror: 1,
        resName: "radius",
        fillMode: "scale9Grid",
        scale9GridRect: new YccMathRect(30, 30, 128 - 30 * 2, 128 - 30 * 2),
        rect: new YccMathRect(-10, -30, 180, 180)
      }).addToLayer(this.stage.defaultLayer);
      const frameText = new TextUI({
        value: ""
      }).addToLayer(this.stage.defaultLayer);
      const ticker = new YccTicker(this);
      ticker.addFrameListener((frame) => {
        frameText.props.value = `${frame.deltaTime.toFixed(2)}ms \u5E73\u5747\uFF1A${((Date.now() - ticker.startTime) / frame.frameCount).toFixed(2)}ms  \u7ED8\u5236\u5C3A\u5BF8\uFF1A${this.stage.stageCanvas.width}*${this.stage.stageCanvas.height}px dpi\uFF1A${this.stage.stageInfo.dpi}`;
        this.render();
      }).start(60);
      this.render();
    }
    render() {
      this.stage.clearStage();
      const TestImage = this.stage.getElementByName("TestImage");
      TestImage.props.rotation++;
      this.stage.renderAll();
    }
  };

  // test/helloworld/bootstrap.ts
  SetGlobal("env", "h5");
  SetGlobal("frameRate", 60);
  var app = new App();
  var resources = [
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
  new ParallelLoader(app, resources).load((result) => {
    console.log("\u8D44\u6E90\u52A0\u8F7D\u7ED3\u675F", resources, result);
    app.bootstrap(result);
  });
})();
//# sourceMappingURL=index.js.map
