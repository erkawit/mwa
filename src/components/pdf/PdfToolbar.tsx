import React from 'react';
import { 
  ArrowLeft, MousePointer2, Type, Pen, Eraser, 
  Image as ImageIcon, Square, MessageSquare, Plus, 
  Trash2, RotateCw, Layers, Download, Stamp, Signature,
  Highlighter
} from 'lucide-react';
import type { PdfToolType } from '../../types/pdf';

interface PdfToolbarProps {
  fileName: string;
  activeTool: PdfToolType;
  currentPage: number;
  totalPages: number;
  onToolChange: (tool: PdfToolType) => void;
  onAction: (action: string, params?: any) => void;
  onGoHome: () => void;
}

export const PdfToolbar: React.FC<PdfToolbarProps> = ({
  fileName,
  activeTool,
  currentPage,
  totalPages,
  onToolChange,
  onAction,
  onGoHome
}) => {
  const toolClass = (tool: PdfToolType) => 
    `p-2 rounded-md transition-colors ${activeTool === tool ? 'bg-app-accent/10 text-app-accent' : 'text-slate-600 hover:bg-slate-100'}`;

  const actionClass = "p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors";

  return (
    <div className="h-14 border-b border-slate-200 bg-app-surface flex items-center justify-between px-4 sticky top-0 z-10 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <button 
          onClick={onGoHome}
          className="p-2 -ml-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1"
          title="กลับหน้าหลัก"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium hidden sm:inline">กลับ</span>
        </button>
        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        <span className="font-medium text-sm text-app-textMain truncate max-w-[150px] sm:max-w-[200px]" title={fileName}>
          {fileName || 'ไม่ได้ระบุชื่อไฟล์'}
        </span>
      </div>

      <div className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-md border border-slate-200">
        <button onClick={() => onToolChange('select')} className={toolClass('select')} title="เลือก">
          <MousePointer2 size={18} />
        </button>
        <button onClick={() => onToolChange('text')} className={toolClass('text')} title="ข้อความ">
          <Type size={18} />
        </button>
        
        {/* Draw tools group */}
        <div className="flex items-center gap-1 border-l border-r border-slate-200 px-1 mx-1">
          <button onClick={() => onToolChange('pen')} className={toolClass('pen')} title="ปากกา">
            <Pen size={18} />
          </button>
          <button onClick={() => onToolChange('highlight')} className={toolClass('highlight')} title="ปากกาเน้นข้อความ">
            <Highlighter size={18} />
          </button>
        </div>

        {/* Shapes group */}
        <button onClick={() => onToolChange('shape')} className={toolClass('shape')} title="รูปร่าง">
          <Square size={18} />
        </button>

        <button onClick={() => onToolChange('image')} className={toolClass('image')} title="แทรกรูปภาพ">
          <ImageIcon size={18} />
        </button>
        <button onClick={() => onToolChange('signature')} className={toolClass('signature')} title="ลายเซ็น">
          <Signature size={18} />
        </button>
        <button onClick={() => onToolChange('stamp')} className={toolClass('stamp')} title="ตราประทับ">
          <Stamp size={18} />
        </button>
        <button onClick={() => onToolChange('comment')} className={toolClass('comment')} title="โน้ตคอมเมนต์">
          <MessageSquare size={18} />
        </button>
        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        <button onClick={() => onToolChange('eraser')} className={toolClass('eraser')} title="ลบ">
          <Eraser size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 mr-2">หน้า {currentPage + 1}/{totalPages}</span>
        
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <button onClick={() => onAction('add_page')} className={actionClass} title="เพิ่มหน้า">
            <Plus size={18} />
          </button>
          <button onClick={() => onAction('delete_page')} className={actionClass} title="ลบหน้า">
            <Trash2 size={18} />
          </button>
          <button onClick={() => onAction('rotate')} className={actionClass} title="หมุนหน้า">
            <RotateCw size={18} />
          </button>
          <button onClick={() => onAction('merge')} className={actionClass} title="รวมไฟล์">
            <Layers size={18} />
          </button>
        </div>

        <button 
          onClick={() => onAction('download')} 
          className="flex items-center gap-2 px-3 py-1.5 bg-app-accent hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          <Download size={16} />
          <span className="hidden sm:inline">บันทึก</span>
        </button>
      </div>
    </div>
  );
};
