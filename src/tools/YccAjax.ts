// declare function ajaxGet (option: { url: string, successCb: (data: any) => void, errorCb: (e: any) => {}, responseType: string }): any
/**
 * ajax get请求
 * @param url
 * @param successCb
 * @param successCb
 * @param responseType
 */
function ajaxGet (url: string, successCb: (data: any) => void, errorCb: (e: any) => void, responseType: XMLHttpRequestResponseType): any
/**
 * ajax get请求
 * @param option
 * @param option.url
 * @param option.successCb
 * @param option.successCb
 * @param option.responseType
 */
function ajaxGet (option: { url: string, successCb: (data: any) => void, errorCb: (e: any) => void, responseType: XMLHttpRequestResponseType }): any
function ajaxGet (option: any) {
  let {
    url,
    successCb,
    errorCb,
    responseType = 'json'
  } = option

  if (arguments.length === 1) {
    url = option.url
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
    successCb(request.response)
  }

  request.onerror = function (e) {
    errorCb(e)
  }
  request.send()
}

export { ajaxGet }
