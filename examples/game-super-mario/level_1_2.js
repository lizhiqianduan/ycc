/**
 * @file    level_1_2.js
 * @author  xiaohei
 * @date    2018/10/23
 * @description  level_1_2文件
 *
 * 关卡二：超长地图
 */


(function (GameScene) {
	
	GameScene.prototype.level_1_2 = function () {
		this.levelCommonSetting();
		
		uiCreator.call(this);
		
		this.levelCommonEnd(4800);
	};
	
	
	function uiCreator(){
		this.newGround(0,150,500);
		this.newGround(600,150,500);
		this.newGround(1200,150,100);
		this.newGround(1400,150,100);
		this.newGround(1600,150,50);
		this.newGround(1700,150,50);
		this.newGround(1800,150,50);
		
		this.newWall(1900,200,1,4);
		this.newWall(2200,300,1,2);
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
		
		// 添加几发导弹
		this.newMissile(900,400);
		this.newMissile(1300,300);
		this.newMissile(1900,600);
		this.newMissile(3300,500);
		
	}
	
})(GameScene);