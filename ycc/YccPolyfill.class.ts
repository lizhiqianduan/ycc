/**
 * 此文件存储那些需要根据环境`ycc.appenv`兼容多个端的函数方法
 * 方法名全部小写
 */

import Ycc from './Ycc.class'

export default class YccPolyfill {
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
      return this.yccInstance.canvasDom.createImage()
    }
    return new Image()
  }
}
