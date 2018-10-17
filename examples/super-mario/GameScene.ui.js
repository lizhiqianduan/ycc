/**
 * @file    GameScene.ui.js.js
 * @author  xiaohei
 * @date    2018/10/15
 * @description  GameScene.ui.js文件
 */



(function(GameScene){
	
	
	
	
	
	/**
	 * 创建路面
	 * @param startX 	路面的起点
	 * @param width		路面宽度（长）
	 * @param height	路面距离屏幕最下方的高度
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
		
	};
	
	/**
	 * 创建一堆墙
	 * @param x			起始x坐标
	 * @param height	最下一行距离屏幕最下方的高度
	 * @param row		行数
	 * @param col		列数
	 */
	GameScene.prototype.newWall = function (x, height,row, col) {
		// 一朵墙高宽
		var wallWidth 	= 40;
		var wallHeight 	= 40;
		
		for(var i=0;i<row;i++){
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
                    rect:new Ycc.Math.Rect(x+(w+wGap)*j,stageH-height-h*i,w,h),
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
	 * 新建一个桶
	 * @param startX 				桶的左侧起点
	 * @param height				桶下边缘距离屏幕最下方的高度
	 * @param [bucketWidth]			桶的宽度
	 * @param [bucketHeight]		桶的高度
	 * @param [direction]			桶的朝向  1上 2右 3下 4左
	 */
	GameScene.prototype.newBucket = function (startX,height,direction,bucketWidth,bucketHeight) {
		
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
	};
	
	/**
	 * 新建一个旗子
	 * 旗子必须插在地面上，即下方必须存在ground
	 * @param startX 				旗子的左侧起点
	 * @param height				旗子下边缘距离屏幕最下方的高度
	 * @param [flagHeight]			旗子的高度
	 */
	GameScene.prototype.newFlag = function (startX,height,flagHeight) {
		
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
	 * 生成金币UI
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
		
	};
	
	/**
	 * 创建游戏结束图层，及其内容
	 */
	GameScene.prototype.createGameOverLayer = function () {
		this.gameOverLayer = ycc.layerManager.newLayer({enableEventManager:true,name:"游戏结束图层",show:false});
		this.gameOverLayer.addUI(new Ycc.UI.SingleLineText({
			content:"点击屏幕任意位置重新开始",
			rect:new Ycc.Math.Rect(0,0,stageW,stageH),
			xAlign:'center',
			yAlign:'center',
			rectBgColor:'rgba(0,0,0,0.5)',
			ontap:function () {
				ycc.layerManager.deleteAllLayer();
				currentScene.update = null;
				currentScene = null;
				projectInit();
			}
		}))
	};
	
})(window.GameScene);