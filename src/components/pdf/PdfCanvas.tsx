import React, { useRef, useEffect, useState } from 'react';
import type { PdfToolType, PdfPage, PdfAnnotation } from '../../types/pdf';
import { renderPageToCanvas } from '../../utils/pdfEngine';

interface PdfCanvasProps {
  pdfData: ArrayBuffer | null;
  pages: PdfPage[];
  currentPage: number;
  zoom: number;
  activeTool: PdfToolType;
  selectedAnnotationId: string | null;
  onAddAnnotation: (annotation: PdfAnnotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<PdfAnnotation>) => void;
  onSelectAnnotation: (id: string | null) => void;
  onPageChange: (pageIndex: number) => void;
  drawColor?: string;
  drawWidth?: number;
}

export const PdfCanvas: React.FC<PdfCanvasProps> = ({
  pdfData,
  pages,
  currentPage,
  zoom,
  activeTool,
  selectedAnnotationId: _selectedAnnotationId,
  onAddAnnotation: _onAddAnnotation,
  onUpdateAnnotation: _onUpdateAnnotation,
  onSelectAnnotation,
  onPageChange: _onPageChange,
  drawColor: _drawColor = '#000000',
  drawWidth: _drawWidth = 2
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  
  useEffect(() => {
    const renderCurrentPage = async () => {
      if (!pdfData || pages.length === 0 || !canvasRef.current) return;
      
      try {
        setIsRendering(true);
        await renderPageToCanvas(pdfData, currentPage, canvasRef.current, zoom);
      } catch (error) {
        console.error("Error rendering PDF page:", error);
      } finally {
        setIsRendering(false);
      }
    };

    renderCurrentPage();
  }, [pdfData, currentPage, zoom, pages]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-[#e4e4e7] overflow-auto flex justify-center p-8 custom-scrollbar relative"
    >
      {pages.length > 0 ? (
        <div className="relative shadow-md bg-white transition-transform origin-top" style={{ transform: `scale(1)` }}>
          <canvas ref={canvasRef} className="block" />
          
          {/* Annotation Overlay Layer */}
          <div className="absolute inset-0 pointer-events-auto" 
               style={{ zIndex: 10 }}
               onClick={() => {
                 if (activeTool === 'select') {
                   onSelectAnnotation(null);
                 }
               }}
          >
            {/* Render Annotations Here (placeholder for actual implementation) */}
          </div>
          
          {isRendering && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <p>กรุณาเปิดไฟล์ PDF หรือสร้างหน้าใหม่</p>
        </div>
      )}
    </div>
  );
};
