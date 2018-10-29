/**
 * @file    level-1-1.js
 * @author  xiaohei
 * @date    2018/10/15
 * @description  level-1-1文件
 *
 * 关卡一：吃金币
 */


(function (GameScene) {

	var endBucket = null;
	
	GameScene.prototype.level_1_1 = function () {
		
		this.createBackground(images.bg01,2222,stageH,2);
		
		// 游戏接触的弹出图层
		this.createGameOverLayer();
		
		// 方向键
		this.createDirectionBtn();
		
		// 技能键
		this.createSkillBtn();
		
		// 右上角的金币计数
		this.createCoinUI();

		
	    // 起点
        this.newBounds(8);
		
		this.newGround(0,150,450);
		
		// this.newGirl(220,150);
		this.newMushroom(220,180);
		this.newMushroom(260,180);
		this.newMushroom(300,180);
		
		this.newBucket(100,150);
        this.newCoin(100,300,1,4);
		
		this.newBucket(350,150);

        this.newCoin(380,300,1,1);

        this.newCoin(450,350,1,1);

        this.newGround(550,150,100);
        this.newCoin(550,350,1,2);






		// 创建一堵墙
        this.newWall(700,250,1,3);
        this.newCoin(700,450,1,5);

        this.newWall(850,400,1,3);
        this.newCoin(850,450,1,2);

        this.newWall(1050,50,1,3);
        this.newCoin(1050,250,1,5);
		
		
		
		this.newWall(1200,0,2,1);
		this.newWall(1240,0,3,1);
		this.newWall(1280,0,4,1);
		this.newWall(1320,0,5,1);
		this.newWall(1360,0,6,1);
		this.newWall(1400,0,7,1);
		this.newWall(1460,0,8,1);
		
		this.newWall(1560,0,10,1);
  
        this.newGround(1650,150,2000);
		
        // 终点旗子
		this.newFlag(1650,150,400);
		
		endBucket = this.newBucket(1650+stageW-90,140,4,90,90);
		
		
		// 最下方的死亡线，即Mario最低能降落到多少
		this.newDeadLine(2000,-100);
		
		// 添加几发导弹
		this.newMissile(300,300);
		this.newMissile(1300,400);
		this.newMissile(2300,500);
		
		
	};
	
	
	/**
     * 当前关卡结束后的处理
	 */
	GameScene.prototype.level_1_1_onVictory = function () {
        // var marioBody = self
		if(this.marioContactWith.indexOf(endBucket._matterBody)>-1){
			Matter.World.remove(engine.world, endBucket._matterBody);
			this.gameOverLayer.show=true;
			this.gameOverLayer.uiList[0].content='恭喜通关！点击屏幕任意位置重新开始';
			this.gameOverLayer.uiList[0].color='#ff4d4f';
		}
		
	};
	



})(window.GameScene);