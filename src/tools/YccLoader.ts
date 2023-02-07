import Ycc from '../Ycc'
import { createImage } from './YccPolyfill'

export interface Resource {
  /**
   * 资源的名称
   */
  name: string
  /**
   * 资源的远端链接
   */
  url: string
  /**
   * 资源的类型
   */
  type: 'image' | 'audio'
  /**
   * 资源加载的html元素
   */
  element?: HTMLImageElement | HTMLAudioElement
  /**
   * 图片跨域标识
   */
  crossOrigin?: string

  /**
   * 是否加载成功
   */
  success?: boolean

  /**
   * 加载失败的错误消息
   */
  errorMsg?: string
}

/**
 * 资源加载完成后的数据结构
 */
export interface LoaderResult {
  /**
   * 成功的总数
   */
  successCnt: number
  /**
   * 资源的总数
   */
  totalCnt: number

  /**
   * 数组资源集合
   */
  resArr: Resource[]
  /**
   * Map资源集合
   */
  resMap: Record<string, Resource>
}
/**
 * 进度回调
 */
type ProgressCb = (curRes: Resource, index: number) => void

/**
 * 结果回调
 */
type EndCb = (result: LoaderResult) => void

/**
 * 批量加载资源，并发加载
 */
export class ParallelLoader {
  resArr: Resource[]
  ycc: Ycc
  endCb?: EndCb
  progressCb?: ProgressCb
  constructor (ycc: Ycc, resArr: Resource[]) {
    this.ycc = ycc
    this.resArr = resArr
  }

  bind: (ycc: Ycc) => ParallelLoader = (ycc) => {
    this.ycc = ycc
    return this
  }

  load: (endCb: EndCb, progressCb?: ProgressCb) => ParallelLoader = (endCb, progressCb) => {
    const { ycc, resArr } = this
    this.endCb = endCb
    this.progressCb = progressCb
    // 加载完成后的数组
    const endResArr: Resource[] = []
    // 加载完成后的record
    const endResMap: Record<string, Resource> = {}

    let endLen = 0
    let successCnt = 0
    for (let i = 0; i < resArr.length; i++) {
      const curRes = resArr[i]
      // 新建资源
      if (curRes.type === 'image') { curRes.element = createImage(ycc) }
      if (curRes.type === 'audio') { curRes.element = new Audio() }
      console.log(curRes.type)

      loadResource(curRes, res => {
        if (progressCb) progressCb(res, i)
        endResArr.push(res)
        endResMap[res.name] = res
        endLen++
        if (res.success) successCnt++
        if (endLen === resArr.length) {
          if (endCb) {
            endCb({
              totalCnt: resArr.length,
              successCnt,
              resArr: endResArr,
              resMap: endResMap
            })
          }
        }
      })
    }
    return this
  }

  end: (endCb: EndCb) => ParallelLoader = (endCb) => {
    this.endCb = endCb
    return this
  }

  progress: (progressCb: ProgressCb) => ParallelLoader = (progressCb) => {
    this.progressCb = progressCb
    return this
  }
}

/**
 * 加载一个资源
 * @param res
 * @param endCb
 */
export function loadResource (res: Resource, endCb: (res: Resource) => void) {
  if ((res.element instanceof HTMLImageElement)) {
    loadImage(res, endCb)
  }
  if ((res.element instanceof Audio)) {
    loadAudio(res, endCb)
  }
}

/**
 * 加载一张图片，回调返回加载后的资源
 * @param res
 * @param endCb
 */
export function loadImage (res: Resource, endCb: (res: Resource) => void) {
  res.success = false
  if (!(res.element instanceof HTMLImageElement)) { endCb(res); return }
  res.type = 'image'
  if ((res.element.setAttribute) != null) {
    res.element.setAttribute('src', res.url)
    res.element.setAttribute('crossOrigin', res.crossOrigin ?? '')
  }

  res.element.onload = (e) => {
    res.success = true
    endCb(res)
  }
  res.element.onerror = (e) => {
    res.errorMsg = (e as string).toString()
    endCb(res)
  }
}

/**
 * 加载一个音频，回调返回加载后的资源
 * @param res
 * @param endCb
 */
export function loadAudio (res: Resource, endCb: (res: Resource) => void) {
  res.success = false
  if (!(res.element instanceof Audio)) { endCb(res); return }
  res.type = 'audio'
  if ((res.element.setAttribute) != null) {
    res.element.setAttribute('src', res.url)
    res.element.setAttribute('crossOrigin', res.crossOrigin ?? '')
    res.element.setAttribute('preload', 'load')
  }

  res.element.onloadedmetadata = (e) => {
    res.success = true
    endCb(res)
  }
  res.element.onerror = e => {
    res.errorMsg = (e as string).toString()
    endCb(res)
  }
}
