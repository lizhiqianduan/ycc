import YccLayer from './YccLayer';
import YccPolyfill from './YccPolyfill';
import YccStage from './YccStage';
import YccTicker from './YccTicker';
export * from './YccMath';
export { YccLayer, YccStage, YccTicker };
/**
 * 整个Ycc应用的配置项
 */
interface YccConfig {
    /**
     * 整个应用所运行的环境 默认：h5 <br> h5-普通web应用、wxapp-微信小程序、wxgame-微信小游戏
     */
    appenv: 'h5' | 'wxapp' | 'wxgame';
    /**
     * 调试参数，是否显示所有UI的容纳区域
     */
    debugDrawContainer: boolean;
}
export default class Ycc {
    /**
     * 初始配置
     */
    config: YccConfig;
    /**
     * 数据状态
     */
    $state?: object;
    /**
     * 舞台，唯一，一个`Ycc`对应一个`Stage`
     */
    stage: YccStage;
    /**
     * 兼容模块，兼容wx和h5
     */
    polyfill: YccPolyfill;
    constructor(config?: Partial<YccConfig>);
    /**
     * 启动
     */
    bootstrap(): void;
    /**
     * 应用的入口
     * @overwrite
     */
    created(): void;
    /**
     * 渲染函数
     * @overwrite
     */
    render(): void;
}
