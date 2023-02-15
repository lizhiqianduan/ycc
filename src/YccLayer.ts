import { YccMathDot } from './tools/math/index'
import { YccStage } from './Ycc'
import YccUI from './ui/YccUI'
import { PipeOperation } from './tools/common/pipe'

/**
 * 图层的外部属性
 */
type LayerOpt = Partial<Pick<YccLayer, 'name' | 'show' | 'position' | 'type' | 'ghost'>>

export default interface YccLayer {
  /**
   * 相对于舞台的位置，以左上角为准
   * @attention 此坐标为实际的物理像素
   */
  position: YccMathDot

  uiList: YccUI[]
  /**
       * 当前图层的绘图环境
       * @type {CanvasRenderingContext2D}
       */
  ctx: CanvasRenderingContext2D
  id: number
  type: 'ui' | 'debug'
  name: string

  show: boolean
  ghost: boolean
  stage: YccStage
}

// 图层的自增id
let layerIndex = 0
// 创建的所有图层
const layerList: YccLayer[] = []

/**
 * 添加一个UI
 * @param ui UI
 * @returns
 */
export const addUI = function (ui: YccUI): PipeOperation<YccLayer, YccUI> {
  return function (layer: YccLayer) {
    layer.uiList.push(ui)
    return ui
  }
}

/**
 * 创建一个图层
 * @param {YccStage} stage 舞台
 * @param option
 */
export function createLayer (option?: LayerOpt) {
  return (stage: YccStage) => {
    const layer: YccLayer = {
      /**
       * 图层的位置
       */
      position: option?.position ?? new YccMathDot(0, 0),

      /**
       * 图层所属的舞台
       */
      stage,

      /**
       * 存储图层中的所有UI。UI的顺序，即为图层中的渲染顺序。
       */
      uiList: [],

      /**
       * 当前图层的绘图环境
       * @type {CanvasRenderingContext2D}
       */
      ctx: stage.createCanvasByStage().getContext('2d')!,

      /**
       * 图层id
       */
      id: layerIndex++,

      /**
       * 图层类型。
       * `ui`表示用于绘图的图层。`tool`表示辅助的工具图层。`text`表示文字图层。
       * 默认为`ui`。
       */
      type: option?.type ?? 'ui',

      /**
       * 图层名称
       * @type {string}
       */
      name: option?.name ?? ('图层_' + 'ui' + '_' + layerIndex.toString()),

      /**
       * 图层是否显示
       */
      show: option?.show ?? true,

      /**
       * 图层是否幽灵，幽灵状态的图层，getElementFromPointer 会直接跳过整个图层
       * @type {boolean}
       */
      ghost: option?.show ?? true

    }
    layerList.push(layer)
    return layer
  }
}

/**
   * 释放layer的内存，等待GC
   * 将所有引用属性置为null
   * @param layer
   */
export function releaseLayer (layer: YccLayer) {
  layer.uiList = []

  layer.show = false
  layer.ghost = true
}

/**
 * 获取所有已创建的图层
 * @returns
 */
export function getAllLayer () {
  return layerList
}
