/**
 * bootstrap启动文件
 * 一些异步操作、资源加载等，都可以在此文件进行
 */
import { SetGlobal } from '@datagetter.cn/ycc/tools/YccGlobalCache'
import { loadResParallel, Resource } from '@datagetter.cn/ycc/tools/YccLoader'
import { createImage } from '@datagetter.cn/ycc/tools/YccPolyfill'
import App from './src/app'

SetGlobal('env', 'h5')
SetGlobal('frameRate', 60)

const app = new App()
const resources: Resource[] = [
  {
    name: 'test',
    url: 'https://smartedu.jnei.cn/upload/files/upload/ce155375-3dc3-479e-b4d4-8690cc906d40_WechatIMG15%402x.a69e9004.png',
    crossOrigin: '*',
    element: createImage(app)
  }
]

loadResParallel(resources, () => {
  console.log('资源加载结束', resources)
  app.bootstrap()
})
