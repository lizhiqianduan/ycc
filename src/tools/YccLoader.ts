
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
  type?: 'image' | 'audio'
  /**
   * 资源加载的html元素
   */
  element: HTMLImageElement | HTMLAudioElement
  /**
   * 图片跨域标识
   */
  crossOrigin?: string

  /**
   * 是否加载成功
   */
  success?: boolean
}

/**
 * 进度回调
 */
type ProgressCb = (curRes: Resource, index: number) => void
/**
 * 结果回调
 */
type EndCb = (endResArr: Resource[], endResMap?: Record<string, Resource>) => void

/**
 * 批量加载资源，并发加载
 * @param resArr
 * @param endCb
 * @param {ProgressCb} progressCb
 * @param endResArr
 * @param endResMap
 */
export function loadResParallel (resArr: Resource[], endCb: EndCb, progressCb?: ProgressCb, endResArr?: Resource[], endResMap?: Record<string, Resource>) {
  endResArr = (endResArr != null) ? endResArr : [] as Resource[]
  endResMap = (endResMap != null) ? endResMap : {}

  let endLen = 0
  for (let i = 0; i < resArr.length; i++) {
    const curRes = resArr[i]
    loadResource(curRes, res => {
      if (progressCb) progressCb(res, i)
      endResArr!.push(res)
      endLen++
      if (endLen === resArr.length) endCb(endResArr!)
    })
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
    loadImage(res, endCb)
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
  res.element.onerror = e => {
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
    endCb(res)
  }
}
