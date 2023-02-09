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
   *     <br> auto       -- 自动。左上角对齐，rect大小自动适配图片。若图片超出rect，会动态修改rect大小。
   *     <br> scale9Grid   -- 9宫格模式填充。左上角对齐，中间区域将拉伸，不允许图片超出rect区域大小，不会修改rect大小。
   */
  fillMode: 'none' | 'repeat' | 'scale' | 'auto' | 'scale9Grid'
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

/**
 * 图片UI
 * 图片的尺寸会根据设备的dpi动态调整
 */
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

  /**
   * 获取资源
   * @returns
   */
  getRes () {
    const ycc = this.getYcc()!
    return ycc.$resouces.resMap[this.props.resName].element as CanvasImageSource
  }

  /**
   * 处理镜像
   * @param renderRect {YccMathRect} 计算之后的图片容纳区
   * @private
   */
  private _processMirror (renderRect: YccMathRect) {
    const mirror = this.props.mirror
    const ctx = this.getContext()!
    const { x, y, width, height } = renderRect

    if (mirror === 1) {
      ctx.scale(-1, 1)
      ctx.translate(-x * 2 - width, 0)
    }
    if (mirror === 2) {
      ctx.scale(1, -1)
      ctx.translate(0, -y * 2 - height)
    }
    if (mirror === 3) {
      ctx.scale(-1, -1)
      ctx.translate(-x * 2 - width, -y * 2 - height)
    }
  }

  /**
   * 绘制函数
   */
  render (): void {
    if (!this.isDrawable() || !this.props.show) return
    const ctx = this.getContext()!
    const dpi = this.getDpi()
    // 初始化位置
    this.props.coordinates = this.props.rect.getCoordinates()

    const img = this.getRes()
    // 绘制尺寸
    const renderImgWidth = img.width as number
    const renderImgHeight = img.height as number
    // 物理尺寸
    const imgWidth = renderImgWidth / dpi
    const imgHeight = renderImgHeight / dpi

    // 物理坐标转
    const transformed = this.getWorldContainer(this.props.rect)!
    const worldAnchor = transformed.worldAnchor // 锚点
    const rect = this.props.rect // 物理区
    const renderRect = transformed.render.renderRect! // 绘制区

    ctx.save()
    // 处理旋转：旋转的中心点为UI的锚点
    ctx.translate(worldAnchor.x, worldAnchor.y)
    ctx.rotate(this.props.rotation * Math.PI / 180)
    ctx.translate(-worldAnchor.x, -worldAnchor.y)

    // 处理镜像
    this._processMirror(renderRect)

    // 根据不同绘制模式，开始绘制
    if (this.props.fillMode === 'none') {
      ctx.drawImage(img, 0, 0, rect.width, rect.height, renderRect.x, renderRect.y, renderRect.width, renderRect.height)
    } else if (this.props.fillMode === 'scale') {
      ctx.drawImage(img, 0, 0, img.width as number, img.height as number, renderRect.x, renderRect.y, renderRect.width, renderRect.height)
    } else if (this.props.fillMode === 'auto') {
      ctx.drawImage(img, 0, 0, img.width as number, img.height as number, renderRect.x, renderRect.y, renderRect.width, renderRect.height)
    } else if (this.props.fillMode === 'repeat') {
      const { x, y } = renderRect
      // x,y方向能容纳的img个数
      const wCount = Math.ceil(rect.width / (imgWidth))
      const hCount = Math.ceil(rect.height / (imgHeight))

      for (let i = 0; i < wCount; i++) {
        for (let j = 0; j < hCount; j++) {
          let xRest = renderImgWidth
          let yRest = renderImgHeight
          if (i === wCount - 1) { xRest = renderRect.width - i * renderImgWidth }
          if (j === hCount - 1) { yRest = renderRect.height - j * renderImgHeight }

          ctx.drawImage(img,
            0, 0, xRest, yRest,
            x + renderImgWidth * i, y + renderImgHeight * j, xRest, yRest
          )
        }
      }
    } else if (this.props.fillMode === 'scale9Grid') {
      if (!this.props.scale9GridRect) return

      const rect = this.props.rect
      const centerRect = this.props.scale9GridRect
      const grid: Array<{ src?: YccMathRect, dest?: YccMathRect }> = []
      const dpi = this.getDpi()
      let src, dest

      // 第1块
      grid[0] = {}
      grid[0].src = new YccMathRect(0, 0, centerRect.x, centerRect.y)
      grid[0].dest = new YccMathRect(rect.x, rect.y, centerRect.x, centerRect.y)

      // 第3块
      grid[2] = {}
      grid[2].src = new YccMathRect(centerRect.x + centerRect.width, 0, imgWidth - centerRect.x - centerRect.width, centerRect.y)
      grid[2].dest = new YccMathRect(rect.width - grid[2].src.width + rect.x, rect.y, grid[2].src.width, grid[2].src.height)

      // 第7块
      grid[6] = {}
      grid[6].src = new YccMathRect(0, centerRect.y + centerRect.height, centerRect.x, imgHeight - centerRect.y - centerRect.height)
      grid[6].dest = new YccMathRect(rect.x, rect.y + rect.height - grid[6].src.height, grid[6].src.width, grid[6].src.height)

      // 第9块
      grid[8] = {}
      grid[8].src = new YccMathRect(centerRect.x + centerRect.width, centerRect.y + centerRect.height, imgWidth - centerRect.x - centerRect.width, imgHeight - centerRect.y - centerRect.height)
      grid[8].dest = new YccMathRect(rect.width - grid[8].src.width + rect.x, rect.y + rect.height - grid[8].src.height, grid[8].src.width, grid[8].src.height)

      // 第2块
      grid[1] = {}
      grid[1].src = new YccMathRect(centerRect.x, 0, centerRect.width, centerRect.y)
      grid[1].dest = new YccMathRect(grid[0].dest.x + grid[0].dest.width, rect.y, rect.width - grid[0].dest.width - grid[2].dest.width, centerRect.y)

      // 第4块
      grid[3] = {}
      grid[3].src = new YccMathRect(grid[0].src.x, centerRect.y, grid[0].src.width, centerRect.height)
      grid[3].dest = new YccMathRect(grid[0].dest.x, grid[0].dest.y + grid[0].dest.height, grid[0].dest.width, rect.height - grid[0].dest.height - grid[6].dest.height)

      // 第6块
      grid[5] = {}
      grid[5].src = new YccMathRect(grid[2].src.x, centerRect.y, grid[2].src.width, centerRect.height)
      grid[5].dest = new YccMathRect(grid[2].dest.x, grid[3].dest.y, grid[2].dest.width, grid[3].dest.height)

      // 第8块
      grid[7] = {}
      grid[7].src = new YccMathRect(grid[1].src.x, grid[6].src.y, centerRect.width, grid[6].src.height)
      grid[7].dest = new YccMathRect(grid[1].dest.x, grid[6].dest.y, grid[1].dest.width, grid[6].dest.height)

      // 第5块
      grid[4] = {}
      grid[4].src = new YccMathRect(centerRect.x, centerRect.y, centerRect.width, centerRect.height)
      grid[4].dest = new YccMathRect(grid[1].dest.x, grid[5].dest.y, grid[1].dest.width, grid[5].dest.height)

      // console.log(grid)
      for (let k = 0; k < grid.length; k++) {
        if (!grid[k]) continue
        src = grid[k].src!.scaleBy(dpi, dpi, true)
        dest = grid[k].dest!.scaleBy(dpi, dpi, true)
        // console.log(src, dest)
        ctx.drawImage(img,
          // 源
          src.x, src.y, src.width, src.height,
          // 目标
          dest.x + worldAnchor.x, dest.y + worldAnchor.y, dest.width, dest.height
        )
      }
    }

    ctx.restore()
  }
}
