/**
 * Created by xiaohei on 2016/4/1.
 */
(function(Ycc) {
    var extend = Ycc.utils.extend;
    var isString = Ycc.utils.isString;
    var isNum = Ycc.utils.isNum;
    var isObj = Ycc.utils.isObj;
    var isFn = Ycc.utils.isFn;
    var isArray = Ycc.utils.isArray;
    var isDot = Ycc.utils.isDot;





    /*
     * constructor : ycc
     * */
    function ycc(ctx,ctx_width,ctx_height) {
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

    Ycc.App = ycc;
})(Ycc);