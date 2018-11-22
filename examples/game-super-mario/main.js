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
// 背景乐自动播放
var bgmAutoplay = true;
// 当前场景
var currentScene = null;
// loading窗
var loading = null;
// 物理引擎
var engine = null;
// 调试时间节点
var t1=0,t2=0,t3=0,t4=0,__log='自定义';
// 关卡列表
var levelList=['1_1','1_2','1_3','1_4'];
//////


createYcc();


loading = new Loading();
loadRes(function (imgs, musics) {
	loading.hidden();
	images=imgs;
	audios=musics;
	projectInit();
	
});








function createYcc() {
	if(typeof canvas === 'undefined'){
// 创建canvas
		window.canvas = document.createElement('canvas');
		canvas.width=window.innerWidth;
		canvas.height=window.innerHeight;
		document.body.appendChild(canvas);
	}

// 初始化全局变量
	ycc = new Ycc().bindCanvas(canvas);
	stageW = ycc.getStageWidth();
	stageH = ycc.getStageHeight();
	
	
	ycc.debugger.addField('帧间隔',function () {return ycc.ticker.deltaTime;});
	ycc.debugger.addField('总帧数',function () {return ycc.ticker.frameAllCount;});
	ycc.debugger.addField('总UI数',function () {return currentScene&&currentScene.layer.uiCountRecursion;});
	ycc.debugger.addField('画面位置',function () {return currentScene&&currentScene.layer.x;});
	ycc.debugger.addField('渲染时间',function () {return t2-t1;});
	ycc.debugger.addField('update时间',function () {return t3-t2;});
	ycc.debugger.addField('debug时间',function () {return t4-t3;});
	ycc.debugger.addField('自定义',function () {return __log;});
	// ycc.debugger.showDebugPanel();





// 监听每帧、更新场景
	ycc.ticker.addFrameListener(function () {
		t1 = Date.now();

		ycc.layerManager.reRenderAllLayerToStage();

		t2 = Date.now();

		currentScene && currentScene.update && currentScene.update();
		
		t3 = Date.now();

		// currentScene && currentScene.debug && currentScene.debug();
		// window.onerror = function (e) { alert('系统错误！'+e); };
		
		t4 = Date.now();

	});
	
	
	
}




// 加载资源
function loadRes(cb){
	// http://172.16.10.32:7777/examples/game-super-mario/
	ycc.loader.basePath = 'https://www.lizhiqianduan.com/products/ycc/examples/game-super-mario/';
	ycc.loader.loadResOneByOne([
		{name:"btn",url:"./images/btn.jpg"},
		{name:"button",url:"./images/button.png"},
		{name:"fight",url:"./images/fight.png"},
		{name:"music",url:"./images/music.png"},
		{name:"jump",url:"./images/jump.png"},
		{name:"mario",url:"./images/mario-walk.png"},
		{name:"girl",url:"./images/girl.png"},
		{name:"mushroom",url:"./images/mushroom.png"},
		{name:"wall",url:"./images/wall.png"},
		{name:"wallSpecial01",url:"./images/wall-special-01.jpg"},
		{name:"wallSpecial02",url:"./images/wall-special-02.png"},
		{name:"marioFight",url:"./images/mario-fight.png"},
		{name:"marioJump",url:"./images/mario-jump.png"},
		{name:"marioDown",url:"./images/mario-down.png"},
		{name:"coin100",url:"./images/coin100.jpg"},
		{name:"bucket",url:"./images/bucket.png"},
		{name:"flag",url:"./images/flag.png"},
		{name:"marioTouchFlag",url:"./images/mario-touch-flag.png"},
		{name:"missile",url:"./images/missile.png"},
		{name:"bg01",url:"./images/bg01.jpg"},
		{name:"bg02",url:"./images/bg02.jpg"},
		{name:"bg03",url:"./images/bg03.jpg"},
		{name:"bg04",url:"./images/bg04.jpg"},
		{name:"bg05",url:"./images/bg05.jpg"},
	],function (lise,imgs) {
		ycc.loader.loadResOneByOne([
			{name:"bgm",type:"audio",url:"./audios/bgm.mp3"},
			{name:"jump",type:"audio",url:"./audios/jump.mp3"},
			{name:"victory",type:"audio",url:"./audios/victory.mp3"},
			{name:"touchWall",type:"audio",url:"./audios/touchWall.mp3"},
			{name:"touchCoin",type:"audio",url:"./audios/touchCoin.mp3"},
			{name:"touchMushroom",type:"audio",url:"./audios/touchMushroom.mp3"},
			{name:"dead1",type:"audio",url:"./audios/dead1.mp3"},
			{name:"dead2",type:"audio",url:"./audios/dead2.mp3"},
		],function (lise,musics) {
			cb(imgs,musics);
		},function (item,error) {
			loading.updateText(item.name);
		});
		
	},function (item,error) {
		// 兼容wx
		if (!item.res.naturalWidth) {
			item.res.naturalWidth = item.res.width;
			item.res.naturalHeight = item.res.height;
		}
		loading.updateText(item.name);
	});
	
}


function projectInit(levelName) {
	
	ycc.ticker.start(60);
	engine = Matter.Engine.create();
	Matter.Engine.run(engine);
	currentScene = new GameScene(levelName);
	ycc.layerManager.reRenderAllLayerToStage();
	
}
