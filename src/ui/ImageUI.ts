import { YccMathRect } from '../tools/YccMath'
import YccLayer from '../YccLayer'
import YccUI, { getYccUICommonProps, YccUICommonProps } from './YccUI'

/**
 * Image属性，继承自公用属性
 */
export interface YccUIImageProps extends YccUICommonProps {
  /**
   * 图片资源的名称，对应`Loader`的资源名称
   */
  resName: string

  /**
   * 容纳区
   * 相对坐标，相对于anchor，其像素为物理像素
   * 此属性是一个相对坐标，相对于锚点坐标
   */
  rect: YccMathRect

  /**
   * 填充模式
   *     <br> none       -- 无填充方式。左上角对齐，超出隐藏，不修改rect大小。
   *     <br> repeat     -- 重复。左上角对齐，重复平铺图片，不修改rect大小，超出隐藏。
   *     <br> scale       -- 缩放。左上角对齐，缩放至整个rect区域，不修改rect大小。
   *     <br> scaleRepeat   -- 先缩放再重复。左上角对齐，缩放至某个rect区域，再重复填充整个rect区域，不修改rect大小。
   *     <br> auto       -- 自动。左上角对齐，rect大小自动适配图片。若图片超出rect，会动态修改rect大小。
   *     <br> scale9Grid   -- 9宫格模式填充。左上角对齐，中间区域将拉伸，不允许图片超出rect区域大小，不会修改rect大小。
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
    const rect = new YccMathRect(0, 0, 60, 60)
    return {
      ...getYccUICommonProps(),
      resName: '',
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
   * 添加至图层时，重新计算属性
   * @param layer
   * @returns
   */
  created (layer: YccLayer) {
    super.created(layer)

    // 初始化容纳区
    this.props.coordinates = this.props.rect.getCoordinates()
    // auto模式重新给props赋值
    if (this.props.fillMode === 'auto') {
      const img = this.getRes()
      this.props.rect.width = img.width as number
      this.props.rect.height = img.height as number
      this.props.coordinates = this.props.rect.getCoordinates()
    }
  }

  getRes () {
    const ycc = this.getYcc()!
    return ycc.$resouces.resMap[this.props.resName].element as CanvasImageSource
  }

  /**
   * 绘制函数
   */
  render (): void {
    if (!this.isDrawable() || !this.props.show) return
    const ctx = this.getContext()!
    // 初始化位置
    this.props.coordinates = this.props.rect.getCoordinates()

    // 物理坐标转舞台坐标
    const { worldAnchor: absoluteAnchor } = this.getWorldContainer()!
    const rect = this.props.rect // 物理像素
    const img = this.getRes()

    ctx.save()

    /// /// 处理旋转参数：旋转的中心点为UI的锚点
    ctx.translate(absoluteAnchor.x, absoluteAnchor.y)
    ctx.rotate(this.props.rotation * Math.PI / 180)
    ctx.translate(-absoluteAnchor.x, -absoluteAnchor.y)

    // 图片的绘制区域
    const rectDpi = this.props.rect.dpi(this.getDpi()) // dpi兼容后的舞台坐标
    const renderRect = new YccMathRect(absoluteAnchor.x + rectDpi.x, absoluteAnchor.y + rectDpi.y, rectDpi.width, rectDpi.height)

    if (this.props.fillMode === 'none') {
      ctx.drawImage(img, 0, 0, rect.width, rect.height, renderRect.x, renderRect.y, renderRect.width, renderRect.height)
    } else if (this.props.fillMode === 'scale') {
      ctx.drawImage(img, 0, 0, img.width as number, img.height as number, renderRect.x, renderRect.y, renderRect.width, renderRect.height)
    } else if (this.props.fillMode === 'auto') {
      ctx.drawImage(img, 0, 0, img.width as number, img.height as number, renderRect.x, renderRect.y, renderRect.width, renderRect.height)
    }

    ctx.restore()
  }
}
