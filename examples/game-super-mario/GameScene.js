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
	
	// 终点的x坐标、通过newFlag自动赋值
	this.endPoint = 0;

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
	this.gameLevel = (location.hash||'#1_1').slice(1);
	
	this.init();
	
}

// 初始化
GameScene.prototype.init = function () {

	// 通过关卡创建当前关卡的UI及其场景
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
	
	Matter.Events.on(engine,'collisionStart',function (event) {
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
        if(['wall','ground','bucket','flag','girl','mushroom','wallBox'].indexOf(body.label)!==-1){
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
 * 更新界面中的UI的位置、速度，毒蘑菇、小乌龟、飞鸟等
 */
GameScene.prototype.updateUIPosition = function () {
	var self = this;
	var bodies = Matter.Composite.allBodies(engine.world);

	for(var i=0;i<bodies.length;i++){
		var body = bodies[i];
		var ui = self.getUIFromMatterBody(body);
		
		// 更新蘑菇的UI位置
		if(body.label==='mushroom'){
			ui.rect.x=body.vertices[0].x;
			ui.rect.y=body.vertices[0].y;
			
			// 更新蘑菇速度。原因在于：速度较小时，matter引擎碰撞后反弹不了
			Matter.Body.setVelocity(body,{x:(body.velocity.x>0)?1:-1,y:body.velocity.y});
			Matter.Body.setAngle(body,0);
		}
		
		// 更新导弹的位置
		if(body.label==='missile'){
			// 更新蘑菇速度。原因在于：速度较小时，matter引擎碰撞后反弹不了
			Matter.Body.setPosition(body,{x:body.position.x-2,y:body.position.y});

			ui.rect.x=body.vertices[0].x-5;
			ui.rect.y=body.vertices[0].y;
		}
	}

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
		
		// 人物在空中起身
		if(this.downTouchEndFlag){
			// 此处重新赋值的原因在于，人物下蹲后刚体尺寸发生了变化，所以起身时需要重新计算刚体高度
			// 重新赋值高度
			this.mario.rect.height = this.mario.res.naturalHeight*2;
			// 更新刚体的高、宽
			this.updateMarioBodyVerticesByMarioRect();
			this.downTouchEndFlag=false;
			this.mario.firstFrameRect.height = this.mario.res.naturalHeight;
		}
		
	}
	
	// 人物处于下蹲状态
	else if(this.downIsPressing){
		console.log('下蹲');
		
		this.mario.res = images.marioDown;
		this.mario.frameRectCount = 1;

		// 计算刚体位置
		pos.y+=(this.mario.rect.height-this.mario.res.naturalHeight*2)/2;
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
	var marioBody = self.getMatterBodyFromUI(this.mario);
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
		
		if(body.label==='mushroom'){
			// 如果只接触蘑菇，说明是踩在蘑菇上面，并且支持同时踩两个蘑菇。否则游戏结束
			if(this.marioContactWith.length===1 && this.marioStayingOnWall){
				self.layer.removeUI(self.getUIFromMatterBody(body));
				Matter.World.remove(engine.world, body);
				Matter.Body.setVelocity(marioBody,{x:0,y:-4})
			}else if(this.marioContactWith.length===2 && this.marioContactWith[0].label==='mushroom'&& this.marioContactWith[1].label==='mushroom' && this.marioStayingOnWall){
				self.layer.removeUI(self.getUIFromMatterBody(this.marioContactWith[0]));
				Matter.World.remove(engine.world, this.marioContactWith[0]);
				self.layer.removeUI(self.getUIFromMatterBody(this.marioContactWith[1]));
				Matter.World.remove(engine.world, this.marioContactWith[1]);
				
				// 给人物一个反弹速度，防止蘑菇删除后人物直接下落
				Matter.Body.setVelocity(marioBody,{x:0,y:-4})
				
			}else{
				// 去除物理引擎、保留UI
				Matter.World.remove(engine.world, body);
				// 角色死亡
				self.marioDeadProcess();
			}
		}
		
		// 处理人物撞墙的撞碎效果 todo
		if(body.label==='wallBox' && !this.marioStayingOnWall){
			var marioRect = this.mario.rect;
			var wallRect = this.getUIFromMatterBody(body).rect;
			var test = parseInt(marioRect.y)>=body.vertices[0].y+wallRect.height
				&& marioRect.x+marioRect.width-17>body.vertices[0].x
				&& marioRect.x<=body.vertices[0].x+wallRect.width-17;

			// var test = parseInt(marioRect.y)>=body.vertices[0].y+wallRect.height
			// 	&& marioRect.x+marioRect.width-17>body.vertices[0].x;
			
			
			if(test){
				__log='撞上了 '+(new Date().toLocaleTimeString()+' '+(marioRect.x)+' '+(body.vertices[0].x+wallRect.width));
				this.marioHitWall(body);
			}
		}
		
		
		
		if(body.label==='missile'){
			// 去除导弹的刚体，使其UI的位置不再更新
			Matter.World.remove(engine.world,body);
		}
		
		if(body.label==='deadLine' || body.label==='missile'){
			// 角色死亡
			self.marioDeadProcess();
		}
	}
	
};

/***
 * 角色死亡游戏结束之后的处理
 */
GameScene.prototype.marioDeadProcess = function(){
	// 去除Mario的刚体，防止碰撞，并且去除之后MarioUI的位置不会再更新
	Matter.World.remove(engine.world,this.mario._matterBody);

	// 停止更新
	this.update = null;
	
	// 禁止按钮图层的事件
	this.btnLayer.enableEventManager=false;
	// 方向设为空
	this.direction='';
	// 停止帧动画
	this.mario.stop();
	// 播放音效
	audios.dead2.play();
	// 显示结束之后的图层
	this.gameOverLayer.show = true;
	
	// ycc.ticker.stop(60);
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

/**
 * 处理人物撞墙的撞碎效果
 * @param wallBoxBody
 */
GameScene.prototype.marioHitWall = function (wallBoxBody) {
	var wallBox = this.getUIFromMatterBody(wallBoxBody);
	var marioRect = this.mario.getAbsolutePosition();
	// Mario中线
	var middleX = marioRect.x+marioRect.width/2;
	
	for(var i=0;i<wallBox.children.length;i++){
		var child = wallBox.children[i].getAbsolutePosition();
		if(middleX<child.width+child.x && middleX>child.x){
			// wallBox.belongTo.removeUI(wallBox.children[i]);
			wallBox.removeChild(wallBox.children[i]);
		}
		
		// 恰好撞在中线处，可以撞碎两块墙
		if(middleX===child.x){
			wallBox.removeChild(wallBox.children[i]);
			if(wallBox.children[i+1]) wallBox.removeChild(wallBox.children[i+1]);
		}
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
	
	this.updateUIPosition();

	
	
	
	// 判断游戏胜利、执行游戏胜利的回调
	this.gameVictoryCompute();
	
	// 场景的移动
	if(this.mario.rect.x-stageW/2>0 && this.mario.rect.x<this.endPoint){
		// 初始layer的x为0
		this.layer.x = -(this.mario.rect.x-stageW/2);
	}



	
	
};
