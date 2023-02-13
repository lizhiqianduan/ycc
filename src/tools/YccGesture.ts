/**
 * @file    YccGesture.ts
 * @author  xiaohei
 * @description  YccGesture.ts文件
 * 移动端的手势类，封装简单的手势操作，操作只对target元素生效，若需要转发给Ycc.UI，则需要自己处理
 * @requires TouchLifeTracer
 */

import { YccMathDot, YccMathVector } from './YccMath'
import YccTicker from './YccTicker'
import TouchLifeTracer, { TouchLife, YccTouchEvent } from './YccTouchLife'
import { isMobile, isNum } from './YccUtils'

/**
 * 手势触发时的事件
 */
export interface GestureEvent<DataType = any> {
  /**
   * 事件类型
   */
  type: 'tap' | 'dragstart' | 'dragging' | 'dragend' | 'longtap' | 'multistart' | 'multichange' | 'multiend' | 'zoom' | 'rotate' | 'log' | 'swipe' | 'doubletap'

  /**
   * 触发事件的触摸点，多点触控时，此值为一个数组
   */
  triggerTouch?: YccTouchEvent[]

  /**
   * 事件所携带的数据，根据`DataType`推导，默认为any
   */
  data: DataType
}

interface TapData {
  position: YccMathDot
}

interface DragStartData {
  position: YccMathDot
  life: TouchLife
}

type LongTapData = TapData
interface DragEndData {
  position: YccMathDot
  life: TouchLife
}
type DoubleTapData = TapData

interface DraggingData {
  position: YccMathDot
  life: TouchLife
}

interface SwipeData {
  /**
   * swipe的方向
   */
  dir: string
}

/**
   *
   * @param option
   * @param option.target 手势触发的HTML对象
   * @param option.useMulti {boolean} 是否启用多点触控。对于无多点触控的项目，关闭多点触控，可节省性能消耗。默认启用
   * @extends Ycc.Listener
   * @constructor
   */
export default class YccGesture {
  option: { target: HTMLElement | null, useMulti: boolean, frameTickerSync?: YccTicker }
  _longTapTimeout: number
  ismutiltouching: boolean
  touchLifeTracer: TouchLifeTracer | null

  /**
   * 默认的事件监听函数
   * @param data
   */
  events = {
    tap: function (data: GestureEvent<TapData>) {},
    dragstart: function (data: GestureEvent<DragStartData>): void {},
    dragging: function (data: GestureEvent<DraggingData>): void {},
    dragend: function (data: GestureEvent<DragEndData>): void {},
    longtap: function (data: GestureEvent<LongTapData>): void {},
    multistart: function (data: GestureEvent): void {},
    multichange: function (data: GestureEvent<TapData>): void {},
    multiend: function (data: GestureEvent<TapData>): void {},
    zoom: function (data: GestureEvent<TapData>): void {},
    rotate: function (data: GestureEvent<TapData>): void {},
    log: function (data: GestureEvent<TapData>): void {},
    swipe: function (data: GestureEvent<SwipeData>): void {},
    doubletap: function (data: GestureEvent<DoubleTapData>): void {}
  }

  /**
   * 当设置了此参数时，将启用帧同步
   * 帧同步的含义：
   * 每帧之间存在一定时间间隔，比如16ms
   * 在此时间间隔之内产生的事件，将进行合并，直到下一帧开始才触发，且只触发一次
   */
  frameTickerSync?: YccTicker

  constructor (option: { target: HTMLElement, frameTickerSync?: YccTicker }) {
    /**
       *
       * @type {{useMulti: boolean, frameTickerSync?: YccTicker}}
       */
    this.option = {
      target: option.target,
      useMulti: true,
      frameTickerSync: option.frameTickerSync
    }

    /**
       * 长按事件的定时器id
       * @type {null}
       * @private
       */
    this._longTapTimeout = 0

    /**
       * 多点触摸是否正处于接触中
       * @type {Bolean}
       * @private
       */
    this.ismutiltouching = false

    /**
       * 生命追踪
       */
    this.touchLifeTracer = null

    this._init()
  }

  _init () {
    if (isMobile()) {
      console.log('mobile gesture init...')
      this._initForMobile()
    } else {
      console.log('pc gesture init...')
      // this._initForPC()
    }
  }

  /**
     * 向外部触发事件
     * @param type
     * @param data
     */
  triggerListener <DataType=any>(type: GestureEvent['type'], data: DataType, data2?: any) {
    const event: GestureEvent = {
      type,
      data
    }
    this.events[type](event)
  }

  /**
   * 构造筛选事件中的有用信息
   * @param event  {MouseEvent | TouchEvent}  鼠标事件或者触摸事件
   * @param [type] {String} 事件类型，可选
   * @return {{target: null, clientX: number, clientY: number, pageX: number, pageY: number, screenX: number, screenY: number, force: number}}
   * @private
   */
  _createEventData (event: object, type: string) {
    let data = {
      /**
         * 事件类型
         */
      type: '',
      /**
         * 事件触发对象
         */
      target: null,

      /**
         * 事件的生命周期ID，只在拖拽过程中存在，存在时此值大于-1
         * PC端表示mousedown直至mouseup整个周期
         * mobile端表示touchstart直至touchend整个周期
         */
      identifier: -1,

      // x、y兼容微信端，web端其值等于pageX、pageY
      x: 0,
      y: 0,

      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      screenX: 0,
      screenY: 0,
      force: 1,

      /**
         * 手势滑动方向，此属性当且仅当type为swipe时有值
         */
      swipeDirection: '',

      /**
         * 缩放比例 仅当事件为zoom时可用
         */
      zoomRate: 1,
      /**
         * 旋转角度 仅当事件为rotate时可用
         */
      angle: 0,

      /**
         * 创建时间
         */
      createTime: Date.now()
    }

    data = Object.assign(data, event)
    data.type = type
    return data
  }

  /**
   * 获取缩放比例
   * @param preLife
   * @param curLife
   * @return {number}
   * @private
   */
  getZoomRateAndRotateAngle (preLife: TouchLife, curLife: TouchLife) {
    const x0 = preLife.startTouchEvent!.triggerTouch.pageX
    const y0 = preLife.startTouchEvent!.triggerTouch.pageY
    const x1 = curLife.startTouchEvent!.triggerTouch.pageX
    const y1 = curLife.startTouchEvent!.triggerTouch.pageY

    const preMoveTouch = preLife.moveTouchEventList.length > 0 ? preLife.moveTouchEventList[preLife.moveTouchEventList.length - 1] : preLife.startTouchEvent
    const curMoveTouch = curLife.moveTouchEventList.length > 0 ? curLife.moveTouchEventList[curLife.moveTouchEventList.length - 1] : curLife.startTouchEvent
    const x0move = preMoveTouch!.triggerTouch.pageX
    const y0move = preMoveTouch!.triggerTouch.pageY
    const x1move = curMoveTouch!.triggerTouch.pageX
    const y1move = curMoveTouch!.triggerTouch.pageY

    const vector0 = new YccMathVector(x1 - x0, y1 - y0)
    const vector1 = new YccMathVector(x1move - x0move, y1move - y0move)

    const angle = Math.acos(vector1.dot(vector0) / (vector1.getLength() * vector0.getLength())) / Math.PI * 180
    return {
      rate: vector1.getLength() / vector0.getLength(),
      angle: angle * (vector1.cross(vector0).z > 0 ? -1 : 1)
    }// (new Ycc.Math.Vector(x1move-x0move,y1move-y0move).getLength())/(new Ycc.Math.Vector(x1-x0,y1-y0).getLength());
  }

  /**
   * 获取某个触摸点的swipe方向
   * @private
   */
  _getSwipeDirection (x1: number, y1: number, x2: number, y2: number) {
    return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'left' : 'right') : (y1 - y2 > 0 ? 'up' : 'down')
  }

  /**
   * 是否处于多点触控中
   */
  isMutilTouching () {
    if (this.touchLifeTracer) { return this.touchLifeTracer.currentLifeList.length >= 2 }
    return false
  }

  /**
   * 初始化移动端的手势
   * @private
   */
  _initForMobile () {
    const self = this
    const tracer = new TouchLifeTracer(this.option.target!, this.option.frameTickerSync)
    this.touchLifeTracer = tracer
    // 上一次触摸、当前触摸
    let preLife: TouchLife | null, curLife: TouchLife | null
    // 是否阻止事件
    const prevent = {
      tap: false,
      swipe: false
    }

    tracer.onlifestart = function (life) {
      // 单击事件
      self.triggerListener<TapData>('tap', {
        position: new YccMathDot(life.startTouchEvent!.triggerTouch.pageX, life.startTouchEvent!.triggerTouch.pageY)
      })

      // 触发拖拽开始事件
      self.triggerListener<DragStartData>('dragstart', {
        position: new YccMathDot(life.startTouchEvent!.triggerTouch.pageX, life.startTouchEvent!.triggerTouch.pageY),
        life
      })

      // 多个触摸点的情况
      if (tracer.currentLifeList.length > 1) {
        self.ismutiltouching = true
        // 判断是否启用多点触控
        if (!self.option.useMulti) return

        // self.triggerListener('log', 'multi touch start ...')
        self.triggerListener('multistart', tracer.currentLifeList)

        prevent.tap = false
        prevent.swipe = false
        clearTimeout(self._longTapTimeout)
        // 缩放、旋转只取最先接触的两个点即可
        preLife = tracer.currentLifeList[0]
        curLife = tracer.currentLifeList[1]
        return this
      }
      self.ismutiltouching = false
      // 只有一个触摸点的情况
      prevent.tap = false
      prevent.swipe = false
      // 长按事件
      self._longTapTimeout = setTimeout(function () {
        self.triggerListener<LongTapData>('longtap', {
          position: new YccMathDot(life.startTouchEvent!.triggerTouch.pageX, life.startTouchEvent!.triggerTouch.pageY)
        })
      }, 750)
    }

    tracer.onlifechange = function (life) {
    // 只要存在移动的接触点，就触发dragging事件
      life.moveTouchEventList.forEach(function (moveEvent) {
        self.triggerListener<DraggingData>('dragging', {
          position: new YccMathDot(moveEvent.triggerTouch.pageX, moveEvent.triggerTouch.pageY),
          life
        })
      })

      if (tracer.currentLifeList.length > 1) {
        self.ismutiltouching = true

        // 判断是否启用多点触控
        if (!self.option.useMulti) return
        prevent.tap = true
        prevent.swipe = true
        // self.triggerListener('log', 'multi touch move ...')
        self.triggerListener('multichange', preLife, curLife)

        const rateAndAngle = self.getZoomRateAndRotateAngle(preLife!, curLife!)

        if (isNum(rateAndAngle.rate)) {
          const e = self._createEventData(preLife!.startTouchEvent!, 'zoom')
          e.zoomRate = rateAndAngle.rate
          self.triggerListener('zoom', self._createEventData(e, 'zoom'))
          // self.triggerListener('log', 'zoom triggered', rateAndAngle.rate)
        }
        if (isNum(rateAndAngle.angle)) {
          const e = self._createEventData(preLife!.startTouchEvent!, 'rotate')
          e.angle = rateAndAngle.angle
          self.triggerListener('rotate', self._createEventData(e, 'rotate'))
          // self.triggerListener('rotate',self._createEventData(preLife.startTouchEvent,'rotate'),rateAndAngle.angle);
          // self.triggerListener('log', 'rotate triggered', rateAndAngle.angle)
        }
        return this
      }

      // 只有一个触摸点的情况
      if (life.moveTouchEventList.length > 0) {
        self.ismutiltouching = false
        const firstMove = life.startTouchEvent!.triggerTouch
        const lastMove = Array.prototype.slice.call(life.moveTouchEventList, -1)[0]

        // 如果触摸点按下期间存在移动行为，且移动距离大于10，则认为该操作不是longtap
        if (Math.abs(lastMove.pageX - firstMove.pageX) > 10 || Math.abs(lastMove.pageY - firstMove.pageY) > 10) {
          clearTimeout(self._longTapTimeout)
        }
      }
    }

    tracer.onlifeend = function (life) {
      // 触发事件
      self.triggerListener<DragEndData>('dragend', {
        position: new YccMathDot(life.endTouchEvent?.triggerTouch.pageX, life.endTouchEvent?.triggerTouch.pageY),
        life
      })
      self.ismutiltouching = true
      // console.log('lifeend', life)

      // 若某个触摸结束，当前触摸点个数为1，说明之前的操作为多点触控。这里发送多点触控结束事件
      if (tracer.currentLifeList.length === 1) {
        self.ismutiltouching = false
        self.triggerListener('multiend', preLife, curLife); return
      }

      // 结束时，没有存活的触摸点
      if (tracer.currentLifeList.length === 0) {
        // 取消长按事件，长按时，肯定至少有一个触摸点
        clearTimeout(self._longTapTimeout)

        if (life.getDistance() > 10) {
          // 大于300ms，并且大于10px，什么也不触发
          if (life.lifeTime > 300) {
            return this
          } else {
          // 小于300ms，并且大于10px，需判断swipe事件

            const firstMove = life.startTouchEvent!.triggerTouch
            const lastMove = life.endTouchEvent!.triggerTouch
            if (Math.abs(lastMove.pageX - firstMove.pageX) > 30 || Math.abs(lastMove.pageY - firstMove.pageY) > 30) {
              const dir = self._getSwipeDirection(firstMove.pageX, firstMove.pageY, lastMove.pageX, lastMove.pageY)
              // 触发swipe
              self.triggerListener<SwipeData>('swipe', {
                dir
              })
            }
            return this
          }
        } else {
          // 距离小于10px，并且时间在300ms内
          if (life.lifeTime < 300) {
            /// ///// 开始和结束时间在300ms内，并且移动距离在10px以内，认为是tap事件
            // 此处判断doubletap事件

            // 两次点击在300ms内，并且两次点击的范围在10px内，则认为是doubletap事件
            if (preLife && life.endTouchEvent!.triggerTime - preLife.endTouchEvent!.triggerTime < 300 && Math.abs(preLife.endTouchEvent!.triggerTouch.pageX - life.endTouchEvent!.triggerTouch.pageX) < 10 && Math.abs(preLife.endTouchEvent!.triggerTouch.pageY - life.endTouchEvent!.triggerTouch.pageY) < 10) {
              self.triggerListener<DoubleTapData>('doubletap', {
                position: new YccMathDot(life.endTouchEvent!.triggerTouch.pageX, life.endTouchEvent!.triggerTouch.pageY)
              })
              preLife = null
              return this
            }
            preLife = life
            return this
          }
        }
      }
    }
  }
}
