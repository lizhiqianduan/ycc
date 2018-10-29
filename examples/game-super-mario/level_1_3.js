/**
 * @file    level_1-3.js
 * @author  xiaohei
 * @date    2018/10/25
 * @description  level_1-3文件
 */


(function (GameScene) {
	
	var endBucket = null;
	
	GameScene.prototype.level_1_3 = function () {
		
		// 游戏接触的弹出图层
		this.createGameOverLayer();
		// 最下方的死亡线，即Mario最低能降落到多少
		this.newDeadLine(2000,-100);
		
		// this.newWall(0,-50,1,10);
		
		var i=0;
		for(i=0;i<100;i++){
			this.newGirl(100+i*5,150);
		}
		
		for(i=0;i<100;i++){
			this.newBucket(100+i*5,250);
		}

		for(i=0;i<1000;i++){
			this.newBucket(100+i*5,350);
		}
		
	};
	
	
	
	
})(window.GameScene);