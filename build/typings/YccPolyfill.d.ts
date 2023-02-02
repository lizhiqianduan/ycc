/**
 * 此文件存储那些需要根据环境`ycc.appenv`兼容多个端的函数方法
 * 方法名全部小写
 */
import Ycc from './Ycc';
export default class YccPolyfill {
    /**
     * 应用的实例
     */
    yccInstance: Ycc;
    constructor(ycc: Ycc);
    /**
     *
     * @returns
     */
    _createImage(): HTMLImageElement;
    /**
   * 新创建canvas
   * @param options
   * @param options.width
   * @param options.height
   * @param options.dpi 像素比
   */
    createCanvas(options: {
        width: number;
        height: number;
        dpi?: number;
    }): HTMLCanvasElement;
}
