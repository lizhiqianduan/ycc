/**
 * 与环境无关的所有方法
 */

/**
* 判断字符串
* @param str
* @return {boolean}
*/
export const isString = function (str: any) {
  return typeof (str) === 'string'
}

/**
* 判断数字
* @param str
* @return {boolean}
*/
export const isNum = function (str: any) {
  return typeof (str) === 'number'
}

/**
* 判断boolean
* @param str
* @return {boolean}
*/
export const isBoolean = function (str: any) {
  return typeof (str) === 'boolean'
}

/**
* 判断对象
* @param str
* @return {boolean}
*/
export const isObj = function (str: any) {
  return typeof (str) === 'object'
}
/**
* 判断函数
* @param str
* @return {boolean}
*/
export const isFn = function (str: any) {
  return typeof (str) === 'function'
}

/**
* 判断数组
* @param str
* @return {boolean}
*/
export const isArray = function (str: any) {
  return Object.prototype.toString.call(str) === '[object Array]'
}

/**
* 检测是否是移动端
* @return {boolean}
*/
export const isMobile = function () {
  const userAgentInfo = navigator.userAgent
  const Agents = ['Android', 'iPhone',
    'SymbianOS', 'Windows Phone',
    'iPad', 'iPod']
  let flag = false
  for (let v = 0; v < Agents.length; v++) {
    if (userAgentInfo.indexOf(Agents[v]) > 0) {
      flag = true
      break
    }
  }
  return flag
}

/**
 * 获取系统的dpi、高宽等尺寸
 * @returns
 */
export const getSystemInfo = () => {
  const dpi = window.devicePixelRatio ?? 1
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    dpi,
    renderWidth: window.innerWidth * dpi,
    renderHeight: window.innerWidth * dpi
  }
}
