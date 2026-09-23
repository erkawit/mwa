import React from 'react';
import { Plus, Copy, Trash2, ArrowUp, ArrowDown, LayoutTemplate } from 'lucide-react';
import type { Slide } from '../../types/presentation';
import { getSlideBackgroundStyle } from '../../types/presentation';

interface SlidePanelProps {
  slides: Slide[];
  activeSlideId: string | null;
  onSelectSlide: (slideId: string) => void;
  onAddSlide: (afterIndex?: number) => void;
  onDuplicateSlide: (slideId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onReorderSlides: (slideIds: string[]) => void;
}

export const SlidePanel: React.FC<SlidePanelProps> = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlides
}) => {
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...slides];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    onReorderSlides(newOrder.map(s => s.id));
  };

  const moveDown = (index: number) => {
    if (index === slides.length - 1) return;
    const newOrder = [...slides];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    onReorderSlides(newOrder.map(s => s.id));
  };

  return (
    <div className="w-64 h-full bg-app-surface border-r border-slate-200 flex flex-col font-sans">
      <div className="p-4 border-b border-slate-200 flex flex-col gap-2">
        <button
          onClick={() => onAddSlide()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-app-primary text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>เพิ่มสไลด์ใหม่</span>
        </button>
        <button
          onClick={() => onAddSlide()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
        >
          <LayoutTemplate size={16} />
          <span>เพิ่มจากแม่แบบ</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;
          return (
            <div 
              key={slide.id}
              className={`relative group rounded-md border-2 transition-all ${
                isActive ? 'border-app-primary ring-4 ring-blue-100' : 'border-transparent hover:border-slate-300'
              }`}
            >
              <div 
                className="text-xs text-slate-500 mb-1 font-medium pl-1 flex justify-between items-center"
              >
                <span>{index + 1}</span>
              </div>
              <div 
                onClick={() => onSelectSlide(slide.id)}
                className="w-full aspect-video bg-white rounded shadow-sm border border-slate-200 cursor-pointer overflow-hidden relative"
                style={getSlideBackgroundStyle(slide.background)}
              >
                {/* Mini preview content would go here */}
              </div>

              {/* Hover Controls */}
              <div className="absolute top-6 right-1 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-md shadow-md border border-slate-200">
                <button 
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                  title="เลื่อนขึ้น"
                >
                  <ArrowUp size={14} />
                </button>
                <button 
                  onClick={() => moveDown(index)}
                  disabled={index === slides.length - 1}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                  title="เลื่อนลง"
                >
                  <ArrowDown size={14} />
                </button>
                <div className="h-px bg-slate-200 my-1"></div>
                <button 
                  onClick={() => onDuplicateSlide(slide.id)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600"
                  title="ทำซ้ำ"
                >
                  <Copy size={14} />
                </button>
                <button 
                  onClick={() => onDeleteSlide(slide.id)}
                  className="p-1 hover:bg-red-50 rounded text-red-600"
                  title="ลบ"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SlidePanel;
