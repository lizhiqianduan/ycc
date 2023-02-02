import YccUI, { YccUICommonProps } from './YccUI';
/**
 * Text属性，继承自公用属性
 */
interface YccUITextProps extends YccUICommonProps {
    /**
     * 文本内容
     */
    value: string;
    /**
     * 文本样式
     */
    style?: {
        color?: string;
        fontSize?: number;
    };
}
export default class TextUI extends YccUI<YccUITextProps> {
    getDefaultProps(): YccUITextProps;
    /**
     * 绘制函数
     */
    render(): void;
}
export {};
