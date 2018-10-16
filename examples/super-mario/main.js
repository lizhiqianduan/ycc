/**
 * @file    main.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  main文件
 */

if(!Ycc.utils.isMobile())
	alert('此示例在移动端查看效果更好！');



///////////////////////////// 全局变量
var ycc = null;
var stageW = 0;
var stageH = 0;

// 所有的图片资源
var images = null;
// 所以音频资源
var audios = null;
// 当前场景
var currentScene = null;
// loading窗
var loading = null;
// 物理引擎
var engine = null;
//////


createYcc();
projectInit();








function createYcc() {
// 创建canvas
	document.body.innerHTML='';
	var canvas = document.createElement('canvas');
	canvas.width=document.documentElement.clientWidth;
	canvas.height=document.documentElement.clientHeight;
	document.body.appendChild(canvas);

// 初始化全局变量
	ycc = new Ycc().bindCanvas(canvas);
	stageW = ycc.getStageWidth();
	stageH = ycc.getStageHeight();

// 监听每帧、更新场景
	ycc.ticker.addFrameListener(function () {
		ycc.layerManager.reRenderAllLayerToStage();
		currentScene && currentScene.update && currentScene.update();
		currentScene && currentScene.debug && currentScene.debug();
	});
}



function projectInit() {
	
	loading = new Loading();
	ycc.ticker.start(60);
	
	
	// 加载资源
	ycc.loader.loadResOneByOne([
		{name:"btn",url:"./images/btn.jpg"},
		{name:"fight",url:"./images/fight.png"},
		{name:"jump",url:"./images/jump.png"},
		{name:"mario",url:"./images/mario-walk.png"},
		{name:"wall",url:"./images/wall.png"},
		{name:"marioFight",url:"./images/mario-fight.png"},
		{name:"marioJump",url:"./images/mario-jump.png"},
		{name:"marioDown",url:"./images/mario-down.png"},
		{name:"coin100",url:"./images/coin100.jpg"},
		{name:"bucket",url:"./images/bucket.png"},
		{name:"flag",url:"./images/flag.png"},
	],function (lise,imgs) {
		
		ycc.loader.loadResOneByOne([
			{name:"bgm",type:"audio",url:"./audios/bgm.mp3"},
			{name:"jump",type:"audio",url:"./audios/jump.mp3"},
			{name:"touchWall",type:"audio",url:"./audios/touchWall.mp3"},
			{name:"touchCoin",type:"audio",url:"./audios/touchCoin.mp3"},
			{name:"dead1",type:"audio",url:"./audios/dead1.mp3"},
			{name:"dead2",type:"audio",url:"./audios/dead2.mp3"},
		],function (lise,musics) {
			console.log(imgs,222);
			console.log(musics,333);
			images = imgs;
			audios = musics;
			loading.hidden();
			
			engine = Matter.Engine.create();
			Matter.Engine.run(engine);
			
			currentScene = new GameScene();
			ycc.layerManager.reRenderAllLayerToStage();
		});
		
	});
	
}
