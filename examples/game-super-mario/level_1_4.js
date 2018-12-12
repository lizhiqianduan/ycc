/**
 * @file    level_1_4.js
 * @author  xiaohei
 * @date    2018/11/15
 * @description  level_1_4文件
 */

(function (GameScene) {
	
	GameScene.prototype.level_1_4 = function () {
		this.levelCommonSetting();
		uiCreator.call(this);
		this.levelCommonEnd(5100);
	};
	
	function uiCreator() {
		this.newGround(0,150,300);this.newWall(126,260,1,3,[[0,1,1,3]]);this.newWall(370,260,1,3,[]);this.newCoin(382,400,1,3);this.newWall(556,360,1,3,[]);this.newGround(676,150,300);this.newCoin(770,300,1,3);this.newBucket(864,150,1,80,90);this.newGround(1008,150,300);this.newBucket(1008,150,1,80,90);this.newBucket(1198,150,1,80,90);this.newMushroom(1112,150);this.newWall(1334,260,1,3,[]);this.newWall(1500,160,1,3,[]);this.newCoin(1500,260,1,5);this.newWall(1690,260,1,3,[]);this.newCoin(1692,400,1,3);this.newGround(1850,150,600);this.newBucket(1858,150,1,80,90);this.newBucket(2360,150,1,80,90);this.newMushroom(2080,150);this.newMushroom(2136,150);this.newMushroom(2216,150);this.newMushroom(1986,150);this.newMushroom(1986,310);this.newGround(2498,150,30);this.newGround(2586,150,30);this.newGround(2686,150,30);this.newGround(2788,150,100);this.newWall(2934,260,1,3,[]);this.newWall(3092,360,1,3,[]);this.newWall(3298,460,1,3,[]);this.newWall(3492,560,1,3,[]);this.newGround(3484,150,300);this.newWall(3484,260,1,3,[]);this.newBucket(3562,150,1,80,90);this.newMushroom(3690,150);this.newMushroom(3762,150);this.newWall(3792,260,1,3,[[0,1,1,10]]);this.newWall(2020,260,1,6,[[0,1,1,5]]);this.newGround(3926,150,300);this.newCoin(4128,200,1,3);this.newGround(4346,150,300);this.newWall(4646,260,1,3,[]);this.newWall(4770,0,5,1,[]);this.newWall(4810,0,6,1,[]);this.newWall(4850,0,7,1,[]);this.newWall(4890,0,8,1,[]);this.newWall(4930,0,9,1,[]);this.newWall(4970,0,10,2,[]);
	}
	
	
})(GameScene);

