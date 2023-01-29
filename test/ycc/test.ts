import YccUIText from '../../ycc/ui/YccUI.Text.class'
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
    new YccUI({
      name: '自定义UI',
      coordinates: [
        new YccMathDot(10, 10),
        new YccMathDot(200, 10),
        new YccMathDot(10, 200),
        new YccMathDot(10, 10)
      ]
    }).addToLayer(this.stage.defaultLayer)

    // 新建一个文本
    new YccUIText({
      value: 'sfsdfsdf',
      style: {
        fontSize: 16,
        color: 'red'
      }
    }).addToLayer(this.stage.defaultLayer)

    // 加入定时器
    new YccTicker(this).addFrameListener(frame => {
      this.render()
    }).start(60)

    this.render()
  }

  render () {
    // 先全部清空舞台
    // 注：条件允许的情况，可以只部分清空
    this.stage.clearStage()

    // 这里可以做点动画
    // 比如，改变一下UI的位置
    this.stage.getElementByName('自定义UI')!.props.belongTo!.position.x++
    this.stage.getElementByName('自定义UI')!.props.belongTo!.position.y++

    // 渲染函数，直接调用`renderAll`
    // 注：条件允许的情况，可以只部分render
    this.stage.renderAll()
  }
}

new App().bootstrap()
