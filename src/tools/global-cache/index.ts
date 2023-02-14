interface GlobalCache {
  /**
   * 环境变量
   */
  env?: 'h5' | 'wxapp' | 'wxgame'

  /**
   * 帧率
   */
  frameRate?: number
}
let GLOBAL_CACHE: GlobalCache = {}

GLOBAL_CACHE = JSON.parse(localStorage.getItem('ycc_global') ?? '{}')

/**
 * 获取/设置全局的配置
 * @param key
 * @returns
 */
export function YccGlobal <K extends keyof GlobalCache> (key: K, value?: GlobalCache[K]) {
  GLOBAL_CACHE[key] = value
  localStorage.setItem('ycc_global', JSON.stringify(GLOBAL_CACHE))

  return GLOBAL_CACHE[key]
}

/**
 * 设置全局配置
 * @param key
 * @param value
 */
export function SetGlobal <K extends keyof GlobalCache> (key: K, value: GlobalCache[K]) {
  GLOBAL_CACHE[key] = value
  localStorage.setItem('ycc_global', JSON.stringify(GLOBAL_CACHE))
}
