/**
 * 此文件存储那些需要根据环境`ycc.appenv`兼容多个端的函数方法
 * 方法名全部小写
 */

/**
 * 创建canvas
 * @param options
 * @param options.width
 * @param options.height
 * @param options.dpi 像素比
 */
export function createCanvas (options: { width: number, height: number, dpi?: number }) {
  const canvas = document.createElement('canvas')
  const dpi = options.dpi ?? 2
  // const dpi = 1

  // 设置dpi
  canvas.width = options.width * dpi
  canvas.height = options.height * dpi
  canvas.style.width = options.width.toString() + 'px'

  // 去除5px inline-block偏差
  canvas.style.display = 'block'
  // debug
  // document.body.appendChild(canvas)
  // 返回值
  return canvas
}
/**
 * 创建图片
 * @param ycc
 * @returns
 */
export function createImage (): HTMLImageElement {
  // if (GetGlobal('env') === 'wxapp') {
  //   if (!ycc) { console.error('ycc实例必传'); return new HTMLImageElement() }
  //   return ycc.stage.stageCanvas.createImage()
  // }
  const img = new Image()
  // debug
  // document.body.appendChild(img)
  return img
}
