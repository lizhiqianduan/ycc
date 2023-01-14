
export default class YccStage {
  canvasDom: HTMLCanvasElement
  ctx: CanvasRenderingContext2D | null

  constructor (canvasDom: HTMLCanvasElement) {
    this.canvasDom = canvasDom
    this.ctx = canvasDom.getContext('2d')
  }

  getStageWidth () {
    return this.canvasDom.width
  }

  getStageHeight () {
    return this.canvasDom.height
  }

  clearStage () {
    this.ctx?.clearRect(0, 0, this.getStageWidth(), this.getStageHeight())
  }

  getUIFromPointer (dot, uiIsShow) {
    const self = this
    uiIsShow = Ycc.utils.isBoolean(uiIsShow) ? uiIsShow : true
    // 从最末一个图层开始寻找
    for (let j = self.layerList.length - 1; j >= 0; j--) {
      const layer = self.layerList[j]
      // 幽灵图层，直接跳过
      if (layer.ghost) continue
      if (uiIsShow && !layer.show) continue
      const ui = layer.getUIFromPointer(dot, uiIsShow)
      if (ui) { return ui }
    }
    return null
  }
}
