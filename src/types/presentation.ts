// Slide element types
export type SlideElementType = 'text' | 'image' | 'shape' | 'table' | 'chart' | 'video';

export type SlideTransitionType = 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom-in' | 'zoom-out' | 'dissolve' | 'flip';

/**
 * องค์ประกอบภายในสไลด์ เช่น ข้อความ รูปภาพ หรือรูปร่าง
 */
export interface SlideElement {
  id: string;
  type: SlideElementType;
  x: number;           // ตำแหน่งแนวนอน เป็นเปอร์เซ็นต์ (0-100)
  y: number;           // ตำแหน่งแนวตั้ง เป็นเปอร์เซ็นต์ (0-100)
  width: number;       // ความกว้าง เป็นเปอร์เซ็นต์ (0-100)
  height: number;      // ความสูง เป็นเปอร์เซ็นต์ (0-100)
  rotation: number;    // องศาการหมุน
  opacity: number;     // ความโปร่งใส 0-1
  locked?: boolean;    // ล็อกไม่ให้แก้ไข
  
  // เฉพาะข้อความ
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  color?: string; // alias for textColor
  isBold?: boolean; // alias
  isItalic?: boolean; // alias
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: 'none' | 'underline';
  
  // เฉพาะรูปภาพ
  src?: string;
  alt?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
  
  // เฉพาะรูปร่าง
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'arrow' | 'line' | 'diamond' | 'hexagon';
  fillColor?: string;
  fill?: string; // alias for fillColor
  strokeColor?: string;
  stroke?: string; // alias for strokeColor
  strokeWidth?: number;
  
  // เงาและเอฟเฟกต์
  shadow?: {
    enabled: boolean;
    x: number;
    y: number;
    blur: number;
    color: string;
  };
}

/**
 * ข้อมูลของแต่ละสไลด์ในโปรเจกต์
 */
export interface Slide {
  id: string;
  elements: SlideElement[];
  background: string | {
    type: 'solid' | 'gradient' | 'image';
    color?: string;
    gradientFrom?: string;
    gradientTo?: string;
    gradientDirection?: number;
    imageSrc?: string;
  };
  transition?: SlideTransitionType;
  transitionDuration?: number; // วินาที
  notes?: string;
  order: number;
}

/**
 * โปรเจกต์งานนำเสนอ (Presentation)
 */
export interface PresentationProject {
  id: string;
  title: string;
  slides: Slide[];
  theme: PresentationTheme;
  aspectRatio: '16:9' | '4:3' | '16:10';
  createdAt: string;
  updatedAt: string;
}

/**
 * ธีมสีและฟอนต์สำหรับงานนำเสนอ
 */
export interface PresentationTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headingFontFamily: string;
}

/**
 * แม่แบบสไลด์ (Template)
 */
export interface SlideTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail?: string;
  slides: Slide[];
}

/**
 * แปลงค่า background ของสไลด์ให้เป็น React CSSProperties
 */
export function getSlideBackgroundStyle(bg?: Slide['background']): React.CSSProperties {
  if (!bg) return { backgroundColor: '#ffffff' };
  if (typeof bg === 'string') return { background: bg };
  if (bg.type === 'solid') return { backgroundColor: bg.color || '#ffffff' };
  if (bg.type === 'gradient') {
    const dir = bg.gradientDirection ?? 90;
    const from = bg.gradientFrom || '#ffffff';
    const to = bg.gradientTo || '#f1f5f9';
    return { background: `linear-gradient(${dir}deg, ${from}, ${to})` };
  }
  if (bg.type === 'image' && bg.imageSrc) {
    return {
      backgroundImage: `url(${bg.imageSrc})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { backgroundColor: '#ffffff' };
}

