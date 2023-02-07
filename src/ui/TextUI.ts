import { YccMathDot } from '../tools/YccMath'
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
  style?: {
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
      ]
    }
  }

  /**
   * 绘制函数
   */
  render (): void {
    if (!this.isDrawable() || !this.props.show) return
    const ctx = this.getContext()!

    ctx.save()
    ctx.fillStyle = this.props.style?.color ?? this.props.fillStyle
    ctx.textBaseline = 'top'
    ctx.font = `${(this.props.style?.fontSize ?? 16) * this.props.belongTo!.stage.stageInfo.dpi}px Arial`
    ctx.fillText(this.props.value, this.props.anchor.x, this.props.anchor.y)
    ctx.restore()
  }
}
