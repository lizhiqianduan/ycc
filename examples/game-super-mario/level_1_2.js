/**
 * @file    level_1_2.js
 * @author  xiaohei
 * @date    2018/10/23
 * @description  level_1_2文件
 *
 * 关卡二：超长地图
 */


(function (GameScene) {
	
	// 游戏结束时的下穿桶
	var endBucket = null;
	
	GameScene.prototype.level_1_2 = function () {
		
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
		
		this.newGround(0,150,500);
		this.newGround(600,150,500);
		this.newGround(1200,150,100);
		this.newGround(1400,150,100);
		this.newGround(1600,150,50);
		this.newGround(1700,150,50);
		this.newGround(1800,150,50);

		this.newWall(1900,300,1,4);
		this.newWall(2200,400,1,2);
		this.newWall(2400,400,1,3);
		this.newWall(2600,200,1,3);
		this.newWall(2700,100,1,3);
		this.newWall(2800,300,1,7);
		
		this.newGround(3000,150,500);
		this.newGround(3600,150,500);
		
		this.newWall(4100,200,1,8);
		this.newWall(4400,300,1,3);
		this.newWall(4600,400,1,2);
		
		this.newGround(4800,150,500);
		
		
		
		this.newMushroom(220,180);
		this.newMushroom(260,180);
		this.newMushroom(300,180);

		this.newMushroom(1220,180);
		this.newMushroom(1260,180);
		
		this.newMushroom(2220,180);
		this.newMushroom(2260,180);
		
		
		this.newMushroom(3220,180);
		this.newMushroom(3260,180);
		
		this.newMushroom(4220,180);
		this.newMushroom(4260,180);
		
		
		this.newCoin(100,300,1,3);
		this.newCoin(380,300,4,1);
		this.newCoin(450,350,2,1);
		this.newCoin(1200,500,1,3);
		this.newCoin(1800,400,1,3);
		this.newCoin(2100,300,4,3);
		this.newCoin(3100,300,1,3);
		this.newCoin(4100,300,1,3);
		
		
		// 终点旗子
		this.newFlag(4800,150,400);
		
		endBucket = this.newBucket(4800+stageW-90,140,4,90,90);
		
		
		
		// 添加几发导弹
		this.newMissile(900,400);
		this.newMissile(1300,300);
		this.newMissile(1900,600);
		this.newMissile(3300,500);
		
		
	};
	
	
	/**
	 * 当前关卡结束后的处理
	 */
	GameScene.prototype.level_1_2_onVictory = function () {
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