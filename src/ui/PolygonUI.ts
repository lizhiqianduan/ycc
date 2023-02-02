import YccUI, { getYccUICommonProps, YccUICommonProps } from './YccUI'

interface PolygonUIProps extends YccUICommonProps {

}

/**
 * 多边形UI
 */
export default class PolygonUI extends YccUI<PolygonUIProps> {
  getDefaultProps () {
    // 直接使用通用属性
    return {
      ...getYccUICommonProps()
    }
  }

  /**
   * 绘制函数
   */
  render (): void {
    if (!this.isDrawable() || !this.props.show) return

    const ctx = this.getContext()!
    ctx.save()
    this.renderPath()
    this.props.fill ? ctx.fill() : ctx.stroke()
    ctx.restore()
  }
}
