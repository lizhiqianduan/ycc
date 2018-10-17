/**
 * @file    GameScene.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  GameScene文件
 */

function GameScene(){
	
	// 游戏进行中的图层
	this.layer = ycc.layerManager.newLayer({enableEventManager:true,name:'场景图层'});
	
	// 放置按钮的图层
	this.btnLayer = ycc.layerManager.newLayer({enableEventManager:true,name:"按钮图层"});

	// 游戏结束图层
	this.gameOverLayer = null;
	
	// mario的UI
	this.mario = null;

    // 右上角金币UI
    this.coinUI = null;

    // 分数
    this.score = 0;
	
	// matter引擎
	this.engine = null;
	
	// 人脸方向
	this.direction = '';

    // 方向键下 是否正在按住
    this.downIsPressing = false;

    // 人物从下蹲起身的标志位
    this.downTouchEndFlag = false;

    // 跳跃键 是否正在按住
    this.jumpIsPressing = false;

	// 物理引擎中的物体
	this.bodies = null;
	
	// 人物正在接触的物体数组
	this.marioContactWith = [];
	
	// 人物是否正站立在墙体上
	this.marioStayingOnWall = false;
	
	// 游戏是否胜利、接触旗子就表示游戏胜利
	this.isGameVictory = false;
	
	// 当前游戏关卡
	this.gameLevel = '1_1';
	
	this.init();
	
}

// 初始化
GameScene.prototype.init = function () {
	this.createGameOverLayer();
	this.createDirectionBtn();
	this.createSkillBtn();

    this.createCoinUI();

	// 通过关卡创建当前关卡的UI
	this['level_'+this.gameLevel] && this['level_'+this.gameLevel]();
	// 先创建场景，再创建Mario，防止场景覆盖Mario
	this.createMario();
	
	this.collisionListenerInit();
//    audios.bgm.currentTime=0;
//    audios.bgm.play();
};




/**
 * 将matter的刚体绑定至UI
 * @param body matter刚体
 * @param ui
 */
GameScene.prototype.bindMatterBodyWithUI = function (body,ui) {
	ui._matterBody = body;
	body._yccUI = ui;
};

/**
 * 获取与ui绑定的matter刚体
 * @param ui
 */
GameScene.prototype.getMatterBodyFromUI = function (ui) {
	return ui._matterBody;
};

/**
 * 获取与matter刚体绑定的ui
 * @param body
 * @return {*}
 */
GameScene.prototype.getUIFromMatterBody = function (body) {
	return body._yccUI;
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
		context.moveTo(vertices[0].x+this.layer.x, vertices[0].y);
		for (var j = 1; j < vertices.length; j += 1) {
			context.lineTo(vertices[j].x+this.layer.x, vertices[j].y);
		}
		context.lineTo(vertices[0].x+this.layer.x, vertices[0].y);
	}
	context.lineWidth = 2;
	context.strokeStyle = '#999';
	context.stroke();
	context.restore();
};


/**
 * 碰撞检测
 */
GameScene.prototype.collisionListenerInit = function () {
	var self = this;
	
	/*Matter.Events.on(engine,'collisionStart',function (event) {
		var pair = event.pairs[0];
		var mario = getMarioFromPair(pair);
		var other = getAnotherBodyFromPair(pair,mario);
		
		if(mario&&other){
			self.marioContactWith = other;
		}
	});*/

	Matter.Events.on(engine,'collisionEnd',function (event) {

        for(var i=0;i<event.pairs.length;i++){
            var pair = event.pairs[i];
            //console.log(i,pair.bodyA.label,pair.bodyB.label)
            var mario = getMarioFromPair(pair);
            var other = getAnotherBodyFromPair(pair,mario);

            if(mario&&other){
                var index=self.marioContactWith.indexOf(other);
                index!==-1&&self.marioContactWith.splice(index,1);
            }
        }
	});
	
	
	Matter.Events.on(engine,'collisionActive',function (event) {
		for(var i=0;i<event.pairs.length;i++){
			var pair = event.pairs[i];
			var mario = getMarioFromPair(pair);
			var other = getAnotherBodyFromPair(pair,mario);
			
			if(mario&&other){
                var index=self.marioContactWith.indexOf(other);
                index===-1&&self.marioContactWith.push(other);
			}
		}
	});
	
	// 碰撞时获取与Mario相碰撞的另一刚体
	function getAnotherBodyFromPair(pair,mario) {
		if(!mario)
			return null;
		if(mario===pair.bodyA)
			return pair.bodyB;
		if(mario===pair.bodyB)
			return pair.bodyA;
	}
	// 碰撞时获取Mario
	function getMarioFromPair(pair) {
		var marioBody = self.getMatterBodyFromUI(self.mario);
		if(pair.bodyA.label=== marioBody.label)
			return pair.bodyA;
		if(pair.bodyB.label=== marioBody.label)
			return pair.bodyB;
		return null;
	}
	
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

/**
 * 判断Mario是否处于正常站立状态
 * 并设置属性marioStayingOnWall
 */
GameScene.prototype.marioStayingOnWallCompute = function () {
    for(var i=0;i<this.marioContactWith.length;i++){
        var body = this.marioContactWith[i];
        if(['wall','ground','bucket','flag'].indexOf(body.label)!==-1){
            var marioRect = this.mario.rect;
            var wallRect = this.getUIFromMatterBody(body).rect;
            this.marioStayingOnWall = parseInt(marioRect.y+marioRect.height)<=body.vertices[0].y
                && marioRect.x+marioRect.width>=body.vertices[0].x
                && marioRect.x<body.vertices[0].x+wallRect.width;

            // 如果处于站立状态，立即中断循环
            if(this.marioStayingOnWall) return;
        }
    }

    this.marioStayingOnWall = false;

};

/**
 * 判断Mario是否处于悬空、跳跃状态
 * 并设置属性jumpIsPressing
 */
GameScene.prototype.jumpIsPressingCompute = function () {
	if(this.jumpIsPressing && this.marioStayingOnWall){
		Matter.Body.setVelocity(this.getMatterBodyFromUI(this.mario), {x:0,y:-10});
        audios.jump.currentTime=0;
        audios.jump.play();
		this.jumpIsPressing = false;
	}else{
		this.jumpIsPressing = false;
	}
};

/**
 * 根据Mario的rect属性设置刚体的高、宽
 */
GameScene.prototype.updateMarioBodyVerticesByMarioRect = function () {
	var temp = new Ycc.Math.Rect(this.mario.rect);
	temp.x+=6;
	temp.width-=16;
	// 赋值刚体高、宽
	Matter.Body.setVertices(this.getMatterBodyFromUI(this.mario),temp.getVertices());
	temp=null;
};

/**
 * 计算Mario需要显示的图片及Mario的高度等
 */
GameScene.prototype.marioImageResCompute = function () {
	
	var marioBody = this.getMatterBodyFromUI(this.mario);
	// 刚体位置
	var pos = marioBody.position;
	
	// console.log(this.marioStayingOnWall,this.isFighting(),this.downIsPressing);
	
	// 人物正在行走或站立，并且没有攻击，并且没有下蹲
	if(this.marioStayingOnWall && !this.isFighting() && !this.downIsPressing){
		this.mario.res = images.mario;
		this.mario.frameRectCount = 3;

        // 起身的标志位
        if(this.downTouchEndFlag){
            // 此处重新赋值的原因在于，人物下蹲后刚体尺寸发生了变化，所以起身时需要重新计算刚体高度
            // 重新赋值高度
            this.mario.rect.height = this.mario.res.naturalHeight*2;
            // 更新刚体的高、宽
			this.updateMarioBodyVerticesByMarioRect();
            this.downTouchEndFlag=false;
        }
		  
		// 赋值序列帧动画第一帧的图片高度
		this.mario.firstFrameRect.height = this.mario.res.naturalHeight;
	}

	// 人物处于空中
	else if(!this.marioStayingOnWall){
		this.mario.res = this.downIsPressing?images.marioDown:images.marioJump;
		this.mario.frameRectCount = 1;
		
		// 人物碰到了旗子
		if(this.marioContactWith && this.marioContactWith[0] && this.marioContactWith[0].label==='flag'){
			this.mario.res = images.marioTouchFlag;
			this.isGameVictory = true;
		}
		
	}
	
	// 人物处于下蹲状态
	else if(this.downIsPressing){
		console.log('下蹲');
		
		this.mario.res = images.marioDown;
		this.mario.frameRectCount = 1;

		// 计算刚体位置
		pos.y+=this.mario.rect.height-this.mario.res.naturalHeight*2;
		// 赋值人物高度
		this.mario.rect.height=this.mario.res.naturalHeight*2;
		// 赋值刚体高度
		this.updateMarioBodyVerticesByMarioRect();
		// 赋值序列帧动画第一帧的图片高度
		this.mario.firstFrameRect.height = this.mario.res.naturalHeight;
		// 重新赋值刚体位置
		Matter.Body.setPosition(marioBody,pos);
	}

	// 人物行走或者站立时，正在攻击
	else if(this.marioStayingOnWall && this.isFighting()){
		this.mario.res = images.marioFight;
		this.mario.frameRectCount = 1;
	}
	
};

/**
 * 处理Mario穿透的金币等物品
 */
GameScene.prototype.marioContactWithCompute = function(){
    var self = this;
	
	// 接触旗子是否下落至最低点的标志位
	for(var i=0;i<this.marioContactWith.length;i++){
		var body = this.marioContactWith[i];
		
		// 接触旗子，并且下落至最低点时，去除旗子的刚体，只保留UI
		if(body.label==='flag' && this.marioStayingOnWall){
			Matter.World.remove(engine.world, body);
		}
		if(body.label==='coin'){
			audios.touchCoin.currentTime=0;
			audios.touchCoin.play();
			self.layer.removeUI(self.getUIFromMatterBody(body));
			Matter.World.remove(engine.world, body);
			// 金币+1
			self.score++;
			self.coinUI.content="× "+self.score;
			
		}
	}
	
};

/***
 * 判断游戏结束
 */
GameScene.prototype.gameOverCompute = function(){

	for(var i=0;i<this.marioContactWith.length;i++){
		var body = this.marioContactWith[i];
		if(body.label==='deadLine'){
			audios.dead2.play();
			this.gameOverLayer.show = true;
			ycc.ticker.stop(60);
			return true;
		}
	}
    return false;
};

/**
 * 判断游戏胜利、执行游戏胜利的回调
 */
GameScene.prototype.gameVictoryCompute = function () {
	if(this.isGameVictory){
		
		var marioBody = this.getMatterBodyFromUI(this.mario);
		Matter.Body.setVelocity(marioBody,{x:0,y:marioBody.velocity.y});
		this.direction='left';
		
		
		if(this.marioStayingOnWall){
			var marioBodyPosition = marioBody.position;
			!this.mario.isRunning && this.mario.start();
			Matter.Body.setPosition(marioBody, {x:marioBodyPosition.x+3,y:marioBodyPosition.y});
			
		}
		var key = 'level_'+this.gameLevel+'_onVictory';
		this[key] && this[key]();
	}
};


/**
 * 人物方向的控制
 */
GameScene.prototype.directionCompute = function () {
	var marioBody = this.getMatterBodyFromUI(this.mario);
	var marioBodyPosition = marioBody.position;
	
	// 游戏胜利后不能控制人物移动
	if(this.isGameVictory) return;
	
	// 不在空中的下蹲不能控制人物左右移动
	if((this.marioStayingOnWall&&this.downIsPressing)) {
		return;
	}
	
	// 正常的左右移动
	if(this.direction==='left'){
		Matter.Body.setPosition(marioBody, {x:marioBodyPosition.x-3,y:marioBodyPosition.y});
	}
	if(this.direction==='right'){
		Matter.Body.setPosition(marioBody, {x:marioBodyPosition.x+3,y:marioBodyPosition.y});
	}

};

// 每帧的更新函数
GameScene.prototype.update = function () {

	var marioBody = this.getMatterBodyFromUI(this.mario);
    // 强制设置Mario的旋转角度为0，防止倾倒
    Matter.Body.setAngle(marioBody,0);

    // 强制设置Mario的旋转角速度为0，防止人物一只脚站立时旋转
    Matter.Body.setAngularVelocity(marioBody,0);
	
    // 判断Mario是否处于正常站立
	this.marioStayingOnWallCompute();
	
	// 判断Mario是否处于悬空、跳跃状态，跳跃键处于按下状态
	this.jumpIsPressingCompute();

	// 判断当前帧应该显示的Mario图片
	this.marioImageResCompute();

    // 处理Mario接触的金币等
    this.marioContactWithCompute();
	

	// 处理人物方向键的控制
	this.directionCompute();
	
	// 默认情况、更新人物位置
	// 减8是因为Mario图片比实际碰撞body偏大
	this.mario.rect.x=marioBody.vertices[0].x-8;
	this.mario.rect.y=marioBody.vertices[0].y;
	
	
	
	// 判断游戏胜利、执行游戏胜利的回调
	this.gameVictoryCompute();
	// 判断角色死亡
	this.gameOverCompute();
	
	// 场景的移动
	if(this.mario.rect.x-stageW/2>0){
		// 初始layer的x为0
		this.layer.x = -(this.mario.rect.x-stageW/2);
	}



	
	
};
