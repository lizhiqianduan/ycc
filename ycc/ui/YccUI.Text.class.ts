import { YccMathDot } from '../Ycc.class'
import YccUI, { YccUICommonProps } from '../YccUI.class'

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

/**
 * 文本UI
 */
export default class YccUIText extends YccUI<YccUITextProps> {
  /**
   * @overwrite
   * @returns
   */
  getDefaultProps (): YccUITextProps {
    return {
      ...super.getDefaultProps(),
      coordinates: [
        new YccMathDot(0, 0),
        new YccMathDot(0, 0)
      ],
      value: ''
    }
  }

  render (): void {
    const ctx = this.props.belongTo!.ctx
    ctx.save()
    ctx.fillStyle = this.props.style?.color ?? this.props.fillStyle
    ctx.textBaseline = 'top'
    ctx.font = `${(this.props.style?.fontSize ?? 16) * this.props.belongTo!.stage.stageInfo.dpi}px Arial`
    ctx.fillText(this.props.value, this.props.anchor.x, this.props.anchor.y)
    ctx.restore()
  }
}
