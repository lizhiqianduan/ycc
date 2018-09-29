/**
 * @file    main.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  main文件
 */

if(!Ycc.utils.isMobile())
	throw new Error(alert('此示例只能在移动端查看！'));

var canvas = document.createElement('canvas');
console.log(document.documentElement.clientWidth,document.documentElement.clientHeight);
canvas.width=document.documentElement.clientWidth;
canvas.height=document.documentElement.clientHeight;
document.body.appendChild(canvas);


///////////////////////////// 全局变量
var ycc = new Ycc().bindCanvas(canvas);
var stageW = ycc.getStageWidth();
var stageH = ycc.getStageHeight();
// 所有的图片资源
var images = null;
// 当前场景
var currentScene = null;
// loading窗
var loading = new Loading();
//////




// 加载资源
ycc.loader.loadResOneByOne([
	{name:"btn",url:"./images/btn.jpg"},
	{name:"fight",url:"./images/fight.png"},
	{name:"jump",url:"./images/jump.png"},
	{name:"mario",url:"./images/mario.png"},
],function (lise,imgs) {
	console.log(imgs,222);
	images = imgs;
	loading.hidden();
	currentScene = new GameScene();
	ycc.layerManager.reRenderAllLayerToStage();
});

// 开启动画，每帧都更新场景
ycc.ticker.start(60);
ycc.ticker.addFrameListener(function () {
	currentScene && currentScene.update && currentScene.update();
	ycc.layerManager.reRenderAllLayerToStage();
});
