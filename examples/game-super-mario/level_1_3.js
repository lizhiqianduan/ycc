/**
 * @file    level_1-3.js
 * @author  xiaohei
 * @date    2018/10/25
 * @description  level_1-3文件
 */


(function (GameScene) {
	
	
	GameScene.prototype.level_1_3 = function () {
		this.levelCommonSetting();
		
		uiCreator.call(this);
		
		this.levelCommonEnd(1800);
	};
	
	
	function uiCreator(){
		// 临时变量
		var x=0;
		var marginBottom=150;
		var width = 200;
		
		this.newWall(0,200,1,10,[[0,2,1]]);
		
		this.newWall(150,350,2,5,[[1,2,1,3]]);
		
		this.newMushroom(350,500);
		
		
		/**
		 *
		 *    -----
		 * |   ^^^   |
		 *  _________
		 */
		x=500;
		marginBottom=150;
		width=400;
		this.newGround(x,marginBottom,width);
		this.newBucket(x,marginBottom);
		this.newBucket(x+width-80,marginBottom,1,80);
		this.newWall(x+100,marginBottom+200,1,4,[[0,1,1,1],[0,2,1,1]]);
		this.newCoin(x+150,marginBottom+250,1,3);
		this.newMushroom(x+100,marginBottom);
		this.newMushroom(x+150,marginBottom);
		this.newMushroom(x+200,marginBottom);
		
		
		/**
		 *       __
		 *    __
		 * __
		 */
		x=1000;
		marginBottom = 150;
		width=700;
		this.newWall(x,marginBottom,1,5);
		this.newWall(x+250,marginBottom+100,1,5);
		this.newWall(x+500,marginBottom+200,1,5);
		this.newMushroom(x+200,marginBottom+200);
		this.newCoin(x,marginBottom+100,1,3);
		this.newCoin(x+250,marginBottom+100+100,1,3);
		this.newCoin(x+500,marginBottom+200+100,1,3);
	}
	
	
})(window.GameScene);