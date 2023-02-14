export interface YccFrame {
  /**
      * 帧创建时间
      * @type {number}
      */
  createTime: number
  /**
        * 与上一帧的时间差
        * @type {number}
        */
  deltaTime: number
  /**
        * 实时帧率
        * @type {number}
        */
  fps: number
  /**
        * 帧下标，表示第几帧
        * @type {number}
        */
  frameCount: number

  /**
   * 当前帧对应的心跳数
   */
  tickerCount: number
  /**
        * 当前帧是否已全部绘制，ticker回调函数可根据此字段判断
        * 以此避免一帧内的重复绘制
        * @type {boolean}
        */
  isRendered: boolean
}

/**
 * 创建一帧
 * @param lastFrame
 * @returns
 */
export function createFrame (lastFrame?: YccFrame): YccFrame {
  const now = performance.now()
  if (lastFrame) {
    const deltaTime = now - lastFrame.createTime
    const fps = parseInt(`${1000 / deltaTime}`)
    const frameCount = lastFrame.frameCount + 1
    return {
      createTime: now,
      isRendered: false,
      tickerCount: 0,
      deltaTime,
      frameCount,
      fps
    }
  } else {
    return {
      createTime: now,
      isRendered: false,
      deltaTime: 0,
      tickerCount: 0,
      frameCount: 1,
      fps: 60
    }
  }
}
