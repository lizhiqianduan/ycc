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
	 * @param height	路面高度
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
		this.bindMatterBodyWithUI(Matter.Bodies.rectangle(rect.x+rect.width/2,rect.y+rect.height/2,rect.width,rect.height,{
			isStatic:true,
			friction:0,
			label:"wall"
		}),ui);
		Matter.World.add(engine.world,this.getMatterBodyFromUI(ui));
		rect = null;ui=null;
	};

})(window.GameScene);