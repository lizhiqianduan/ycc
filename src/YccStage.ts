/**
 * 舞台类，一个Ycc应用有且仅有一个舞台，用于绘制
 * 舞台包含多个图层`Layer`
 */

import { getDpi, getSystemInfo } from './tools/common/utils'
import { YccMathDot } from './tools/math/index'
import { createCanvas } from './tools/polyfill/index'
import Ycc from './Ycc'
import YccLayer, { createLayer, getAllLayer } from './YccLayer'

export default interface YccStage {
  /**
   * Ycc的引用
   */
  yccInstance?: Ycc

  /**
   * 舞台的绘图容器Canvas
   */
  stageCanvas: HTMLCanvasElement

  /**
   * 舞台的绘图环境
   */
  stageCanvasCtx: CanvasRenderingContext2D

  /**
   * 舞台的默认图层
   */
  defaultLayer: YccLayer

  /**
   * 舞台的终端设备信息
   */
  stageInfo: ReturnType<typeof getSystemInfo>
}

/**
 * 创建一个舞台，并与ycc实例绑定
 * @param ycc
 * @returns
 */
export const createStage = () => {
  const stageInfo = getSystemInfo()
  // 舞台初始化
  const stageCanvas = createCanvasByStage(stageInfo)
  const stageCanvasCtx = stageCanvas.getContext('2d')!

  const stage: YccStage = {
    stageCanvas,
    stageCanvasCtx,
    stageInfo,
    defaultLayer: createLayer({ name: '舞台默认图层' })(stageInfo)
  }
  return { stage, bindYcc }

  function bindYcc (ycc: Ycc) {
    ycc.stage = stage
    stage.yccInstance = ycc
  }
}

/**
   * 根据舞台信息，创建一个覆盖全舞台的canvas
   */
export const createCanvasByStage = (stageInfo: YccStage['stageInfo']) => {
  return createCanvas({
    ...stageInfo
  })
}

/**
   * 根据ui的位置获取舞台上的ui
   * @param dot
   */
export const getElementByPointer = (dot: YccMathDot) => {
  const layers = getAllLayer()
  for (let index = layers.length - 1; index >= 0; index--) {
    const layer = layers[index]
    const uiList = layer.uiList
    for (let i = uiList.length - 1; i >= 0; i--) {
      const ui = uiList[i]

      if (ui.isContainDot(dot.dpi(getDpi()))) return ui
    }
  }
}

/**
* 根据ui的名称获取舞台上的ui
* @param name
* @returns
*/
export const getElementByName = function (name: string) {
  const layers = getAllLayer()
  for (let index = 0; index < layers.length; index++) {
    const layer = layers[index]
    const uiList = layer.uiList
    for (let i = 0; i < uiList.length; i++) {
      const ui = uiList[i]
      if (ui.props.name === name) return ui
    }
  }
}

/**
   * 清空舞台
   * @param withLayerCanvas 是否连带图层的canvas一起清空
   */
export const clearStage = (withLayerCanvas: boolean = true) => {
  return (stage: YccStage) => {
    const dpi = stage.stageInfo.dpi
    stage.stageCanvasCtx.clearRect(0, 0, stage.stageInfo.width * dpi, stage.stageInfo.height * dpi)
    if (withLayerCanvas) {
      getAllLayer().forEach(layer => {
        layer.ctx.clearRect(0, 0, stage.stageInfo.width * dpi, stage.stageInfo.height * dpi)
      })
    }
    return stage.yccInstance
  }
}

/**
   * 绘制所有图层的所有元素
   */
export const renderAll = (stage: YccStage) => {
  const { dpi } = stage.stageInfo
  // 遍历所有图层
  getAllLayer().forEach(layer => {
    layer.uiList.forEach(ui => {
      // 绘制背景
      ui.renderBg()
      // 将离屏图层绘制到舞台来
      // this.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi)
      ui.render()
      // debug 绘制锚点
      ui.renderAnchor()
      // console.log(ui, 11)
      // 将离屏图层绘制到舞台来
      // this.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi)
    })

    // 将离屏图层绘制到舞台来
    stage.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, stage.stageInfo.width * dpi, stage.stageInfo.height * dpi, 0, 0, stage.stageInfo.width * dpi, stage.stageInfo.height * dpi)
  })
}
