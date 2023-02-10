import { YccMathDot } from '../tools/YccMath'
import YccUI, { getYccUICommonProps, YccUICommonProps } from './YccUI'

/**
 * Text属性，继承自公用属性
 */
interface YccUILineProps extends YccUICommonProps {
  /**
   * 文本内容
   */
  dots: YccMathDot[]

  /**
   * 文本样式
   */
  style: {
    color?: string
  }
}

export default class LineUI extends YccUI<YccUILineProps> {
  getDefaultProps (): YccUILineProps {
    return {
      ...getYccUICommonProps(),
      dots: [],
      /**
       * 此属性只在绘制后生效
       */
      coordinates: [
        new YccMathDot(0),
        new YccMathDot(0)
      ],
      style: {
        color: 'red'
      }
    }
  }

  /**
   * 绘制函数
   */
  render (): void {
    if (!this.isDrawable() || !this.props.show) return
    if (this.props.dots.length < 2) return
    const ctx = this.getContext()!
    const dpi = this.getDpi()!

    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = this.props.style?.color ?? this.props.strokeStyle
    ctx.textBaseline = 'top'

    const transformed = this.getWorldContainer()
    const dots = this.props.dots.map(dot => dot.dpi(dpi).plus(transformed!.render.renderAnchor))

    ctx.moveTo(dots[0].x, dots[0].y)
    for (let index = 0; index < dots.length; index++) {
      const dot = dots[index]
      ctx.lineTo(dot.x, dot.y)
    }
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
  }
}
