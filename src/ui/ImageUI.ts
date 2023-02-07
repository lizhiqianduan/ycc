import { YccMathRect } from '../tools/YccMath'
import YccUI, { getYccUICommonProps, YccUICommonProps } from './YccUI'

/**
 * Image属性，继承自公用属性
 */
interface YccUIImageProps extends YccUICommonProps {
  /**
   * 图片资源的名称，对应`Loader`的资源名称
   */
  name: string

  /**
   * 容纳区
   */
  rect: YccMathRect

  /**
   * 填充模式
   */
  fillMode: 'none' | 'repeat' | 'scale' | 'scaleRepeat' | 'auto' | 'scale9Grid'
  /**
   * 9宫格相对于res图片的中间区域，当且仅当fillMode为scale9Grid有效
   */
  scale9GridRect?: YccMathRect
  /**
   * 将图片镜像绘制方式
   * <br> 0 -- 无
   * <br> 1-- 上下颠倒
   * <br> 2 -- 左右翻转
   * <br> 3 -- 上下左右颠倒
   */
  mirror: 0 | 1 | 2 | 3
}

export default class ImageUI extends YccUI<YccUIImageProps> {
  getDefaultProps (): YccUIImageProps {
    const rect = new YccMathRect(0, 0, 80, 80)
    return {
      ...getYccUICommonProps(),
      name: '',
      rect,
      fillMode: 'none',
      mirror: 0,
      /**
       * 顶点转换
       */
      coordinates: rect.getCoordinates()
    }
  }

  /**
   * 绘制函数
   */
  render (): void {
    if (!this.isDrawable() || !this.props.show) return
    const ctx = this.getContext()!
    const ycc = this.getYcc()!
    // 计算过程
    this.props.coordinates = this.props.rect.getCoordinates()
    this.props.worldCoordinates = this.getWorldContainer()!.worldCoordinates

    ctx.save()
    ctx.drawImage(ycc.$resouces.resMap[this.props.name].element as CanvasImageSource, this.props.worldCoordinates[0].x, this.props.worldCoordinates[0].y)
    ctx.restore()
  }
}
