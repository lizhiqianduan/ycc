/**
 * Created by xiaohei on 2016/4/1.
 * 功能说明：
 *  整个程序公用的基础工具模块
 *
 * 依赖模块Ycc.init
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

    Ycc.utils.deepClone = function(arrOrObj){
        
        return (Ycc.utils.isArray(arrOrObj))? deepCopy(arrOrObj):deepExtend(arrOrObj);
        function deepExtend(obj){
            var tempObj = {};
            for(var i in obj){
                tempObj[i] = obj[i];
                if(Ycc.utils.isArray(obj[i])){
                    tempObj[i] = deepCopy(obj[i]);
                }else if(Ycc.utils.isObj(obj[i])){
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
                if(Ycc.utils.isArray(v))
                    newArr.push(deepCopy(v));
                else if(Ycc.utils.isObj(v))
                    newArr.push(deepExtend(v));
                else{
                    newArr.push(v);
                }
            }
            return newArr;
        }
    }


})(Ycc);

