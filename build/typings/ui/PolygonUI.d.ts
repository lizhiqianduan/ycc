import YccUI, { YccUICommonProps } from './YccUI';
interface PolygonUIProps extends YccUICommonProps {
}
/**
 * 多边形UI
 */
export default class PolygonUI extends YccUI<PolygonUIProps> {
    getDefaultProps(): {
        name?: string | undefined;
        belongTo?: import("../YccLayer").default | undefined;
        userData?: any;
        anchor: import("../YccMath").YccMathDot;
        rotation: number;
        coordinates: import("../YccMath").YccMathDot[];
        worldCoordinates: import("../YccMath").YccMathDot[];
        show: boolean;
        ghost: boolean;
        stopEventBubbleUp: boolean;
        opacity: number;
        lineWidth: number;
        strokeStyle: string;
        fill: boolean;
        fillStyle: string;
    };
    /**
     * 绘制函数
     */
    render(): void;
}
export {};
