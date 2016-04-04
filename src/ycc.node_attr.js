/**
 * Created by xiaohei on 2016/4/3.
 * 用于处理node属性的模块
 */

(function(Ycc){
    Ycc.nodeAttr = function(){};

    var ctx_width = null;
    var ctx_height = null;



    Ycc.nodeAttr.init = init;
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
            var parent = parents[parents.length-1];
            if(!parent){
                // 没有parent，说明是根节点，跳过它的计算
                continue;
            }
            var be_hold_info = parent._be_hold_info;
            var parent_rect = parent._hold_rect;

            if(style.borderWidth){
                style.borderTopWidth = style.borderBottomWidth = style.borderLeftWidth=style.borderRightWidth = style.borderWidth;
            }
            if(style.padding){
                style.paddingLeft = style.paddingTop = style.paddingRight = style.paddingBottom = style.padding;
            }
            if(style.margin){
                style.marginLeft = style.marginTop = style.marginRight = style.marginBottom = style.margin;
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
                hold_rect.left = style.left+parent_rect.left+parent.style.paddingLeft+parent.style.borderLeftWidth;
                hold_rect.top = style.top + parent_rect.top+parent.style.borderTopWidth+parent.style.borderTopWidth;
                hold_rect.width = style.width + style.borderLeftWidth+style.borderRightWidth+style.paddingLeft+style.paddingRight;
                hold_rect.height = style.height + style.borderTopWidth+style.borderBottomWidth+style.paddingTop+style.paddingBottom;
                continue;
            }


            //**** 下面是默认的 relative 布局的情况    *****//
            // float为none的情况，分为block，inline，inline-block三类

            // float为none，display为block时，hold_rect占据canvas中的一行
            if(style.float == "none" && style.display == "block"){
                hold_rect.left = style.left+style.marginLeft;
                hold_rect.top = style.top+style.marginTop + be_hold_info.maxHeight;
                hold_rect.width = style.width + style.borderLeftWidth+style.borderRightWidth+style.paddingLeft+style.paddingRight;
                hold_rect.height = style.height + style.borderTopWidth+style.borderBottomWidth+style.paddingTop+style.paddingBottom;
                be_hold_info.maxHeight += style.marginTop+style.marginBottom+hold_rect.height;
                be_hold_info.left2right = 0;
                be_hold_info.right2left = 0;

                continue;
            }
            // float为none，display为inline时，hold_rect类似于左浮动
            if((style.float == "none" && style.display == "inline")
                ||(style.float == "left")){

                var restWidth = ctx_width-be_hold_info.left2right-be_hold_info.right2left;// todo
                hold_rect.left = be_hold_info.left2right+style.left+style.marginLeft;
                hold_rect.top = style.top+style.marginTop;
                hold_rect.width = style.width + style.borderLeftWidth+style.borderRightWidth+style.paddingLeft+style.paddingRight;
                hold_rect.height = style.height + style.borderTopWidth+style.borderBottomWidth+style.paddingTop+style.paddingBottom;

                // 盒子的外宽高
                var outWidth = hold_rect.width + style.marginLeft+style.marginRight;
                var outHeight = hold_rect.height + style.marginTop+style.marginBottom;
                // 如果浮动的一行，放不下当前元素，那么换行 todo:
                if(restWidth<hold_rect.width+style.marginLeft+style.marginRight){
                    // 记录上一行的最大高度
                    be_hold_info.lastMaxHeight = be_hold_info.maxHeight;
                    hold_rect.top = be_hold_info.lastMaxHeight+style.top+style.marginTop;
                    hold_rect.left = style.left+style.marginLeft;
                    be_hold_info.left2right = outWidth;
                    be_hold_info.right2left = 0;
                    be_hold_info.maxHeight = be_hold_info.lastMaxHeight+outHeight;
                }else{
                // 一行放得下的情况
                    be_hold_info.maxHeight = be_hold_info.lastMaxHeight+outHeight>be_hold_info.maxHeight?be_hold_info.lastMaxHeight+outHeight:be_hold_info.maxHeight;
//                    be_hold_info.maxHeight = style.marginTop+style.marginBottom+hold_rect.height;
                    be_hold_info.left2right += style.marginLeft+style.marginRight+hold_rect.width;
                    hold_rect.top = be_hold_info.lastMaxHeight+style.top+style.marginTop;

                }




                continue;
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


})(Ycc);