
var ycc = new Ycc();
ycc.bindCanvas(canvas);
ycc.ticker.start();


// 新建图层
var layer = ycc.layerManager.newLayer({ enableFrameEvent: true, enableEventManager: true });
// 新建多行文本的UI
var ui = new Ycc.UI.MultiLineText({
  content: "我是  可以拖拽的  多行文本框  测试文字  测试文字 测试文字 测试文字  01234567",
  rect: new Ycc.Math.Rect(100, 100, 100, 100),
  wordBreak: "break-word",
  overflow: "auto",
  color: 'red'
});
// 添加至图层
layer.addUI(ui);

//	全部绘制
ycc.layerManager.reRenderAllLayerToStage();


// 拖拽
var startPos = null,
  startRect = null;
ui.ondragstart = function (e) {
  startPos = new Ycc.Math.Dot(e);
  startRect = new Ycc.Math.Rect(ui.rect);
  console.log(e, startPos, startRect);
};
ui.ondragging = function (e) {
  // console.log("我是", this.yccClass.name, "我", e.type, e);
  ui.rect.x = startRect.x + e.x - startPos.x;
  ui.rect.y = startRect.y + e.y - startPos.y;
};

layer.onFrameComing = function () {
  ycc.layerManager.reRenderAllLayerToStage();
};
