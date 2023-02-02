import Polyfill from '../YccPolyfill';
interface Resource {
    name?: string;
    url: string;
    type?: 'image' | 'audio';
    res?: HTMLImageElement | HTMLAudioElement;
    crossOrigin?: string;
}
export default class YccPluginLoader extends Polyfill {
    loadResParallel(resArr: Resource[], endCb: () => void, progressCb: () => void, endResArr?: Resource[], endResMap?: Record<string, Resource>): void;
}
export {};
