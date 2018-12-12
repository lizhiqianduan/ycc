/**
 * @file    Loading.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  Loading文件
 */

function Loading(){
	/**
	 * 正在加载下方的进度
	 * @type {string}
	 */
	this.textUI = new Ycc.UI.SingleLineText({
		content:'',
		fontSize:'12px',
		rect:new Ycc.Math.Rect(0,stageH/2+20,stageW,20),
		xAlign:"center",
		color:'red'
	});
	
	this.layer = ycc.layerManager.newLayer();
	
	this.layer.addUI(new Ycc.UI.Rect({
		rect:new Ycc.Math.Rect(0,0,stageW,stageH),
		color:"gray"
	}));
	this.layer.addUI(new Ycc.UI.SingleLineText({
		content:"正在加载...",
		rect:new Ycc.Math.Rect(0,stageH/2,stageW,20),
		xAlign:"center",
		color:'red'
	}));
	this.layer.addUI(this.textUI);
	
	this.hidden = function(){
		this.layer.show = false;
	};
	
	this.show = function(){
		this.layer.show = true;
	};
	
	this.updateText = function (text) {
		this.textUI.content = text;
		ycc.layerManager.reRenderAllLayerToStage();
	};
};/**
 * @file    GameScene.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  GameScene文件
 */

/**
 * 游戏场景的构造器
 * @param levelName	关卡名
 * @constructor
 */
function GameScene(levelName){
	
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
    
    // 音乐按钮
    this.musicBtn = null;

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
	this.gameLevel = (location.hash || levelName ||'#1_1').slice(1);
	
	// 通关时的桶，默认的通关效果
	this.endBucket = null;

	this.init();
	
}

// 初始化
GameScene.prototype.init = function () {

	// 通过关卡创建当前关卡的UI及其场景
	this['level_'+this.gameLevel] && this['level_'+this.gameLevel]();
	
	this.collisionListenerInit();
	if(bgmAutoplay){
		audios.bgm.currentTime=0;
		audios.bgm.play();
	}
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
 * 关卡公共的设置
 * @param bgName
 * @param bgRepeatType
 * @param bgWidth
 */
GameScene.prototype.levelCommonSetting = function (bgName,bgRepeatType,bgWidth) {
	bgName = bgName || 'bg01';
	bgRepeatType = bgRepeatType || 2;
	bgWidth = bgWidth || 9999;
	// 游戏背景图
	this.createBackground(bgName,bgWidth,stageH,bgRepeatType);
	
	// 游戏接触的弹出图层
	this.createGameOverLayer();
	
	// 方向键
	this.createDirectionBtn();
	
	// 技能键
	this.createSkillBtn();
	
	// 右上角的金币计数
	this.createCoinUI();
	
	// 最下方的死亡线，即Mario最低能降落到多少，超出即认为死亡
	this.newDeadLine(bgWidth,-100);
	
	
	// 起点
	this.newBounds(8);
};

/**
 * 关卡公用的结束标志，即旗子后面一个走进去的桶
 * 只要人物碰到旗子即认为通关
 * @param x	旗子所在的位置
 */
GameScene.prototype.levelCommonEnd = function (x) {
	// 终点旗子
	x=x||1800;
	this.newFlag(x,200,400);
	this.newGround(x,200,1000);
	this.endBucket = this.newBucket(x+stageW-90,200-10,4,90,90);
	
	// 创建Mario，防止场景覆盖Mario
	this.createMario();
};

/**
 * 关卡默认的通关回调
 */
GameScene.prototype.levelCommonOnVictory = function () {
	var endBucket = this.endBucket;
	if(this.marioContactWith.indexOf(endBucket._matterBody)>-1){
		Matter.World.remove(engine.world, endBucket._matterBody);
		this.gameOverLayer.show=true;
	}
	
	// 最后的桶在图层最前面，人物走进去的效果
	var uiList = endBucket.belongTo.uiList;
	var i=uiList.indexOf(endBucket);
	uiList.splice(i,1);
	uiList.push(endBucket);

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
	
	// console.log(audios.bgm.running);
	if(audios.bgm.running){
		this.musicBtn.children[0].show = false;
		this.musicBtn.rotation+=1;
	}else{
		this.musicBtn.children[0].show = true;
		this.musicBtn.rotation=0;
	}
	
	for(var i=0;i<bodies.length;i++){
		var body = bodies[i];
		var ui = self.getUIFromMatterBody(body);
		
		// 更新蘑菇的UI位置
		if(body.label==='mushroom'){
			ui.rect.x=body.vertices[0].x;
			ui.rect.y=body.vertices[0].y;
			// 蘑菇落地之后反弹势能设为0，即不反弹
			body.restitution=body.velocity.y===0?1:0;
			// 更新蘑菇速度。原因在于：速度较小时，matter引擎碰撞后反弹不了
			Matter.Body.setVelocity(body,{x:(body.velocity.x>=0)?1:-1,y:body.velocity.y});
			Matter.Body.setAngle(body,0);
		}
		
		// 更新导弹的位置
		if(body.label==='missile'){
			Matter.Body.setPosition(body,{x:body.position.x-2*ycc.ticker.deltaTimeRatio,y:body.position.y});

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
		
		// 人物在空中，且游戏胜利，说明人物正在空中接触旗子
		if(this.isGameVictory){
			this.mario.res = images.marioTouchFlag;
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
		
		// 接触旗子，游戏胜利
		if(body.label==='flag'){
			this.isGameVictory = true;
			// 并且下落至最低点时，去除旗子的刚体，只保留UI
			if(this.marioStayingOnWall){
				audios.bgm.pause();
				audios.victory.currentTime=0;
				audios.victory.play();
				Matter.World.remove(engine.world, body);
			}
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
				audios.touchMushroom.currentTime=0;
				audios.touchMushroom.play();
				self.layer.removeUI(self.getUIFromMatterBody(body));
				Matter.World.remove(engine.world, body);

				// 给人物一个反弹速度，防止蘑菇删除后人物直接下落
				Matter.Body.setVelocity(marioBody,{x:0,y:-4})
			}else if(this.marioContactWith.length===2 && this.marioContactWith[0].label==='mushroom'&& this.marioContactWith[1].label==='mushroom' && this.marioStayingOnWall){
				audios.touchMushroom.currentTime=0;
				audios.touchMushroom.play();
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
				&& marioRect.x+marioRect.width-16>body.vertices[0].x
				&& marioRect.x<=body.vertices[0].x+wallRect.width-17;

			if(test){
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
	// 停止背景乐
	audios.bgm.pause();
	
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
			Matter.Body.setPosition(marioBody, {x:marioBodyPosition.x+3*ycc.ticker.deltaTimeRatio,y:marioBodyPosition.y});
			
		}
		var key = 'level_'+this.gameLevel+'_onVictory';
		if(this[key]){
			this[key]();
		}else{
			this.levelCommonOnVictory();
		}
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
		Matter.Body.setPosition(marioBody, {x:marioBodyPosition.x-3*ycc.ticker.deltaTimeRatio,y:marioBodyPosition.y});
	}
	if(this.direction==='right'){
		Matter.Body.setPosition(marioBody, {x:marioBodyPosition.x+3*ycc.ticker.deltaTimeRatio,y:marioBodyPosition.y});
	}

};

/**
 * 处理人物撞墙的撞碎效果
 * @param wallBoxBody
 */
GameScene.prototype.marioHitWall = function (wallBoxBody) {
	var self = this;
	var wallBox = this.getUIFromMatterBody(wallBoxBody);
	var wallBoxRect = wallBox.getAbsolutePosition();
	var marioRect = this.mario.getAbsolutePosition();
	// Mario中线
	var middleX = marioRect.x+marioRect.width/2;
	
	console.log('mario middle x--> ',middleX);
	
	
	if(middleX<=wallBoxRect.x){
		console.log('撞第一块');
		// wallBox.children[0] && wallBox.removeChild(wallBox.children[0]);
		rebuildWall(wallBox,0,1);
		return;
	}

	if(middleX>=wallBoxRect.x+wallBoxRect.width){
		console.log('撞最后一块');
		rebuildWall(wallBox,wallBox.children.length-1,1);
		// wallBox.children[wallBox.children.length-1] && wallBox.removeChild(wallBox.children[wallBox.children.length-1]);
		return;
	}
	
	
	for(var i=0;i<wallBox.children.length;i++){
		var child = wallBox.children[i].getAbsolutePosition();
		if(middleX<child.width+child.x && middleX>child.x){
			rebuildWall(wallBox,i,1);
			// wallBox.removeChild(wallBox.children[i]);
			return;
		}
		
		// 恰好撞在中线处，可以撞碎两块墙
		if(middleX===child.x){
			console.log('撞相邻两块');
			rebuildWall(wallBox,i,2);
			// wallBox.removeChild(wallBox.children[i]);
			// if(wallBox.children[i-1]) wallBox.removeChild(wallBox.children[i-1]);
			return;
		}
	}
	
	
	/**
	 * 人物撞击墙体时，重新构建该墙体
	 * @param wallBoxUI 		撞击前的墙体UI
	 * @param index				消失墙的朵数的起点
	 * @param delCount			消失墙的的朵数
	 */
	function rebuildWall(wallBoxUI,index,delCount){
		var rect = wallBoxUI.rect;
		var children = wallBoxUI.children;
		var len = children.length;

		// 只要其中有一个是特殊墙体，都不重新构建
		if(children[index].__specialType!==0 || children[index+delCount-1].__specialType!==0){
			
			var child = (children[index].__specialType===1 && children[index]) || (children[index+delCount-1].__specialType===1 && children[index+delCount-1]);
			// 如果撞击了金币墙体，整个重建
			if(child){
				// 墙体金币数减一
				child.__coinNumber--;
				// 总金币+1
				self.score++;
				self.coinUI.content="× "+self.score;

				// 播放音效
				audios.touchCoin.currentTime=0;
				audios.touchCoin.play();
				
				// 撞击金币的特效
				var childAbsolute = child.getAbsolutePosition();
				self.newCoinAnimation(childAbsolute.x+childAbsolute.width/2-self.layer.x,stageH-(childAbsolute.y),2,6);

				// 直到墙体的金币数为0时，才重新构建墙体
				if(child.__coinNumber===0){
					child.__specialType=2;
					var tempX = children[0].getAbsolutePosition().x-self.layer.x;
					var tempSpecial = rebuildSpecial(0,len-1);
					self.newWall(tempX,stageH-(rect.y+rect.height),1,len,tempSpecial);

					// 删除之前的物理刚体及其UI
					Matter.World.remove(engine.world, self.getMatterBodyFromUI(wallBoxUI));
					self.layer.removeUI(wallBoxUI);
					tempX=0;tempSpecial=null;
				}
			}
			return;
		}
		
		// 没有撞击特殊墙体时，播放音效
		audios.touchWall.currentTime=0;
		audios.touchWall.play();
		
		// 一块都不剩的情况
		if(len<=delCount){
			console.log('一块都不剩')
		}else if(index>0 && index+delCount<len){
			// 分成两块
			console.log('分成两块');
			self.newWall(children[0].getAbsolutePosition().x-self.layer.x,stageH-(rect.y+rect.height),1,index,rebuildSpecial(0,index));
			self.newWall(children[index+delCount].getAbsolutePosition().x-self.layer.x,stageH-(rect.y+rect.height),1,len-index-delCount,rebuildSpecial(index+delCount,len-1));
		}else{
		//撞击后还是一块的情况
			console.log('还剩一块');
			var i = 0;
			var special = null;
			if(delCount===1){
				// 前面少一块
				if(index===0) {
					i=1;
					special = rebuildSpecial(1,len-1);
					__log = JSON.stringify(special);
				}else{
					// 后面少一块
					i=0;
					special = rebuildSpecial(0,index);
				}
			}
			if(delCount===2){
				// 前面少2块
				if(index===1) {
					i=delCount;
					special = rebuildSpecial(index,len-1);
				}else {
					// 后面少2块
					i=0;
					special = rebuildSpecial(0,index);
				}
			}

			var x = children[i].getAbsolutePosition().x-self.layer.x;
			self.newWall(x,stageH-(rect.y+rect.height),1,len-delCount,special);
		}
		
		// 删除之前的物理刚体及其UI
		Matter.World.remove(engine.world, self.getMatterBodyFromUI(wallBoxUI));
		self.layer.removeUI(wallBoxUI);
		
		
		/**
		 * 根据开始和结束的下标，重新构造special，以保证撞击之前的UI效果
		 * 处理 金币墙体、不可撞碎的墙体等
		 * @param startIndex
		 * @param endIndex
		 */
		function rebuildSpecial(startIndex, endIndex) {
			var special = [];
			for(var i=startIndex;i<=endIndex;i++){
				if(children[i].__specialType!==0)
					special.push([0,i-startIndex,children[i].__specialType,children[i].__coinNumber]);
			}
			return special;
		}
	}
	
};

/**
 * 删除界面上的UI，及其被绑定的body
 * @param ui 	GameScene.ui中创建的ui
 */
GameScene.prototype.removeUI = function (ui) {
	var body = ui._matterBody;
	if(body){
		ui._matterBody._yccUI = null;
		ui._matterBody=null;
		Matter.World.remove(engine.world,body);
	}
	this.layer.removeUI(ui);
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
;/**
 * @file    GameScene.ui.js.js
 * @author  xiaohei
 * @date    2018/10/15
 * @description  GameScene.ui.js文件
 */



(function(GameScene){
	
	
	
	
	
	/**
	 * 创建路面
	 * @param startX 	路面的起点
	 * @param height	路面距离屏幕最下方的高度
	 * @param width		路面宽度（长）
	 */
	GameScene.prototype.newGround = function (startX,height,width) {
		var ground = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-height,width,height),
			res:images.wall,
			fillMode:'repeat',
			name:'ground'
		});
		this.layer.addUI(ground);
		
		// 绑定至物理引擎
		var rect = ground.rect,ui = ground;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
			isStatic:true,
			label:"ground",
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0,
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;

		return ground;
	};
	
	/**
	 * 创建一堆墙
	 * @param x				起始x坐标
	 * @param marginBottom	最下一行距离屏幕最下方的高度
	 * @param row			行数
	 * @param col			列数
	 * @param [special]		特殊的墙体，它是一个二维数组
	 * [[row,col,type],[row,col,type]]
	 */
	GameScene.prototype.newWall = function (x, marginBottom,row, col,special) {
		// 一朵墙高宽
		var wallWidth 	= 40;
		var wallHeight 	= 40;
		var height = marginBottom;
		
		// 方案一：每行都是一个完整的body。缺点：人物碰撞时无法方便判断与哪个墙体body碰撞
		/*for(var i=0;i<row;i++){
			var wall = new Ycc.UI.Image({
				rect:new Ycc.Math.Rect(x,stageH-height-wallHeight*i,wallWidth*col,wallHeight),
				res:images.wall,
				fillMode:'scaleRepeat',
				scaleRepeatRect:new Ycc.Math.Rect(0,0,wallWidth,wallHeight),
				name:'wall'
			});
			
			this.layer.addUI(wall);
			// 绑定至物理引擎
			var rect = wall.rect,ui = wall;
			this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
				isStatic:true,
				friction:0,
				frictionStatic:0,
				frictionAir:0,
				restitution:0,
				label:"wall",
				group:-1
			}),ui);
			Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
			rect = null;ui=null;
		}*/
		
		// 方案二：每行每列都是一个单独的body。缺点：人物在墙面行走时容易被单独的墙体body卡住
		/*for(var i=0;i<row;i++){
			for(var j=0;j<col;j++){
				var wall = new Ycc.UI.Image({
					rect:new Ycc.Math.Rect(x+j*wallWidth,stageH-height-wallHeight*i,wallWidth,wallHeight),
					res:images.wall,
					fillMode:'scaleRepeat',
					scaleRepeatRect:new Ycc.Math.Rect(0,0,wallWidth,wallHeight),
					name:'wall'
				});
				
				this.layer.addUI(wall);
				// 绑定至物理引擎
				var rect = wall.rect,ui = wall;
				this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
					isStatic:true,
					friction:0,
					frictionStatic:0,
					frictionAir:0,
					restitution:0,
					label:"wall",
					group:-1
				}),ui);
				Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
				rect = null;ui=null;
			}
		}*/
		
		// 方案三：结合方案一和二，每行一个rect绑定一个body，rect添加多个子UI
		for(var i=0;i<row;i++){
			// 一行墙体的容器
			var wallBox = new Ycc.UI.Rect({
				rect:new Ycc.Math.Rect(x,stageH-height-wallHeight*(i+1),wallWidth*col,wallHeight),
				color:'rgba(0,0,0,0)',
				name:'wallBox'
			});
			
			this.layer.addUI(wallBox);
			// 绑定至物理引擎
			var rect = wallBox.rect,ui = wallBox;
			this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
				isStatic:true,
				friction:0,
				frictionStatic:0,
				frictionAir:0,
				restitution:0,
				label:"wallBox",
				collisionFilter:{
					group:-1
				}
			}),ui);
			Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
			rect = null;ui=null;
			
			// 子UI
			for(var j=0;j<col;j++){
				var itemSpecial = getItemSpecial(i,j);
				var specialType = (itemSpecial && itemSpecial[2]) || 0;
				var wall = new Ycc.UI.Image({
					rect:new Ycc.Math.Rect(j*wallWidth,0,wallWidth,wallHeight),
					res:getResBySpecialType(specialType),
					fillMode:'scaleRepeat',
					scaleRepeatRect:new Ycc.Math.Rect(0,0,wallWidth,wallHeight),
					name:'wall'
				});
				
				// 附加字段
				// 类型
				wall.__specialType = specialType;
				// 墙体内的金币数目
				wall.__coinNumber = (specialType===1 && itemSpecial[3]) || 0;
				
				wallBox.addChild(wall);
			}
		}
		
		/**
		 * 根据类型获取墙体的UI
		 * @param type
		 * @return {*}
		 */
		function getResBySpecialType(type) {
			if(type===0) return images.wall;
			if(type===1) return images.wallSpecial01;
			if(type===2) return images.wallSpecial02;
		}
		
		
		/**
		 * 根据行号和列号获取墙体的特殊类型
		 * 1 -- 普通墙体
		 * 2 -- 金币墙体
		 * 3 -- 不可撞碎墙体
		 *
		 * @param rowIndex
		 * @param colIndex
		 * @return {Array}
		 */
		function getItemSpecial(rowIndex, colIndex) {
			// 默认为0
			if(!special || special.length===0) return null;
			
			for(var i=0;i<special.length;i++){
				if(special[i][0]===rowIndex && special[i][1]===colIndex)
					return special[i];
			}
			return null;
		}
	};



    /**
     * 创建一堆金币
     * @param x			起始x坐标
     * @param height	最下一行距离屏幕最下方的高度
     * @param row		行数
     * @param col		列数
     */
    GameScene.prototype.newCoin = function (x, height,row, col) {
        var w = 21;
        var h = 34;
        var wGap = 10;
        var hGap = 10;

        for(var i=0;i<row;i++){
            for(var j=0;j<col;j++){
                var coin = new Ycc.UI.Image({
                    rect:new Ycc.Math.Rect(x+(w+wGap)*j,stageH-height-(h+hGap)*i,w,h),
                    res:images.coin100,
                    fillMode:'scale',
                    name:'coin'
                });

                this.layer.addUI(coin);
                // 绑定至物理引擎
                var rect = coin.rect,ui = coin;
                this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
                    isStatic:true,
                    isSensor:true,
                    friction:0,
                    frictionStatic:0,
                    frictionAir:0,
                    restitution:0,
                    label:"coin",
                }),ui);
                Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
                rect = null;ui=null;

            }


        }

    };
	
	
	/**
	 * 新建一个金币旋转特性
	 * @param middleX			旋转的中心线
	 * @param marginBottom		初始位置距离最下方的高度
	 * @param zoomSpeed			旋转速度，可取值1 2 4 5 10
	 * @param upSpeed			向上的初速度
	 */
	GameScene.prototype.newCoinAnimation = function (middleX, marginBottom,zoomSpeed,upSpeed) {
		var self = this;
		var w = 20;
		var h = 34;
		// 旋转速度
		zoomSpeed = zoomSpeed || 2;
		// 向上的初速度
		upSpeed = upSpeed || 4;
		
		var x = middleX-w/2;
		var coin = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(x,stageH-marginBottom-h,w,h),
			res:images.coin100,
			fillMode:'scale',
			name:'coinAnimation'
		});
		
		// 绑定至物理引擎
		var rect = coin.rect,ui = coin;
		var body = Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0,
			label:"coinAnimation",
			collisionFilter:{
				// 不与其他刚体碰撞
				group:-1
			},
		});
		this.bindMatterBodyWithUI(body,ui);
		Matter.World.add(engine.world,body);
		Matter.Body.setVelocity(body, {x:0,y:-upSpeed});
		rect = null;ui=null;
		
		console.log(body);
		
		coin.addListener('computestart',startListener);
		coin.addListener('renderend',renderendListener);
		
		this.layer.addUI(coin);
		
		
		function renderendListener() {
			if(parseInt(body.velocity.y)===0){
				coin.removeListener('computestart',startListener);
				coin.removeListener('renderend',renderendListener);
				self.removeUI(this);
			}
			
		}
		function startListener() {
			var ui = this;
			ui.mirrorCount=ui.mirrorCount || 0;
			ui.zoomOut=!!ui.zoomOut;
			
			// console.log(ui.mirrorCount,ycc.ticker.frameAllCount);
			// if(ycc.ticker.frameAllCount===71) debugger;
			
			Matter.Body.setAngle(body,0);
			
			ui.rect.y=body.vertices[0].y;
			
			if(ui.rect.width===0){
				ui.zoomOut = true;
				ui.mirrorCount++;
			}
			
			if(ui.rect.width===w)
				ui.zoomOut = false;
			
			if(ui.mirrorCount%2===0)
				ui.mirror=0;
			else
				ui.mirror=1;
			
			if(ui.zoomOut){
				ui.rect.x-=zoomSpeed/2;
				ui.rect.width+=zoomSpeed;
			}else{
				ui.rect.x+=zoomSpeed/2;
				ui.rect.width-=zoomSpeed;
			}
			
		}
	};
 
	
	/**
	 * 新建一个女孩
	 * @param startX			起始x坐标
	 * @param marginBottom		女孩距离屏幕最下方的高度
	 */
	GameScene.prototype.newGirl = function (startX,marginBottom) {

		var name = 'girl';
		var width = 36;
		var height = 64;
		
		var image = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-marginBottom-height,width,height),
			res:images.girl,
			fillMode:'scale',
			name:name,
		});
		this.layer.addUI(image);
		
		// 绑定至物理引擎
		var rect = image.rect,ui = image;
		var w = rect.width;
		var h = rect.height;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,w,h,{
			isStatic:true,
			label:name,
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
		
		return image;
	};
	
	/**
	 * 新建一个导弹
	 * @param startX			起始x坐标
	 * @param marginBottom		导弹距离屏幕最下方的高度
	 */
	GameScene.prototype.newMissile = function (startX,marginBottom) {
		
		var name = 'missile';
		var width = 30;
		var height = 20;
		
		var image = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-marginBottom-height,width,height),
			res:images.missile,
			fillMode:'scale',
			name:name,
		});
		this.layer.addUI(image);
		
		// 绑定至物理引擎
		var rect = image.rect,ui = image;
		var w = rect.width;
		var h = rect.height;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2+5,rect.y+rect.height/2,w,h,{
			isStatic:true,
			label:name,
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
		
		return image;
	};
	
	
	/**
	 * 新建一个蘑菇
	 * @param startX			起始x坐标
	 * @param marginBottom		蘑菇距离屏幕最下方的高度
	 */
	GameScene.prototype.newMushroom = function (startX,marginBottom) {
		// ui名字
		var name = 'mushroom';

		// 蘑菇高宽
		var width = 36;
		var height = 38;

		// 蘑菇速度
		var speed = 1;
		
		var image = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-marginBottom-height,width,height),
			res:images.mushroom,
			fillMode:'scale',
			name:name,
		});
		this.layer.addUI(image);
		
		// 绑定至物理引擎
		var rect = image.rect,ui = image;
		var w = rect.width;
		var h = rect.height;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,w,h,{
			label:name,
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0,
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		Matter.Body.setVelocity(this.getMatterBodyFromUI(ui),{x:-speed,y:0});
		rect = null;ui=null;
		return image;
	};
	
	
	/**
	 * 新建一个桶
	 * @param startX 				桶的左侧起点
	 * @param marginBottom			桶下边缘距离屏幕最下方的高度
	 * @param [bucketWidth]			桶的宽度
	 * @param [bucketHeight]		桶的高度
	 * @param [direction]			桶的朝向  1上 2右 3下 4左
	 */
	GameScene.prototype.newBucket = function (startX,marginBottom,direction,bucketWidth,bucketHeight) {
		
		var height = marginBottom;
		bucketWidth=bucketWidth||80;
		bucketHeight=bucketHeight||90;

		var image = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-height-bucketHeight,bucketWidth,bucketHeight),
			res:images.bucket,
			fillMode:'scale',
			name:'bucket',
			anchorX:bucketWidth/2,
			anchorY:bucketHeight/2,
			rotation:[0,0,90,180,270][direction||1]
		});
		this.layer.addUI(image);
	
		// 绑定至物理引擎
		var rect = image.rect,ui = image;
		var w = rect.width;
		var h = rect.height;
		if(image.rotation===90||image.rotation===270){
			rect.x+=(bucketHeight-bucketWidth)/2;
			rect.y+=(bucketHeight-bucketWidth)/2;
			w=rect.height;
			h=rect.width;
		}
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,w,h,{
			isStatic:true,
			label:"bucket",
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
		return image;
	};
	
	/**
	 * 新建一个旗子，每个关卡只能有一个
	 * 旗子之后的一个屏幕宽度，场景不再左右移动
	 * 旗子必须插在地面上，即下方必须存在ground
	 * @param startX 				旗子的左侧起点
	 * @param height				旗子下边缘距离屏幕最下方的高度
	 * @param [flagHeight]			旗子的高度
	 */
	GameScene.prototype.newFlag = function (startX,height,flagHeight) {
		this.endPoint = startX+stageW/2;
		// 旗子之后的一个屏幕宽度新增一个限制区
		this.newBounds(startX+stageW);
		var objectHeight = flagHeight||images.flag.naturalHeight;
		var objectWidth = images.flag.naturalWidth;
		
		var image = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(startX,stageH-height-objectHeight,objectWidth,objectHeight),
			res:images.flag,
			fillMode:'scale9Grid',
			scale9GridRect:new Ycc.Math.Rect(16,78,8,14),
			name:'flag',
		});
		this.layer.addUI(image);
		
		// 绑定至物理引擎
		var rect = image.rect,ui = image;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+16,rect.y+rect.height/2,1,9999,{
			isStatic:true,
			label:"flag",
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
		return image;
	};

    /**
     * 在横坐标x处创建一个限制
	 * @param x
     */
	GameScene.prototype.newBounds = function(x){
        Matter.World.add(engine.world,Matter.Bodies.rectangle(x,0,1,2*stageH,{
            isStatic:true,
            friction:0,
            frictionStatic:0,
            frictionAir:0,
            restitution:0,
            label:"bound"
        }));
    };

	/**
	 * 死亡线、看不见的虚拟线，只要人物触碰立即死亡，只能是横线
	 * @param width		横线长度
	 * @param height	横线距离屏幕最下方的高度
	 */
	GameScene.prototype.newDeadLine = function(width,height){
		Matter.World.add(engine.world,Matter.Bodies.rectangle(width/2,stageH-height,width,1,{
			isStatic:true,
			isSensor:true,
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0,
			label:"deadLine"
		}));
	};
	
	
	
	
	
	/**
	 * 生成马里奥
	 */
	GameScene.prototype.createMario = function () {
		this.mario = new Ycc.UI.ImageFrameAnimation({
			rect:new Ycc.Math.Rect(10,0,18*2,images.mario.naturalHeight*2),
			// rect:new Ycc.Math.Rect(320-26,stageH-300,18*2,images.mario.naturalHeight*2),
			res:images.mario,
			firstFrameRect:new Ycc.Math.Rect(0,0,18,images.mario.naturalHeight),
			frameRectCount:3,
			//autoplay:true,
			frameSpace:8
		});
		this.mario._fightFrameCount=0;
		this.layer.addUI(this.mario);
		
		// 绑定至物理引擎
		var rect = this.mario.rect,ui=this.mario;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2+8,rect.y+rect.height/2,rect.width-16,rect.height,{
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0,
			label:"Mario",
		}),ui);
		this.updateMarioBodyVerticesByMarioRect();
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
	};
	
	
	
	/**
	 * 创建背景
	 * @param imgName		背景图片资源的名称，对应于loader加载时的name字段
	 * @param width			背景需要覆盖的区域宽
	 * @param height		背景需要覆盖的区域高
	 * @param type			背景图片资源的类型	1-方图  2-长图 默认方图
	 */
	GameScene.prototype.createBackground = function (imgName,width,height,type) {
		var imgRes = images[imgName];
		type = type || 1;
		var rect = null;
		if(type===1)
			rect = new Ycc.Math.Rect(0,0,imgRes.naturalWidth,imgRes.naturalHeight);
		else
			rect = new Ycc.Math.Rect(0,0,imgRes.naturalWidth/imgRes.naturalHeight*stageH,stageH);
			
		var ui = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(0,0,width,height),
			res:imgRes,
			fillMode:'scaleRepeat',
			scaleRepeatRect:rect,
			name:'bg'
		});
		this.layer.addUI(ui);
	};
	
	
	/**
	 * 创建右上角金币计数UI
	 */
	GameScene.prototype.createCoinUI = function(){
		var coin = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(stageW-100,10,10,15),
			res:images.coin100,
			fillMode:'scale',
			name:'coinUI'
		});
		var coinText = new Ycc.UI.SingleLineText({
			content:"× 0",
			rect:new Ycc.Math.Rect(15,0,40,20),
			color:'yellow'
		});
		coin.addChild(coinText);
		this.btnLayer.addUI(coin);
		this.coinUI = coinText;
	};
	
	/**
	 * 生成方向键
	 */
	GameScene.prototype.createDirectionBtn = function () {
		var self = this;
		// 按钮大小
		var btnSize = 50;
		// 按钮之间的间隙
		var btnSpace = 20;
		// 按钮组距屏幕左侧的宽度
		var marginLeft = 20;
		
		// 按钮组距屏幕下侧的宽度
		var marginBottom = 10;
		
		// 左
		self.btnLayer.addUI(new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(marginLeft,stageH-(2*btnSize+btnSpace+marginBottom),btnSize,btnSize),
			fillMode:'scale',
			anchorX:btnSize/2,
			anchorY:btnSize/2,
			res:images.btn,
			rotation:180,
			ondragstart:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				self.mario.mirror=1;
				self.mario.start();
				self.direction = 'left';
			},
			ondragend:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				self.mario.stop();
				self.direction = '';
			}
		}));
		
		// 右
		self.btnLayer.addUI(new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(marginLeft+btnSize+btnSpace,stageH-(2*btnSize+btnSpace+marginBottom),btnSize,btnSize),
			fillMode:'scale',
			anchorX:btnSize/2,
			anchorY:btnSize/2,
			res:images.btn,
			rotation:0,
			ondragstart:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				self.mario.mirror=0;
				self.mario.start();
				self.direction = 'right';
			},
			ondragend:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				self.mario.stop();
				self.direction = '';
			}
			
		}));
		// 下
		self.btnLayer.addUI(new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(marginLeft+btnSize/2+btnSpace/2,stageH-(btnSize+marginBottom),btnSize,btnSize),
			fillMode:'scale',
			anchorX:btnSize/2,
			anchorY:btnSize/2,
			res:images.btn,
			rotation:90,
			ondragstart:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				// 如果人物不处于站立或行走状态，按下键无效
				if(!self.marioStayingOnWall) {
					console.log('人物当前状态不能下蹲!');
					return;
				}
				self.downIsPressing = true;
			},
			ondragend:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				self.downIsPressing = false;
				self.downTouchEndFlag = true;
			}
		}));
		
		
		
		
		// 上
		/*self.btnLayer.addUI(new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(marginLeft+btnSize+btnSpace,stageH-(btnSize+marginBottom)-(btnSize+btnSpace),btnSize,btnSize),
			fillMode:'scale',
			anchorX:btnSize/2,
			anchorY:btnSize/2,
			res:images.btn,
			rotation:-90,
			ontap:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				if(self.jumpIsPressing) return;
				self.jumpIsPressing = true;
			}
			
		}));*/
		
		// 按键`上`是否是抬起状态。此属性用于阻止人物连跳
		var upIsUp = true;
		window.onkeydown = function(e){
			// 游戏胜利禁用按键
			if(self.isGameVictory) return;
			
			if(e.keyCode===38){
				if(upIsUp){
					upIsUp=false;
					self.jumpIsPressing = true;
				}
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
				// 如果人物不处于站立或行走状态，按下键无效
				if(!self.marioStayingOnWall) {
					console.log('人物当前状态不能下蹲!');
					return;
				}
				self.downIsPressing = true;
			}
			
			if(e.keyCode===88){
				if(self.isFighting())
					return;
				// 记录攻击时的帧数
				self.mario._fightFrameCount=ycc.ticker.frameAllCount;
			}
			
			if(e.keyCode===67){
				if(upIsUp){
					upIsUp=false;
					self.jumpIsPressing = true;
				}
			}
			
		};
		
		window.onkeyup = function(e){
			if(e.keyCode===38){
				upIsUp=true;
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
				self.downTouchEndFlag = true;
			}
			if(e.keyCode===67){
				upIsUp=true;
				self.jumpIsPressing = false;
			}
		};
		
	};
	
	
	/**
	 * 生成功能键
	 */
	GameScene.prototype.createSkillBtn = function () {
		var self = this;
		// 按钮大小
		var btnSize = 50;
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
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;

				if(self.jumpIsPressing) return;
				self.jumpIsPressing = true;
			}
		}));
		
		// 攻击
		self.btnLayer.addUI(new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(stageW-btnSize*2-btnSpace-marginRight,stageH-(btnSize+marginBottom),btnSize,btnSize),
			fillMode:'scale',
			res:images.fight,
			ontap:function (e) {
				// 游戏胜利禁用按键
				if(self.isGameVictory) return;
				
				if(self.isFighting())
					return;
				// 记录攻击时的帧数
				self.mario._fightFrameCount=ycc.ticker.frameAllCount;
			}
		}));
		
		this.createMusicBtn();
	};
	
	/**
	 * 创建音乐按钮
	 */
	GameScene.prototype.createMusicBtn = function () {
		var self = this;
		var btn = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(stageW-40,10,30,30),
			anchorX:15,
			anchorY:15,
			fillMode:'scale',
			res:images.music,
			name:'musicBtn',
			ontap:function (e) {
				if(audios.bgm.running)
					audios.bgm.pause();
				else
					audios.bgm.play();
				
			}
		});
		btn.addChild(new Ycc.UI.Line({
			start:new Ycc.Math.Dot(5,5),
			end:new Ycc.Math.Dot(25,25),
			width:5,
			color:'#ccc',
			ontap:function (e) {
				if(audios.bgm.running)
					audios.bgm.pause();
				else
					audios.bgm.play();
				
			}
		}));
		
		this.musicBtn=btn;
		// 音乐按钮
		self.btnLayer.addUI(btn);
	};
	
	/**
	 * 创建游戏结束图层，及其内容
	 */
	GameScene.prototype.createGameOverLayer = function () {
		var self = this;
		this.gameOverLayer = ycc.layerManager.newLayer({enableEventManager:true,name:"游戏结束图层",show:false});
		
		var restartBtn,nextBtn,mask,text;
		
		// 遮罩
		mask = new Ycc.UI.Rect({
			rect:new Ycc.Math.Rect(0,0,stageW,stageH),
			color:'rgba(0,0,0,0.6)',
		});
		text = new Ycc.UI.SingleLineText({
			rect:new Ycc.Math.Rect(0,stageH/2,stageW,5),
			xAlign:'center',
			color:'red',
			oncomputestart:function () {
				this.content = '您的得分：'+ self.score;
				var index = levelList.indexOf(self.gameLevel);
				if(index===levelList.length-1 && self.isGameVictory){
					this.content = '您的得分：'+ self.score+' '+'恭喜通关！';
				}
			}
		});
		
		// 重玩按钮
		restartBtn = new Ycc.UI.ComponentButton({
			rect:new Ycc.Math.Rect(stageW/2-110,stageH/2+50,100,40),
			backgroundImageRes:images.button,
			text:'重新开始',
			oncomputestart:function () {
				if(self.isGameVictory){
					this.rect.x=stageW/2-110;
					nextBtn&&(nextBtn.show = true);
				}else{
					this.rect.x=stageW/2-100/2;
					nextBtn&&(nextBtn.show = false);
				}
			},
			ontap:restart
		});
		
		// 下一关按钮
		nextBtn = new Ycc.UI.ComponentButton({
			rect:new Ycc.Math.Rect(stageW/2,stageH/2+50,100,40),
			backgroundImageRes:images.button,
			text:'下一关',
			show:false,
			ontap:nextLevel
		});
		
		
		mask.addChild(text);
		mask.addChild(restartBtn);
		mask.addChild(nextBtn);
		
		
		this.gameOverLayer.addUI(mask);
		
		
		
		function nextLevel() {
			console.log('nextLevel');
			clearMemory();
			var index = levelList.indexOf(self.gameLevel);
			if(index===-1) return;
			if(index===levelList.length-1){
				if("undefined"!==typeof wx){
					return projectInit('#'+levelList[0]);
				}
				window.location.href=window.location.pathname+'#'+levelList[0];
				window.location.reload();
				return;
			}
			if("undefined"!==typeof wx){
				return projectInit('#'+levelList[index+1]);
			}
			window.location.href=window.location.pathname+'#'+levelList[index+1];
			window.location.reload();
		}
		
		function restart() {
			console.log('restart');
			clearMemory();
			projectInit('#'+self.gameLevel);
		}
		
		function clearMemory() {
			// 去除body引用
			Matter.Composite.allBodies(engine.world).forEach(function (body) {
				if(body._yccUI){
					body._yccUI._matterBody=null;
					body._yccUI=null;
				}
				Matter.World.remove(engine.world,body);
			});
			Matter.Engine.clear(engine);
			
			self.btnLayer.removeSelf();
			self.layer.removeSelf();
			self.gameOverLayer.removeSelf();
			self.update = null;
			currentScene = null;
		}
	};
	
})(GameScene);;/**
 * @file    level-1-1.js
 * @author  xiaohei
 * @date    2018/10/15
 * @description  level-1-1文件
 *
 * 关卡一：吃金币
 */


(function (GameScene) {
	
	
	GameScene.prototype.level_1_1 = function () {
		this.levelCommonSetting();
		
		uiCreator.call(this);
		
		this.levelCommonEnd(1650);
	};
	
	
	function uiCreator(){
		this.newGround(0,150,450);
		
		// this.newGirl(220,150);
		this.newMushroom(220,180);
		this.newMushroom(260,180);
		this.newMushroom(300,180);
		
		this.newBucket(100,150);
		this.newCoin(100,300,1,4);
		
		this.newBucket(350,150);
		
		this.newCoin(380,300,1,1);
		
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
		this.newWall(1460,0,8,1);
		
		this.newWall(1560,0,10,1);
		// 添加几发导弹
		this.newMissile(300,300);
		this.newMissile(1300,400);
		this.newMissile(2300,500);
		
		
	}
	


})(GameScene);;/**
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
	
})(GameScene);;/**
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
	
	
})(GameScene);;/**
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

;/**
 * @file    main.js
 * @author  xiaohei
 * @date    2018/9/28
 * @description  main文件
 */

if(!Ycc.utils.isMobile()){
	document.body.innerHTML='<img src="./images/qr.png"/>';
	throw new Error('PC端请扫码进入！');
}



///////////////////////////// 全局变量
var ycc = null;
var stageW = 0;
var stageH = 0;

// 所有的图片资源
var images = null;
// 所以音频资源
var audios = null;
// 背景乐自动播放
var bgmAutoplay = true;
// 当前场景
var currentScene = null;
// loading窗
var loading = null;
// 物理引擎
var engine = null;
// 调试时间节点
var t1=0,t2=0,t3=0,t4=0,__log='自定义';
// 关卡列表
var levelList=['1_1','1_2','1_3','1_4'];
//////


createYcc();


loading = new Loading();
loadRes(function (imgs, musics) {
	loading.hidden();
	images=imgs;
	audios=musics;
	projectInit();
	
});








function createYcc() {
	if(typeof canvas === 'undefined'){
// 创建canvas
		window.canvas = document.createElement('canvas');
		canvas.width=window.innerWidth;
		canvas.height=window.innerHeight;
		document.body.appendChild(canvas);
	}

// 初始化全局变量
	ycc = new Ycc().bindCanvas(canvas);
	stageW = ycc.getStageWidth();
	stageH = ycc.getStageHeight();
	
	
	ycc.debugger.addField('帧间隔',function () {return ycc.ticker.deltaTime;});
	ycc.debugger.addField('总帧数',function () {return ycc.ticker.frameAllCount;});
	ycc.debugger.addField('总UI数',function () {return currentScene&&currentScene.layer.uiCountRecursion;});
	ycc.debugger.addField('画面位置',function () {return currentScene&&currentScene.layer.x;});
	ycc.debugger.addField('渲染时间',function () {return t2-t1;});
	ycc.debugger.addField('update时间',function () {return t3-t2;});
	ycc.debugger.addField('debug时间',function () {return t4-t3;});
	ycc.debugger.addField('自定义',function () {return __log;});
	// ycc.debugger.showDebugPanel();





// 监听每帧、更新场景
	ycc.ticker.addFrameListener(function () {
		t1 = Date.now();

		ycc.layerManager.reRenderAllLayerToStage();

		t2 = Date.now();

		currentScene && currentScene.update && currentScene.update();
		
		t3 = Date.now();

		// 绘制刚体的方框
		// currentScene && currentScene.debug && currentScene.debug();
		// window.onerror = function (e) { alert('系统错误！'+e); };
		
		t4 = Date.now();

	});
	
	
	
}




// 加载资源
function loadRes(cb){
	// http://172.16.10.32:7777/examples/game-super-mario/
	if("undefined"!==typeof wx)
		ycc.loader.basePath = 'https://www.lizhiqianduan.com/products/ycc/examples/game-super-mario/';
	ycc.loader.loadResOneByOne([
		{name:"btn",url:"./images/btn.jpg"},
		{name:"button",url:"./images/button.png"},
		{name:"fight",url:"./images/fight.png"},
		{name:"music",url:"./images/music.png"},
		{name:"jump",url:"./images/jump.png"},
		{name:"mario",url:"./images/mario-walk.png"},
		{name:"girl",url:"./images/girl.png"},
		{name:"mushroom",url:"./images/mushroom.png"},
		{name:"wall",url:"./images/wall.png"},
		{name:"wallSpecial01",url:"./images/wall-special-01.jpg"},
		{name:"wallSpecial02",url:"./images/wall-special-02.png"},
		{name:"marioFight",url:"./images/mario-fight.png"},
		{name:"marioJump",url:"./images/mario-jump.png"},
		{name:"marioDown",url:"./images/mario-down.png"},
		{name:"coin100",url:"./images/coin100.jpg"},
		{name:"bucket",url:"./images/bucket.png"},
		{name:"flag",url:"./images/flag.png"},
		{name:"marioTouchFlag",url:"./images/mario-touch-flag.png"},
		{name:"missile",url:"./images/missile.png"},
		{name:"bg01",url:"./images/bg01.jpg"},
		{name:"bg02",url:"./images/bg02.jpg"},
		{name:"bg03",url:"./images/bg03.jpg"},
		{name:"bg04",url:"./images/bg04.jpg"},
		{name:"bg05",url:"./images/bg05.jpg"},
	],function (lise,imgs) {
		ycc.loader.loadResOneByOne([
			{name:"bgm",type:"audio",url:"./audios/bgm.mp3"},
			{name:"jump",type:"audio",url:"./audios/jump.mp3"},
			{name:"victory",type:"audio",url:"./audios/victory.mp3"},
			{name:"touchWall",type:"audio",url:"./audios/touchWall.mp3"},
			{name:"touchCoin",type:"audio",url:"./audios/touchCoin.mp3"},
			{name:"touchMushroom",type:"audio",url:"./audios/touchMushroom.mp3"},
			{name:"dead1",type:"audio",url:"./audios/dead1.mp3"},
			{name:"dead2",type:"audio",url:"./audios/dead2.mp3"},
		],function (lise,musics) {
			cb(imgs,musics);
		},function (item,error) {
			loading.updateText(item.name);
		});
		
	},function (item,error) {
		// 兼容wx
		if (!item.res.naturalWidth) {
			item.res.naturalWidth = item.res.width;
			item.res.naturalHeight = item.res.height;
		}
		loading.updateText(item.name);
	});
	
}


function projectInit(levelName) {
	
	ycc.ticker.start(60);
	engine = Matter.Engine.create();
	Matter.Engine.run(engine);
	currentScene = new GameScene(levelName);
	ycc.layerManager.reRenderAllLayerToStage();
	
}
