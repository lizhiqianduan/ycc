import YccLayer from './YccLayer.class'
import Polyfill from './YccPolyfill.class'
import YccStage from './YccStage.class'

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
  config: YccConfig = {
    appenv: 'h5',
    debugDrawContainer: false
  }

  layerList: YccLayer[]
  stage: YccStage

  constructor (config?: Partial<YccConfig>) {
    this.config.appenv = config?.appenv ?? 'h5'
    this.config.debugDrawContainer = config?.debugDrawContainer ?? false

    	/**
	 * Layer对象数组。包含所有的图层
	 * @type {Array}
	 */
    this.layerList = []

    this.stage = new YccStage(this)
  }
}
