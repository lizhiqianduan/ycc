import Ycc, { YccMathDot, YccUI } from '../../ycc/Ycc.class'

// const canvasDom = document.getElementById('canvas') as HTMLCanvasElement

class App extends Ycc {
  main () {
    document.getElementById('canvas')?.appendChild(this.stage.stageCanvas)
    new YccUI({
      coordinates: [
        new YccMathDot(10, 10),
        new YccMathDot(200, 10),
        new YccMathDot(10, 200),
        new YccMathDot(10, 10)
      ]
    }).addToLayer(this.stage.defaultLayer)
    this.stage.renderAll()
    // window.ycc = this
  }
}

new App().main()
