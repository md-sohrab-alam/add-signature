declare module 'react-signature-canvas' {
  import * as React from 'react';

  export interface SignatureCanvasProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
    minWidth?: number;
    maxWidth?: number;
    penColor?: string;
    velocityFilterWeight?: number;
    dotSize?: number;
    minDistance?: number;
  }

  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    toDataURL(type?: string, encoderOptions?: number): string;
    fromDataURL(dataURL: string): void;
    getTrimmedCanvas(): HTMLCanvasElement;
    getCanvas(): HTMLCanvasElement;
    getPoints(): Array<any>;
    off(): void;
    on(): void;
  }
} 