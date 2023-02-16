/**
 * UI模块的基类，默认是个多边形
 */

import YccLayer, { addUI } from '../YccLayer'
import { YccMathDot, YccMathRect } from '../tools/math/index'
import { getDpi } from '../tools/common/utils'
import YccStage from '../YccStage'

/**
  * UI的公用属性
  */
export interface YccUICommonProps {
  /**
    * UI的名称，尽量不要重复
    */
  name?: string
  /**
     * UI所属的图层，若UI为加入图层，所有与绘制相关的方法将抛错
     * 在调用`addToStage`之前此值为空
     */
  belongTo?: YccLayer
  /**
   * UI所属的舞台 在调用`addToStage`之前此值为空
   */
  $stage?: YccStage

  /**
         * 用户自定义的数据
         */
  userData?: any

  /**
     * 锚点坐标，是一个相对坐标，只相对于图层，默认为(0,0)，即图层的左上角
     * 当ui处于旋转、平移、缩放时，将参考此锚点坐标
     * 转换顺序：1、缩放 2、旋转 3、平移
     * @attention 此坐标为实际的物理像素
     */
  anchor: YccMathDot
  /**
     * 相对于锚点的旋转角度
     * @type {number}
     */
  rotation: number

  /**
     * 多边形图形的容纳区，点坐标数组，为保证图形能够闭合，起点和终点必须相等
     * 此属性是一个相对坐标，相对于锚点坐标
     * @attention 此坐标为实际的物理像素
     */
  coordinates: YccMathDot[]

  /**
       * 是否显示
       * @type {boolean}
       */
  show: boolean
  /**
       * 是否幽灵状态，默认false
       * 幽灵状态的UI：只能用于显示，不可点击，事件也不会触发，其子元素的事件也不会触发，不能通过getUIFromPointer获取
       * 用于解决多个UI重叠时是否需要穿透，以点击被覆盖UI的问题
       * @type {boolean}
       */
  ghost: boolean
  /**
       * 默认情况下为true，UI阻止事件冒泡，但不会阻止事件传播给图层
       * @type {boolean}
       */
  stopEventBubbleUp: boolean

  /**
       * 透明度 默认1
       * @type {number}
       */
  opacity: number
  /**
        * 线条宽度 默认1
        * @type {number}
        */
  lineWidth: number

  /**
        * 线条颜色，默认`black`
        * @type {string}
        */
  strokeStyle: string

  /**
     * 是否填充，默认`true`
     */
  fill: boolean
  /**
     * 填充样式，默认'black'
     */
  fillStyle: string
}

interface BgStyle {
  color: string
  withBorder: boolean
  borderColor: string
  borderWidth: number
}

/**
    * 多边形UI
    * 位置坐标x、y为只读属性，且为相对坐标，默认取多边形的第一个顶点坐标
    * @constructor
    * @param {Partial<PolygonUIProps>} option    所有可配置的配置项
    */
export default abstract class YccUI<YccUIProps extends YccUICommonProps = YccUICommonProps> {
  /**
    * UI的属性，默认属性在此设置
    */
  props!: YccUIProps

  /**
   * 传递给UI的属性列表
   */
  readonly initProps: Partial<YccUIProps>

  /**
    * UI的构造函数
    * @param {Partial<YccUIProps>} option
    */
  constructor (option: Partial<YccUIProps> = {}) {
    this.initProps = option
  }

  /**
   * 获取UI的默认属性，在初始化时会调用一次
   * @overwrite 需子类实现的方法
   */
  abstract getDefaultProps (): YccUIProps

  /**
    * 初始化UI属性
    * @param option
    */
  private _extendOption (option: Partial<YccUIProps>) {
    return Object.assign(this.props, option)
  }

  /**
   * 当UI被添加至图层后，会立即触发此hook函数
   * 当子类有特殊的计算属性时，需重写此方法，在添加至图层时提前计算ui的属性，比如，`ImageUI`
   */
  created (layer: YccLayer) {
    this.props = this.getDefaultProps()
    this.props = this._extendOption(this.initProps)
    this.props.belongTo = layer
  }

  /**
    * 将此UI添加至舞台的某个图层
    * @param layer
    */
  addToStage (stage: YccStage, layer: YccLayer) {
    this.created(layer)
    this.props.$stage = stage
    addUI(this)(layer)
    return this
  }

  /**
    * 判断UI是否可绘制
    * 存在`belongTo`且存在`coordinates`则认为此UI可绘制
    * @overwrite 若UI有特殊的渲染过程，则子类需重写此方法
    */
  isDrawable () {
    if (!this.props.belongTo) { console.log('该UI未加入图层'); return false }
    if (!this.props.$stage!.yccInstance) { console.log('图层还未加入舞台'); return false }
    if (this.props.coordinates.length === 0) { console.log('该UI未设置坐标'); return false }
    if (this.props.coordinates.length < 2) { console.log('该UI坐标未正确设置'); return false }
    return true
  }

  /**
    * 根据coordinates绘制路径
    * 只绘制路径，不填充、不描边
    * 此过程只会发生在图层的离屏canvas中
    */
  renderPath () {
    if (!this.isDrawable()) return

    // 绘图环境
    const ctx = this.props.belongTo!.ctx
    // 图层的位置
    const { worldCoordinates } = this.getWorldContainer()!

    // 旋转后的点
    const start = worldCoordinates[0]
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    for (let i = 0; i < worldCoordinates.length - 1; i++) {
      // 旋转后的点
      const dot = worldCoordinates[i]
      ctx.lineTo(dot.x, dot.y)
    }
    ctx.closePath()
  }

  /**
    * 获取能容纳多边形的最小矩形框，返回的坐标已经经过dpi处理，是可直接绘制`stage坐标`
    * @param {YccMathRect} rect 相对坐标，相对于`anchor`，可直接传递子ui的`props.rect`属性，用于子UI获取容纳区
    * @returns {worldCoordinates,worldRect}
    */
  getWorldContainer (rect?: YccMathRect) {
    if (!this.props.belongTo) { console.log('该UI未加入图层'); return }
    // 图层的位置
    const dpi = getDpi()

    // dpi处理
    const dpiPosition = this.props.belongTo.position.dpi(dpi)
    const dpiAnchor = this.props.anchor.dpi(dpi)
    const dpiCoordinates = this.props.coordinates.map(item => item.dpi(dpi))
    const dpiRect = rect?.dpi(dpi)

    // 坐标计算
    const renderPosition = dpiPosition
    const renderAnchor = dpiAnchor.plus(dpiPosition)
    const renderCoordinates = dpiCoordinates.map(item => item.plus(renderAnchor))
    const renderRect = dpiRect?.moveBy(renderAnchor.x, renderAnchor.y)

    // 舞台坐标变换
    const worldPosition = renderPosition
    const worldAnchor = renderAnchor
    const worldCoordinates = renderCoordinates.map(
      item => {
        return item
        // 旋转、平移
          .rotate(this.props.rotation, worldAnchor)
      }
    )

    const start = worldCoordinates[0]
    let minx = start.x; let miny = start.y; let maxx = start.x; let maxy = start.y

    for (let i = 0; i < worldCoordinates.length; i++) {
      const dot = worldCoordinates[i]
      if (dot.x < minx) minx = dot.x
      if (dot.x >= maxx) maxx = dot.x
      if (dot.y < miny) miny = dot.y
      if (dot.y >= maxy) maxy = dot.y
    }

    return {
      // renderPosition与worldPosition一致，因为：Layer不存在变换
      dpi: {
        dpiAnchor,
        dpiPosition,
        dpiCoordinates,
        dpiRect
      },
      render: {
        renderPosition,
        renderAnchor,
        renderCoordinates,
        renderRect
      },
      /**
       * `worldRect`是不存在的，因为存在旋转/变换，旋转后的图形无法用`rect`表达，只能由`renderRect`推导出来
       */
      worldRect: null,
      worldPosition,
      worldAnchor,
      worldCoordinates,
      worldContainerRect: new YccMathRect(minx, miny, maxx - minx, maxy - miny)
    }
  }

  /**
    * 重载基类的包含某个点的函数，用于点击事件等的响应
    * 两种方法：
    * 方法一：经过该点的水平射线与多边形的焦点数，即Ray-casting Algorithm
    * 方法二：某个点始终位于多边形逆时针向量的左侧、或者顺时针方向的右侧即可判断，算法名忘记了
    * 此方法采用方法一，并假设该射线平行于x轴，方向为x轴正方向
    * @param dot {Ycc.Math.Dot} 需要判断的点，绝对坐标（world坐标）
    * @param noneZeroMode {Number} 是否noneZeroMode 1--启用 2--关闭 默认启用
    *   从这个点引出一根“射线”，与多边形的任意若干条边相交，计数初始化为0，若相交处被多边形的边从左到右切过，计数+1，若相交处被多边形的边从右到左切过，计数-1，最后检查计数，如果是0，点在多边形外，如果非0，点在多边形内
    * @return {boolean}
    */
  isContainDot (dot: YccMathDot, noneZeroMode?: 1 | 2) {
    if (!this.props.belongTo) { console.log('该UI未加入图层'); return }
    // 获取ui的绝对坐标
    const coordinates = this.getWorldContainer()!.worldCoordinates

    // 默认启动none zero mode
    noneZeroMode = noneZeroMode ?? 1

    const _dot = dot

    const x = _dot.x; const y = _dot.y
    let crossNum = 0
    // 点在线段的左侧数目
    let leftCount = 0
    // 点在线段的右侧数目
    let rightCount = 0
    for (let i = 0; i < coordinates.length - 1; i++) {
      // const start = coordinates[i].rotate(this.props.rotation, this.props.anchor.plus(this.props.belongTo.position))
      // const end = coordinates[i + 1].rotate(this.props.rotation, this.props.anchor.plus(this.props.belongTo.position))
      const start = coordinates[i]
      const end = coordinates[i + 1]

      // 起点、终点斜率不存在的情况
      if (start.x === end.x) {
        // 因为射线向右水平，此处说明不相交
        if (x > start.x) continue

        // 从左侧贯穿
        if ((end.y > start.y && y >= start.y && y <= end.y)) {
          leftCount++
          // console.log('++1');
          crossNum++
        }
        // 从右侧贯穿
        if ((end.y < start.y && y >= end.y && y <= start.y)) {
          rightCount++
          // console.log('++1');
          crossNum++
        }
        continue
      }
      // 斜率存在的情况，计算斜率
      const k = (end.y - start.y) / (end.x - start.x)
      // 交点的x坐标
      const x0 = (y - start.y) / k + start.x
      // 因为射线向右水平，此处说明不相交
      if (x > x0) continue

      if ((end.x > start.x && x0 >= start.x && x0 <= end.x)) {
        // console.log('++2');
        crossNum++
        if (k >= 0) leftCount++
        else rightCount++
      }
      if ((end.x < start.x && x0 >= end.x && x0 <= start.x)) {
        // console.log('++2');
        crossNum++
        if (k >= 0) rightCount++
        else leftCount++
      }
    }

    // console.log('polygon',dot,noneZeroMode,crossNum,crossNum%2,leftCount,rightCount);
    return noneZeroMode === 1 ? leftCount - rightCount !== 0 : crossNum % 2 === 1
  }

  /**
   * 获取绘图环境
   */
  getContext () {
    return this.props.belongTo?.ctx
  }

  /**
   * 获取当前实例
   * @returns
   */
  getYcc () {
    return this.props.$stage!.yccInstance
  }

  /**
   * 绘制ui的背景，多用于调试
   * @returns
   */
  renderBg (bgStyle: BgStyle = { color: '#ccc', withBorder: true, borderColor: 'red', borderWidth: 4 }) {
    if (!this.isDrawable() || !this.props.show) return
    const ctx = this.getContext()!

    ctx.save()
    this.renderPath()
    ctx.fillStyle = bgStyle.color
    ctx.strokeStyle = bgStyle.borderColor
    ctx.lineWidth = bgStyle.borderWidth
    ctx.fill()
    if (bgStyle.withBorder) ctx.stroke()
    ctx.restore()
  }

  /**
   * 绘制UI的锚点，多用于调试
   */
  renderAnchor () {
    if (!this.isDrawable() || !this.props.show) return
    const ctx = this.getContext()!
    const world = this.getWorldContainer()!

    ctx.save()
    ctx.strokeStyle = 'blue'
    ctx.lineWidth = 4

    ctx.beginPath()
    ctx.moveTo(world.worldAnchor.x + 16, world.worldAnchor.y)
    ctx.lineTo(world.worldAnchor.x - 16, world.worldAnchor.y)
    ctx.closePath()
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(world.worldAnchor.x, world.worldAnchor.y + 16)
    ctx.lineTo(world.worldAnchor.x, world.worldAnchor.y - 16)
    ctx.closePath()
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(world.worldAnchor.x, world.worldAnchor.y, 16, 0, 360)
    ctx.closePath()
    ctx.stroke()
    ctx.closePath()

    ctx.restore()
  }

  /**
    * 渲染至离屏ctx
    * @overwrite 若UI有特殊的渲染过程，则此处的render方法需子类重写
    */
  abstract render (): void
}

/**
 * 获取UI的通用属性
 */
export function getYccUICommonProps (): YccUICommonProps {
  return {
    anchor: new YccMathDot(0, 0),
    coordinates: [] as YccMathDot[],
    fill: true,
    fillStyle: 'black',
    ghost: false,
    lineWidth: 1,
    opacity: 1,
    rotation: 0,
    show: true,
    stopEventBubbleUp: true,
    strokeStyle: 'black'
  }
}
