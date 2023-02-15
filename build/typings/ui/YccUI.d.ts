/**
 * UI模块的基类，默认是个多边形
 */
import YccLayer from '../YccLayer';
import { YccMathDot, YccMathRect } from '../YccMath';
/**
  * UI的公用属性
  */
export interface YccUICommonProps {
    /**
      * UI的名称，尽量不要重复
      */
    name?: string;
    /**
       * UI所属的图层，若UI为加入图层，所有与绘制相关的方法将抛错
       */
    belongTo?: YccLayer;
    /**
           * 用户自定义的数据
           */
    userData?: any;
    /**
       * 锚点坐标，是一个相对坐标，默认为(0,0)，是`coordinates`的第一个点
       */
    anchor: YccMathDot;
    /**
       * 相对于锚点的旋转角度
       * @type {number}
       */
    rotation: number;
    /**
       * 多边形图形的容纳区，点坐标数组，为保证图形能够闭合，起点和终点必须相等
       */
    coordinates: YccMathDot[];
    /**
        * 经过缩放、旋转、平移后，UI在舞台的真实的坐标
        */
    worldCoordinates: YccMathDot[];
    /**
         * 是否显示
         * @type {boolean}
         */
    show: boolean;
    /**
         * 是否幽灵状态，默认false
         * 幽灵状态的UI：只能用于显示，不可点击，事件也不会触发，其子元素的事件也不会触发，不能通过getUIFromPointer获取
         * 用于解决多个UI重叠时是否需要穿透，以点击被覆盖UI的问题
         * @type {boolean}
         */
    ghost: boolean;
    /**
         * 默认情况下为true，UI阻止事件冒泡，但不会阻止事件传播给图层
         * @type {boolean}
         */
    stopEventBubbleUp: boolean;
    /**
         * 透明度 默认1
         * @type {number}
         */
    opacity: number;
    /**
          * 线条宽度 默认1
          * @type {number}
          */
    lineWidth: number;
    /**
          * 线条颜色，默认`black`
          * @type {string}
          */
    strokeStyle: string;
    /**
       * 是否填充，默认`true`
       */
    fill: boolean;
    /**
       * 填充样式，默认'black'
       */
    fillStyle: string;
}
/**
    * 多边形UI
    * 位置坐标x、y为只读属性，且为相对坐标，默认取多边形的第一个顶点坐标
    * @constructor
    * @param {Partial<PolygonUIProps>} option    所有可配置的配置项
    */
export default abstract class YccUI<YccUIProps extends YccUICommonProps = YccUICommonProps> {
    /**
      * UI的属性，默认属性在此设置
      */
    props: YccUIProps;
    /**
      * UI的构造函数
      * @param {Partial<YccUIProps>} option
      */
    constructor(option?: Partial<YccUIProps>);
    /**
     * 获取UI的默认属性，在初始化时会调用一次
     * @overwrite 需子类实现的方法
     */
    abstract getDefaultProps(): YccUIProps;
    /**
      * 初始化UI属性
      * @param option
      */
    private _extendOption;
    /**
      * 将此UI添加至图层
      * @param layer
      */
    addToStage(layer: YccLayer): this;
    /**
      * 判断UI是否可绘制
      * 存在`belongTo`且存在`coordinates`则认为此UI可绘制
      * @overwrite 若UI有特殊的渲染过程，则子类需重写此方法
      */
    isDrawable(): boolean;
    /**
      * 根据coordinates绘制路径
      * 只绘制路径，不填充、不描边
      * 此过程只会发生在图层的离屏canvas中
      */
    renderPath(): void;
    /**
      * 获取能容纳多边形的最小矩形框
      * @returns {YccMathRect}
      */
    getWorldContainer(): {
        worldCoordinates: YccMathDot[];
        worldRect: YccMathRect;
    } | undefined;
    /**
      * 重载基类的包含某个点的函数，用于点击事件等的响应
      * 两种方法：
      * 方法一：经过该点的水平射线与多边形的焦点数，即Ray-casting Algorithm
      * 方法二：某个点始终位于多边形逆时针向量的左侧、或者顺时针方向的右侧即可判断，算法名忘记了
      * 此方法采用方法一，并假设该射线平行于x轴，方向为x轴正方向
      * @param dot {Ycc.Math.Dot} 需要判断的点，绝对坐标（world坐标）
      * @param noneZeroMode {Number} 是否noneZeroMode 1--启用 2--关闭 默认启用
      *   从这个点引出一根“射线”，与多边形的任意若干条边相交，计数初始化为0，若相交处被多边形的边从左到右切过，计数+1，若相交处被多边形的边从右到左切过，计数-1，最后检查计数，如果是0，点在多边形外，如果非0，点在多边形内
      * @return {boolean}
      */
    isContainDot(dot: YccMathDot, noneZeroMode?: 1 | 2): boolean | undefined;
    /**
     * 获取绘图环境
     */
    getContext(): CanvasRenderingContext2D | undefined;
    /**
      * 渲染至离屏ctx
      * @overwrite 若UI有特殊的渲染过程，则此处的render方法需子类重写
      */
    abstract render(): void;
}
/**
 * 获取UI的通用属性
 */
export declare function getYccUICommonProps(): YccUICommonProps;
