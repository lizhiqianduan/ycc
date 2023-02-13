import Ycc from '../Ycc'
import { isFn } from './YccUtils'

/**
 * 帧 私有类
 * @constructor
 * @param ticker {Ycc.Ticker}
 */
export class Frame {
  createTime: number
  deltaTime: number
  fps: number
  frameCount: number
  isRendered: boolean

  constructor (ticker: YccTicker) {
    /**
     * 帧创建时间
     * @type {number}
     */
    this.createTime = Date.now()

    /**
       * 与上一帧的时间差
       * @type {number}
       */
    this.deltaTime = ticker.deltaTime

    /**
       * 实时帧率
       * @type {number}
       */
    this.fps = parseInt(`${1000 / this.deltaTime}`)

    /**
       * 帧下标，表示第几帧
       * @type {number}
       */
    this.frameCount = ticker.frameAllCount

    /**
       * 当前帧是否已全部绘制，ticker回调函数可根据此字段判断
       * 以此避免一帧内的重复绘制
       * @type {boolean}
       */
    this.isRendered = false
  }
}

/**
 * 系统心跳管理类。
 * 管理系统的心跳；自定义帧事件的广播；帧更新图层的更新等。
 *
 * 注：
 * 心跳间隔时间为1e3/60；
 * 无论帧率为多少，心跳间隔时间不变；
 * 总帧数<=总心跳次数；
 * 只有当总帧数*每帧的理论时间小于总心跳时间，帧的监听函数才会触发，以此来控制帧率；
 *
 * @param yccInstance
 * @constructor
 */
export default class YccTicker {
  yccInstance: Ycc
  currentFrame?: Frame
  startTime: number
  lastFrameTime: number
  lastFrameTickerCount: number
  deltaTime: number
  deltaTimeExpect: number
  deltaTimeRatio: number
  frameListenerList: Array<(frame: Frame) => void>
  defaultFrameRate: number
  defaultDeltaTime: number
  tickerSpace: number
  frameAllCount: number
  timerTickCount: number
  _timerId: number
  _isRunning: boolean

  constructor (yccInstance: Ycc) {
    /**
   * ycc实例的引用
   * @type {Ycc}
   */
    this.yccInstance = yccInstance

    /**
       * 当前帧
       * @type {Frame}
       */
    this.currentFrame = undefined

    /**
       * 启动时间戳
       * @type {number}
       */
    this.startTime = Date.now()

    /**
       * 上一帧刷新的时间戳
       * @type {number}
       */
    this.lastFrameTime = this.startTime

    /**
       * 上一帧刷新时的心跳数
       * @type {number}
       */
    this.lastFrameTickerCount = 0

    /**
       * 当前帧与上一帧的刷新的时间差
       * @type {number}
       */
    this.deltaTime = 0

    /**
       * 当前帧与上一帧时间差的期望值（根据帧率计算而来的）
       * @type {number}
       */
    this.deltaTimeExpect = 0

    /**
       * 实际帧间隔与期望帧间隔的时间比
       * @type {number}
       */
    this.deltaTimeRatio = 1

    /**
       * 所有自定义的帧监听函数列表
       * @type {function[]}
       */
    this.frameListenerList = []

    /**
       * 默认帧率
       * @type {number}
       */
    this.defaultFrameRate = 60

    /**
       * 默认帧间隔
       * @type {number}
       */
    this.defaultDeltaTime = 1e3 / this.defaultFrameRate

    /**
       * 每帧之间间隔的心跳数
       * @type {number}
       */
    this.tickerSpace = 1

    /**
       * 总帧数
       * @type {number}
       */
    this.frameAllCount = 0

    /**
       * 总心跳次数
       * @type {number}
       */
    this.timerTickCount = 0

    /**
       * 定时器ID。用于停止心跳。
       * @type {number}
       * @private
       */
    this._timerId = 0

    /**
       * 心跳是否已经启动
       * @type {boolean}
       * @private
       */
    this._isRunning = false
  }

  /**
     * 定时器开始
     * @param [frameRate] 心跳频率，即帧率
     * 可取值有[60,30,20,15]
     */
  start (frameRate: number) {
    // 兼容wxapp处理
    let timer = this.yccInstance.stage.stageCanvas.requestAnimationFrame ? this.yccInstance.stage.stageCanvas.requestAnimationFrame : (requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame)
    const self = this

    // 重置状态
    self.currentFrame = undefined
    self.timerTickCount = 0
    self.lastFrameTickerCount = 0

    // 正常设置的帧率
    frameRate = frameRate || self.defaultFrameRate
    // 每帧之间的心跳间隔，默认为1
    self.tickerSpace = parseInt(`${60 / frameRate}`) || 1

    // 每帧理论的间隔时间
    self.deltaTimeExpect = 1000 / frameRate

    // 初始帧数量设为0
    self.frameAllCount = 0

    // 启动时间
    self.startTime = Date.now()

    // 正在进行中 不再启动心跳
    if (self._isRunning) return this

    // timer兼容
    timer || (timer = function (callback: (curTime: number) => void) {
      return setTimeout(function () {
        callback(Date.now())
      }, 1e3 / 60)
    }
    )
    // 启动心跳
    // self._timerId = timer.call(window, cb);
    self._timerId = timer(cb)
    self._isRunning = true

    // 心跳回调函数。约60fps
    function cb (curTime: number) {
      // 总的心跳数加1
      self.timerTickCount++
      if (self.timerTickCount - self.lastFrameTickerCount === self.tickerSpace) {
        // 设置 总帧数加1
        self.frameAllCount++
        // 设置 两帧的时间差
        self.deltaTime = curTime - self.lastFrameTime
        // 设置 帧间隔缩放比
        self.deltaTimeRatio = self.deltaTime / self.deltaTimeExpect
        // 设置 上一帧刷新时间
        self.lastFrameTime += self.deltaTime
        // 设置 上一帧刷新时的心跳数
        self.lastFrameTickerCount = self.timerTickCount
        // 构造一帧
        self.currentFrame = new Frame(self)
        // 执行所有自定义的帧监听函数
        self._broadcastFrameEvent(self.currentFrame)
        // // 执行所有图层的帧监听函数
        // self.broadcastToLayer(self.currentFrame)
      }

      // 递归调用心跳函数
      // self._timerId = timer.call(window,cb);
      self._timerId = timer(cb)
    }

    return this
  }

  /**
     * 停止心跳
     */
  stop () {
    // 兼容wxapp处理
    let stop = this.yccInstance.stage.stageCanvas.cancelAnimationFrame ? this.yccInstance.stage.stageCanvas.cancelAnimationFrame : (cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame)
    stop || (stop = function (id: number) {
      clearTimeout(id)
    })
    stop(this._timerId)
    this._isRunning = false
    this.currentFrame = undefined
  }

  /**
     * 给每帧添加自定义的监听函数
     * @param listener
     */
  addFrameListener (listener: (frame: Frame) => void) {
    this.frameListenerList.push(listener)
    return this
  }

  /**
     * 移除某个监听函数
     * @param listener
     */
  removeFrameListener (listener: () => void) {
    const index = this.frameListenerList.indexOf(listener)
    if (index !== -1) { this.frameListenerList.splice(index, 1) }
    return this
  }

  /**
     * 执行所有自定义的帧监听函数
     */
  private _broadcastFrameEvent (frame: Frame) {
    for (let i = 0; i < this.frameListenerList.length; i++) {
      const listener = this.frameListenerList[i]
      isFn(listener) && listener(frame)
    }
  }

  // /**
  //    * 执行所有图层的监听函数
  //    */
  // broadcastToLayer (frame: Frame) {
  //   for (let i = 0; i < this.yccInstance.layerList.length; i++) {
  //     const layer = this.yccInstance.layerList[i]
  //     layer.show && layer.enableFrameEvent && layer.onFrameComing(frame)
  //   }
  // }
}
