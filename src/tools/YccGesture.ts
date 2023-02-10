/**
 * @file    YccGesture.ts
 * @author  xiaohei
 * @description  YccGesture.ts文件
 * 移动端的手势类，封装简单的手势操作，操作只对target元素生效，若需要转发给Ycc.UI，则需要自己处理
 * @requires TouchLifeTracer
 */

import { YccMathVector } from './YccMath'
import TouchLifeTracer, { TouchLife } from './YccTouchLife'
import { isMobile, isNum } from './YccUtils'

/**
   *
   * @param option
   * @param option.target 手势触发的HTML对象
   * @param option.useMulti {boolean} 是否启用多点触控。对于无多点触控的项目，关闭多点触控，可节省性能消耗。默认启用
   * @extends Ycc.Listener
   * @constructor
   */
export default class YccGesture {
  option: { target: HTMLElement | null, useMulti: boolean }
  _longTapTimeout: number
  ismutiltouching: boolean
  touchLifeTracer: TouchLifeTracer | null

  constructor (option: { target: HTMLElement, useMulti: boolean }) {
    /**
       *
       * @type {{useMulti: boolean, target: null}}
       */
    this.option = {
      target: option.target,
      useMulti: option.useMulti
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
  triggerListener (type: string, data: any, data2?: any) {
    console.log(type, data, data2)
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
    // this.triggerListener('log', 'preLife')
    // this.triggerListener('log', preLife)
    // this.triggerListener('log', 'curLife')
    // this.triggerListener('log', curLife)

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
   * 初始化移动端的手势
   * @private
   */
  _initForMobile () {
    const self = this
    const tracer = new TouchLifeTracer(this.option.target!)
    this.touchLifeTracer = tracer
    // 上一次触摸、当前触摸
    let preLife: TouchLife | null, curLife: TouchLife | null
    // 是否阻止事件
    const prevent = {
      tap: false,
      swipe: false
    }

    tracer.onlifestart = function (life) {
      self.triggerListener('tap', self._createEventData(life.startTouchEvent!, 'tap'))
      // self.triggerListener('log', 'tap triggered')

      // 触发拖拽开始事件
      self.triggerListener('dragstart', self._createEventData(life.startTouchEvent!, 'dragstart'))

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
        self.triggerListener('longtap', self._createEventData(life.startTouchEvent!, 'longtap'))
      }, 750)
    }
    tracer.onlifechange = function (life) {
    // 只要存在移动的接触点，就触发dragging事件
      life.moveTouchEventList.forEach(function (moveEvent) {
        self.triggerListener('dragging', self._createEventData(moveEvent, 'dragging'))
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
        // 如果触摸点按下期间存在移动行为，且移动距离大于10，则认为该操作不是tap、longtap
        if (Math.abs(lastMove.pageX - firstMove.pageX) > 10 || Math.abs(lastMove.pageY - firstMove.pageY) > 10) {
          prevent.tap = true
          clearTimeout(self._longTapTimeout)
        }
      }
    }
    tracer.onlifeend = function (life) {
      self.triggerListener('dragend', self._createEventData(life.endTouchEvent!.triggerTouch, 'dragend'))
      self.ismutiltouching = true

      // 若某个触摸结束，当前触摸点个数为1，说明之前的操作为多点触控。这里发送多点触控结束事件
      if (tracer.currentLifeList.length === 1) {
        self.ismutiltouching = false
        self.triggerListener('multiend', preLife, curLife); return
      }

      if (tracer.currentLifeList.length === 0) {
        self.ismutiltouching = false

        // 开始和结束时间在300ms内，认为是tap事件
        if (!prevent.tap && life.endTime - life.startTime < 300) {
        // 取消长按事件
          clearTimeout(self._longTapTimeout)

          // 两次点击在300ms内，并且两次点击的范围在10px内，则认为是doubletap事件
          if (preLife && life.endTime - preLife.endTime < 300 && Math.abs(preLife.endTouchEvent!.triggerTouch.pageX - life.endTouchEvent!.triggerTouch.pageX) < 10 && Math.abs(preLife.endTouchEvent!.triggerTouch.pageY - life.endTouchEvent!.triggerTouch.pageY) < 10) {
            self.triggerListener('doubletap', self._createEventData(life.endTouchEvent!.triggerTouch, 'doubletap'))
            self.triggerListener('log', 'doubletap triggered')
            preLife = null
            return this
          }
          preLife = life
          return this
        }

        // 如果触摸点按下期间存在移动行为，且移动范围大于30px，触摸时间在200ms内，则认为该操作是swipe
        if (!prevent.swipe && life.endTime - life.startTime < 300) {
          const firstMove = life.startTouchEvent!.triggerTouch
          const lastMove = Array.prototype.slice.call(life.moveTouchEventList, -1)[0]
          if (Math.abs(lastMove.pageX - firstMove.pageX) > 30 || Math.abs(lastMove.pageY - firstMove.pageY) > 30) {
            const dir = self._getSwipeDirection(firstMove.pageX, firstMove.pageY, lastMove.pageX, lastMove.pageY)
            const type = 'swipe' + dir
            self.triggerListener('log', type)
            // 触发swipeXXX
            self.triggerListener(type, self._createEventData({ ...life.endTouchEvent!, dir }, type))
            // 触发swipe
            self.triggerListener('swipe', self._createEventData({ ...life.endTouchEvent!, dir }, 'swipe'))
            console.log('swipe', type)
          }
          return this
        }
      }
    }
  }
}
