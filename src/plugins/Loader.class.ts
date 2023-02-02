import Polyfill from '../YccPolyfill'
import Ycc from '../Ycc'

interface Resource {
  name?: string
  url: string
  type?: 'image' | 'audio'
  res?: HTMLImageElement | HTMLAudioElement
  crossOrigin?: string
}

export default class YccPluginLoader extends Polyfill {
  loadResParallel (resArr: Resource[], endCb: () => void, progressCb: () => void, endResArr?: Resource[], endResMap?: Record<string, Resource>) {
    endResArr = (endResArr != null) ? endResArr : [] as Resource[]
    endResMap = (endResMap != null) ? endResMap : {}
    const self = this

    // 加载资源的监听函数
    const listener = (curRes: Resource, index: number, error: boolean) => {
      return function () {
        endResArr?.push(curRes)
        if (typeof curRes.name !== 'undefined') endResMap[curRes.name] = curRes.res
        Ycc.utils.isFn(progressCb) && progressCb(curRes, error, index)
        if (resArr.length === endResArr.length) {
          endCb(endResArr, endResMap)
        }
      }
    }

    for (let i = 0; i < resArr.length; i++) {
      const curRes = resArr[i]
      const errorEvent = 'error'
      curRes.type = curRes.type ?? 'image'

      if (curRes.type === 'image') {
        // curRes.res = new Image();
        curRes.res = self._createImage()
        if ((curRes.res?.setAttribute) != null) {
          curRes.res.setAttribute('src', curRes.url)
          curRes.res.setAttribute('crossOrigin', curRes.crossOrigin ?? '')
        }

        curRes.res.onload = listener(curRes, i, true)
      }
      if (curRes.type === 'audio') {
        curRes.res = new Audio()
        curRes.res.onloadedmetadata = listener(curRes, i, false)
        if ((curRes.res?.setAttribute) != null) {
          curRes.res.setAttribute('src', curRes.url)
          curRes.res.setAttribute('crossOrigin', curRes.crossOrigin ?? '')
          curRes.res.setAttribute('preload', 'load')
        }
      }
    }
  }
}
