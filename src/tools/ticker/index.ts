import Ycc from '../../Ycc'
import { PipeOperation } from '../common/pipe'
import { isFn } from '../common/utils'
import { createFrame, YccFrame } from './frame'

/**
 * 系统心跳管理类。
 * 管理系统的心跳；自定义帧事件的广播；帧更新图层的更新等。
 *
 * 注：
 * 心跳间隔时间为1e3/60；
 * 无论帧率为多少，心跳间隔时间不变；
 * 总帧数<=总心跳次数；
 * 只有当总帧数*每帧的理论时间小于总心跳时间，帧的监听函数才会触发，以此来控制帧率；
 */
export interface YccTicker {
  /**
    * ticker绑定的Ycc对象
    * 在调用`bindYcc`之前此值为空
    */
  ycc?: Ycc
  /**
   * 当前帧
   */
  currentFrame?: YccFrame
  /**
   * 上一帧
   */
  lastFrame?: YccFrame

  /**
       * 启动时间戳
       * @type {number}
       */
  startTime: number

  //   lastFrameTime: number
  //   lastFrameTickerCount: number
  //   deltaTime: number
  //   deltaTimeExpect: number
  //   deltaTimeRatio: number
  frameListenerList: Array<(frame: YccFrame) => void>
  //   defaultFrameRate: number
  //   defaultDeltaTime: number
  //   tickerSpace: number
  /**
       * 总的帧数
       * @type {number}
       */
  frameAllCount: number
  /**
       * 总心跳次数，大于等于总帧数，因为可能丢帧
       * @type {number}
       */
  timerTickCount: number
  //   _timerId: number
  /**
   * 是否正在运行
   */
  isRunning: boolean

  /**
   * 定时器的ID
   */
  timerId: number

}

/**
 * 创建一个定时器
 * @returns
 */
export function createTicker () {
  const startTime = Date.now()

  const ticker: YccTicker = {
    startTime,
    frameListenerList: [],
    frameAllCount: 0,
    isRunning: false,
    timerTickCount: 0,
    timerId: -1
  }

  //   ticker.do()

  return { ticker, bindYcc }
  function bindYcc (ycc: Ycc) {
    ycc.$ticker = ticker
    ticker.ycc = ycc
  }
}

/**
 * 停止心跳
 */
export const stopTicker: PipeOperation<YccTicker, YccTicker> = function (ticker: YccTicker) {
  // 兼容wxapp处理
  let stop = ticker.ycc!.stage.stageCanvas.cancelAnimationFrame ? ticker.ycc!.stage.stageCanvas.cancelAnimationFrame : (cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame)
  stop || (stop = function (id: number) {
    clearTimeout(id)
  })
  stop(ticker.timerId)
  ticker.isRunning = false
  return ticker
}

/**
 * 添加帧的监听函数
 * @param listener
 * @returns
 */
export const addFrameListener = function (listener: (frame: YccFrame) => void): PipeOperation<YccTicker, YccTicker> {
  return function (ticker: YccTicker) {
    ticker.frameListenerList.push(listener)
    return ticker
  }
}
/**
 * 移除帧的监听函数
 * @param listener
 * @returns
 */
export const removeFrameListener = function (listener: (frame: YccFrame) => void): PipeOperation<YccTicker, YccTicker> {
  return function (ticker: YccTicker) {
    const index = ticker.frameListenerList.indexOf(listener)
    if (index !== -1) { ticker.frameListenerList.splice(index, 1) }
    return ticker
  }
}

/**
 * 启动心跳
 * @param ticker
 * @param frameRate
 * @returns
 */
export function startTicker (ticker: YccTicker, frameRate: number = 60) {
  const self = ticker
  if (self.isRunning) return self

  // 每帧之间的心跳间隔，默认为1
  const tickerSpace = parseInt(`${60 / frameRate}`) || 1
  // 每帧理论的间隔时间
  //  const deltaTimeExpect = 1000 / frameRate

  // 兼容wxapp处理
  let timer = ticker.ycc!.stage.stageCanvas.requestAnimationFrame ? ticker.ycc!.stage.stageCanvas.requestAnimationFrame : (requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame)

  // 启动时间
  self.startTime = Date.now()

  // timer兼容
  timer || (timer = function (callback: (curTime: number) => void) {
    return setTimeout(function () {
      callback(Date.now())
    }, 1e3 / 60)
  }
  )
  // 启动心跳
  ticker.timerId = timer(cb)
  self.isRunning = true
  return ticker

  // 心跳回调函数。约60fps
  function cb (curTime: number) {
    // 总的心跳数加1
    self.timerTickCount++
    if (self.timerTickCount - (self.lastFrame?.tickerCount ?? 0) === tickerSpace) {
      // 设置 总帧数加1
      self.frameAllCount++

      // 创建新的帧
      self.currentFrame = createFrame(self.lastFrame)
      self.currentFrame.deltaTime = curTime - (self.lastFrame?.createTime ?? 0)
      self.currentFrame.fps = frameRate
      self.currentFrame.frameCount = self.frameAllCount
      self.currentFrame.tickerCount = self.timerTickCount

      // 设置 帧间隔缩放比
      //   self.deltaTimeRatio = self.deltaTime / deltaTimeExpect
      // 设置 上一帧刷新时间
      //   self.lastFrameTime += self.deltaTime
      // 设置 上一帧刷新时的心跳数
      //   self.lastFrameTickerCount = self.timerTickCount

      // 执行所有自定义的帧监听函数
      _broadcastFrameEvent(self.currentFrame)
      // console.log(self)

      //  上一帧赋值
      self.lastFrame = self.currentFrame
    }

    // 递归调用心跳函数
    ticker.timerId = timer(cb)
  }

  function _broadcastFrameEvent (frame: YccFrame) {
    for (let i = 0; i < self.frameListenerList.length; i++) {
      const listener = self.frameListenerList[i]
      isFn(listener) && listener(frame)
    }
  }
}
