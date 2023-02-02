/**
 * 点的定义
 */
export declare class YccMathDot {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    isEqual(dot: YccMathDot): boolean;
    /**
     * 点是否在某个区域内
     */
    isInRect(rect: YccMathRect): boolean;
    /**
     * 点的加法/点的偏移量
     * @param dot {YccMathDot} 加的点
     * @return {YccMathDot} 返回一个新的点
     */
    plus(dot: YccMathDot): YccMathDot;
    /**
     * 将当前点绕另外一个点旋转一定度数
     * @param rotation  旋转角度
     * @param anchorDot  锚点坐标
     * @return 旋转后的点
     */
    rotate(rotation: number, anchorDot?: YccMathDot): YccMathDot;
    /**
     * 判断三点是否共线
     * @param dot1
     * @param dot2
     * @param dot3
     */
    static threeDotIsOnLine(dot1: YccMathDot, dot2: YccMathDot, dot3: YccMathDot): boolean;
}
/**
 * 区域的定义
 */
export declare class YccMathRect {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x?: number, y?: number, width?: number, height?: number);
    /**
     * 将矩形的长和宽转换为正数
     */
    toPositive(): void;
    /**
     * 获取区域的顶点列表
     * @return {YccMathDot[]}
     */
    getVertices(): YccMathDot[];
    /**
     * 根据向量更新顶点数值
     * @param vertices
     */
    updateByVertices(vertices: Array<{
        x: number;
        y: number;
    }>): boolean;
}
/**
   * 向量构造函数
   * @constructor
   */
export declare class YccMathVector {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    /**
       * 向量的点乘法
       * @param v2 {Ycc.Math.Vector} 点乘向量
       * @return {number}
       */
    dot(v2: YccMathVector): number;
    /**
       * 向量的叉乘法
       * @param v2 {Ycc.Math.Vector} 叉乘向量
       * @return {number}
       */
    cross(v2: YccMathVector): YccMathVector;
    /**
     * 获取向量的模长
     * @return {number}
     */
    getLength(): number;
}
/**
   * 矩阵的构造方法。
   * @param data  {array}    矩阵所有行拼接的数组
   * @param m    {number}  行数
   * @param n    {number}  列数
   * @constructor
   */
export declare class YccMathMatrix {
    data: number[];
    m: number;
    n: number;
    constructor(data?: number[], m?: number, n?: number);
    /**
     * 矩阵点乘法
     * @param M  {Ycc.Math.Matrix}  另一个矩阵
     */
    dot(M: {
        m: any;
        n: any;
        get: (arg0: number, arg1: number) => number;
    }): YccMathMatrix | undefined;
    /**
     * 获取矩阵i行j列的元素。
     * 注：i，i下标从1开始
     * @param i
     * @param j
     * @return {number}
     */
    get(i: number, j: number): number;
    /**
     * 设置矩阵i行j列的元素为val
     * 注：i，i下标从1开始
     * @param i
     * @param j
     * @param val
     */
    set(i: number, j: number, val: any): void;
}
