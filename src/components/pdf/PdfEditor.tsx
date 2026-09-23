import React, { useState, useEffect } from 'react';
import { PdfToolbar } from './PdfToolbar';
import { PdfPagePanel } from './PdfPagePanel';
import { PdfCanvas } from './PdfCanvas';
import type { PdfToolType, PdfProject, PdfPage, PdfAnnotation } from '../../types/pdf';
import { loadPdf, getPageCount, savePdf } from '../../utils/pdfEngine';
import { alertError, alertSuccess, notifyToast } from '../../utils/swal';
import { PDFDocument } from 'pdf-lib';

interface PdfEditorProps {
  onGoHome: () => void;
  initialFile?: File;
}

export const PdfEditor: React.FC<PdfEditorProps> = ({ onGoHome, initialFile }) => {
  const [pdfProject, setPdfProject] = useState<PdfProject | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<PdfToolType>('select');
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (initialFile) {
      handleOpenFile(initialFile);
    }
  }, [initialFile]);

  const handleOpenFile = async (file: File) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await loadPdf(arrayBuffer);
      setPdfDoc(doc);
      
      const pageCount = getPageCount(doc);
      const pages: PdfPage[] = [];
      const docPages = doc.getPages();
      for (let i = 0; i < pageCount; i++) {
        const { width, height } = docPages[i].getSize();
        pages.push({ index: i, width, height });
      }

      setPdfProject({
        id: crypto.randomUUID(),
        name: file.name,
        data: arrayBuffer,
        pages,
        annotations: []
      });
      setCurrentPage(0);
      notifyToast('เปิดไฟล์สำเร็จ', 'success');
    } catch (error) {
      console.error(error);
      alertError('เกิดข้อผิดพลาด', 'ไม่สามารถเปิดไฟล์ PDF ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: string, _params?: any) => {
    if (!pdfProject || !pdfDoc) {
      if (action !== 'merge') {
        alertError('แจ้งเตือน', 'กรุณาเปิดไฟล์ก่อนดำเนินการ');
        return;
      }
    }

    switch (action) {
      case 'download':
        try {
          const bytes = await savePdf(pdfDoc!);
          const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `edited_${pdfProject!.name}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alertSuccess('สำเร็จ', 'บันทึกไฟล์สำเร็จ');
        } catch (e) {
          alertError('ผิดพลาด', 'ไม่สามารถบันทึกไฟล์ได้');
        }
        break;
      // Implement other actions like merge, split, rotate, add_page here...
      default:
        console.log(`Action ${action} not fully implemented yet.`);
        notifyToast('ฟังก์ชันนี้กำลังอยู่ในระหว่างการพัฒนา', 'info');
    }
  };

  const handleAddAnnotation = (annotation: PdfAnnotation) => {
    if (pdfProject) {
      setPdfProject({
        ...pdfProject,
        annotations: [...pdfProject.annotations, annotation]
      });
    }
  };

  const handleUpdateAnnotation = (id: string, updates: Partial<PdfAnnotation>) => {
    if (pdfProject) {
      setPdfProject({
        ...pdfProject,
        annotations: pdfProject.annotations.map(a => a.id === id ? { ...a, ...updates } : a)
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-app-bg overflow-hidden font-sans">
      <PdfToolbar 
        fileName={pdfProject?.name || ''}
        activeTool={activeTool}
        currentPage={currentPage}
        totalPages={pdfProject?.pages.length || 0}
        onToolChange={setActiveTool}
        onAction={handleAction}
        onGoHome={onGoHome}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <PdfPagePanel 
          pages={pdfProject?.pages || []}
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          onAction={(act, idx) => handleAction(act, idx)}
        />
        
        <PdfCanvas 
          pdfData={pdfProject?.data || null}
          pages={pdfProject?.pages || []}
          currentPage={currentPage}
          zoom={zoom}
          activeTool={activeTool}
          selectedAnnotationId={selectedAnnotationId}
          onAddAnnotation={handleAddAnnotation}
          onUpdateAnnotation={handleUpdateAnnotation}
          onSelectAnnotation={setSelectedAnnotationId}
          onPageChange={setCurrentPage}
        />
        
        <div className="w-[260px] bg-slate-50 border-l border-slate-200 shrink-0 p-4 flex flex-col h-full overflow-y-auto">
          <h3 className="font-semibold text-slate-700 text-sm mb-4">คุณสมบัติ</h3>
          {selectedAnnotationId ? (
            <div className="text-sm text-slate-600">
              <p>เลือกไอเทมอยู่</p>
              {/* Properties controls would go here */}
            </div>
          ) : (
            <div className="text-sm text-slate-400 text-center mt-6">
              เลือกเครื่องมือเพื่อปรับแต่ง
            </div>
          )}

          {/* Zoom Controls */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <label className="block text-xs font-medium text-slate-500 mb-2">อัตราการซูม (Zoom)</label>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setZoom(z => Math.max(0.5, Number((z - 0.1).toFixed(1))))}
                className="w-8 h-8 rounded border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold"
              >
                -
              </button>
              <span className="flex-1 text-center text-xs font-mono font-medium text-slate-700">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(z => Math.min(2.5, Number((z + 0.1).toFixed(1))))}
                className="w-8 h-8 rounded border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold"
              >
                +
              </button>
            </div>
          </div>

          {!pdfProject && !isLoading && (
            <div className="mt-8 border-2 border-dashed border-slate-300 rounded-md p-6 text-center hover:bg-slate-100 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept=".pdf" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleOpenFile(e.target.files[0]);
                  }
                }}
              />
              <p className="text-sm text-slate-600 font-medium">คลิกเพื่อเลือกไฟล์ PDF</p>
              <p className="text-xs text-slate-400 mt-2">หรือลากไฟล์มาวางที่นี่</p>
            </div>
          )}
        </div>
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-app-accent"></div>
            <span className="text-sm text-slate-600 font-medium">กำลังโหลดไฟล์...</span>
          </div>
        </div>
      )}
    </div>
  );
};
