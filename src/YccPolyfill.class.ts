/**
 * 此文件存储那些需要根据环境`ycc.appenv`兼容多个端的函数方法
 * 方法名全部小写
 */

import Ycc from './Ycc.class'

export default class YccPolyfill {
  /**
   * 应用的实例
   */
  yccInstance: Ycc

  constructor (ycc: Ycc) {
    this.yccInstance = ycc
  }

  /**
   *
   * @returns
   */
  _createImage (): HTMLImageElement {
    if (this.yccInstance.config.appenv === 'wxapp') {
      return this.yccInstance.stage.stageCanvas.createImage()
    }
    return new Image()
  }

  /**
 * 新创建canvas
 * @param options
 * @param options.width
 * @param options.height
 * @param options.dpi 像素比
 */
  createCanvas (options: { width: number, height: number, dpi?: number }) {
    const canvas = document.createElement('canvas')
    const dpi = options.dpi ?? 2
    // const dpi = 1

    // 设置dpi
    canvas.width = options.width * dpi
    canvas.height = options.height * dpi
    canvas.style.width = options.width.toString() + 'px'

    // 去除5px inline-block偏差
    canvas.style.display = 'block'
    // 返回值
    return canvas
  }
}
