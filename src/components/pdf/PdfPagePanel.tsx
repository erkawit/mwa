import React from 'react';
import type { PdfPage } from '../../types/pdf';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface PdfPagePanelProps {
  pages: PdfPage[];
  currentPage: number;
  onSelectPage: (pageIndex: number) => void;
  onAction: (action: string, pageIndex: number) => void;
}

export const PdfPagePanel: React.FC<PdfPagePanelProps> = ({
  pages,
  currentPage,
  onSelectPage,
  onAction
}) => {
  return (
    <div className="w-[180px] bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0">
      <div className="p-3 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">หน้าทั้งหมด ({pages.length})</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {pages.map((_page, idx) => (
          <div 
            key={idx}
            className={`relative group flex flex-col items-center gap-2 cursor-pointer ${currentPage === idx ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
            onClick={() => onSelectPage(idx)}
          >
            <div className={`w-full aspect-[1/1.4] bg-white shadow-sm rounded flex items-center justify-center border-2 transition-all ${currentPage === idx ? 'border-app-accent shadow-md' : 'border-transparent'}`}>
              <span className="text-slate-300 text-xs">Page {idx + 1}</span>
            </div>
            <span className={`text-xs font-medium ${currentPage === idx ? 'text-app-accent' : 'text-slate-500'}`}>
              {idx + 1}
            </span>

            {/* Quick actions on hover */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-md shadow-sm border border-slate-200 flex flex-col p-1">
              <button 
                onClick={(e) => { e.stopPropagation(); onAction('move_up', idx); }}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                disabled={idx === 0}
                title="เลื่อนขึ้น"
              >
                <ChevronUp size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onAction('move_down', idx); }}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                disabled={idx === pages.length - 1}
                title="เลื่อนลง"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        ))}
        {pages.length === 0 && (
          <div className="text-center text-sm text-slate-500 mt-10">
            ไม่มีหน้าในเอกสาร
          </div>
        )}
      </div>
    </div>
  );
};
