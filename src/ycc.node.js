/**
 * Created by xiaohei on 2016/4/2.
 * 此文件应该放置在server端
 */

(function(Ycc,utils){
    Ycc.Node = Node;

    // 节点列表
    Ycc.Node.nodeList = [];
    // 节点map
    Ycc.Node.nodeMap = {};

    Ycc.Node.getRoot = getRoot;
    Ycc.Node.init = init;
    Ycc.Node.createNode = createNode;
    Ycc.Node.createTextNode = createTextNode;
    // 获取节点的属性
    Ycc.Node.get_node_attr = get_node_attr;
    // 获取节点列表的属性
    Ycc.Node.get_node_list_attr = get_node_list_attr;
    Ycc.Node.compute_hold_rect = compute_hold_rect;

    // 当前绘图环境
    var ctx = {};

    // root节点
    var root = new Node({},{id:"root"});
    root.node_id = 1;
    Ycc.Node.nodeList.push(root);
    Ycc.Node.nodeMap[root.node_id] = root;


    // constructor
    function Node(style,attrs){
        // 父节点默认为根
        this.parent = root;
        // 祖先元素的node_id列表
        this.parents = [];
        // 子节点node_id列表
        this.children = [];
        // 节点在canvas中实际所占据的位置信息，该属性是私有信息，不应该被更改
        this._hold_rect = {left:0,top:0,width:0,height:0};
        // 节点被子元素占据的相关信息，私有信息，不应该被更改
        this._be_hold_info = {
            // 上一行的maxHeight
            lastMaxHeight:0,
            // 最下边元素所占据的相对当前node节点的位置
            // 应该包括margin
            maxHeight:0,
            // 从左至右元素所占据的相对当前node节点的位置
            // 应该包括margin
            left2right:0,
            // 从右至左元素所占据的位置，应该包括margin
            right2left:0
        };

        // 文字节点的文字
        this._innerText = null;

        // 节点属性
        this.attrs = {};
        this.attrs.id = "";
        this.attrs.class = '';

        // 样式
        this.style = {};
        // 位置及盒模型
        this.style.display = "block";
        this.style.float = "none";
        this.style.position = "absolute";
        this.style.top = 0;
        this.style.bottom = 0;
        this.style.left = 0;
        this.style.right = 0;

        // 高宽
        this.style.width = 0;
        this.style.height = 0;
        // 边框
        this.style.borderColor = "#000";
        this.style.borderWidth = 0;
        this.style.borderTopWidth = 0;
        this.style.borderRightWidth = 0;
        this.style.borderBottomWidth = 0;
        this.style.borderLeftWidth = 0;
        // 内边距
        this.style.padding = 0;
        this.style.paddingTop = 0;
        this.style.paddingRight = 0;
        this.style.paddingBottom = 0;
        this.style.paddingLeft = 0;
        // 外边距
        this.style.margin = 0;
        this.style.marginTop = 0;
        this.style.marginRight = 0;
        this.style.marginBottom = 0;
        this.style.marginLeft = 0;
        // 背景色
        this.style.backgroundColor = null; // "#fff/red/gradient"
        // 文字
        this.style.fontSize = 16;
        this.style.color = "#000";
        this.style.fontFamily = "Arial";

        // 溢出处理
        this.style.overflow = "";
        this.style.overflowX = "";
        this.style.overflowY = "auto";

        if(utils.isObj(style))
            this.style = utils.extend(this.style,style);
        if(utils.isObj(attrs))
            this.attrs = utils.extend(this.attrs,attrs);

        // 标签名
        this.tagName = "div";
        // 层级layer
        this.layer = 1;
        // 每个节点的唯一标示
        this.node_id = Math.random().toString(16).replace("0.",this.layer+".");
    }


    var proto = Ycc.Node.prototype;

    proto.add_child = add_child;
    proto.del_child = del_child;

    function getRoot(){
        return root;
    }

    /*
    * 向节点添加子节点，只能先添加父节点，再添加子节点
    * */
    function add_child(node){
        node.layer = this.layer+1;
        node.node_id = Math.random().toString(16).replace("0.",node.layer+".");

        node.parent = this;
        node.parents = this.parents.slice(0);
        node.parents.push(this);
        this.children.push(node);

        Ycc.Node.nodeList.push(node);
        Ycc.Node.nodeMap[node.node_id] = node;
    }

    function del_child(child_id){
        var index = this.children.indexOf(child_id);
        this.children.splice(index,1);

        Ycc.Node.nodeMap[child_id] = null;
        delete Ycc.Node.nodeMap[child_id];
        Ycc.Node.nodeList = [];
        for(var node in Ycc.Node.nodeMap){
            Ycc.Node.nodeList.push(node);
        }
    }


    // 获取所有属性值，转为json
    function get_node_attr(node){
        var json = {};
        var attr_num = 0;
        for(var attr in node){
            if(!utils.isFn(attr)){
                attr_num++;
                json[attr] = node[attr];
            }
        }
        if(attr_num==0){
            json = null;
        }
        return json;
    }

    // 获取创建的所有节点属性
    function get_node_list_attr(){
        var arr = [];
        for(var i=0;i<Ycc.Node.nodeList.length;i++){
            arr.push(Ycc.Node.nodeList[i]);
        }
        return arr;
    }

    /*
    * exports function
    * 创建节点
    * 需要三个参数  tagName,style,attrs
    * 或者两个参数  style,attrs
    * 或者一个参数  style
    * */
    function createNode(){
        var tagName = "div";
        var style = null;
        var attrs = null;
        if(arguments.length==2){
            style = utils.deepClone(arguments[0]);
            attrs = utils.deepClone(arguments[1]);
        }else if(arguments.length==3){
            tagName = arguments[0];
            style = utils.deepClone(arguments[1]);
            attrs = utils.deepClone(arguments[2]);
        }else if(arguments.length==1){
            style = utils.deepClone(arguments[0]);
        }

        var node = new Node();
        node.tagName = tagName;
        if(utils.isObj(style))
            node.style = utils.extend(node.style,style);
        if(utils.isObj(attrs))
            node.attrs = utils.extend(node.attrs,attrs);
        return node;
    }

    /*
    * exports function
    * 创建一个文字节点
    * */
    function createTextNode(text){
        var node = new Node();
        node.tagName = "_innerText";
        node._innerText = text;
        node.display = "inline";
        return node;
    }

    /*
    * 模块初始化函数
    * */
    function init(_ctx){
        //ctx.canvas.width =
        ctx = _ctx;
    }



    /*
     * 某节点在计算之前的预处理
     * */
    function before_compute(node,parent){
        var tagName = node.tagName;
        var style = node.style;

        // 重置img的一些特性
        if(tagName == "img"){
            style.padding = 0;
        }else if(tagName == "_innerText"){
            // 重置文字节点的一些特性
            style.padding = 0;
            style.margin = 0;
            style.border = 0;
        }
    }

    /*
     * 计算节点在画布中的实际占据的位置信息
     * */
    function compute_hold_rect(nodeAttrMap){
        for(var node_id in nodeAttrMap){
            var attr = nodeAttrMap[node_id];
            var style = attr.style;
            var hold_rect = attr._hold_rect;
            var parents = attr.parents;
            // 最后一个父级元素即为节点的直接父级
            var parent = attr.parent;
            var be_hold_info = null;
            var parent_rect = null;
            if(!parent){
                // 没有parent，说明是根节点，跳过它的计算
                style.width = ctx.canvas.width;
                style.height = ctx.canvas.height;
                attr._hold_rect.height = ctx.canvas.height;
                continue;
            }else{
                before_compute(attr,parent);
                be_hold_info = parent._be_hold_info;
                parent_rect = parent._hold_rect;
            }
//            be_hold_info = parent._be_hold_info;
//            parent_rect = parent._hold_rect;
            if(style.borderWidth){
                style.borderTopWidth = style.borderBottomWidth = style.borderLeftWidth=style.borderRightWidth = style.borderWidth;
            }
            if(style.padding){
                style.paddingLeft = style.paddingTop = style.paddingRight = style.paddingBottom = style.padding;
            }
            if(style.margin){
                style.marginLeft = style.marginTop = style.marginRight = style.marginBottom = style.margin;
            }
            if(style.overflow !=""){
                style.overflowX = style.overflowY = style.overflow;
            }

            // fixed 布局的情况
            // float失效，margin失效，只看left、top
            if(style.position == "fixed"){
                hold_rect.left = style.left;
                hold_rect.top = style.top;
                hold_rect.width = style.width + style.borderLeftWidth+style.borderRightWidth+style.paddingLeft+style.paddingRight;
                hold_rect.height = style.height + style.borderTopWidth+style.borderBottomWidth+style.paddingTop+style.paddingBottom;
                continue;
            }

            // absolute 布局的情况，
            // float失效，margin失效，只看left、top
            // 并且根据父节点的位置来确定
            if(style.position == "absolute"){
                hold_rect.left = style.left+parent_rect.left+parent.style.paddingLeft+parent.style.borderLeftWidth+style.marginLeft;
                hold_rect.top = style.top + parent_rect.top+parent.style.paddingTop+parent.style.borderTopWidth+style.marginTop;
//                hold_rect.left = style.left+parent_rect.left+parent.style.paddingLeft+parent.style.borderLeftWidth;
//                hold_rect.top = style.top + parent_rect.top+parent.style.borderTopWidth+parent.style.borderTopWidth;
                hold_rect.width = style.width + style.borderLeftWidth+style.borderRightWidth+style.paddingLeft+style.paddingRight;
                hold_rect.height = style.height + style.borderTopWidth+style.borderBottomWidth+style.paddingTop+style.paddingBottom;
                continue;
            }


            //**** 下面是默认的 relative 布局的情况    *****//
            // float为none的情况，分为block，inline，inline-block三类

            var restWidth = null;
            var outWidth = null;
            var outHeight = null;
            // float为none，display为block时，hold_rect占据canvas中的一行
            if(style.float == "none" && style.display == "block"){
                hold_rect.left = style.left+style.marginLeft+parent_rect.left+parent.style.paddingLeft+parent.style.borderLeftWidth;
                hold_rect.top = style.top+style.marginTop + be_hold_info.maxHeight+ parent_rect.top+parent.style.paddingTop+parent.style.borderTopWidth;
                hold_rect.width = style.width + style.borderLeftWidth+style.borderRightWidth+style.paddingLeft+style.paddingRight;
                hold_rect.height = style.height + style.borderTopWidth+style.borderBottomWidth+style.paddingTop+style.paddingBottom;
                be_hold_info.maxHeight += style.marginTop+style.marginBottom+hold_rect.height;
                be_hold_info.left2right = 0;
                be_hold_info.right2left = 0;

            }else if((style.float == "none" && style.display == "inline")
                ||(style.float == "left")){
                // float为none，display为inline时，hold_rect类似于左浮动

                restWidth = parent.style.width-be_hold_info.left2right-be_hold_info.right2left;
//                restWidth = ctx_width-be_hold_info.left2right-be_hold_info.right2left;
                hold_rect.left = be_hold_info.left2right+style.left+style.marginLeft+parent_rect.left+parent.style.borderLeftWidth+parent.style.paddingLeft;
//                hold_rect.left = be_hold_info.left2right+style.left+style.marginLeft;
                hold_rect.top = style.top+style.marginTop;
                hold_rect.width = style.width + style.borderLeftWidth+style.borderRightWidth+style.paddingLeft+style.paddingRight;
                hold_rect.height = style.height + style.borderTopWidth+style.borderBottomWidth+style.paddingTop+style.paddingBottom;

                // 盒子的外宽高
                outWidth = hold_rect.width + style.marginLeft+style.marginRight;
                outHeight = hold_rect.height + style.marginTop+style.marginBottom;
                // 如果浮动的一行，放不下当前元素，那么换行
                if(restWidth<hold_rect.width+style.marginLeft+style.marginRight){
                    // 记录上一行的最大高度
                    be_hold_info.lastMaxHeight = be_hold_info.maxHeight;
                    hold_rect.top = be_hold_info.lastMaxHeight+style.top+style.marginTop+parent_rect.top+parent.style.borderTopWidth+parent.style.paddingTop;
                    hold_rect.left = style.left+style.marginLeft+parent_rect.left+parent.style.borderLeftWidth+parent.style.paddingLeft;
                    be_hold_info.left2right = outWidth;
                    be_hold_info.right2left = 0;
                    be_hold_info.maxHeight = be_hold_info.lastMaxHeight+outHeight;
                }else{
                    // 一行放得下的情况
                    be_hold_info.maxHeight = be_hold_info.lastMaxHeight+outHeight>be_hold_info.maxHeight?be_hold_info.lastMaxHeight+outHeight:be_hold_info.maxHeight;
//                    be_hold_info.maxHeight = style.marginTop+style.marginBottom+hold_rect.height;
                    be_hold_info.left2right += style.marginLeft+style.marginRight+hold_rect.width;
                    hold_rect.top = be_hold_info.lastMaxHeight+style.top+style.marginTop+parent_rect.top+parent.style.borderTopWidth+parent.style.paddingTop;

                }
            }else if(style.float == "right"){
                // 节点向右浮动的情况
                restWidth = parent.style.width-be_hold_info.left2right-be_hold_info.right2left;

                hold_rect.width = style.width + style.borderLeftWidth+style.borderRightWidth+style.paddingLeft+style.paddingRight;
                hold_rect.height = style.height + style.borderTopWidth+style.borderBottomWidth+style.paddingTop+style.paddingBottom;
                hold_rect.left = be_hold_info.right2left+style.marginRight+hold_rect.width;
                hold_rect.top = style.top+style.marginTop;

                // 盒子的外宽高
                outWidth = hold_rect.width + style.marginLeft+style.marginRight;
                outHeight = hold_rect.height + style.marginTop+style.marginBottom;
                // 如果浮动的一行，放不下当前元素，那么换行
                if(restWidth<hold_rect.width+style.marginLeft+style.marginRight){
                    // 记录上一行的最大高度
                    be_hold_info.lastMaxHeight = be_hold_info.maxHeight;
                    hold_rect.top = be_hold_info.lastMaxHeight+style.top+style.marginTop    +parent_rect.top+parent.style.borderTopWidth+parent.style.paddingTop;
                    hold_rect.left = parent.style.width      +parent_rect.left+parent.style.borderLeftWidth+parent.style.paddingLeft     -(outWidth-style.marginLeft);
                    be_hold_info.right2left = outWidth;
                    be_hold_info.left2right = 0;
                    be_hold_info.maxHeight = be_hold_info.lastMaxHeight+outHeight;

                }else{
                    // 一行放得下的情况
                    be_hold_info.maxHeight = be_hold_info.lastMaxHeight+outHeight>be_hold_info.maxHeight?be_hold_info.lastMaxHeight+outHeight:be_hold_info.maxHeight;
                    hold_rect.top = be_hold_info.lastMaxHeight+style.top+style.marginTop   +parent_rect.top+parent.style.borderTopWidth+parent.style.paddingTop;
                    hold_rect.left = parent.style.width      +parent_rect.left+parent.style.borderLeftWidth+parent.style.paddingLeft     -(be_hold_info.right2left+outWidth-style.marginLeft);
                    be_hold_info.right2left += outWidth;
                }
            }

            if(parent.style.overflowY =="auto"){
                // 需要调整其所有父节点的高度
                for(var i=parents.length-1;i>-1;i--){
                    parent = parents[i];
                    var grand_parent = parents[i-1];
                    if(parent._be_hold_info.maxHeight>parent.style.height){
                        var increase = parent._be_hold_info.maxHeight - parent.style.height;
                        parent.style.height = be_hold_info.maxHeight;
                        parent._hold_rect.height+=increase;
                        if(grand_parent && grand_parent.style.overflowY=="auto"){
                            var new_max_height = grand_parent._be_hold_info.lastMaxHeight+parent._hold_rect.height+parent.style.marginTop+parent.style.marginBottom;
                            if(new_max_height>grand_parent._be_hold_info.maxHeight){
                                grand_parent._hold_rect.height+=new_max_height-grand_parent._be_hold_info.maxHeight;
                                grand_parent._be_hold_info.maxHeight = new_max_height;
                            }
                        }
                    }
                }

            }
        }
        return nodeAttrMap;
    }

})(Ycc,Ycc.utils);