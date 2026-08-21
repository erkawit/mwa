import type { CustomFont, TextEffectConfig } from '../types';

export const defaultFonts: CustomFont[] = [
  { name: 'Prompt (ฟอนต์ระบบ UI)', family: 'Prompt, sans-serif' },
  { name: 'Sarabun (สารบรรณ)', family: 'Sarabun, sans-serif' },
  { name: 'Kanit (คณิต)', family: 'Kanit, sans-serif' },
  { name: 'Inter (สากล)', family: 'Inter, sans-serif' },
  { name: 'TH Sarabun New', family: "'TH Sarabun New', Sarabun, sans-serif" },
  { name: 'Tahoma (ฟอนต์มาตรฐาน Windows)', family: 'Tahoma, sans-serif' },
  { name: 'Segoe UI (Windows)', family: "'Segoe UI', sans-serif" },
  { name: 'Arial (Standard)', family: 'Arial, sans-serif' },
  { name: 'Impact (ตัวหนาพาดหัว)', family: 'Impact, sans-serif' },
  { name: 'Courier New (พิมพ์ดีด)', family: "'Courier New', monospace" },
];

/**
 * Load system fonts installed on user machine if browser supports Local Font Access API
 */
export async function getSystemLocalFonts(): Promise<CustomFont[]> {
  try {
    if ('queryLocalFonts' in window) {
      // @ts-ignore
      const availableFonts = await window.queryLocalFonts();
      const uniqueFamilies = Array.from(new Set(availableFonts.map((f: any) => f.family))) as string[];
      return uniqueFamilies.slice(0, 40).map((family) => ({
        name: `${family} (จากเครื่อง)`,
        family: `"${family}", sans-serif`,
      }));
    }
  } catch (e) {
    console.log('Local Font Access API not permitted or available, using standard system fonts.');
  }
  return [];
}

/**
 * Dynamically register a user-uploaded custom font (.ttf, .otf, .woff, .woff2)
 */
export async function registerCustomFont(file: File): Promise<CustomFont> {
  const fontName = file.name.replace(/\.[^/.]+$/, '').trim();
  const fontUrl = URL.createObjectURL(file);
  
  const fontFace = new FontFace(fontName, `url(${fontUrl})`);
  const loadedFace = await fontFace.load();
  document.fonts.add(loadedFace);

  return {
    name: `${fontName} (ฟอนต์ที่อัปโหลด)`,
    family: `"${fontName}", sans-serif`,
    url: fontUrl,
    isUploaded: true,
  };
}

/**
 * Generate CSS styles for a text effect
 */
export function getTextEffectStyles(config: TextEffectConfig): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: config.fontFamily,
    fontSize: `${config.fontSize}px`,
    color: config.color,
    fontWeight: config.bold ? '700' : '500',
    fontStyle: config.italic ? 'italic' : 'normal',
    textAlign: config.align,
    transition: 'all 0.15s ease',
  };

  switch (config.effectType) {
    case 'shadow':
      return {
        ...base,
        textShadow: `0 4px 12px ${config.shadowColor || 'rgba(0,0,0,0.85)'}, 0 1px 3px rgba(0,0,0,0.9)`,
      };
    case 'neon':
      return {
        ...base,
        color: '#FFFFFF',
        textShadow: `0 0 5px #FFF, 0 0 10px ${config.shadowColor || '#3B82F6'}, 0 0 20px ${config.shadowColor || '#3B82F6'}, 0 0 40px ${config.shadowColor || '#3B82F6'}`,
      };
    case 'outline':
      return {
        ...base,
        WebkitTextStroke: `${config.strokeWidth || 2}px ${config.strokeColor || '#000000'}`,
        paintOrder: 'stroke fill',
      };
    case 'gradient': {
      const g1 = config.gradientColors?.[0] || '#60A5FA';
      const g2 = config.gradientColors?.[1] || '#EC4899';
      return {
        ...base,
        backgroundImage: `linear-gradient(135deg, ${g1}, ${g2})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block',
      };
    }
    case '3d':
      return {
        ...base,
        textShadow: `
          0 1px 0 #ccc,
          0 2px 0 #c9c9c9,
          0 3px 0 #bbb,
          0 4px 0 #b9b9b9,
          0 5px 0 #aaa,
          0 6px 1px rgba(0,0,0,.1),
          0 0 5px rgba(0,0,0,.1),
          0 1px 3px rgba(0,0,0,.3),
          0 3px 5px rgba(0,0,0,.2),
          0 5px 10px rgba(0,0,0,.25)
        `,
      };
    case 'boxed':
      return {
        ...base,
        backgroundColor: config.boxBgColor || 'rgba(15, 23, 42, 0.85)',
        padding: `${config.boxPadding || 8}px 16px`,
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        display: 'inline-block',
      };
    default:
      return base;
  }
}
