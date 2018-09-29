/**
 * @file    GameScene.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  GameScene文件
 */

function GameScene(){
	
	// 游戏进行中的图层
	this.layer = ycc.layerManager.newLayer({enableEventManager:true});
	
	// mario的UI
	this.mario = null;
	
	// 方向
	this.direction = '';
	
	this.init();
	
}

// 初始化
GameScene.prototype.init = function () {
	this.createDirectionBtn();
	this.createSkillBtn();
	this.createMario();
};

/**
 * 生成方向键
 */
GameScene.prototype.createDirectionBtn = function () {
	var self = this;
	// 按钮大小
	var btnSize = 40;
	// 按钮之间的间隙
	var btnSpace = 5;
	// 按钮组距屏幕左侧的宽度
	var marginLeft = 20;

	// 按钮组距屏幕下侧的宽度
	var marginBottom = 20;
	
	// 左
	self.layer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(marginLeft,stageH-(btnSize+marginBottom),btnSize,btnSize),
		fillMode:'scale',
		anchorX:btnSize/2,
		anchorY:btnSize/2,
		res:images.btn,
		rotation:180,
		ondragstart:function (e) {
			self.direction = 'left';
		},
		ondragend:function (e) {
			self.direction = '';
		}
	}));
	
	// 下
	self.layer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(marginLeft+btnSize+btnSpace,stageH-(btnSize+marginBottom),btnSize,btnSize),
		fillMode:'scale',
		anchorX:btnSize/2,
		anchorY:btnSize/2,
		res:images.btn,
		rotation:90,
		ondragstart:function (e) {
			self.direction = 'down';
		},
		ondragend:function (e) {
			self.direction = '';
		}
	}));

	// 右
	self.layer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(marginLeft+btnSize*2+btnSpace*2,stageH-(btnSize+marginBottom),btnSize,btnSize),
		fillMode:'scale',
		anchorX:btnSize/2,
		anchorY:btnSize/2,
		res:images.btn,
		rotation:0,
		ondragstart:function (e) {
			self.direction = 'right';
		},
		ondragend:function (e) {
			self.direction = '';
		}
		
	}));
	
	
	// 上
	self.layer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(marginLeft+btnSize+btnSpace,stageH-(btnSize+marginBottom)-(btnSize+btnSpace),btnSize,btnSize),
		fillMode:'scale',
		anchorX:btnSize/2,
		anchorY:btnSize/2,
		res:images.btn,
		rotation:-90,
		ondragstart:function (e) {
			self.direction = 'up';
		},
		ondragend:function (e) {
			self.direction = '';
		}
		
	}));

};


/**
 * 生成功能键
 */
GameScene.prototype.createSkillBtn = function () {
	var self = this;
	// 按钮大小
	var btnSize = 40;
	// 按钮之间的间隙
	var btnSpace = 15;
	// 按钮组距屏幕左侧的宽度
	var marginRight = 20;
	// 按钮组距屏幕下侧的宽度
	var marginBottom = 20;
	
	// 跳跃
	self.layer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(stageW-btnSize-marginRight,stageH-(btnSize+marginBottom),btnSize,btnSize),
		fillMode:'scale',
		res:images.jump,
		ondragstart:function (e) {
			console.log(e,this);
		},
		ondragend:function (e) {
			console.log(e);
		}
	}));
	
	// 攻击
	self.layer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(stageW-btnSize*2-btnSpace-marginRight,stageH-(btnSize+marginBottom),btnSize,btnSize),
		fillMode:'scale',
		res:images.fight,
		ondragstart:function (e) {
			console.log(e,this);
		},
		ondragend:function (e) {
			console.log(e);
		}
	}));
	
};


/**
 * 生成马里奥
 */
GameScene.prototype.createMario = function () {
	this.mario = new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(0,0,50,50/images.mario.naturalWidth*images.mario.naturalHeight),
		fillMode:'scale',
		res:images.mario
	});
	
	this.layer.addUI(this.mario);
};


// 每帧的更新函数
GameScene.prototype.update = function () {
	if(this.direction==='left')
		this.mario.rect.x--;
	if(this.direction==='right')
		this.mario.rect.x++;
	if(this.direction==='up')
		this.mario.rect.y--;
	if(this.direction==='down')
		this.mario.rect.y++;
};
