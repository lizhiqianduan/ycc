"# ycc" 
Ycc迷你Canvas框架
=========================
##框架的主要目标---使用Canvas编写高性能web应用
将一个json格式的数据格式的html节点，转换为Canvas中对应的元素。
假想示例：
```html
<!-- other code -->
<canvas id="can"></canvas>

<script src="ycc.min.js"></script>
<script>
var child01 = {
    id:111,
    style:{
        width:222,
        height:111,
        backgroundColor:"#ccc"
    },
    children:[]
}

var child02 = {
    id:222,
    style:{
        width:222,
        height:111,
        backgroundColor:"#000"
    },
    children:[]
}

var rootNode = {
    id:3333,
    style:{
        width:888,
        height:444,
        backgroundColor:#ccc
    },
    children:[111,222]
}

var can = document.getElementById("can");
var ctx = can.getContext("2d");
var ycc = new Ycc.App(ctx,can.width,can.height);
ycc.render([rootNode,child01,child02]);
</script>

<!-- other code -->
```
        目前项目处于开发过程中，如果你有兴趣、有想法，期待你的加入！
我的联系方式:lizhiqianduan@gmail.com <br>
我的个人网站:http://www.lizhiqianduan.com