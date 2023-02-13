import YccGesture from './tools/YccGesture'
import { LoaderResult } from './tools/YccLoader'
import YccLayer from './YccLayer'
import YccStage from './YccStage'

export {
  YccLayer,
  YccStage
}

/**
 * 整个Ycc应用的配置项
 */
export interface YccConfig {
  /**
   * 整个应用所运行的环境 默认：h5 <br> h5-普通web应用、wxapp-微信小程序、wxgame-微信小游戏
   */
  appenv: 'h5' | 'wxapp' | 'wxgame'

  /**
   * 调试参数，是否显示所有UI的容纳区域
   */
  debugDrawContainer?: boolean
}

export default class Ycc {
  /**
   * 启动参数
   */
  $config!: YccConfig
  /**
   * 数据状态
   */
  $state?: object

  /**
   * 加载的资源
   */
  $resouces!: LoaderResult

  /**
   * 舞台，唯一，一个`Ycc`对应一个`Stage`
   */
  stage: YccStage

  gesture: YccGesture

  constructor (config?: Partial<YccConfig>) {
    const defaultConfig: YccConfig = {
      appenv: 'h5',
      debugDrawContainer: false
    }
    this.$config = Object.assign(defaultConfig, config)

    // 舞台初始化
    this.stage = new YccStage(this)

    // 手势库的支持
    this.gesture = new YccGesture({ target: this.stage.stageCanvas, useMulti: true })
  }

  /**
   * 启动
   * @param {Resource[]} resources 已加载完成的资源
   */
  bootstrap (resources: LoaderResult) {
    this.$resouces = resources
    this.created()
  }

  /**
   * 根据资源名称获取资源
   * @param resName
   */
  getRes (resName: string) {
    const res = this.$resouces.resMap[resName]
    return res
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
