/**
 * 舞台类，一个Ycc应用有且仅有一个舞台，用于绘制
 * 舞台包含多个图层`Layer`
 */
import Ycc, { YccLayer } from './Ycc';
export default class YccStage {
    /**
     * Ycc的引用
     */
    yccInstance: Ycc;
    /**
     * 舞台的绘图环境
     */
    stageCanvas: HTMLCanvasElement;
    stageCanvasCtx: CanvasRenderingContext2D;
    /**
     * 舞台的默认图层
     */
    defaultLayer: YccLayer;
    /**
     * 舞台的终端设备信息
     */
    stageInfo: {
        width: number;
        height: number;
        dpi: number;
    };
    constructor(ycc: Ycc);
    /**
     * 清空舞台
     * @param withLayerCanvas 是否连带图层的canvas一起清空
     */
    clearStage(withLayerCanvas?: boolean): void;
    /**
     * 根据舞台信息，创建一个覆盖全舞台的canvas
     */
    createCanvasByStage(): HTMLCanvasElement;
    /**
     * 根据ui的名称获取舞台上的ui
     * @param name
     * @returns
     */
    getElementByName(name: string): import("./ui/YccUI").default<import("./ui/YccUI").YccUICommonProps> | undefined;
    /**
     *
     * @param dot
     * @param uiIsShow
     * @returns
     */
    /**
     * 获取系统信息：dpi、高、宽，等
     * @returns
     */
    getSystemInfo(): {
        width: number;
        height: number;
        dpi: number;
    };
    /**
     * 绘制所有图层的所有元素
     */
    renderAll(): void;
}
