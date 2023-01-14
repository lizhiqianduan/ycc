import Ycc from './Ycc.class'
import YccPolyfill from './YccPolyfill.class'
import YccUI from './YccUI.class'

export default class YccLayer extends YccPolyfill {
  yccClass: any
  uiList: YccUI[]
  uiCountRecursion: number
  uiCountRendered: number
  ctx: null
  useCache: boolean
  ctxCache: null
  ctxCacheRect: null
  renderCacheRect: boolean
  id: number
  type: string
  textValue: string
  name: any
  x: number
  y: number
  width: any
  height: any
  show: boolean
  ghost: boolean
  enableEventManager: boolean
  enableFrameEvent: boolean
  onFrameComing: () => void

  constructor (ycc: Ycc) {
    super(ycc)

    /**
     * 存储图层中的所有UI。UI的顺序，即为图层中的渲染顺序。
     */
    this.uiList = []

    /**
     * 该图层ui的总数（只在渲染之后赋值）
     * @type {number}
     */
    this.uiCountRecursion = 0

    /**
     * 该图层渲染的ui总数(只在渲染之后赋值）
     * @type {number}
     */
    this.uiCountRendered = 0

    /**
     * 当前图层的绘图环境
     * @type {CanvasRenderingContext2D}
     */
    this.ctx = null

    /**
     * 是否使用独立的缓存canvas
     * @type {boolean}
     */
    this.useCache = false

    /**
     * 图层的缓存绘图环境
     */
    this.ctxCache = null

    /**
     * 缓存时drawImage所绘制的最小区域
     * @type {Ycc.Math.Rect}
     */
    this.ctxCacheRect = null

    /**
     * 是否以红色方框框选缓存的最小区域，调试时可使用
     * @type {boolean}
     */
    this.renderCacheRect = false

    /**
     * 图层id
     */
    this.id = layerIndex++

    /**
     * 图层类型。
     * `ui`表示用于绘图的图层。`tool`表示辅助的工具图层。`text`表示文字图层。
     * 默认为`ui`。
     */
    this.type = 'ui'

    /**
     * 图层中的文字。仅当图层type为text时有值。
     * @type {string}
     */
    this.textValue = ''

    /**
     * 图层名称
     * @type {string}
     */
    this.name = option.name ? option.name : '图层_' + this.type + '_' + this.id

    /**
     * 图层位置的x坐标。默认与舞台左上角重合
     * @type {number}
     */
    this.x = 0

    /**
     * 图层位置的Y坐标。默认与舞台左上角重合
     * @type {number}
     */
    this.y = 0

    /**
     * 图层宽
     * @type {number}
     */
    this.width = yccInstance.getStageWidth()
    /**
     * 图层高
     * @type {number}
     */
    this.height = yccInstance.getStageHeight()

    /**
     * 图层是否显示
     */
    this.show = true

    /**
     * 图层是否幽灵，幽灵状态的图层，getUIFromPointer 会直接跳过整个图层
     * @type {boolean}
     */
    this.ghost = false

    /**
     * 是否监听舞台的事件。用于控制舞台事件是否广播至图层。默认关闭
     * @type {boolean}
     */
    this.enableEventManager = false

    /**
     * 是否接收每帧更新的通知。默认为false
     * @type {boolean}
     */
    this.enableFrameEvent = false

    /**
     * 若接收通知，此函数为接收通知的回调函数。当且仅当enableFrameEvent为true时生效
     * @type {function}
     */
    this.onFrameComing = function () { }
  }
}
