




var width = canvas.width;
var height = canvas.height;

var ycc = new Ycc();
ycc.bindCanvas(canvas);
ycc.ticker.start();

var layer = ycc.layerManager.newLayer({ enableFrameEvent: true });

layer.addUI(new Ycc.UI.Rect({
  rect: new Ycc.Math.Rect(0, 0, ycc.getStageWidth(), ycc.getStageHeight()),
  color:'red'
}));

var x = 0, y = 0;
var stepPx = 8;
var left = true;
var topTo = true;
var update = function () {
  if (x <= 0) left = true;
  if (x >= width) left = false;
  if (y <= 0) topTo = true;
  if (y >= height) topTo = false;
  if (left)
    x += stepPx;
  else
    x -= stepPx;

  if (topTo)
    y += stepPx;
  else
    y -= stepPx;
};
var circle = new Ycc.UI.Circle({ point: new Ycc.Math.Dot(x, y), r: 20 });
layer.addUI(circle);
ycc.layerManager.reRenderAllLayerToStage();

layer.onFrameComing = function () {
  console.log('frameComing...',Date.now());
  update();
  layer.clear();
  circle.point.x = x;
  circle.point.y = y;
  ycc.layerManager.reRenderAllLayerToStage();
}