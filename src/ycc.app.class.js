/**
 * Created by xiaohei on 2016/4/1.
 */
(function(Ycc) {
    var extend = Ycc.utils.extend;
    var deepClone = Ycc.utils.deepClone;
    var isString = Ycc.utils.isString;
    var isNum = Ycc.utils.isNum;
    var isObj = Ycc.utils.isObj;
    var isFn = Ycc.utils.isFn;
    var isArray = Ycc.utils.isArray;
    var isDot = Ycc.utils.isDot;
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

            Ycc.painter(ctx,ctx_width,ctx_height);
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
        Ycc.painter.render(node_attr_map);
    }



})(Ycc);