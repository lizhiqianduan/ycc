import { YccMathDot } from './YccMath';
import { YccStage } from './Ycc';
import YccUI from './ui/YccUI';
/**
 * 图层的外部属性
 */
interface LayerOpt {
    /**
     * 图层的名称
     */
    name: string;
    /**
     * 图层的类型，默认为'ui'
     */
    type?: 'ui' | 'debug';
    /**
     * 是否允许帧动画事件的监听
     */
    enableFrameEvent: boolean;
}
export default class YccLayer {
    /**
     * 相对于舞台的位置，以左上角为准
     */
    position: YccMathDot;
    uiList: YccUI[];
    ctx: CanvasRenderingContext2D;
    id: number;
    type: 'ui' | 'debug';
    name: string;
    show: boolean;
    ghost: boolean;
    enableEventManager: boolean;
    enableFrameEvent: boolean;
    onFrameComing: () => void;
    stage: YccStage;
    constructor(stage: YccStage, option?: LayerOpt);
    /**
   * 添加一个UI图形至图层
   */
    addUI(ui: YccUI): YccUI<import("./ui/YccUI").YccUICommonProps>;
}
/**
 * 创建一个图层
 * @param {YccStage} stage 舞台
 * @param opt
 */
export declare function createLayer(stage: YccStage, opt?: LayerOpt): YccLayer;
/**
   * 释放layer的内存，等待GC
   * 将所有引用属性置为null
   * @param layer
   */
export declare function releaseLayer(layer: YccLayer): void;
/**
 * 获取所有已创建的图层
 * @returns
 */
export declare function getAllLayer(): YccLayer[];
export {};
