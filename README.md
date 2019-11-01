### Ycc迷你Canvas框架

#### 介绍

Ycc是一套迷你开源的`Canvas 2D`渲染引擎，它能很方便的帮助用户渲染出想要的UI图形。
引擎最初的设计灵感来源于`PhotoShop`，熟悉`PhotoShop`的朋友相对较容易上手。
在代码设计上，引擎借鉴了当前流行框架`cocos`、`egret`等的代码风格，熟悉这些框架的朋友也很容易上手。
另外，底层代码全部由`原生Javascript`编写，并且引擎不依赖任何第三方库，基础好的朋友还可以二次开发和扩展。

项目的`develop`分支处于开发阶段，欢迎大家Fork、Star，多几个star，多几分动力！

###### 兼容性

所有支持ES5的浏览器，包括微信小游戏。

#### 模块

主要模块：

图层：层级仅次于舞台的透明容器

UI：只能位于图层内的显示对象

事件：由舞台统一捕获再分发给图层和UI

心跳：支持控制帧率，丢帧警告

资源加载：支持加载图片、音频

调试器：支持UI容纳区绘制，帧率等自定义信息的打印

#### 安装

你可以下载项目的mater分支，然后在页面引入脚本
```
<script src="ycc.js" type="text/javascript"></script>
````
你也可以通过模块工具npm、bower来安装
```
bower install ycc-engine
npm install ycc-engine
```
#### 开始使用

下面是一个最简单的Ycc示例，若运行成功将在舞台中心显示文字`Hello Ycc!`

```javascript
// 新建舞台
var canvas = document.createElement("canvas");
canvas.width = 300;
canvas.height = 300;
document.body.appendChild(canvas);

// 新建ycc实例
var ycc = new Ycc().bindCanvas(canvas);
// 新建图层
var layer = ycc.layerManager.newLayer({enableEventManager:true});
// 添加至图层
layer.addUI(new Ycc.UI.MultiLineText({
	content:"Hello Ycc!",
	rect:new Ycc.Math.Rect(0,ycc.getStageHeight()/2,ycc.getStageWidth(),30),
	xAlign:'center'
}));

//	全部绘制
ycc.layerManager.reRenderAllLayerToStage();
```
几乎所有使用Ycc的项目都会经过如上这几个步骤：创建舞台->新建Ycc实例->新建图层->向图层添加UI->绘制。

在运行如上代码前，请确认页面已经引入了`ycc.js`文件。

#### 重要原则

1、UI在舞台的真实属性，只能先绘制后再获取。

2、所有UI都必须继承多边形类Polygon，而Polygon类继承自基类Base（v0.0.2及其之前的版本全都继承自Base），必要时UI可以覆盖父类的方法。

3、UI的x,y坐标表示UI的位置，但其值为相对坐标，相对于UI的父级，可以通过方法获取其绝对坐标。

4、UI的锚点坐标也是相对位置，同样也是相对于UI的父级。

#### 常用命令

##### 安装依赖
```
npm install
```
下载源码后，首先需要安装依赖，否则后续命令将会报错。
##### 启动源码监听
```
npm start
```
命令将监听src目录下的源码变化，并自动构建至build目录。
##### 打开示例
```
npm run example
```
命令会启动一个服务，监听7777端口，并自动打开浏览器访问示例。
##### 编译源码
```
npm run build
```
命令将编译src目录下的源码，并构建至build目录。
##### 构建API文档
```
npm run doc
```
命令将生成API文档，存入项目的docs目录。
##### 构建微信小游戏-超级玛丽
```
npm run build:game_super_mario
```
命令将为微信端生成一个小游戏至目录`/examples/wx-minigame/examples/game-super-mario`。

wx-minigame目录可以直接使用微信开发者工具打开、调试、构建、预览、绑定账号、上传等操作。

#### 示例

访问更多的示例，你可以直接点击[查看线上示例](http://www.lizhiqianduan.com/products/ycc/examples/)，或者下载Ycc模块后点击查看`/ycc/examples/index.html`。

#### 文档

你可以点击[查看线上文档](http://www.lizhiqianduan.com/products/ycc/docs/)，也可以下载Ycc模块后点击查看`/ycc/docs/index.html`

#### 案例

<center>
<img src='https://www.lizhiqianduan.com/wp-content/uploads/image/20191029/1572355723994593.png' width=200 height=200 />
微信小游戏-别踩白块
</center>

#### 需要注意的事

项目的`develop`分支一般都比`master`分支超前，如果你想要查看最新的代码，请下载`develop`分支的代码！

#### 联系方式
对于项目，如果有任何问题，有任何想法或者建议，你可以在github提交issue，或者可以通过如下方式联系到作者，期待大家的反馈。联系时请注明Ycc项目！

	工作邮箱:lizhiqianduan@lizhiqianduan.com
	个人网站:http://www.lizhiqianduan.com
	QQ交流群：439366057