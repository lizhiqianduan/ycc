// import PolygonUI from '@datagetter.cn/ycc/ui/PolygonUI'
import TextUI from '@datagetter.cn/ycc/ui/TextUI'
import Ycc, { createApp } from '@datagetter.cn/ycc/Ycc'
import { YccMathDot, YccMathRect } from '@datagetter.cn/ycc/tools/math/index'
import ImageUI from '@datagetter.cn/ycc/ui/ImageUI'
import LineUI from '@datagetter.cn/ycc/ui/LineUI'
import PolygonUI from '@datagetter.cn/ycc/ui/PolygonUI'
import { createLayer } from '@datagetter.cn/ycc/YccLayer'
import { addFrameListener, startTicker } from '@datagetter.cn/ycc/tools/ticker/index'
import { clearStage, getElementByName, renderAll, getElementByPointer } from '@datagetter.cn/ycc/YccStage'
import { LoaderResult, ParallelLoader, Resource } from '@datagetter.cn/ycc/tools/loader/index'
import { YccFrame } from '@datagetter.cn/ycc/tools/ticker/frame'

/**
 * 启动函数
 * @param resources
 */
export function setup (resources: LoaderResult) {
  // 创建实例
  const ycc = createApp(resources)

  // 初始化UI
  initUI(ycc)

  // 监听事件
  eventListener(ycc)

  // 渲染
  tickerRender(ycc)
}

/**
 * 加载资源
 * @param cb
 */
export function loadResources (cb: (res: LoaderResult) => void) {
  // 定义资源
  const resources = [
    {
      name: 'test',
      type: 'image',
      url: 'https://smartedu.jnei.cn/upload/files/upload/ce155375-3dc3-479e-b4d4-8690cc906d40_WechatIMG15%402x.a69e9004.png',
      crossOrigin: '*'
    } as Resource,
    {
      name: 'radius',
      type: 'image',
      url: 'https://bpic.588ku.com/element_origin_min_pic/01/01/71/9556f3fa9fc2b12.jpg',
      crossOrigin: '*'
    } as Resource
  ]

  new ParallelLoader(resources).load((result) => {
    console.log('资源加载结束', resources, result)
    // setup(result)
    cb(result)
  })
}

function tickerRender (ycc: Ycc) {
  addFrameListener(frame => {
    // console.log(frame)
    render(frame)
  })(ycc.$ticker)
  startTicker(ycc.$ticker, 30)

  function render (frame: YccFrame) {
    // 先全部清空舞台
    // 注：条件允许的情况，可以只部分清空
    clearStage()(ycc.stage)

    // 这里可以做点动画
    // 比如，改变一下UI的位置
    const TestImage = getElementByName('TestImage')!
    TestImage.props.rotation++

    // 比如，打印一下当前的帧率
    const DebugUI = getElementByName('debug')! as TextUI
    DebugUI.props.value = `帧间隔：${frame.deltaTime.toFixed(2)}ms 平均：${((Date.now() - ycc.$ticker.startTime) / ycc.$ticker.frameAllCount).toFixed(2)} 心跳数：${ycc.$ticker.timerTickCount} 帧数：${ycc.$ticker.frameAllCount}`

    // 渲染函数，直接调用`renderAll`
    // 注：条件允许的情况，可以只部分render
    renderAll(ycc.stage)
  }
}

// 舞台事件监听
function eventListener (ycc: Ycc) {
  ycc.$gesture.events.tap = e => {
    const ui = getElementByPointer(e.data.position)
    console.log('点击ui：', ui)
  }

  ycc.$gesture.events.dragend = e => {
    console.log('dragend：', e)
  }
  ycc.$gesture.events.dragging = e => {
    // console.log('dragging：', e)
    (getElementByName('line01')! as LineUI).props.dots = e.data.life.moveTouchEventList.map(item => new YccMathDot(item.triggerTouch.pageX, item.triggerTouch.pageY))
  }
  ycc.$gesture.events.dragstart = e => {
    console.log('dragstart：', e)
  }
}

function initUI (ycc: Ycc) {
  const stage = ycc.stage
  document.getElementById('canvas')?.appendChild(stage.stageCanvas)

  const dpi = stage.stageInfo.dpi
  const layer = {
    test1: createLayer({ name: 't1' })(stage.stageInfo),
    test2: createLayer({ name: 't2' })(stage.stageInfo)
  }
  new LineUI({
    name: 'line01',
    dots: [
      new YccMathDot(10, 10),
      new YccMathDot(100, 100)
    ]
  }).addToStage(stage, stage.defaultLayer)

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
  }).addToStage(stage, layer.test1)

  // 新建一个文本
  new TextUI({
    value: 'sfsdfsdf',
    anchor: new YccMathDot(200, 10),
    style: {
      fontSize: 16,
      color: 'red'
    }
  }).addToStage(stage, layer.test2)

  new ImageUI({
    name: 'TestImage',
    anchor: new YccMathDot(50, 50),
    // rotation: 30,
    mirror: 1,
    resName: 'radius',
    fillMode: 'scale9Grid',
    scale9GridRect: new YccMathRect(30, 30, 256 / dpi - 30 * 2, 256 / dpi - 30 * 2),
    rect: new YccMathRect(-10, -30, 180, 180)
  }).addToStage(stage, stage.defaultLayer)

  new TextUI({
    name: 'debug',
    value: '',
    style: {
      fontSize: 12
    }
  }).addToStage(stage, stage.defaultLayer)
}
