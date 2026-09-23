import React, { useRef } from 'react';
import type { Slide, SlideElement } from '../../types/presentation';
import { getSlideBackgroundStyle } from '../../types/presentation';

interface SlideCanvasProps {
  slide: Slide | null;
  selectedElementId: string | null;
  zoom: number;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElement?: (elementId: string, updates: Partial<SlideElement>) => void;
  onDeleteElement?: (elementId: string) => void;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  selectedElementId,
  zoom,
  onSelectElement,
  onUpdateElement: _onUpdateElement,
  onDeleteElement: _onDeleteElement
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!slide) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-slate-100 font-sans text-slate-500">
        ไม่มีสไลด์ที่เลือก
      </div>
    );
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectElement(null);
    }
  };

  return (
    <div className="flex-1 h-full bg-slate-100 overflow-auto flex items-center justify-center p-8 relative font-sans">
      <div 
        ref={containerRef}
        className="bg-white shadow-lg relative"
        style={{
          width: `${1920 * (zoom / 100)}px`,
          height: `${1080 * (zoom / 100)}px`,
          transformOrigin: 'top left',
          position: 'relative',
          ...getSlideBackgroundStyle(slide.background)
        }}
        onClick={handleCanvasClick}
      >

        {slide.elements?.map(element => {
          const isSelected = element.id === selectedElementId;
          
          return (
            <div
              key={element.id}
              className={`absolute cursor-move border-2 ${
                isSelected ? 'border-app-primary' : 'border-transparent hover:border-slate-300'
              }`}
              style={{
                left: `${element.x * (zoom / 100)}px`,
                top: `${element.y * (zoom / 100)}px`,
                width: `${element.width * (zoom / 100)}px`,
                height: `${element.height * (zoom / 100)}px`,
                transform: `rotate(${element.rotation || 0}deg)`
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(element.id);
              }}
              onDoubleClick={() => {
                // Handle inline editing for text
              }}
            >
              {/* Element content rendering goes here based on element.type */}
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {element.type === 'text' ? (
                  <div style={{ fontSize: `${(element.fontSize || 24) * (zoom / 100)}px`, color: element.textColor || element.color || '#000000' }}>
                    {element.content}
                  </div>
                ) : (
                  <div className="text-slate-400">[{element.type}]</div>
                )}
              </div>

              {isSelected && (
                <>
                  {/* Resize handles */}
                  {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(pos => (
                    <div 
                      key={pos}
                      className={`absolute bg-white border border-app-primary w-3 h-3 rounded-full 
                        ${pos.includes('n') ? '-top-1.5' : pos.includes('s') ? '-bottom-1.5' : 'top-1/2 -translate-y-1/2'}
                        ${pos.includes('w') ? '-left-1.5' : pos.includes('e') ? '-right-1.5' : 'left-1/2 -translate-x-1/2'}
                      `}
                      style={{ cursor: `${pos}-resize` }}
                    />
                  ))}
                  {/* Rotation handle */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border border-app-primary w-3 h-3 rounded-full cursor-grab" />
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-px h-5 bg-app-primary pointer-events-none" />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SlideCanvas;
