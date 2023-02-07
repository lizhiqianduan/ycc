import PolygonUI from '@datagetter.cn/ycc/ui/PolygonUI'
import TextUI from '@datagetter.cn/ycc/ui/TextUI'
import Ycc from '@datagetter.cn/ycc/Ycc'
import { YccMathDot, YccMathRect } from '@datagetter.cn/ycc/tools/YccMath'
import YccTicker from '@datagetter.cn/ycc/tools/YccTicker'
import ImageUI from '@datagetter.cn/ycc/ui/ImageUI'
// import ImageUI from '@datagetter.cn/ycc/ui/ImageUI'

console.log(333)
/**
 * 新建应用
 */
export default class App extends Ycc {
  created () {
    // 加入到dom中
    document.getElementById('canvas')?.appendChild(this.stage.stageCanvas)

    // 新建一个UI
    new PolygonUI({
      name: '自定义UI',
      // rotation: 20,
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
      style: {
        fontSize: 16,
        color: 'red'
      }
    }).addToLayer(this.stage.defaultLayer)

    new ImageUI({
      name: 'test',
      fillMode: 'auto',
      rect: new YccMathRect(0, 0, 30, 30)
    }).addToLayer(this.stage.defaultLayer)

    // 加入定时器
    // new YccTicker(this).addFrameListener(frame => {
    //   this.render()
    // }).start(60)

    this.render()
  }

  render () {
    // 先全部清空舞台
    // 注：条件允许的情况，可以只部分清空
    this.stage.clearStage()

    // 这里可以做点动画
    // 比如，改变一下UI的位置
    // this.stage.defaultLayer.position.x++
    // this.stage.defaultLayer.position.y++

    // 渲染函数，直接调用`renderAll`
    // 注：条件允许的情况，可以只部分render
    this.stage.renderAll()
  }
}
