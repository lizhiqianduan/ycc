/**
 * Created by xiaohei on 2016/4/2.
 */

(function (Ycc,utils){
    var extend = utils.extend;
    var isString = utils.isString;
    var isNum = utils.isNum;
    var isObj = utils.isObj;
    var isFn = utils.isFn;
    var isArray = utils.isArray;
    var isDot = utils.isDot;


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
    Ycc.painter.paint_bgColor_and_border = paint_bgColor_and_border;
    // 渲染所有节点
    Ycc.painter.render = render;



    /*
     * 画一个节点元素
     * */
    function paint_node(nodeAttr){
        switch (nodeAttr.tagName){
            case "div":
                paint_bgColor_and_border(nodeAttr);
                break;
            case "img":
                break;
            case "_innerText":

                break;
        }
    }

    /*
    * 根据节点的属性，将div画出来
    * */
    function paint_bgColor_and_border(nodeAttr){
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



        // 如果超出隐藏，那么绘制一个裁剪区
        (function(){
            var parent = nodeAttr.parent;
            if(!parent){
                return null;
            }
            var hold_rect = parent._hold_rect;
            var parent_style = parent.style;
            if(parent_style.overflow!="hidden"){
                console.log(parent.attrs);
                return null;
            }
            var x0 = hold_rect.left+parent_style.borderLeftWidth+parent_style.paddingLeft;
            var x1 = x0+parent_style.width;
            var y0 = hold_rect.top + parent_style.borderTopWidth+parent_style.paddingTop;
            var y1 = y0 + parent_style.height;
            ctx.beginPath();
            ctx.moveTo(x0,y0);
            ctx.lineTo(x0,y1);
            ctx.lineTo(x1,y1);
            ctx.lineTo(x1,y0);
            ctx.lineTo(x0,y0);
            ctx.closePath();
            //ctx.strokeStyle="yellow";
            //ctx.lineWidth=1;
            //ctx.stroke();
            ctx.clip();
        })();

        // 画边框
        paint_border(style,options);
        // 画背景
        paint_bg();


        //while(!parent || (parent && parent.style.overflow == "hidden")){
        //    var hold_rect = parent._hold_rect;
        //
        //    parent = parent.parent;
        //}


        function paint_bg(){
            if(style.backgroundColor){
                left_top_dot[0] = style.borderLeftWidth+nodeAttr._hold_rect.left;
                left_top_dot[1] = style.borderTopWidth+nodeAttr._hold_rect.top;
                right_bottom_dot[0] =left_top_dot[0] +  style.paddingLeft+style.paddingRight+style.width;
                right_bottom_dot[1] =left_top_dot[1] +  style.paddingTop+style.paddingBottom+style.height;
                options.fillStyle = style.backgroundColor;
                fill_rect(left_top_dot,right_bottom_dot,options);
            }
        }


        function paint_border(style,options){
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
            paint_bgColor_and_border(sorted[i]);

            switch (sorted[i].tagName){
                case "div":
                    break;
                case "img":
                    break;
                case "_innerText":
                    paint_textNode(sorted[i],node_attr_map);
                    break;
            }
        }
    }

    /*
    * 根据节点属性的layer将节点进行排序
    * 返回排序后的列表 使用了es5函数
    * todo:此处应该做一下排序
    * */
    function sort_node_attr_by_layer(node_attr_map){
        var root = node_attr_map["1"];

        var node_attr_list = [];
        var keys = Object.keys(node_attr_map).sort();
        for(var i=0;i<keys.length;i++){
            node_attr_list[i] = node_attr_map[keys[i]];
        }
        return node_attr_list;
    }

    /*
     * 由于文字当前环境的高宽并不能确定，所以在渲染的时候
     * */
    function paint_textNode(text_node,node_attr_map){
        //var parent = node_attr_map[text_node.parents[text_node.parents.length-1]];
        var parent = text_node.parent;
        var text = text_node._innerText;
        var parentStyle = parent.style;
        var parent_hold_rect = parent._hold_rect;
        var font_start_left = parent_hold_rect.left+parentStyle.borderLeftWidth+parentStyle.paddingLeft;
        var font_start_top = parent_hold_rect.top+parentStyle.borderTopWidth+parentStyle.paddingTop;

        console.log(parentStyle);
        var fontSize = parentStyle.fontSize;
        var fontFamily = parentStyle.fontFamily;
        var color  = parentStyle.color;
        ctx.font = fontSize+"px "+fontFamily;

        var curWidth = 0;
        for(var i=0;i<text.length;i++){
            var letter = text[i];
            var curLetterWidth = ctx.measureText(letter).width;
            if(curWidth+curLetterWidth>parentStyle.width){
                curWidth = 0;
                font_start_top += fontSize;
                font_start_left = parent_hold_rect.left+parentStyle.borderLeftWidth+parentStyle.paddingLeft;
            }

            fill_font(letter,{
                //文字的起点，默认left=0 top=0
                x:font_start_left,
                y:font_start_top,
                //文字大小和字体
                fontSize: fontSize,
                fontFamily:fontFamily,
                //描边颜色
                fillStyle: color
            });
            curWidth += curLetterWidth;
            font_start_left += curLetterWidth;
        }
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
            strokeStyle: "#000",
            fillStyle : "#000"
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
        ctx.fillStyle = Ycc.init.settings.canvasBg;
        ctx.fillRect(0, 0, ctx_width, ctx_height);
        ctx.restore();
    };








})(Ycc,Ycc.utils);