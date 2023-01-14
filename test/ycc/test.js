"use strict";
(() => {
  // ycc/YccStage.class.ts
  var YccStage = class {
    constructor(canvasDom) {
      this.canvasDom = canvasDom;
      this.ctx = canvasDom.getContext("2d");
    }
    getStageWidth() {
      return this.canvasDom.width;
    }
    getStageHeight() {
      return this.canvasDom.height;
    }
    clearStage() {
      var _a;
      (_a = this.ctx) == null ? void 0 : _a.clearRect(0, 0, this.getStageWidth(), this.getStageHeight());
    }
    getUIFromPointer(dot, uiIsShow) {
      const self = this;
      uiIsShow = Ycc.utils.isBoolean(uiIsShow) ? uiIsShow : true;
      for (let j = self.layerList.length - 1; j >= 0; j--) {
        const layer = self.layerList[j];
        if (layer.ghost)
          continue;
        if (uiIsShow && !layer.show)
          continue;
        const ui = layer.getUIFromPointer(dot, uiIsShow);
        if (ui) {
          return ui;
        }
      }
      return null;
    }
  };

  // ycc/Ycc.class.ts
  var Ycc2 = class {
    constructor(config) {
      /**
       * 初始配置
       */
      this.config = {
        appenv: "h5",
        debugDrawContainer: false
      };
      var _a, _b;
      this.config.appenv = (_a = config == null ? void 0 : config.appenv) != null ? _a : "h5";
      this.config.debugDrawContainer = (_b = config == null ? void 0 : config.debugDrawContainer) != null ? _b : false;
      this.layerList = [];
      this.stage = new YccStage(this);
    }
  };

  // test/ycc/test.ts
  console.log(new Ycc2());
})();
//# sourceMappingURL=test.js.map
