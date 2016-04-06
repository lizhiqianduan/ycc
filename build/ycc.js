/**
 * Created by xiaohei on 2016/4/2.
 */
var Ycc = window.Ycc = function(){};


Ycc.settings = {
    canvasBg: "#fff",
    font: "12px Arial",
    lineWidth: 1,
    strokeStyle: "#CC0000",
    fillStyle: "#CC0000"
};;/**
 * Created by xiaohei on 2016/4/1.
 */

(function(Ycc){
    Ycc.utils = {};

    // 继承
    Ycc.utils.inherits = function(FatherConstructor,SonConstructor){
        var that = this;
        function Son(){
            if(that.isFn(SonConstructor)){
                SonConstructor.call(this,"");
            }
            FatherConstructor.call(this,"");
        }

        Son.prototype = FatherConstructor.prototype;
        return Son;
    };


    //合并两个对象
    Ycc.utils.extend = function(target_obj, obj2,isDeepClone) {
        var newobj = {};
        if(isDeepClone)
            obj2 = deepClone(obj2);
        for (var i in target_obj) {
            newobj[i] = target_obj[i];
            if (obj2 && obj2[i] != null) {
                newobj[i] = obj2[i];
            }
        }
        return newobj;
    };

    Ycc.utils.isString = function(str) {
        return typeof(str) === "string";
    };

    Ycc.utils.isNum = function(str) {
        return typeof(str) === "number";

    };

    Ycc.utils.isObj = function(str) {
        return typeof(str) === "object";
    };

    Ycc.utils.isFn = function(str) {
        return typeof(str) == "function";
    };

    Ycc.utils.isArray = function(str) {
        return Object.prototype.toString.call(str) === '[object Array]';
    };

//检测是否是一个点[x,y]
    Ycc.utils.isDot = function(dot) {
        return this.isArray(dot) && dot.length==2;
    };

//检测是否是点列[[],[],...]
    Ycc.utils.isDotList = function(Dots) {
        if (Dots && (this.isArray(Dots))) {
            for (var i = 0; i < Dots.length; i++) {
                if (!this.isDot(Dots[i])) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }

    };
    /*
     * 两点对应坐标相加,维数不限
     * [1,2]+[3,4] = [4,6]
     *
     */
    Ycc.utils.dotAddDot = function(dot1, dot2) {
//        var isArray = this.isArray;
        if (!this.isArray(dot1) || !this.isArray(dot2)) {
            console.log('%c Function addOffset params wrong', 'color:red');
            return dot1;
        }
        if (dot1.length !== dot2.length) {
            console.log('%c Function addOffset params arr.length must equal offset.length', 'color:red');
            return dot1;
        }
        var tp = dot1.slice(0);
        for (var i = 0; i < dot2.length; i++) {
            tp[i] += dot2[i];
        }
        return tp;
    };

    /*
     * 将传入的点匹配到table表的坐标轴上
     * @param dots : 二维数组点列[[],[]...]
     * @param cellW : 单元格宽
     * @param cellH : 单元格高
     * return 一个新数组
     * */
    Ycc.utils.dotsMatchAxis = function(dots,cellW,cellH){
        var dots1 = dots.slice(0);
        for(var j = 0;j<dots.length;j++){
            dots1[j][0] *=cellW;
            dots1[j][1] *=cellH;
        }
        return dots1;
    };

    Ycc.utils.deepClone = deepClone;



    function deepClone(arrOrObj){
        return (isArr(arrOrObj))? deepCopy(arrOrObj):deepExtend(arrOrObj);

        function isObj(str) {
            return (typeof(str) === "object");
        }
        function isArr(str){
            return (Object.prototype.toString.call(str) === '[object Array]');
        }
        function deepExtend(obj){
            var tempObj = {};
            for(var i in obj){
                tempObj[i] = obj[i];
                if(isArr(obj[i])){
                    tempObj[i] = deepCopy(obj[i]);
                }else if(isObj(obj[i])){
                    tempObj[i] = deepExtend(obj[i]);
                }else{
                    tempObj[i] = obj[i];
                }
            }
            return tempObj;
        }
        function deepCopy(arr){
            var newArr = [];
            var v = null;
            for(var i=0;i<arr.length;i++){
                v = arr[i];
                if(isArr(v))
                    newArr.push(deepCopy(v));
                else if(isObj(v))
                    newArr.push(deepExtend(v));
                else{
                    newArr.push(v);
                }
            }
            return newArr;
        }
    }


})(Ycc);

;/**
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

    // 获取节点的属性
    Ycc.Node.get_node_attr = get_node_attr;
    // 获取节点列表的属性
    Ycc.Node.get_node_list_attr = get_node_list_attr;





    // constructor
    function Node(style){
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
        this.style.backgroundColor = "#fff";
        // 溢出处理
        this.style.overflow = null;
        this.style.overflowX = null;
        this.style.overflowY = "auto";

        if(utils.isObj(style))
            this.style = utils.extend(this.style,style);
    }

    var proto = Ycc.Node.prototype;

    // 标签名
    proto.tagName = "div";
    // 层级layer
    proto.layer = 1;
    // 每个节点的唯一标示
    proto.node_id = Math.random().toString(16).replace("0.",proto.layer+".");
    proto.add_child = add_child;
    proto.del_child = del_child;

    function getRoot(){
        var node = new Node();
//        node._be_hold_info = {};
        Ycc.Node.nodeList.push(node);
        Ycc.Node.nodeMap[node.node_id] = node;
        return node;
    }

    /*
    * 向节点添加子节点，只能先添加父节点，再添加子节点
    * */
    function add_child(node){
        node.layer = this.layer+1;
        node.node_id = Math.random().toString(16).replace("0.",node.layer+".");
        node.parents = this.parents.slice(0);
        node.parents.push(this.node_id);
        this.children.push(node.node_id);
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

})(Ycc,Ycc.utils);;/**
 * Created by xiaohei on 2016/4/3.
 * 用于处理node属性的模块
 */

(function(Ycc){
    Ycc.nodeAttr = function(){};

    var ctx_width = null;
    var ctx_height = null;



    Ycc.nodeAttr.init = init;

    // 计算节点所占据的物理像素区域，返回附加信息之后的nodeAttrMap
    Ycc.nodeAttr.compute_hold_rect = compute_hold_rect;



    function init(_ctx_width,_ctx_height){
        ctx_width = _ctx_width;
        ctx_height = _ctx_height;
    }



    function compute_hold_rect(nodeAttrMap){
        for(var node_id in nodeAttrMap){
            var attr = nodeAttrMap[node_id];
            var style = attr.style;
            var hold_rect = attr._hold_rect;
            var parents = getPatentsAttr(node_id,nodeAttrMap);
            // 最后一个父级元素即为节点的直接父级
            var parent = parents[parents.length-1];
            var be_hold_info = null;
            var parent_rect = null;
            if(!parent){
                // 没有parent，说明是根节点，跳过它的计算
                style.width = ctx_width;
                style.height = ctx_height;
                attr._hold_rect.height = ctx_height;
                continue;
            }else{
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
            if(style.overflow){
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
                    var parent = parents[i];
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

    /*
     * 根据节点id获取父级节点
     * */
    function getPatentsAttr(node_id,nodeAttrMap){
        var res = [];
        var parents = nodeAttrMap[node_id].parents;
        var len = parents.length;
        if(len>0){
            for(var i=0;i<len;i++){
                res.push(nodeAttrMap[parents[i]]);
            }
        }
        return res;
    }


})(Ycc);;/**
 * Created by xiaohei on 2016/4/2.
 */

(function (Ycc){
    var extend = Ycc.utils.extend;
    var isString = Ycc.utils.isString;
    var isNum = Ycc.utils.isNum;
    var isObj = Ycc.utils.isObj;
    var isFn = Ycc.utils.isFn;
    var isArray = Ycc.utils.isArray;
    var isDot = Ycc.utils.isDot;

    var utils = Ycc.utils;

    // app的引用
    var app = null;
    var ctx = null;
    var ctx_width = null;
    var ctx_height = null;


    // 初始化函数
    Ycc.painter = function(_ctx,_width,_height){
//        app = _app;
        ctx = _ctx;
        ctx_width = _width;
        ctx_height = _height;
    };

    Ycc.painter.stroke_line = stroke_line;

    Ycc.painter.stroke_font = stroke_font;
    Ycc.painter.fill_font = fill_font;

    Ycc.painter.stroke_circle = stroke_circle;
    Ycc.painter.fill_circle = fill_circle;

    Ycc.painter.stroke_rect = stroke_rect;
    Ycc.painter.fill_rect = fill_rect;

    Ycc.painter.draw_image = draw_image;

    Ycc.painter.clear = clear;

    // 画div
    Ycc.painter.paint_div = paint_div;
    // 渲染所有节点
    Ycc.painter.render = render;



    // 测试节点
    var test_node = new Ycc.Node({width:200,height:100,borderWidth:5});


    /*
     * 画一个节点元素
     * */
    function paint_node(nodeAttr){
        switch (nodeAttr.tagName){
            case "div":
                paint_div(nodeAttr);
                break;
            case "img":
                break;
        }
    }

    /*
    * 根据节点的属性，将div画出来
    * */
    function paint_div(nodeAttr){
        var style = nodeAttr.style;
        if(style.borderWidth){
            style.borderTopWidth = style.borderBottomWidth = style.borderLeftWidth=style.borderRightWidth = style.borderWidth;
        }
        if(style.borderColor){
            style.borderTopColor = style.borderBottomColor=style.borderLeftColor=style.borderRightColor=style.borderColor;
        }
        if(style.padding){
            style.paddingLeft = style.paddingTop = style.paddingRight = style.paddingBottom = style.padding;
        }
        var left_top_dot = [];
        var right_bottom_dot = [];
        var options = {};
        // 画背景
        left_top_dot[0] = style.borderLeftWidth+nodeAttr._hold_rect.left;
        left_top_dot[1] = style.borderTopWidth+nodeAttr._hold_rect.top;
        right_bottom_dot[0] =left_top_dot[0] +  style.paddingLeft+style.paddingRight+style.width;
        right_bottom_dot[1] =left_top_dot[1] +  style.paddingTop+style.paddingBottom+style.height;
        options.fillStyle = style.backgroundColor;
        fill_rect(left_top_dot,right_bottom_dot,options);

        // 画边框
        print_border(style,options);

        function print_border(style,options){
            if(style.borderWidth>0 && style.borderColor){
                left_top_dot[0] = style.borderLeftWidth/2+nodeAttr._hold_rect.left;
                left_top_dot[1] = style.borderTopWidth/2+nodeAttr._hold_rect.top;
                right_bottom_dot[0] = left_top_dot[0] +  style.paddingLeft+style.borderRightWidth+style.paddingRight+style.width;
                right_bottom_dot[1] = left_top_dot[1] +  style.paddingTop+style.borderBottomWidth+style.paddingBottom+style.height;
                options.lineWidth = style.borderWidth;
                options.strokeStyle = style.borderColor;
                stroke_rect(left_top_dot,right_bottom_dot,options);
            }else{
                var horizontal_length = style.width + style.paddingLeft + style.paddingRight;
                var vertical_length = style.height + style.paddingTop + style.paddingBottom;
                options.strokeStyle = style.borderTopColor;
                options.lineWidth = style.borderTopWidth;
                stroke_vh_line([nodeAttr._hold_rect.left,nodeAttr._hold_rect.top+style.borderTopWidth/2],horizontal_length+style.borderLeftWidth,true,options);
                options.lineWidth = style.borderLeftWidth;
                options.strokeStyle = style.borderLeftColor;
                stroke_vh_line([nodeAttr._hold_rect.left+style.borderLeftWidth/2,nodeAttr._hold_rect.top+style.borderTopWidth],vertical_length+style.borderBottomWidth,false,options);
                options.lineWidth = style.borderBottomWidth;
                options.strokeStyle = style.borderBottomColor;
                stroke_vh_line([nodeAttr._hold_rect.left+style.borderLeftWidth,nodeAttr._hold_rect.top+style.height+style.borderTopWidth+style.borderBottomWidth/2],horizontal_length+style.borderRightWidth,true,options);
                options.lineWidth = style.borderRightWidth;
                options.strokeStyle = style.borderRightColor;
                stroke_vh_line([nodeAttr._hold_rect.left+horizontal_length+style.borderLeftWidth+style.borderRightWidth/2,nodeAttr._hold_rect.top],vertical_length+style.borderTopWidth,false,options);


            }
        }
    }

    /*
    * 根据节点属性将一个图片绘制出来
    * */
    function paint_img(){

    }







    /*
    * 将节点属性列表在canvas中渲染出来
    *
    * */
    function render(node_attr_map){
        var sorted = sort_node_attr_by_layer(node_attr_map);
        for(var i=0;i<sorted.length;i++){
            switch (sorted[i].tagName){
                case "div":
                    paint_div(sorted[i]);
                    break;
                case "img":
                    break;
            }
        }
    }

    /*
    * 根据节点属性的layer将节点进行排序
    * 返回排序后的列表 使用了es5函数
    * */
    function sort_node_attr_by_layer(node_attr_map){
        var node_attr_list = [];
        var keys = Object.keys(node_attr_map).sort();
        for(var i=0;i<keys.length;i++){
            node_attr_list[i] = node_attr_map[keys[i]];
        }
        return node_attr_list;
    }











/*********************************** 下面是canvas基本操作 *********************************************/

    /*
     *文字描边
     @param con : string you want to draw
     @param settings : obj { 		//文字样式设置
     strokeStyle:xx
     font : css string
     startDot : array [x,y]       	//文字的左下角为[0,0],并不是左上角
     }
     */
    function stroke_font(con, settings) {
        if (!isString(con) && !isNum(con)) {
            console.log('%cFunction drawFont need param 1 to be string or number', 'color:red');
            return false;
        }

        ctx.save();
        var defaultSet = {
            //文字的起点，默认left=0 top=0
            x: 0,
            y:0,
            //水平0点靠左
            textAlign: "left",
            //竖直0点从bottom开始
            textBaseline: "top",
            //文字大小和字体
            fontSize: 16,

            fontFamily:"Arial",
            //绘制路径的线宽
            lineWidth: 1,
            //描边颜色
            strokeStyle: "#000"
        };
        settings = (settings && isObj(settings)) ? extend( defaultSet, settings) : defaultSet;
        var afterTransDot = [settings.x,settings.y];
        ctx.textAlign = settings.textAlign;
        ctx.textBaseline = settings.textBaseline;
        ctx.font = settings.fontSize+"px "+settings.fontFamily;
        ctx.strokeStyle = settings.strokeStyle;
        ctx.strokeText(con, afterTransDot[0], afterTransDot[1]);
        ctx.restore();
        return this;
    };

    /*
     *文字填充
     @param con : string you want to draw
     @param settings : obj { 		//文字样式设置
     fillStyle:xx
     font : css string
     startDot : array [x,y]       	//文字的左下角为[0,0],并不是左上角
     }
     */
    function fill_font(con, settings) {
        if (!isString(con) && !isNum(con)) {
            console.log('%cFunction drawFont need param 1 to be string or number', 'color:red');
            return false;
        }

        ctx.save();
        var defaultSet = {
            //文字的起点，默认left=0 top=0
            x:0,
            y:0,
            //水平0点靠左
            textAlign: "left",
            //竖直0点从bottom开始
            textBaseline: "top",
            //文字大小和字体
            fontSize: 16,

            fontFamily:"Arial",
            //绘制路径的线宽
            lineWidth: 1,
            //描边颜色
            strokeStyle: "#000"
        };
        settings = (settings && isObj(settings)) ? extend( defaultSet, settings) : defaultSet;
        var afterTransDot = [settings.x,settings.y];
        ctx.textAlign = settings.textAlign;
        ctx.textBaseline = settings.textBaseline;
        ctx.font = settings.fontSize+"px "+settings.fontFamily;
        ctx.fillStyle = settings.fillStyle;
        ctx.fillText(con, afterTransDot[0], afterTransDot[1]);
        ctx.restore();
        return this;
    };

    /*
     画直线
     @param dot1 : array [x,y]
     @lineSettingsObj : obj {strokeStyle:xx,lineWidth:xx}
     */
    function stroke_line(dot1, dot2, lineSettingsObj){
        ctx.save();
        var defaultSet = {
            //线条颜色
            strokeStyle:"#000",

            //线条宽度
            lineWidth:1
        };
        lineSettingsObj = extend(defaultSet,lineSettingsObj);
        //变换坐标
        var tpdot1 = (dot1);
        var tpdot2 = (dot2);

        ctx.beginPath();
        ctx.moveTo(tpdot1[0], tpdot1[1]);
        ctx.lineTo(tpdot2[0], tpdot2[1]);
        ctx.strokeStyle = lineSettingsObj.strokeStyle;
        ctx.lineWidth = lineSettingsObj.lineWidth;
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
        return this;
    };

    /*
    * 画横线/竖线
    * direction : true 横线   false 竖线
    * */
    function stroke_vh_line(startDot, length, direction,options){
        ctx.save();
        var defaultSet = {
            //线条颜色
            strokeStyle:"#000",

            //线条宽度
            lineWidth:0
        };
        options = extend(defaultSet,options);
        if(options.lineWidth==0){
            return this;
        }
        ctx.beginPath();
        ctx.moveTo(startDot[0], startDot[1]);
        if(direction)
            ctx.lineTo(startDot[0]+length, startDot[1]);
        else
            ctx.lineTo(startDot[0], startDot[1]+length);
        ctx.strokeStyle = options.strokeStyle;
        ctx.lineWidth = options.lineWidth;
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
        return this;
    };

    /*
     * 画一个空心圆
     * */
    function stroke_circle(options){
        var defaultSet = {
            x:10,
            y:10,
            startAngle:0,
            endAngle:360,
            // 顺时针还是逆时针
            direction:true,
            //半径
            radius:10,
            //边框颜色
            strokeStyle:"#000",
            // 起始点是否封闭
            close:false
        };
        var settings = extend(defaultSet, options);
        ctx.strokeStyle = settings.strokeStyle;
        ctx.save();
        ctx.beginPath();
        if(settings.close)
            ctx.moveTo(settings.x,settings.y);
        ctx.arc(
            settings.x,
            settings.y,
            settings.radius,
                settings.startAngle/180*Math.PI,
                settings.endAngle/180*Math.PI,
            settings.direction
        );
        if(settings.close)
            ctx.lineTo(settings.x,settings.y);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

    /*
     * 填充一个圆
     * */
    function fill_circle(options){
        var defaultSet = {
            x:10,
            y:10,
            startAngle:0,
            endAngle:360,
            // 顺时针还是逆时针
            direction:true,
            //半径
            radius:10,
            //填充颜色
            fillStyle:"#000",
            // 起始点是否封闭
            close:false
        };
        var settings = extend(defaultSet, options);
        ctx.strokeStyle = settings.strokeStyle;
        ctx.save();
        ctx.beginPath();
        if(!settings.close)
            ctx.moveTo(settings.x,settings.y);
        ctx.arc(
            settings.x,
            settings.y,
            settings.radius,
                settings.startAngle/180*Math.PI,
                settings.endAngle/180*Math.PI,
            settings.direction
        );
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    /*
     * 矩形描边
     * */
    function stroke_rect(left_top_dot,right_bottom_dot,options){
        var defaultSet = {
            //填充颜色
            strokeStyle:"#000",
            lineWidth:1
        };
        var settings = extend(defaultSet, options);
        ctx.strokeStyle = settings.strokeStyle;
        ctx.lineWidth = settings.lineWidth;
        ctx.save();
        ctx.beginPath();
        ctx.rect(left_top_dot[0],left_top_dot[1],right_bottom_dot[0]-left_top_dot[0],right_bottom_dot[1]-left_top_dot[1]);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

    /*
     * 矩形描边
     * */
    function fill_rect(left_top_dot,right_bottom_dot,options){
        var defaultSet = {
            //填充颜色
            fillStyle:"#000"
        };
        var settings = extend(defaultSet, options);
        ctx.fillStyle = settings.fillStyle;

        ctx.save();
        ctx.beginPath();
        ctx.rect(left_top_dot[0],left_top_dot[1],right_bottom_dot[0]-left_top_dot[0],right_bottom_dot[1]-left_top_dot[1]);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    /*
     * 将图片加入画布
     * */
    function draw_image(imagesrc,left_top_dot,options){
        var defaultSet = {
            onDrawed:function(){},
            width:0,
            height:0
        };
        var settings = extend(defaultSet, options);
        var img = new Image();
        img.src = imagesrc;

        img.onload = function(){
            var scaleX = 1;
            var scaleY = 1;
            if(settings.width && settings.height){
                scaleX = settings.width/img.width;
                scaleY = settings.height/img.height;
            }else if(settings.width && !settings.height){
                scaleX = scaleY = settings.width/img.width;
            }else if(!settings.width && settings.height){
                scaleX = scaleY = settings.height/img.height;
            }
            ctx.save();
            ctx.scale(scaleX,scaleY);
            ctx.beginPath();
            ctx.drawImage(img, left_top_dot[0]/scaleX, left_top_dot[1]/scaleY); // 设置对应的图像对象，以及它在画布上的位置
            ctx.closePath();
            ctx.restore();
            settings.onDrawed(img);
        }
    }

    function clear(){
        ctx.save();
        ctx.fillStyle = Ycc.settings.canvasBg;
        ctx.fillRect(0, 0, ctx_width, ctx_height);
        ctx.restore();
    };








})(Ycc);;/**
 * Created by xiaohei on 2016/4/1.
 */
(function(Ycc,utils,painter) {
    var extend = utils.extend;
    var deepClone = utils.deepClone;
    var isString = utils.isString;
    var isNum = utils.isNum;
    var isObj = utils.isObj;
    var isFn = utils.isFn;
    var isArray = utils.isArray;
    var isDot = utils.isDot;
    var _ctx = null;
    var _ctx_width = null;
    var _ctx_height = null;


    // 内部所有节点列表
    var cur_node_num = 0;
    var cur_node_attr_map = {};

    Ycc.App = App;
    Ycc.App.getNodeAttrById = getNodeAttrById;
    Ycc.App.getChildrenAttr = getChildrenAttr;
    Ycc.App.getPatentsAttr = getPatentsAttr;
    Ycc.App.getNodeAttrByTagName = getNodeAttrByTagName;
    Ycc.App.getNodeAttrById = getNodeAttrById;
    Ycc.App.getNodeAttrById = getNodeAttrById;
    Ycc.App.getPatentAttr = getPatentAttr;



    /*
     * constructor : ycc
     * */
    function App(ctx,ctx_width,ctx_height) {
        _ctx = ctx;
        _ctx_width = ctx_width;
        _ctx_height = ctx_height;
        if (!ctx || !ctx_width || !ctx_height) {
            console.log('%cCan not get the id', 'color:red');
            return false;
        }

        //初始化
        this.init = init;
        this.init();

        this.clear = function(){
            ctx.save();
            ctx.fillStyle = Ycc.settings.canvasBg;
            ctx.fillRect(0, 0, ctx_width, ctx_height);
            ctx.restore();
        };


        /*
         *返回文字在当前环境所占宽度
         */
        this.getTextW = function(text) {
            return ctx.measureText(text).width;
        };

        // 渲染
        this.render = render;



        /*
         * 应用初始化
         * */
        function init() {
            ctx.save();
            ctx.fillStyle = Ycc.settings.canvasBg;
            ctx.fillRect(0, 0, ctx_width, ctx_height);
            ctx.restore();

            painter(ctx,ctx_width,ctx_height);
        };
    }



    /*
    * 根据id获取节点属性
    * param isCopy : true/false default false,是否是新的拷贝
    * */
    function getNodeAttrById(node_id,isCopy){
        if(isCopy){
            return deepClone(cur_node_attr_map[node_id]);
        }
        return cur_node_attr_map[node_id];
    }

    /*
    * 获取子节点的属性
    * */
    function getChildrenAttr(node_id,isCopy){
        var res = [];
        var children = cur_node_attr_map[node_id].children;
        var len = children.length;
        if(len>0){
            for(var i=0;i<len;i++){
                isCopy?res.push(deepClone(cur_node_attr_map[children[i]])):res.push(cur_node_attr_map[children[i]]);
            }
        }
        return res;
    }

    /*
    * 根据节点id获取父级节点
    * */
    function getPatentsAttr(node_id,isCopy){
        var res = [];
        var parents = cur_node_attr_map[node_id].parents;
        var len = parents.length;
        if(len>0){
            for(var i=0;i<len;i++){
                isCopy?res.push(deepClone(cur_node_attr_map[parents[i]])):res.push(cur_node_attr_map[parents[i]]);
            }
        }
        return res;
    }
    /*
    * 获取节点的直接父节点
    * */
    function getPatentAttr(node_id,isCopy){
        var res = null;
        var parents = cur_node_attr_map[node_id].parents;
        var len = parents.length;
        if(len>0){
            res = isCopy?deepClone(parents[len-1]):parents[len-1];
        }
        return res;
    }

    /*
    * 根据tagName选取节点的属性
    * param isCopy : true/false default false,是否是新的拷贝
    * */
    function getNodeAttrByTagName(tagName,isCopy){
        var res = [];
        for(var nodeAttr in cur_node_attr_map){
            if(nodeAttr.tagName == tagName){
                isCopy?res.push(deepClone(nodeAttr)):res.push(nodeAttr);
            }
        }
        return res;
    }


    /*
    * 渲染节点列表
    * */
    function render(node_attr_map,node_num){
        cur_node_num = node_num;
        cur_node_attr_map = node_attr_map;
        painter.render(node_attr_map);
    }



})(Ycc,Ycc.utils,Ycc.painter);