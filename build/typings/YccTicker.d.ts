import Ycc from './Ycc';
/**
 * 帧 私有类
 * @constructor
 * @param ticker {Ycc.Ticker}
 */
declare class Frame {
    createTime: number;
    deltaTime: number;
    fps: number;
    frameCount: number;
    isRendered: boolean;
    constructor(ticker: YccTicker);
}
/**
 * 系统心跳管理类。
 * 管理系统的心跳；自定义帧事件的广播；帧更新图层的更新等。
 *
 * 注：
 * 心跳间隔时间为1e3/60；
 * 无论帧率为多少，心跳间隔时间不变；
 * 总帧数<=总心跳次数；
 * 只有当总帧数*每帧的理论时间小于总心跳时间，帧的监听函数才会触发，以此来控制帧率；
 *
 * @param yccInstance
 * @constructor
 */
export default class YccTicker {
    yccInstance: Ycc;
    currentFrame?: Frame;
    startTime: number;
    lastFrameTime: number;
    lastFrameTickerCount: number;
    deltaTime: number;
    deltaTimeExpect: number;
    deltaTimeRatio: number;
    frameListenerList: Array<(frame: Frame) => void>;
    defaultFrameRate: number;
    defaultDeltaTime: number;
    tickerSpace: number;
    frameAllCount: number;
    timerTickCount: number;
    _timerId: number;
    _isRunning: boolean;
    constructor(yccInstance: Ycc);
    /**
       * 定时器开始
       * @param [frameRate] 心跳频率，即帧率
       * 可取值有[60,30,20,15]
       */
    start(frameRate: number): this;
    /**
       * 停止心跳
       */
    stop(): void;
    /**
       * 给每帧添加自定义的监听函数
       * @param listener
       */
    addFrameListener(listener: (frame: Frame) => void): this;
    /**
       * 移除某个监听函数
       * @param listener
       */
    removeFrameListener(listener: () => void): this;
    /**
       * 执行所有自定义的帧监听函数
       */
    private _broadcastFrameEvent;
}
export {};
