import YccLayer from './YccLayer.class'
import YccPolyfill from './YccPolyfill.class'
import YccStage from './YccStage.class'
import YccTicker from './YccTicker.class'
import YccUI from './YccUI.class'

export * from './YccMath'

export {
  YccLayer,
  YccStage,
  YccUI,
  YccTicker
}

/**
 * 整个Ycc应用的配置项
 */
interface YccConfig {

  /**
   * 整个应用所运行的环境 默认：h5 <br> h5-普通web应用、wxapp-微信小程序、wxgame-微信小游戏
   */
  appenv: 'h5' | 'wxapp' | 'wxgame'

  /**
   * 调试参数，是否显示所有UI的容纳区域
   */
  debugDrawContainer: boolean
}

export default class Ycc {
  /**
   * 初始配置
   */
  config: YccConfig
  /**
   * 数据状态
   */
  $state?: object

  /**
   * 舞台，唯一，一个`Ycc`对应一个`Stage`
   */
  stage: YccStage

  /**
   * 兼容模块，兼容wx和h5
   */
  polyfill: YccPolyfill

  constructor (config?: Partial<YccConfig>) {
    this.config = {
      appenv: config?.appenv ?? 'h5',
      debugDrawContainer: config?.debugDrawContainer ?? false
    }
    this.polyfill = new YccPolyfill(this)

    this.stage = new YccStage(this)
  }

  /**
   * 启动
   */
  bootstrap () {
    this.created()
  }

  /**
   * 应用的入口
   * @overwrite
   */
  created () {}

  /**
   * 渲染函数
   * @overwrite
   */
  render () {}
}
