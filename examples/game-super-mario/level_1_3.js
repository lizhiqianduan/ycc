/**
 * @file    level_1-3.js
 * @author  xiaohei
 * @date    2018/10/25
 * @description  level_1-3文件
 */


(function (GameScene) {
	
	var endBucket = null;
	
	GameScene.prototype.level_1_3 = function () {
		// 临时变量
		var x=0;
		var marginBottom=150;
		var width = 200;
		
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
		
		this.newWall(0,200,1,10,[[0,2,1]]);
		
		this.newWall(150,350,2,5,[[1,2,1,3]]);
		
		this.newMushroom(350,500);
		
		
		x=500;
		marginBottom=150;
		width=400;
		this.newGround(x,marginBottom,width);
		this.newBucket(x,marginBottom);
		this.newBucket(x+width-80,marginBottom,1,80);
		this.newWall(x+100,marginBottom+200,1,4,[[0,1,1,1],[0,2,1,1]]);
		this.newMushroom(x+100,marginBottom);
		this.newMushroom(x+150,marginBottom);
		this.newMushroom(x+200,marginBottom);
		

		// 终点旗子
		x=1500;
		this.newFlag(x,200,400);
		this.newGround(x,200,1000);
		endBucket = this.newBucket(x+stageW-90,200-10,4,90,90);
		
	};
	
	
	GameScene.prototype.level_1_3_onVictory = function () {
		// var marioBody = self
		if(this.marioContactWith.indexOf(endBucket._matterBody)>-1){
			Matter.World.remove(engine.world, endBucket._matterBody);
			this.gameOverLayer.show=true;
		}
		
		// 最后的桶在图层最前面，人物走进去的效果
		var uiList = endBucket.belongTo.uiList;
		var i=uiList.indexOf(endBucket);
		uiList.splice(i,1);
		uiList.push(endBucket);
		
	};
	
	
	
})(window.GameScene);