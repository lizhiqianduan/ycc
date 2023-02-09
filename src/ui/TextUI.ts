import { YccMathDot, YccMathRect } from '../tools/YccMath'
import YccUI, { getYccUICommonProps, YccUICommonProps } from './YccUI'

/**
 * Text属性，继承自公用属性
 */
interface YccUITextProps extends YccUICommonProps {
  /**
   * 文本内容
   */
  value: string

  /**
   * 文本样式
   */
  style: {
    color?: string
    fontSize?: number
  }
}

export default class TextUI extends YccUI<YccUITextProps> {
  getDefaultProps (): YccUITextProps {
    return {
      ...getYccUICommonProps(),
      value: '',
      /**
       * 此属性只在绘制后生效
       */
      coordinates: [
        new YccMathDot(0),
        new YccMathDot(0)
      ],
      style: {
        fontSize: 16
      }
    }
  }

  /**
   * 绘制函数
   */
  render (): void {
    if (!this.isDrawable() || !this.props.show) return
    const ctx = this.getContext()!
    const dpi = this.getDpi()
    const fontSize = this.props.style.fontSize ?? 16

    ctx.save()
    ctx.fillStyle = this.props.style?.color ?? this.props.fillStyle
    ctx.textBaseline = 'top'

    ctx.font = `${fontSize * dpi}px Arial`

    this.props.coordinates = new YccMathRect(0, 0, ctx.measureText(this.props.value).width / dpi, fontSize).getCoordinates()
    const transformed = this.getWorldContainer()!

    ctx.fillText(this.props.value, transformed.worldAnchor.x, transformed.worldAnchor.y)
    ctx.restore()
  }
}
