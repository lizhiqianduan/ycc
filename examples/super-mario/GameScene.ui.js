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
			// 摩擦力0
			friction:0
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
		
	};
	
	
	
	/**
	 * 新建一朵墙
	 * @param x			墙的起始位置
	 * @param height	这朵墙距离屏幕最下方的高度
	 */
	GameScene.prototype.newWall = function(x,height){
		var w=wallWidth,
			h=wallHeight;
		var y = stageH-height;
		var wall = new Ycc.UI.Image({
			rect:new Ycc.Math.Rect(x,y,w,h),
			res:images.wall,
			fillMode:'scale',
			name:'wall'
		});
		this.layer.addUI(wall);
		
		// 绑定至物理引擎
		var rect = wall.rect,ui = wall;
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
			isStatic:true,
			friction:0,
			frictionStatic:0,
			label:"wall",
			group:-1
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
	};
	
	/**
	 * 创建一堆墙
	 * @param x			起始x坐标
	 * @param row		行数
	 * @param col		列数
	 * @param height	最下一行距离屏幕最下方的高度
	 */
	GameScene.prototype.newWallSet = function (x,row, col, height) {
		for(var i=0;i<row;i++){
			var h = height-wallHeight*i;
			for(var j=0;j<col;j++){
				this.newWall(x+(wallWidth-j*5)*j,h);
			}
		}
		/*
		var self = this;
		//第一个物体在位置（50，100），共6列3行，每个物体为长50宽20的矩形所够成的物体堆
		var stack=Matter.Composites.stack(x,stageH-height,col,row,-5,0,function (x,y) {

			var wall = new Ycc.UI.Image({
				rect:new Ycc.Math.Rect(/!*x,stageH-height*!/x,y,wallWidth,wallHeight),
				res:images.wall,
				fillMode:'scale',
				name:'wall'
			});
			self.layer.addUI(wall);
			
			
			
			// 绑定至物理引擎
			var rect = wall.rect,ui = wall;
			var body = Matter.Bodies.rectangle(/!*rect.x+rect.width/2,rect.y+rect.height/2*!/x,y,rect.width,rect.height,{
				isStatic:true,
				friction:0,
				frictionStatic:0,
				label:"wall",
				group:-1
			});
			self.bindMatterBodyWithUI(body,ui);
			
			rect = null;ui=null;
			
			return body;
		});
		
		Matter.World.add(engine.world,stack);*/
		
	};

})(window.GameScene);