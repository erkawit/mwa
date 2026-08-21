import React, { useRef, useState } from 'react';
import { 
  Type, 
  Upload, 
  Sparkles, 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Check,
  X
} from 'lucide-react';
import type { CustomFont, TextEffectConfig, TimelineClip } from '../types';
import { defaultFonts, registerCustomFont, getTextEffectStyles } from '../utils/fontManager';
import { alertError } from '../utils/swal';

interface TextEffectEditorProps {
  clip: TimelineClip;
  customFonts: CustomFont[];
  onAddCustomFont: (font: CustomFont) => void;
  onSave: (clipId: string, text: string, effect: TextEffectConfig) => void;
  onClose: () => void;
}

export const TextEffectEditor: React.FC<TextEffectEditorProps> = ({
  clip,
  customFonts,
  onAddCustomFont,
  onSave,
  onClose,
}) => {
  const [text, setText] = useState(clip.textContent || clip.name || 'ข้อความพาดหัวของคุณ');
  const [config, setConfig] = useState<TextEffectConfig>(
    clip.textEffect || {
      fontFamily: 'Prompt, sans-serif',
      fontSize: 28,
      color: '#FFFFFF',
      bold: true,
      italic: false,
      align: 'center',
      effectType: 'shadow',
      shadowColor: 'rgba(0,0,0,0.85)',
      strokeColor: '#000000',
      strokeWidth: 2,
      gradientColors: ['#60A5FA', '#EC4899'],
      boxBgColor: 'rgba(15, 23, 42, 0.85)',
      boxPadding: 8,
      animation: 'none',
    }
  );

  const fontUploadRef = useRef<HTMLInputElement>(null);
  const allFonts = [...defaultFonts, ...customFonts];

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const loaded = await registerCustomFont(file);
      onAddCustomFont(loaded);
      setConfig(prev => ({ ...prev, fontFamily: loaded.family }));
    } catch (err) {
      alertError('เกิดข้อผิดพลาดในการโหลดฟอนต์', 'โปรดตรวจสอบว่าไฟล์ฟอนต์ถูกต้อง (.ttf, .otf, .woff, .woff2)');
    }
  };

  const handleApply = () => {
    onSave(clip.id, text, config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-md shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                แก้ไขข้อความ & ปรับแต่งสไตล์ฟอนต์ (Text & Font Effects)
              </h2>
              <p className="text-xs text-slate-500 font-doc">
                ปรับเปลี่ยนฟอนต์, อัปโหลดฟอนต์ใหม่ และใส่เอฟเฟกต์แบบเรียลไทม์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Live Preview Box */}
          <div className="bg-slate-900 rounded p-6 flex items-center justify-center min-h-[110px] border border-slate-700 relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]"></div>
            <div style={getTextEffectStyles(config)} className="relative z-10 select-none">
              {text || 'ตัวอย่างข้อความ'}
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">เนื้อหาข้อความ</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          {/* Font Selector & Custom Font Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">รูปแบบฟอนต์ (Font Family)</label>
                <button
                  type="button"
                  onClick={() => fontUploadRef.current?.click()}
                  className="text-[11px] text-purple-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <Upload className="w-3 h-3" />
                  <span>+ อัปโหลดฟอนต์ (.ttf/.otf)</span>
                </button>
                <input
                  type="file"
                  ref={fontUploadRef}
                  onChange={handleFontUpload}
                  accept=".ttf,.otf,.woff,.woff2"
                  className="hidden"
                />
              </div>

              <select
                value={config.fontFamily}
                onChange={(e) => setConfig(prev => ({ ...prev, fontFamily: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {allFonts.map((f, idx) => (
                  <option key={idx} value={f.family}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size & Alignment */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ขนาดฟอนต์ (Font Size)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="14"
                  max="72"
                  value={config.fontSize}
                  onChange={(e) => setConfig(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                  className="flex-1 h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-purple-600"
                />
                <span className="font-mono text-slate-700 font-semibold w-10 text-right">{config.fontSize}px</span>
              </div>
            </div>
          </div>

          {/* Styles & Colors Toolbar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* Bold / Italic */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, bold: !prev.bold }))}
                className={`flex-1 py-1 flex items-center justify-center rounded transition ${
                  config.bold ? 'bg-white shadow-2xs font-bold text-purple-700' : 'text-slate-600'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, italic: !prev.italic }))}
                className={`flex-1 py-1 flex items-center justify-center rounded transition ${
                  config.italic ? 'bg-white shadow-2xs italic text-purple-700' : 'text-slate-600'
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Text Alignment */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, align: a }))}
                  className={`flex-1 py-1 flex items-center justify-center rounded transition ${
                    config.align === a ? 'bg-white shadow-2xs text-purple-700' : 'text-slate-600'
                  }`}
                >
                  {a === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                  {a === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                  {a === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            {/* Primary Text Color */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded">
              <span className="text-slate-600 text-[11px]">สีตัวอักษร:</span>
              <input
                type="color"
                value={config.color}
                onChange={(e) => setConfig(prev => ({ ...prev, color: e.target.value }))}
                className="w-6 h-6 border-0 rounded cursor-pointer p-0 bg-transparent"
              />
            </div>

            {/* Shadow / Outline Color */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded">
              <span className="text-slate-600 text-[11px]">สีเงา/ขอบ:</span>
              <input
                type="color"
                value={config.shadowColor || config.strokeColor || '#000000'}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  shadowColor: e.target.value,
                  strokeColor: e.target.value 
                }))}
                className="w-6 h-6 border-0 rounded cursor-pointer p-0 bg-transparent"
              />
            </div>
          </div>

          {/* Effect Type Presets */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>เอฟเฟกต์ตัวอักษร (Text Effect Presets)</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'none', label: 'ปกติ (Normal)' },
                { id: 'shadow', label: 'เงาตกกระทบ (Drop Shadow)' },
                { id: 'neon', label: 'นีออนเรืองแสง (Neon Glow)' },
                { id: 'outline', label: 'เส้นขอบ (Outline Stroke)' },
                { id: 'gradient', label: 'สีไล่เฉด (Gradient)' },
                { id: '3d', label: '3D Extrusion' },
                { id: 'boxed', label: 'กล่องข้อความ (Boxed)' },
              ].map((eff) => (
                <button
                  key={eff.id}
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, effectType: eff.id as any }))}
                  className={`py-2 px-2.5 rounded border text-left text-xs transition font-sans ${
                    config.effectType === eff.id
                      ? 'bg-purple-50 border-purple-400 text-purple-900 font-medium ring-1 ring-purple-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {eff.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-300 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded shadow-sm transition flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>บันทึกการเปลี่ยนแปลง</span>
          </button>
        </div>
      </div>
    </div>
  );
};
