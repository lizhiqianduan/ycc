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
	 * @param imgRes		背景图片资源
	 * @param width			背景需要覆盖的区域宽
	 * @param height		背景需要覆盖的区域高
	 * @param type			背景图片资源的类型	1-方图  2-长图 默认方图
	 */
	GameScene.prototype.createBackground = function (imgRes,width,height,type) {
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
		
		var mask = new Ycc.UI.Rect({
			rect:new Ycc.Math.Rect(0,0,stageW,stageH),
			color:'rgba(0,0,0,0.6)',
		});
		
		
		var btn,text;
		// 重玩按钮
		btn = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(stageW/2-110,stageH/2+50,100,40),
			res:images.button,
			fillMode:'scale',
			oncomputestart:function () {
				if(self.isGameVictory){
					this.rect.x=stageW/2-110;
				}else{
					this.rect.x=stageW/2-100/2;
				}
			}
		});
		text = new Ycc.UI.SingleLineText({
			rect:new Ycc.Math.Rect(0,0,100,40),
			fontSize:'16px',
			content:"重新开始",
			xAlign:'center',
			yAlign:'center',
			ontap:restart
		});
		btn.addChild(text);
		mask.addChild(btn);
		
		
		// 下一关按钮
		btn = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(stageW/2,stageH/2+50,100,40),
			res:images.button,
			show:false,
			fillMode:'scale'
		});
		text = new Ycc.UI.SingleLineText({
			rect:new Ycc.Math.Rect(0,0,100,40),
			fontSize:'16px',
			content:"下一关",
			xAlign:'center',
			yAlign:'center',
			ontap:nextLevel,
			oncomputestart:function () {
				if(self.isGameVictory){
					this.getParent().show = true;
					this.show = true;
					this.content='下一关';
				}else{
					this.getParent().show = false;
					this.show = false;
				}
			}
		});
		btn.addChild(text);
		mask.addChild(btn);
		
		
		this.gameOverLayer.addUI(mask);
		
		
		
		function nextLevel() {
			clearMemory();
			var index = levelList.indexOf(self.gameLevel);
			if(index===-1) return;
			if(index===levelList.length-1){
				alert('恭喜你！玩通关了！点击返回第一关！');
				window.location.href=window.location.pathname+'#'+levelList[0];
				window.location.reload();
				return;
			}
			window.location.href=window.location.pathname+'#'+levelList[index+1];
			window.location.reload();
		}
		
		function restart() {
			clearMemory();
			projectInit();
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
	
})(window.GameScene);