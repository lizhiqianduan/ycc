/**
 * @file    level-1-1.js
 * @author  xiaohei
 * @date    2018/10/15
 * @description  level-1-1文件
 *
 * 关卡一：吃金币
 */


(function (GameScene) {

	GameScene.prototype.level_1_1 = function () {

	    // 起点
        this.newBounds(8);

		this.newFlag(100,150,400);

//        this.newBounds(180);

		// 创建路面
        this.newGround(0,150,330);
		// this.newFlag(100,150,100);
		this.newBucket(100,150);
        this.newCoin(100,300,1,4);


        this.newGround(380,150,20);
        this.newCoin(380,300,1,1);

        this.newGround(440,150,50);
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
  
        this.newGround(1650,150,200);

		// 终点始终是一个旗子
		this.newFlag(1650,150,400);
		this.newDeadLine(2000,-100);
		
		
		
	};
	
	
	/**
     * 当前关卡结束后的处理
	 */
	GameScene.prototype.level_1_1_onVictory = function () {
 
	};
	



})(window.GameScene);