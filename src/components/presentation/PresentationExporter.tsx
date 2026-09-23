import { useState, useRef } from 'react';
import { X, Download, Send, Image as ImageIcon, FileText, Loader2, Play } from 'lucide-react';
import type { Slide } from '../../types/presentation';
import { getSlideBackgroundStyle } from '../../types/presentation';
import { notifyToast } from '../../utils/swal';

interface PresentationExporterProps {
  slides: Slide[];
  projectTitle: string;
  onClose: () => void;
  onSendToMultimedia?: (slides: Slide[]) => void;
}

export default function PresentationExporter({ slides, projectTitle, onClose, onSendToMultimedia }: PresentationExporterProps) {
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf' | 'pptx'>('png');
  const [quality, setQuality] = useState<'standard' | 'high'>('high');
  const [pageRange, setPageRange] = useState<'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExport = async () => {
    if (exportFormat === 'pptx') {
      notifyToast('ฟีเจอร์ส่งออกเป็น PPTX กำลังอยู่ในช่วงพัฒนา', 'info');
      return;
    }

    setIsExporting(true);
    setProgress(10);
    
    try {
      // Simulation of export process
      const totalSteps = 5;
      for (let i = 1; i <= totalSteps; i++) {
        await new Promise(r => setTimeout(r, 500));
        setProgress(10 + (80 / totalSteps) * i);
      }
      
      setProgress(100);
      const safeTitle = projectTitle.trim() || 'presentation';
      notifyToast(`ส่งออกไฟล์ ${safeTitle}.${exportFormat} สำเร็จ`, 'success');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error(error);
      notifyToast('เกิดข้อผิดพลาดในการส่งออก', 'error');
      setIsExporting(false);
      setProgress(0);
    }
  };

  const handleSendToMultimedia = () => {
    if (onSendToMultimedia) {
      onSendToMultimedia(slides);
      notifyToast('ส่งไปยังโหมดตัดต่อมัลติมีเดียแล้ว', 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl overflow-hidden font-sans flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-heading font-semibold text-slate-800 flex items-center gap-2">
            <Download className="text-blue-600" /> ส่งออกงานนำเสนอ
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">รูปแบบไฟล์</label>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setExportFormat('png')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-md border-2 transition-all ${exportFormat === 'png' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                  <ImageIcon size={24} className={exportFormat === 'png' ? 'text-blue-500' : 'text-slate-400'} />
                  <span className="text-sm font-medium">รูปภาพ (PNG)</span>
                </button>
                <button 
                  onClick={() => setExportFormat('pdf')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-md border-2 transition-all ${exportFormat === 'pdf' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                  <FileText size={24} className={exportFormat === 'pdf' ? 'text-blue-500' : 'text-slate-400'} />
                  <span className="text-sm font-medium">เอกสาร (PDF)</span>
                </button>
                <button 
                  onClick={() => setExportFormat('pptx')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-md border-2 transition-all ${exportFormat === 'pptx' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Play size={24} className={exportFormat === 'pptx' ? 'text-amber-500' : 'text-slate-400'} />
                  <span className="text-sm font-medium">พาวเวอร์พอยต์ (PPTX)</span>
                  {exportFormat === 'pptx' && <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">เร็วๆ นี้</span>}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">คุณภาพ</label>
              <div className="flex bg-slate-100 p-1 rounded-md">
                <button 
                  onClick={() => setQuality('standard')}
                  className={`flex-1 py-1.5 text-sm rounded ${quality === 'standard' ? 'bg-white shadow text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  มาตรฐาน (1080p)
                </button>
                <button 
                  onClick={() => setQuality('high')}
                  className={`flex-1 py-1.5 text-sm rounded ${quality === 'high' ? 'bg-white shadow text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  สูง (4K)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">หน้าสไลด์</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={pageRange === 'all'} onChange={() => setPageRange('all')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <span className="text-sm text-slate-700">ทั้งหมด ({slides.length} สไลด์)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={pageRange === 'custom'} onChange={() => setPageRange('custom')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <span className="text-sm text-slate-700">กำหนดเอง</span>
                </label>
                {pageRange === 'custom' && (
                  <input 
                    type="text" 
                    placeholder="เช่น 1, 3, 5-8" 
                    value={customRange}
                    onChange={(e) => setCustomRange(e.target.value)}
                    className="mt-1 w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-[240px] flex flex-col">
            <label className="block text-sm font-semibold text-slate-700 mb-2">ภาพตัวอย่าง</label>
            <div className="bg-slate-100 rounded-md border border-slate-200 aspect-[16/9] flex items-center justify-center overflow-hidden relative shadow-inner">
                <div 
                   className="w-full h-full"
                   style={getSlideBackgroundStyle(slides[0]?.background)}
                >
                 {/* This is a simple visual placeholder for the preview, actual implementation might render a scaled down SlideCanvas */}
                 <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs flex-col gap-2">
                   <ImageIcon size={32} className="opacity-50" />
                   <span>ภาพตัวอย่างสไลด์แรก</span>
                 </div>
               </div>
            </div>
            
            <div className="mt-auto pt-6 space-y-3">
              {onSendToMultimedia && (
                <button 
                  onClick={handleSendToMultimedia}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-md transition-colors text-sm border border-indigo-200 disabled:opacity-50"
                >
                  <Send size={18} /> นำไปตัดต่อมัลติมีเดีย
                </button>
              )}
              
              <button 
                onClick={handleExport}
                disabled={isExporting || exportFormat === 'pptx'}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors shadow-sm disabled:opacity-50 text-sm"
              >
                {isExporting ? (
                  <><Loader2 size={18} className="animate-spin" /> กำลังส่งออก...</>
                ) : (
                  <><Download size={18} /> ดาวน์โหลด</>
                )}
              </button>
            </div>
          </div>
        </div>

        {isExporting && (
          <div className="px-6 pb-6 pt-2">
            <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
              <span>กำลังประมวลผล...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden canvas for actual rendering if needed later */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
