/**
 * @file    level_1-3.js
 * @author  xiaohei
 * @date    2018/10/25
 * @description  level_1-3文件
 */


(function (GameScene) {
	
	var endBucket = null;
	
	GameScene.prototype.level_1_3 = function () {
		
		// 游戏背景图
		this.createBackground(images.bg01,9999,stageH,2);
		
		// 游戏接触的弹出图层
		this.createGameOverLayer();
		
		// 方向键
		this.createDirectionBtn();
		
		// 技能键
		this.createSkillBtn();
		
		// 右上角的金币计数
		this.createCoinUI();
		
		// 最下方的死亡线，即Mario最低能降落到多少，超出即认为死亡
		this.newDeadLine(9999,-100);
		
		
		// 起点
		this.newBounds(8);
		
		// this.newWall(0,-50,1,10);
		
		// var i=0;
		// for(i=0;i<100;i++){
		// 	this.newGirl(100+i*5,150);
		// }
		//
		// for(i=0;i<100;i++){
		// 	this.newBucket(100+i*5,250);
		// }
		//
		// for(i=0;i<1000;i++){
		// 	this.newBucket(100+i*5,350);
		// }
		
		this.newWall(0,200,1,10,[[0,2,1]]);
		
		this.newWall(100,350,2,5,[[1,2,1,3]]);

		// 终点旗子
		var x=500;
		this.newFlag(x,200,400);
		this.newGround(x,200,1000);
		endBucket = this.newBucket(x+stageW-90,200-10,4,90,90);
		
	};
	
	
	GameScene.prototype.level_1_3_onVictory = function () {
		// var marioBody = self
		if(this.marioContactWith.indexOf(endBucket._matterBody)>-1){
			Matter.World.remove(engine.world, endBucket._matterBody);
			this.gameOverLayer.show=true;
			this.gameOverLayer.uiList[0].content='恭喜通关！点击屏幕任意位置重新开始';
			this.gameOverLayer.uiList[0].color='#ff4d4f';
		}
		
		// 最后的桶在图层最前面，人物走进去的效果
		var uiList = endBucket.belongTo.uiList;
		var i=uiList.indexOf(endBucket);
		uiList.splice(i,1);
		uiList.push(endBucket);
		
	};
	
	
	
})(window.GameScene);