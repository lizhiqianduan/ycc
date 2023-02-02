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
    get(option: {
        url: string;
        successCb: (data: any) => void;
        errorCb: (e: any) => {};
        responseType: string;
    }): void;
}
