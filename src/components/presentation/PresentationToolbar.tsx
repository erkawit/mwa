import { useState } from 'react';
import { 
  ArrowLeft, Type, Image as ImageIcon, Square, Table, 
  Play, Download, Video, Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, ChevronDown, 
  Circle, Triangle, Star, ArrowRight, Minus, Diamond
} from 'lucide-react';
import type { SlideElement, SlideElementType } from '../../types/presentation';

interface PresentationToolbarProps {
  projectTitle: string;
  selectedElement: SlideElement | null;
  onUpdateTitle: (title: string) => void;
  onAddElement: (type: SlideElementType, config?: Partial<SlideElement>) => void;
  onUpdateElement: (elementId: string, updates: Partial<SlideElement>) => void;
  onPresent: () => void;
  onExport: () => void;
  onSendToMultimedia: () => void;
  onGoHome: () => void;
}

export const PresentationToolbar: React.FC<PresentationToolbarProps> = ({
  projectTitle,
  selectedElement,
  onUpdateTitle,
  onAddElement,
  onUpdateElement,
  onPresent,
  onExport,
  onSendToMultimedia,
  onGoHome
}) => {
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 font-sans shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onGoHome}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          <span>กลับหน้าหลัก</span>
        </button>
        <div className="h-6 w-px bg-slate-200"></div>
        <input 
          type="text" 
          value={projectTitle}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="text-lg font-medium text-slate-800 bg-transparent border-none outline-none hover:bg-slate-50 focus:bg-slate-50 px-2 py-1 rounded w-48"
          placeholder="ชื่อโปรเจกต์..."
        />
      </div>

      {/* Center - Tools & Formatting */}
      <div className="flex items-center gap-2">
        {selectedElement?.type === 'text' ? (
          // Text Formatting Toolbar
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
            <button 
              onClick={() => onUpdateElement(selectedElement.id, { 
                isBold: !selectedElement.isBold,
                fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold'
              })}
              className={`p-1.5 rounded transition-colors ${selectedElement.fontWeight === 'bold' || selectedElement.isBold ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200 text-slate-700'}`} 
              title="ตัวหนา"
            >
              <Bold size={16} />
            </button>
            <button 
              onClick={() => onUpdateElement(selectedElement.id, { 
                isItalic: !selectedElement.isItalic,
                fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic'
              })}
              className={`p-1.5 rounded transition-colors ${selectedElement.fontStyle === 'italic' || selectedElement.isItalic ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200 text-slate-700'}`} 
              title="ตัวเอียง"
            >
              <Italic size={16} />
            </button>
            <button 
              onClick={() => onUpdateElement(selectedElement.id, { 
                textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline'
              })}
              className={`p-1.5 rounded transition-colors ${selectedElement.textDecoration === 'underline' ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200 text-slate-700'}`} 
              title="ขีดเส้นใต้"
            >
              <Underline size={16} />
            </button>
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            <button 
              onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'left' })}
              className={`p-1.5 rounded transition-colors ${selectedElement.textAlign === 'left' ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200 text-slate-700'}`}
              title="ชิดซ้าย"
            >
              <AlignLeft size={16} />
            </button>
            <button 
              onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'center' })}
              className={`p-1.5 rounded transition-colors ${selectedElement.textAlign === 'center' ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200 text-slate-700'}`}
              title="กึ่งกลาง"
            >
              <AlignCenter size={16} />
            </button>
            <button 
              onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'right' })}
              className={`p-1.5 rounded transition-colors ${selectedElement.textAlign === 'right' ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200 text-slate-700'}`}
              title="ชิดขวา"
            >
              <AlignRight size={16} />
            </button>
          </div>
        ) : (
          // Add Elements Toolbar
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onAddElement('text')}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-md text-slate-700 text-sm font-medium transition-colors"
            >
              <Type size={16} />
              <span>ข้อความ</span>
            </button>
            <button 
              onClick={() => onAddElement('image')}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-md text-slate-700 text-sm font-medium transition-colors"
            >
              <ImageIcon size={16} />
              <span>รูปภาพ</span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowShapeMenu(!showShapeMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-md text-slate-700 text-sm font-medium transition-colors"
              >
                <Square size={16} />
                <span>รูปทรง</span>
                <ChevronDown size={14} />
              </button>
              
              {showShapeMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 shadow-lg rounded-md p-2 flex gap-2 z-50 w-48 flex-wrap">
                  {[
                    { icon: Square, label: 'สี่เหลี่ยม', type: 'rectangle' as const },
                    { icon: Circle, label: 'วงกลม', type: 'circle' as const },
                    { icon: Triangle, label: 'สามเหลี่ยม', type: 'triangle' as const },
                    { icon: Star, label: 'ดาว', type: 'star' as const },
                    { icon: ArrowRight, label: 'ลูกศร', type: 'arrow' as const },
                    { icon: Minus, label: 'เส้นตรง', type: 'line' as const },
                    { icon: Diamond, label: 'เพชร', type: 'diamond' as const }
                  ].map((shape, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        onAddElement('shape', { shapeType: shape.type });
                        setShowShapeMenu(false);
                      }}
                      className="p-2 hover:bg-slate-100 rounded text-slate-600" 
                      title={shape.label}
                    >
                      <shape.icon size={20} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => onAddElement('table')}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-md text-slate-700 text-sm font-medium transition-colors"
            >
              <Table size={16} />
              <span>ตาราง</span>
            </button>
          </div>
        )}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onPresent}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 text-sm font-medium transition-colors"
        >
          <Play size={16} />
          <span>นำเสนอ</span>
        </button>
        <button 
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 text-sm font-medium transition-colors"
        >
          <Download size={16} />
          <span>ส่งออก</span>
        </button>
        <button 
          onClick={onSendToMultimedia}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-app-primary hover:bg-blue-700 rounded-md text-white text-sm font-medium transition-colors"
        >
          <Video size={16} />
          <span>นำไปตัดต่อ</span>
        </button>
      </div>
    </div>
  );
};

export default PresentationToolbar;
