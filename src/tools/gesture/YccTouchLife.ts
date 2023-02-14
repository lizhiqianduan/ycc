import { YccMathDot, YccMathVector } from '../math/index'
import YccTicker, { Frame } from '../ticker/index'

export type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}

/**
 * 系统默认的`Touch`事件全部为只读属性，不方便追踪
 */
export interface YccTouchEvent {
  /**
   * Touch事件关联的lifeId
   */
  lifeId?: number
  /**
   * 事件类型
   */
  type: 'touchstart' | 'touchmove' | 'touchend'
  /**
   * 事件触发的接触点
   */
  triggerTouch: Mutable<Touch>

  /**
   * 事件触发的时间
   */
  triggerTime: number
}

/**
 * 拷贝Touch的数据
 * @param touches
 * @returns
 */
function syncTouches (touches: TouchList): Array<Mutable<Touch>> {
  const copedList = []
  for (let index = 0; index < touches.length; index++) {
    const touch = touches[index]
    const coped = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
      pageY: touch.pageY,
      identifier: touch.identifier,
      force: touch.force
    } as Mutable<Touch>
    copedList.push(coped)
  }
  return copedList
}

/**
 * 触摸的生命周期
 */
export class TouchLife {
  /**
   * 自增ID记录
   */
  static cacheId = 0
  /**
       * 生命周期的id
       * @type {number}
       * */
  id: number

  /**
  * 开始的touch事件
  * @type {YccTouchEvent}
  * */
  startTouchEvent: YccTouchEvent | null
  /**
  * 结束的touch事件
  * @type {YccTouchEvent}
  * */
  endTouchEvent: YccTouchEvent | null
  /**
   * 移动过程中的点
   * @type {YccTouchEvent}
   */
  moveTouchEventList: YccTouchEvent[]

  /**
   * 存活时间
   */
  lifeTime = 0

  constructor (option?: Partial<TouchLife>) {
    this.id = TouchLife.cacheId++

    this.startTouchEvent = option?.startTouchEvent ?? null

    this.endTouchEvent = option?.endTouchEvent ?? null

    this.moveTouchEventList = option?.moveTouchEventList ?? []
  }

  /**
   * 获取生命周期开始和结束时的距离
   */
  getDistance () {
    if (this.endTouchEvent && this.startTouchEvent) {
      return new YccMathVector(this.endTouchEvent?.triggerTouch.pageX - this.startTouchEvent?.triggerTouch.pageX,
        this.endTouchEvent?.triggerTouch.pageY - this.startTouchEvent?.triggerTouch.pageY).getLength()
    } else {
      return 0
    }
  }

  addStart (ev: YccTouchEvent) {
    ev.lifeId = this.id
    this.startTouchEvent = ev
    return this
  }

  addEnd (ev: YccTouchEvent) {
    ev.lifeId = this.id
    this.endTouchEvent = ev
    this.lifeTime = ev.triggerTime - this.startTouchEvent!.triggerTime
    return this
  }

  addMove (ev: YccTouchEvent) {
    ev.lifeId = this.id
    this.moveTouchEventList.push(ev)
    return this
  }
}

/**
 * 整个对象的生命周期追踪
 */
export default class TouchLifeTracer {
  target: HTMLElement
  /**
   * 所有已经发生过的生命周期
   */
  _lifeList: TouchLife[]
  /**
   * 当前存活的生命周期，正在与target接触的触摸点生命周期
   **/
  currentLifeList: TouchLife[]
  /**
    * 当前对象的touch
    * @type {Touch[]}
    */
  targetTouches: Touch[]
  /**
    * 当前target所有的touch
    * @type {Array}
    */
  touches: Touch[]
  /**
    * 当前改变的所有touch
    * @type {Array}
    */
  changedTouches: Touch[]
  onlifestart: (life: TouchLife) => void
  onlifechange: (life: TouchLife) => void
  onlifeend: (life: TouchLife) => void

  // 帧同步
  frameTickerSync?: YccTicker

  constructor (target: HTMLElement, frameTickerSync?: YccTicker) {
    this.frameTickerSync = frameTickerSync
    /**
     * 追踪的对象
     * */
    this.target = target

    /**
    * 作用于target的所有生命周期，包含存活和死亡的周期
    * */
    this._lifeList = []

    this.currentLifeList = []

    this.targetTouches = []

    this.touches = []

    this.changedTouches = []

    /**
    * 某个生命周期开始
    * @type {function}
    * @param callback(life)
    * */
    this.onlifestart = (life: TouchLife) => {}

    /**
    * 某个生命周期状态变更
    * @type {function}
    * @param callback(life)
    * */
    this.onlifechange = (life: TouchLife) => {}

    /**
    * 某个生命周期开始
    * @type {function}
    * @param callback(life)
    * */
    this.onlifeend = (life: TouchLife) => {}

    this.init()
  }

  init () {
    if (!this.target.addEventListener) { console.error('addEventListener undefined'); return }
    this.target.addEventListener('touchstart', this.touchstart.bind(this))
    this.target.addEventListener('touchend', this.touchend.bind(this))

    if (this.frameTickerSync) {
      this.frameTickerSync.addFrameListener(frame => {
        if (TouchLifeTracer.touchmoveEventCache) {
          this.touchmoveTrigger(TouchLifeTracer.touchmoveEventCache, frame)
          TouchLifeTracer.touchmoveEventCache = undefined // 重置
        }
      })
      this.target.addEventListener('touchmove', this.touchmoveSync.bind(this))
    }
  }

  /**
     * 添加生命周期
     * @param life {TouchLife}  生命周期
     * @return {*}
     */
  addLife (life: TouchLife) {
    this._lifeList.push(life)
  }

  /**
   * 根据identifier查找生命周期，此方法只能在生命周期内使用
   * @param identifier
   * @return {*}
   */
  findCurrentLifeByTouchID (identifier: number) {
    for (let i = 0; i < this.currentLifeList.length; i++) {
      const life = this.currentLifeList[i]
      if (life.startTouchEvent?.triggerTouch.identifier === identifier) { return life }
    }
  }

  /**
   * 根据touchID删除当前触摸的生命周期
   * @param identifier
   * @return {boolean}
   */
  deleteCurrentLifeByTouchID (identifier: number) {
    for (let i = 0; i < this.currentLifeList.length; i++) {
      const life = this.currentLifeList[i]
      if (life.startTouchEvent?.triggerTouch.identifier === identifier) {
        this.currentLifeList.splice(i, 1)
        return true
      }
    }
    return false
  }

  /**
   * 寻找移动过的接触点
   */
  indexOfTouchFromMoveTouchEventList (moveTouchEventList: YccTouchEvent[], touch: Touch) {
    for (let i = 0; i < moveTouchEventList.length; i++) {
      if (touch.identifier === moveTouchEventList[i].triggerTouch.identifier) { return i }
    }
    return -1
  }

  touchstart (e: TouchEvent) {
    const self = this
    if (e.preventDefault) e.preventDefault()
    const life = new TouchLife()
    self.addLife(life.addStart({
      triggerTime: Date.now(),
      triggerTouch: syncTouches(e.touches)[0],
      type: 'touchstart'
    }))
    self.currentLifeList.push(life)
    // console.log('touchstart', life)
    if (self.onlifestart) self.onlifestart(life)
  }

  /**
   * 帧同步时，记录touchmove
   */
  static touchmoveEventCache?: TouchEvent

  /**
   * 没有帧同步时，立即触发
   * @param e
   */
  touchmove (e: TouchEvent) {
    this.touchmoveTrigger(e)
  }

  /**
   * 存在帧同步时，不立即触发，仅记录
   */
  touchmoveSync (e: TouchEvent) {
    // console.log('记录', e)
    TouchLifeTracer.touchmoveEventCache = e
  }

  touchmoveTrigger (e: TouchEvent, frame?: Frame) {
    // if (e) { console.log(e, frame?.frameCount); return }
    // console.time(`touchmove ${frame!.frameCount}`)
    const self = this
    if (e.preventDefault) e.preventDefault()
    const changedTouches = syncTouches(e.changedTouches)
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i]
      const life = self.findCurrentLifeByTouchID(touch.identifier)!
      if (!life) continue

      // 不存在上一个移动点时
      if (!life.moveTouchEventList[life.moveTouchEventList.length - 1]) {
        life.addMove({
          triggerTime: Date.now(),
          triggerTouch: touch,
          type: 'touchmove'
        })
        if (self.onlifechange) self.onlifechange(life)
        continue
      }

      const lastMoveEvent = life.moveTouchEventList[life.moveTouchEventList.length - 1]
      const lastMove = new YccMathDot(life.moveTouchEventList[life.moveTouchEventList.length - 1].triggerTouch.pageX, life.moveTouchEventList[life.moveTouchEventList.length - 1].triggerTouch.pageY)
      const curMove = new YccMathDot(touch.pageX, touch.pageY)

      // 移动距离大于1，才认为其触发move事件，否则事件触发时会卡死界面
      // 触发时间大于16ms，才认为其触发move事件，否则事件触发时会卡死界面
      if (lastMove.distance(curMove) > 1 && Date.now() - lastMoveEvent.triggerTime > 16) {
        life.addMove({
          triggerTime: Date.now(),
          triggerTouch: touch,
          type: 'touchmove'
        })
        if (self.onlifechange) self.onlifechange(life)
      }
    }
    // console.timeEnd(`touchmove ${frame!.frameCount}`)
  }

  touchend (e: TouchEvent) {
    const self = this
    if (e.preventDefault) e.preventDefault()
    const touch = syncTouches(e.changedTouches)[0]
    const life = self.findCurrentLifeByTouchID(touch.identifier)!
    life.addEnd({
      triggerTime: Date.now(),
      triggerTouch: touch,
      type: 'touchend'
    })
    self.deleteCurrentLifeByTouchID(touch.identifier)
    if (self.onlifeend) self.onlifeend(life)
  }
}
