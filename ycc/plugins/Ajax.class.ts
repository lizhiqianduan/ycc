/**
     * 异步加载类
     * @constructor
     */
export default class YccPluginAjax {
  /**
   * ajax get请求
   * @param url
   * @param successCb 成功的回调函数
   * @param errorCb 失败的回调函数
   * @param responseType
   */

  /**
       * ajax get请求
       * @param option
       * @param option.url
       * @param option.successCb
       * @param option.successCb
       * @param option.responseType
       */
  get (option: { url: string, successCb: (data: any) => void, errorCb: (e: any) => {}, responseType: string }) {
    const self = this

    let {
      url,
      successCb,
      errorCb,
      responseType = 'json'
    } = option

    if (arguments.length === 1) {
      url = ''
      successCb = option.successCb
      errorCb = option.errorCb
      responseType = 'json'
    } else {
      url = arguments[0]
      successCb = arguments[1]
      errorCb = arguments[2]
      responseType = arguments[3]
    }

    const request = new XMLHttpRequest()
    request.open('GET', url, true)
    request.responseType = responseType as XMLHttpRequestResponseType

    // Decode asynchronously
    request.onload = function () {
      successCb.call(self, request.response)
    }

    request.onerror = function (e) {
      errorCb.call(self, e)
    }
    request.send()
  }
}
