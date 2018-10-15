/**
 * @file    level-1-1.js
 * @author  xiaohei
 * @date    2018/10/15
 * @description  level-1-1文件
 */


(function (GameScene) {

	GameScene.prototype.level_1_1 = function () {

        this.newBounds(8);

//        this.newBounds(180);

		// 创建路面
		this.newGround(0,stageW*2,200);

		// 创建一堵墙
		this.newWall(100,330,2,6);

        this.newCoin(100,400,1,4);

	};

	



})(window.GameScene);