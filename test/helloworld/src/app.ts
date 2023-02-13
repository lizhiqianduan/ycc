// import PolygonUI from '@datagetter.cn/ycc/ui/PolygonUI'
import TextUI from '@datagetter.cn/ycc/ui/TextUI'
import Ycc from '@datagetter.cn/ycc/Ycc'
import { YccMathDot, YccMathRect } from '@datagetter.cn/ycc/tools/YccMath'
import YccTicker from '@datagetter.cn/ycc/tools/YccTicker'
import ImageUI from '@datagetter.cn/ycc/ui/ImageUI'
import LineUI from '@datagetter.cn/ycc/ui/LineUI'
import PolygonUI from '@datagetter.cn/ycc/ui/PolygonUI'
// import LineUI from '@datagetter.cn/ycc/ui/LineUI'
// import ImageUI from '@datagetter.cn/ycc/ui/ImageUI'

/**
 * 新建应用
 */
export default class App extends Ycc {
  created () {
    // 加入到dom中
    document.getElementById('canvas')?.appendChild(this.stage.stageCanvas)
    new LineUI({
      dots: [
        new YccMathDot(10, 10),
        new YccMathDot(100, 100)
      ]
    }).addToLayer(this.stage.defaultLayer)

    // 新建一个UI
    new PolygonUI({
      name: 'TestPolygon',
      anchor: new YccMathDot(200, 200),
      coordinates: [
        new YccMathDot(0, 0),
        new YccMathDot(200, 0),
        new YccMathDot(0, 200),
        new YccMathDot(0, 0)
      ]
    }).addToLayer(this.stage.defaultLayer)

    // 新建一个文本
    new TextUI({
      value: 'sfsdfsdf',
      anchor: new YccMathDot(200, 10),
      style: {
        fontSize: 16,
        color: 'red'
      }
    }).addToLayer(this.stage.defaultLayer)

    new ImageUI({
      name: 'TestImage',
      anchor: new YccMathDot(50, 50),
      // rotation: 30,
      mirror: 1,
      resName: 'radius',
      fillMode: 'scale9Grid',
      scale9GridRect: new YccMathRect(30, 30, 128 - 30 * 2, 128 - 30 * 2),
      rect: new YccMathRect(-10, -30, 180, 180)
    }).addToLayer(this.stage.defaultLayer)

    const frameText = new TextUI({
      value: ''
    }).addToLayer(this.stage.defaultLayer)

    // 加入定时器
    const ticker = new YccTicker(this)
    ticker.addFrameListener(frame => {
      frameText.props.value = `${frame.deltaTime.toFixed(2)}ms 平均：${((Date.now() - ticker.startTime) / frame.frameCount).toFixed(2)}ms  绘制尺寸：${this.stage.stageCanvas.width}*${this.stage.stageCanvas.height}px dpi：${this.stage.stageInfo.dpi}`
      this.render()
    }).start(60)

    this.render()
    this.eventListener()
  }

  // 舞台事件监听
  eventListener () {
    this.gesture.events.tap = e => {
      const ui = this.stage.getElementByPointer(e.data.position)
      console.log('点击ui：', ui)
    }
  }

  render () {
    // 先全部清空舞台
    // 注：条件允许的情况，可以只部分清空
    this.stage.clearStage()

    // 这里可以做点动画
    // 比如，改变一下UI的位置
    const TestImage = this.stage.getElementByName('TestImage')
    TestImage!.props.rotation++

    // 渲染函数，直接调用`renderAll`
    // 注：条件允许的情况，可以只部分render
    this.stage.renderAll()
  }
}
