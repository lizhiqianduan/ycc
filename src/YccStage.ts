/**
 * 舞台类，一个Ycc应用有且仅有一个舞台，用于绘制
 * 舞台包含多个图层`Layer`
 */

import { YccMathDot } from './tools/YccMath'
import { createCanvas } from './tools/YccPolyfill'
import Ycc, { YccLayer } from './Ycc'
import { createLayer, getAllLayer } from './YccLayer'

export default class YccStage {
  /**
   * Ycc的引用
   */
  yccInstance: Ycc

  /**
   * 舞台的绘图环境
   */
  stageCanvas: HTMLCanvasElement
  stageCanvasCtx: CanvasRenderingContext2D

  /**
   * 舞台的默认图层
   */
  defaultLayer: YccLayer

  /**
   * 舞台的终端设备信息
   */
  stageInfo = this.getSystemInfo()

  constructor (ycc: Ycc) {
    this.yccInstance = ycc

    // 舞台初始化
    this.stageCanvas = this.createCanvasByStage()
    this.stageCanvasCtx = this.stageCanvas.getContext('2d')!

    // 初始化默认图层
    this.defaultLayer = createLayer(this, { name: '舞台默认图层', enableFrameEvent: true })
  }

  /**
   * 清空舞台
   * @param withLayerCanvas 是否连带图层的canvas一起清空
   */
  clearStage (withLayerCanvas: boolean = true) {
    const dpi = this.stageInfo.dpi
    this.stageCanvasCtx.clearRect(0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi)
    if (withLayerCanvas) {
      getAllLayer().forEach(layer => {
        layer.ctx.clearRect(0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi)
      })
    }
  }

  /**
   * 根据舞台信息，创建一个覆盖全舞台的canvas
   */
  createCanvasByStage () {
    return createCanvas({
      ...this.stageInfo
    })
  }

  /**
   * 根据ui的位置获取舞台上的ui
   * @param dot
   */
  getElementByPointer (dot: YccMathDot) {
    const layers = getAllLayer()
    for (let index = 0; index < layers.length; index++) {
      const layer = layers[index]
      const uiList = layer.uiList
      for (let i = 0; i < uiList.length; i++) {
        const ui = uiList[i]

        if (ui.isContainDot(dot.dpi(ui.getDpi()))) return ui
      }
    }
  }

  /**
   * 根据ui的名称获取舞台上的ui
   * @param name
   * @returns
   */
  getElementByName (name: string) {
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
   *
   * @param dot
   * @param uiIsShow
   * @returns
   */
  // getUIFromPointer (dot: YccMathDot, uiIsShow: boolean) {
  //   const self = this.ycc
  //   uiIsShow = isBoolean(uiIsShow) ? uiIsShow : true
  //   // 从最末一个图层开始寻找
  //   for (let j = self.layerList.length - 1; j >= 0; j--) {
  //     const layer = self.layerList[j]
  //     // 幽灵图层，直接跳过
  //     if (layer.ghost) continue
  //     if (uiIsShow && !layer.show) continue
  //     const ui = layer.getUIFromPointer(dot, uiIsShow)
  //     if (ui) { return ui }
  //   }
  //   return null
  // }

  /**
   * 获取系统信息：dpi、高、宽，等
   * @returns
   */
  getSystemInfo () {
    const dpi = window.devicePixelRatio ?? 1
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      dpi,
      renderWidth: window.innerWidth * dpi,
      renderHeight: window.innerWidth * dpi
    }
  }

  /**
   * 绘制所有图层的所有元素
   */
  renderAll () {
    const { dpi } = this.stageInfo
    // 遍历所有图层
    getAllLayer().forEach(layer => {
      layer.uiList.forEach(ui => {
        // 绘制背景
        ui.renderBg()
        // 将离屏图层绘制到舞台来
        this.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi)
        ui.render()
        // debug 绘制锚点
        ui.renderAnchor()
        // 将离屏图层绘制到舞台来
        this.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi)
      })

      // 将离屏图层绘制到舞台来
      this.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi, 0, 0, this.stageInfo.width * dpi, this.stageInfo.height * dpi)
    })
  }
}
