import Ycc, { YccMathDot, YccTicker, YccUI } from '../../ycc/Ycc.class'

/**
 * 应用的状态
 */
interface AppState {
  testUI?: YccUI
}

/**
 * 新建应用
 */
class App extends Ycc {
  /**
   * 应用的状态
   */
  $state: AppState = { testUI: undefined }

  created () {
    // 加入到dom中
    document.getElementById('canvas')?.appendChild(this.stage.stageCanvas)

    // 新建一个UI
    this.$state.testUI = new YccUI({
      coordinates: [
        new YccMathDot(10, 10),
        new YccMathDot(200, 10),
        new YccMathDot(10, 200),
        new YccMathDot(10, 10)
      ]
    }).addToLayer(this.stage.defaultLayer)

    // 加入定时器
    new YccTicker(this).addFrameListener(frame => {
      this.render()
    }).start(60)
  }

  render () {
    // 先全部清空舞台
    this.stage.clearStage()

    // 这里可以做点动画
    // 比如，改变一下UI的位置
    this.$state.testUI!.props.belongTo!.position.x++
    this.$state.testUI!.props.belongTo!.position.y++

    // 渲染函数，直接调用`renderAll`
    this.stage.renderAll()
  }
}

new App().bootstrap()
