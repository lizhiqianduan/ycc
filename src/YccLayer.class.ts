import { YccMathDot } from './YccMath'
import { YccStage } from './Ycc.class'
import YccUI from './YccUI.class'

/**
 * 图层的外部属性
 */
interface LayerOpt {
  /**
   * 图层的名称
   */
  name: string
  /**
   * 图层的类型，默认为'ui'
   */
  type?: 'ui' | 'debug'

  /**
   * 是否允许帧动画事件的监听
   */
  enableFrameEvent: boolean
}

export default class YccLayer {
  /**
   * 相对于舞台的位置，以左上角为准
   */
  position = new YccMathDot()

  uiList: YccUI[]
  ctx: CanvasRenderingContext2D
  id: number
  type: 'ui' | 'debug'
  name: string

  show: boolean
  ghost: boolean
  enableEventManager: boolean
  enableFrameEvent: boolean
  onFrameComing: () => void
  stage: YccStage

  constructor (stage: YccStage, option?: LayerOpt) {
    /**
     * 图层所属的舞台
     */
    this.stage = stage

    /**
     * 存储图层中的所有UI。UI的顺序，即为图层中的渲染顺序。
     */
    this.uiList = []

    /**
     * 当前图层的绘图环境
     * @type {CanvasRenderingContext2D}
     */
    this.ctx = stage.createCanvasByStage().getContext('2d')!

    /**
     * 图层id
     */
    this.id = layerIndex++

    /**
     * 图层类型。
     * `ui`表示用于绘图的图层。`tool`表示辅助的工具图层。`text`表示文字图层。
     * 默认为`ui`。
     */
    this.type = 'ui'

    /**
     * 图层名称
     * @type {string}
     */
    this.name = ((option?.name) != null) ? option?.name : ('图层_' + this.type + '_' + this.id.toString())

    /**
     * 图层是否显示
     */
    this.show = true

    /**
     * 图层是否幽灵，幽灵状态的图层，getUIFromPointer 会直接跳过整个图层
     * @type {boolean}
     */
    this.ghost = false

    /**
     * 是否监听舞台的事件。用于控制舞台事件是否广播至图层。默认关闭
     * @type {boolean}
     */
    this.enableEventManager = false

    /**
     * 是否接收每帧更新的通知。默认为false
     * @type {boolean}
     */
    this.enableFrameEvent = false

    /**
     * 若接收通知，此函数为接收通知的回调函数。当且仅当enableFrameEvent为true时生效
     * @type {function}
     */
    this.onFrameComing = function () { }
  }

  /**
 * 添加一个UI图形至图层
 */
  addUI (ui: YccUI) {
    // 建立ui与layer的互相引用关系
    ui.props.belongTo = this
    this.uiList.push(ui)
    return ui
  }
}

// 图层的自增id
let layerIndex = 0
// 创建的所有图层
const layerList: YccLayer[] = []

/**
 * 创建一个图层
 * @param {YccStage} stage 舞台
 * @param opt
 */
export function createLayer (stage: YccStage, opt?: LayerOpt) {
  const layer = new YccLayer(stage, opt)
  layerList.push(layer)
  return layer
}

/**
   * 释放layer的内存，等待GC
   * 将所有引用属性置为null
   * @param layer
   */
export function releaseLayer (layer: YccLayer) {
  layer.uiList = []

  layer.show = false

  layer.enableEventManager = false

  layer.enableFrameEvent = false

  layer.onFrameComing = () => { }
}

/**
 * 获取所有已创建的图层
 * @returns
 */
export function getAllLayer () {
  return layerList
}
