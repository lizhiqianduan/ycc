/**
 * 舞台类，一个Ycc应用有且仅有一个舞台，用于绘制
 * 舞台包含多个图层`Layer`
 */

import Ycc, { YccLayer } from './Ycc.class'
import { createLayer, getAllLayer } from './YccLayer.class'

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

  clearStage () {
    this.stageCanvasCtx.clearRect(0, 0, this.stageInfo.width, this.stageInfo.height)
  }

  /**
   * 根据舞台信息，创建一个覆盖全舞台的canvas
   */
  createCanvasByStage () {
    return this.yccInstance.polyfill.createCanvas({
      ...this.stageInfo
    })
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
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      dpi: window.devicePixelRatio ?? 1
    }
  }

  /**
   * 绘制所有图层的所有元素
   */
  renderAll () {
    // 先清空舞台
    this.clearStage()
    // 遍历所有图层
    getAllLayer().forEach(layer => {
      layer.uiList.forEach(ui => {
        ui.render()
      })

      // 将离屏图层绘制到舞台来
      this.stageCanvasCtx.drawImage(layer.ctx.canvas, 0, 0, this.stageInfo.width, this.stageInfo.height, 0, 0, this.stageInfo.width, this.stageInfo.height)
    })
  }
}
