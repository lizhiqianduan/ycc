/**
 * @file    GameScene.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  GameScene文件
 */

function GameScene(){
	
	// 游戏进行中的图层
	this.layer = ycc.layerManager.newLayer({enableEventManager:true});
	
	// 放置按钮的图层
	this.btnLayer = ycc.layerManager.newLayer({enableEventManager:true,name:"按钮图层"});
	
	// mario的UI
	this.mario = null;

    // 地面的UI
    this.ground = null;
	
	// matter引擎
	this.engine = null;
	
	// 人脸方向
	this.direction = '';

    // 方向键下 是否正在按住
    this.downIsPressing = false;

    // 跳跃键 是否正在按住
    this.jumpIsPressing = false;

	// 物理引擎中的物体
	this.bodies = null;
	
	
	this.init();
	
}

// 初始化
GameScene.prototype.init = function () {
    this.createGround();
	this.createDirectionBtn();
	this.createSkillBtn();
	this.createMario();

    // 创建一堵墙
    this.newWall(300,stageH-300);
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
	self.btnLayer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(marginLeft,stageH-(btnSize+marginBottom),btnSize,btnSize),
		fillMode:'scale',
		anchorX:btnSize/2,
		anchorY:btnSize/2,
		res:images.btn,
		rotation:180,
		ondragstart:function (e) {
			self.mario.mirror=1;
			self.mario.start();
			self.direction = 'left';
		},
		ondragend:function (e) {
			self.mario.stop();
			self.direction = '';
		}
	}));
	
	// 下
	self.btnLayer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(marginLeft+btnSize+btnSpace,stageH-(btnSize+marginBottom),btnSize,btnSize),
		fillMode:'scale',
		anchorX:btnSize/2,
		anchorY:btnSize/2,
		res:images.btn,
		rotation:90,
		ondragstart:function (e) {
            self.downIsPressing = true;
		},
		ondragend:function (e) {
            self.downIsPressing = false;
		}
	}));

	// 右
	self.btnLayer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(marginLeft+btnSize*2+btnSpace*2,stageH-(btnSize+marginBottom),btnSize,btnSize),
		fillMode:'scale',
		anchorX:btnSize/2,
		anchorY:btnSize/2,
		res:images.btn,
		rotation:0,
		ondragstart:function (e) {
			self.mario.mirror=0;
			self.mario.start();
			self.direction = 'right';
		},
		ondragend:function (e) {
			self.mario.stop();
			self.direction = '';
		}
		
	}));
	
	
	// 上
	self.btnLayer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(marginLeft+btnSize+btnSpace,stageH-(btnSize+marginBottom)-(btnSize+btnSpace),btnSize,btnSize),
		fillMode:'scale',
		anchorX:btnSize/2,
		anchorY:btnSize/2,
		res:images.btn,
		rotation:-90,
        ontap:function (e) {
            self.jumpIsPressing = true;
        }
		
	}));


    window.onkeydown = function(e){
        if(e.keyCode===38){
            self.jumpIsPressing = true;
        }
        if(e.keyCode===37){
            self.mario.mirror=1;
            !self.mario.isRunning && self.mario.start();
            self.direction = 'left';
        }
        if(e.keyCode===39){
            self.mario.mirror=0;
            !self.mario.isRunning && self.mario.start();
            self.direction = 'right';
        }
        if(e.keyCode===40){
            self.downIsPressing = true;
        }

        if(e.keyCode===88){
            if(self.isFighting())
                return;
            // 记录攻击时的帧数
            self.mario._fightFrameCount=ycc.ticker.frameAllCount;
        }

        if(e.keyCode===67)
            self.jumpIsPressing = true;

    };

    window.onkeyup = function(e){
        if(e.keyCode===38){
            self.jumpIsPressing = false;
        }
        if(e.keyCode===37){
            self.mario.stop();
            self.direction = '';
        }
        if(e.keyCode===39){
            self.mario.stop();
            self.direction = '';
        }
        if(e.keyCode===40){
            self.downIsPressing = false;
        }
    };

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
	self.btnLayer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(stageW-btnSize-marginRight,stageH-(btnSize+marginBottom),btnSize,btnSize),
		fillMode:'scale',
		res:images.jump,
		ontap:function (e) {
            self.jumpIsPressing = true;
        }
    }));
	
	// 攻击
	self.btnLayer.addUI(new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(stageW-btnSize*2-btnSpace-marginRight,stageH-(btnSize+marginBottom),btnSize,btnSize),
		fillMode:'scale',
		res:images.fight,
		ontap:function (e) {
			if(self.isFighting())
				return;
			// 记录攻击时的帧数
			self.mario._fightFrameCount=ycc.ticker.frameAllCount;
		}
	}));
	
};


/**
 * 生成马里奥
 */
GameScene.prototype.createMario = function () {
	this.mario = new Ycc.UI.ImageFrameAnimation({
		rect:new Ycc.Math.Rect(stageW/2-18,stageH/2-33,18*2,33*2),
		res:images.mario,
		firstFrameRect:new Ycc.Math.Rect(0,0,18,33),
		frameRectCount:3,
		//autoplay:true,
		frameSpace:8
	});
	this.mario._fightFrameCount=0;
	this.layer.addUI(this.mario);
	
	// 绑定至物理引擎
	var rect = this.mario.rect,ui=this.mario;
	this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height),ui);
	Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
	rect = null;ui=null;
};

/**
 * 创建路面
 */
GameScene.prototype.createGround = function () {
    var wallHeight = 200;
	var ground = new Ycc.UI.Image({
		rect:new Ycc.Math.Rect(0,stageH-wallHeight,stageW,wallHeight),
		res:images.wall,
		fillMode:'repeat',
		name:'ground'
	});
	this.layer.addUI(ground);
	this.ground = ground;

	// 绑定至物理引擎
	var rect = ground.rect,ui = ground;
	this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{isStatic:true}),ui);
	Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
	rect = null;ui=null;

};


/**
 * 新建墙
 * @param x
 * @param y
 */
GameScene.prototype.newWall = function(x,y){
    var w=20,
        h=20;
    var wall = new Ycc.UI.Image({
        rect:new Ycc.Math.Rect(x,y,w,h),
        res:images.wall,
        fillMode:'scale',
        name:'wall'
    });
    this.layer.addUI(wall);

    // 绑定至物理引擎
    var rect = wall.rect,ui = wall;
    this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{isStatic:true}),ui);
    Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
    rect = null;ui=null;
};


/**
 * 将matter的刚体绑定至UI
 * @param body matter刚体
 * @param ui
 */
GameScene.prototype.bindMatterBodyWithUI = function (body,ui) {
	ui._matterBody = body;
};

/**
 * 获取与ui绑定的matter刚体
 * @param ui
 */
GameScene.prototype.getMatterBodyFromUI = function (ui) {
	return ui._matterBody;
};


/**
 * 调试
 */
GameScene.prototype.debug = function () {
	var bodies = Matter.Composite.allBodies(engine.world);
	var context = ycc.ctx;
	context.save();
	context.beginPath();
	for (var i = 0; i < bodies.length; i += 1) {
		var vertices = bodies[i].vertices;
		context.moveTo(vertices[0].x, vertices[0].y);
		for (var j = 1; j < vertices.length; j += 1) {
			context.lineTo(vertices[j].x, vertices[j].y);
		}
		context.lineTo(vertices[0].x, vertices[0].y);
	}
	context.lineWidth = 2;
	context.strokeStyle = '#999';
	context.stroke();
	context.restore();
};


/**
 * 判断Mario是否接触到地面
 * @returns {boolean}
 */
GameScene.prototype.contactGround = function(){
    return parseInt(this.mario.rect.y+this.mario.rect.height-this.ground.rect.y)>=0;
};


/**
 * 判断Mario是否真正攻击
 * @returns {boolean}
 */
GameScene.prototype.isFighting = function(){
    var res = this.mario._fightFrameCount>0 && ycc.ticker.frameAllCount - this.mario._fightFrameCount<6;
    if(!res)
        this.mario._fightFrameCount=0;
    return res;
};


// 每帧的更新函数
GameScene.prototype.update = function () {
	var marioBody = this.getMatterBodyFromUI(this.mario);
	var marioBodyPosition = marioBody.position;
	if(this.direction==='left')
		Matter.Body.setPosition(marioBody, {x:marioBodyPosition.x-1,y:marioBodyPosition.y});
	if(this.direction==='right')
		Matter.Body.setPosition(marioBody, {x:marioBodyPosition.x+1,y:marioBodyPosition.y});

	if(this.downIsPressing)
        console.log('todo 下蹲图片');

    if(this.jumpIsPressing && this.contactGround()){
        Matter.Body.setVelocity(this.getMatterBodyFromUI(this.mario), {x:0,y:-6});
        this.jumpIsPressing = false;
    }



    // 更新人物位置
    this.mario.rect.x=marioBody.vertices[0].x;
    this.mario.rect.y=marioBody.vertices[0].y;
//    Matter.Body.setVertices(marioBody,this.mario.rect.getVertices());

	// 攻击后的6帧都显示攻击状态的图片
	if(this.contactGround()){
        this.mario.res = images.mario;
        this.mario.frameRectCount = 3;
        if(this.isFighting()){
            this.mario.res = images.marioFight;
            this.mario.frameRectCount = 1;
        }
	}else{
        this.mario.res = images.marioJump;
        this.mario.frameRectCount = 1;
	}
	
	
};
