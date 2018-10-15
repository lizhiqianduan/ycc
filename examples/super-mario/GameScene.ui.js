/**
 * @file    GameScene.ui.js.js
 * @author  xiaohei
 * @date    2018/10/15
 * @description  GameScene.ui.js文件
 */



(function(GameScene){
	
	// 一朵墙高宽
	var wallWidth 	= 60;
	var wallHeight 	= 20;
	
	
	
	
	/**
	 * 创建路面
	 * @param startX 	路面的起点
	 * @param width		路面宽度（长）
	 * @param height	路面距离屏幕最下方的高度
	 */
	GameScene.prototype.newGround = function (startX,width,height) {
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
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
			friction:0,
			frictionStatic:0,
			frictionAir:0,
			restitution:0,
			label:"Mario"
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
	};
	
	
})(window.GameScene);