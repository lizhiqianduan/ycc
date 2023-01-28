
// 兼容wx端
interface HTMLCanvasElement {
  createImage: () => HTMLImageElement
}

interface Window {
  webkitRequestAnimationFrame: typeof window.requestAnimationFrame
  mozRequestAnimationFrame: typeof window.requestAnimationFrame
  oRequestAnimationFrame: typeof window.requestAnimationFrame
  msRequestAnimationFrame: typeof window.requestAnimationFrame

  webkitCancelAnimationFrame: typeof window.cancelAnimationFrame
  mozCancelAnimationFrame: typeof window.cancelAnimationFrame
  oCancelAnimationFrame: typeof window.cancelAnimationFrame
}

interface HTMLCanvasElement {
  requestAnimationFrame?: typeof window.requestAnimationFrame

  cancelAnimationFrame?: typeof window.cancelAnimationFrame
}
