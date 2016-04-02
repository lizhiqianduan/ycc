##已实现的类（class/constructor）
###class Ycc.Node
```javascript
var node = new Ycc.Node();
console.log(node);
```
####Node Attribute
* node.style 节点的css样式

默认支持如下的一些样式

        // 位置及盒模型
        this.style.display = "block";
        this.style.position = "relative";
        this.style.top = 0;
        this.style.bottom = 0;
        this.style.left = 0;
        this.style.right = 0;

        // 高宽
        this.style.width = 0;
        this.style.height = 0;
        // 边框
        this.style.borderColor = "#000";
        this.style.borderTopWidth = 0;
        this.style.borderRightWidth = 0;
        this.style.borderBottomWidth = 0;
        this.style.borderLeftWidth = 0;
        // 内边距
        this.style.paddingTop = 0;
        this.style.paddingRight = 0;
        this.style.paddingBottom = 0;
        this.style.paddingLeft = 0;
        // 外边距
        this.style.marginTop = 0;
        this.style.marginRight = 0;
        this.style.marginBottom = 0;
        this.style.marginLeft = 0;
* node.layer 节点的层级
* node.node_id 节点的唯一标示
* node.tagName 节点的标签名

####Node Public Method
* node.add_child(node)  添加子节点
* node.del_child(child_id)  删除子节点
