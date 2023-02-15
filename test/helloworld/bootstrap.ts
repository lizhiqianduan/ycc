/**
 * bootstrap启动文件
 * 一些异步操作、资源加载等，都可以在此文件进行
 */
import { SetGlobal } from '@datagetter.cn/ycc/tools/global-cache/index'
import { loadResources, setup } from './src/app'

SetGlobal('env', 'h5')
SetGlobal('frameRate', 60)

// 加载资源后，执行setup函数启动APP
loadResources(setup)
