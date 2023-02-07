
/**
 * 点的定义
 */
export class YccMathDot {
  x: number
  y: number
  constructor (x?: number, y?: number) {
    this.x = x ?? 0
    this.y = y ?? 0
  }

  isEqual (dot: YccMathDot) {
    return this.x === dot.x && this.y === dot.y
  }

  /**
   * 点是否在某个区域内
   */
  isInRect (rect: YccMathRect) {
    return this.x >= rect.x && this.x <= rect.x + rect.width && this.y >= rect.y && this.y <= rect.y + rect.height
  }

  /**
   * 点的加法/点的偏移量
   * @param dot {YccMathDot} 加的点
   * @return {YccMathDot} 返回一个新的点
   */
  plus (dot: YccMathDot) {
    return new YccMathDot(this.x + dot.x, this.y + dot.y)
  }

  /**
   * 缩放比例
   * @param x x轴的缩放
   * @param y y轴的缩放
   */
  divide (dot: YccMathDot) {
    return new YccMathDot(Math.floor(this.x / dot.x), Math.floor(this.y / dot.y))
  }

  /**
   * 适配dpi，去除dpi的影响，转换为物理像素
   * @param dpi
   * @returns
   */
  dpi (dpi: number = 1) {
    return this.divide(new YccMathDot(1 / dpi, 1 / dpi))
  }

  /**
   * 将当前点绕另外一个点旋转一定度数
   * @param rotation  旋转角度
   * @param anchorDot  锚点坐标
   * @return 旋转后的点
   */
  rotate (rotation: number, anchorDot?: YccMathDot) {
    anchorDot = anchorDot ?? new YccMathDot(0, 0)
    const dotX = this.x; const dotY = this.y; const anchorX = anchorDot.x; const anchorY = anchorDot.y
    const dx = (dotX - anchorX) * Math.cos(rotation / 180 * Math.PI) - (dotY - anchorY) * Math.sin(rotation / 180 * Math.PI) + anchorX
    const dy = (dotY - anchorY) * Math.cos(rotation / 180 * Math.PI) + (dotX - anchorX) * Math.sin(rotation / 180 * Math.PI) + anchorY
    return new YccMathDot(dx, dy)
  }

  /**
   * 判断三点是否共线
   * @param dot1
   * @param dot2
   * @param dot3
   */
  static threeDotIsOnLine (dot1: YccMathDot, dot2: YccMathDot, dot3: YccMathDot) {
    // 存在位置相同点肯定共线
    if (dot1.isEqual(dot2) || dot1.isEqual(dot3) || dot2.isEqual(dot3)) { return true }
    // 三个点x一样
    if (dot1.x === dot2.x && dot2.x === dot3.x) { return true }
    const k1 = Math.abs(dot1.y - dot2.y) / Math.abs(dot1.x - dot2.x)
    const k2 = Math.abs(dot1.y - dot3.y) / Math.abs(dot1.x - dot3.x)
    return k1 === k2
  }
}

/**
 * 区域的定义
 */
export class YccMathRect {
  x: number
  y: number
  width: number
  height: number

  constructor (x?: number, y?: number, width?: number, height?: number) {
    /**
     * 左上角x坐标
     * @type {number}
     */
    this.x = x ?? 0
    /**
      * 左上角y坐标
      * @type {number}
      */
    this.y = y ?? 0
    /**
      * 区域宽
      * @type {number}
      */
    this.width = width ?? 0
    /**
      * 区域高
      * @type {number}
      */
    this.height = height ?? 0
  }

  /**
   * 将矩形的长和宽转换为正数
   */
  toPositive () {
    const x0 = this.x
    const y0 = this.y
    const x1 = this.x + this.width
    const y1 = this.y + this.height
    this.x = x0 < x1 ? x0 : x1
    this.y = y0 < y1 ? y0 : y1
    this.width = Math.abs(this.width)
    this.height = Math.abs(this.height)
  }

  /**
   * 获取区域的顶点列表
   * @return {YccMathDot[]}
   */
  getCoordinates () {
    return [
      new YccMathDot(this.x, this.y),
      new YccMathDot(this.x + this.width, this.y),
      new YccMathDot(this.x + this.width, this.y + this.height),
      new YccMathDot(this.x, this.y + this.height),
      new YccMathDot(this.x, this.y)
    ]
  }

  /**
   * 适配dpi，去除dpi的影响，使用物理像素
   * @param dpi
   */
  dpi (dpi: number = 1) {
    return new YccMathRect(this.x * dpi, this.y * dpi, this.width * dpi, this.height * dpi)
  }

  /**
   * 根据向量更新区域
   * @param vertices
   */
  updateByVertices (vertices: Array<{ x: number, y: number }>) {
    if (vertices.length !== 2) { console.error('数组参数有问题！'); return this }
    this.x = vertices[0].x
    this.y = vertices[0].y
    this.width = vertices[1].x - this.x
    this.height = vertices[2].y - this.y
    return this
  }
}

/**
   * 向量构造函数
   * @constructor
   */
export class YccMathVector {
  x: number
  y: number
  z: number
  constructor (x?: number, y?: number, z?: number) {
    this.x = x ?? 0
    this.y = y ?? 0
    this.z = z ?? 0
  }

  /**
     * 向量的点乘法
     * @param v2 {Ycc.Math.Vector} 点乘向量
     * @return {number}
     */
  dot (v2: YccMathVector) {
    return this.x * v2.x + this.y * v2.y + this.z * v2.z
  }

  /**
     * 向量的叉乘法
     * @param v2 {Ycc.Math.Vector} 叉乘向量
     * @return {number}
     */
  cross (v2: YccMathVector) {
    const res = new YccMathVector()
    res.x = this.y * v2.z - v2.y * this.z
    res.y = v2.x * this.z - this.x * v2.z
    res.z = this.x * v2.y - v2.x * this.y
    return res
  }

  /**
   * 获取向量的模长
   * @return {number}
   */
  getLength () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }
}

/**
   * 矩阵的构造方法。
   * @param data  {array}    矩阵所有行拼接的数组
   * @param m    {number}  行数
   * @param n    {number}  列数
   * @constructor
   */
export class YccMathMatrix {
  data: number[]
  m: number
  n: number
  constructor (data?: number[], m?: number, n?: number) {
    this.data = data ?? [] as number[]
    this.m = m ?? 0
    this.n = n ?? 0
  }

  /**
   * 矩阵点乘法
   * @param M  {Ycc.Math.Matrix}  另一个矩阵
   */
  dot (M: { m: any, n: any, get: (arg0: number, arg1: number) => number }) {
    if (M.m !== this.n || M.n !== this.m) { console.error('两个矩阵的行数和列数不对应，不能相乘！'); return }

    const N = new YccMathMatrix([], this.m, this.m)
    // 循环行
    for (let i = 1; i <= this.m; i++) {
      // 循环矩阵赋值
      for (let k = 1; k <= this.m; k++) {
        let temp = 0
        // 循环列
        for (let j = 1; j <= this.n; j++) {
          temp += this.get(i, j) * M.get(j, k)
        }
        N.set(i, k, temp)
      }
    }
    return N
  }

  /**
   * 获取矩阵i行j列的元素。
   * 注：i，i下标从1开始
   * @param i
   * @param j
   * @return {number}
   */
  get (i: number, j: number) {
    return this.data[(i - 1) * this.n + j - 1]
  }

  /**
   * 设置矩阵i行j列的元素为val
   * 注：i，i下标从1开始
   * @param i
   * @param j
   * @param val
   */
  set (i: number, j: number, val: any) {
    this.data[(i - 1) * this.n + j - 1] = val
  }
}
