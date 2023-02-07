/**
 * bootstrap启动文件
 * 一些异步操作、资源加载等，都可以在此文件进行
 */
import { SetGlobal } from '@datagetter.cn/ycc/tools/YccGlobalCache'
import { ParallelLoader, Resource } from '@datagetter.cn/ycc/tools/YccLoader'
import App from './src/app'

SetGlobal('env', 'h5')
SetGlobal('frameRate', 60)

const app = new App()

// 定义资源
const resources = [
  {
    name: 'test',
    type: 'image',
    url: 'https://smartedu.jnei.cn/upload/files/upload/ce155375-3dc3-479e-b4d4-8690cc906d40_WechatIMG15%402x.a69e9004.png',
    crossOrigin: '*'
  } as Resource,
  {
    name: 'test2',
    type: 'image',
    url: 'https://smartedu.jnei.cn/upload/files/upload/ce155375-3dc3-479e-b4d4-8690cc906d40_WechatIMG15%402x.a69e9004.png',
    crossOrigin: '*'
  } as Resource
]

new ParallelLoader(app, resources).load((result) => {
  console.log('资源加载结束', resources, result)
  // console.log(map?.test)
  app.bootstrap(result)
})
