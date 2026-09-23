export type PdfToolType = 'select' | 'text' | 'pen' | 'highlight' | 'shape' | 'image' | 'signature' | 'stamp' | 'comment' | 'eraser';

export interface PdfAnnotation {
  id: string;
  type: string;
  pageIndex: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  fontSize?: number;
  opacity?: number;
}

export interface PdfPage {
  index: number;
  width: number;
  height: number;
}

export interface PdfProject {
  id: string;
  name: string;
  data: ArrayBuffer;
  pages: PdfPage[];
  annotations: PdfAnnotation[];
}
