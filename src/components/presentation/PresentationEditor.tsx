import { useState, useEffect, useCallback } from 'react';
import { 
  Type, Image as ImageIcon, Square, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
  Trash2, Copy, Settings, ChevronDown, ChevronRight
} from 'lucide-react';
import SlidePanel from './SlidePanel';
import SlideCanvas from './SlideCanvas';
import PresentationToolbar from './PresentationToolbar';
import SlidePlayer from './SlidePlayer';
import PresentationExporter from './PresentationExporter';
import type { Slide, SlideElement, SlideElementType, PresentationProject } from '../../types/presentation';
import { alertConfirm, notifyToast } from '../../utils/swal';

export interface PresentationEditorProps {
  onGoHome: () => void;
  onSendToMultimedia?: (slides: Slide[]) => void;
  initialProject?: PresentationProject;
}

export function PresentationEditor({ onGoHome, onSendToMultimedia, initialProject }: PresentationEditorProps) {
  const defaultSlide: Slide = {
    id: crypto.randomUUID(),
    elements: [],
    background: '#FFFFFF',
    order: 0
  };

  const [slides, setSlides] = useState<Slide[]>(initialProject?.slides || [defaultSlide]);
  const [activeSlideId, setActiveSlideId] = useState<string>(slides[0].id);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [projectTitle, setProjectTitle] = useState<string>(initialProject?.title || 'งานนำเสนอใหม่');
  
  // History state for undo/redo
  const [history, setHistory] = useState<{ slides: Slide[]; activeSlideId: string }[]>([{ slides: initialProject?.slides || [defaultSlide], activeSlideId: slides[0].id }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const saveHistory = useCallback((newSlides: Slide[], newActiveId: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ slides: newSlides, activeSlideId: newActiveId });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setSlides(prev.slides);
      setActiveSlideId(prev.activeSlideId);
      setHistoryIndex(historyIndex - 1);
      setSelectedElementId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setSlides(next.slides);
      setActiveSlideId(next.activeSlideId);
      setHistoryIndex(historyIndex + 1);
      setSelectedElementId(null);
    }
  };

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];
  const selectedElement = activeSlide?.elements.find(e => e.id === selectedElementId);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPresenting || isExporting) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          handleDeleteElement(selectedElementId);
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'd') {
          e.preventDefault();
          if (selectedElementId) {
            handleDuplicateElement(selectedElementId);
          } else {
            handleDuplicateSlide(activeSlideId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, activeSlideId, isPresenting, isExporting, historyIndex, history]);

  const updateSlides = (newSlides: Slide[]) => {
    setSlides(newSlides);
    saveHistory(newSlides, activeSlideId);
  };

  const updateActiveSlide = (updatedSlide: Slide) => {
    const newSlides = slides.map(s => s.id === updatedSlide.id ? updatedSlide : s);
    updateSlides(newSlides);
  };

  // Slide CRUD
  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      elements: [],
      background: '#FFFFFF',
      order: slides.length
    };
    const newSlides = [...slides, newSlide];
    setSlides(newSlides);
    setActiveSlideId(newSlide.id);
    setSelectedElementId(null);
    saveHistory(newSlides, newSlide.id);
  };

  const handleDeleteSlide = async (id: string) => {
    if (slides.length <= 1) {
      notifyToast('ไม่สามารถลบสไลด์สุดท้ายได้', 'error');
      return;
    }
    const confirmed = await alertConfirm('ลบสไลด์', 'คุณแน่ใจหรือไม่ว่าต้องการลบสไลด์นี้?');
    if (confirmed) {
      const newSlides = slides.filter(s => s.id !== id);
      setSlides(newSlides);
      if (activeSlideId === id) {
        setActiveSlideId(newSlides[0].id);
      }
      saveHistory(newSlides, activeSlideId === id ? newSlides[0].id : activeSlideId);
    }
  };

  const handleDuplicateSlide = (id: string) => {
    const slideToCopy = slides.find(s => s.id === id);
    if (!slideToCopy) return;
    
    const newSlide: Slide = {
      ...slideToCopy,
      id: crypto.randomUUID(),
      order: slides.length,
      elements: slideToCopy.elements.map(e => ({ ...e, id: crypto.randomUUID() }))
    };
    const newSlides = [...slides, newSlide];
    setSlides(newSlides);
    setActiveSlideId(newSlide.id);
    saveHistory(newSlides, newSlide.id);
  };

  // Element CRUD
  const handleAddElement = (type: SlideElement['type'], config?: Partial<SlideElement>) => {
    const newElement: SlideElement = {
      id: crypto.randomUUID(),
      type,
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 50 : 150,
      rotation: 0,
      opacity: 1,
      content: type === 'text' ? 'ข้อความใหม่' : undefined,
      color: type === 'text' ? '#1E293B' : undefined,
      fill: type === 'shape' ? '#E2E8F0' : undefined,
      stroke: type === 'shape' ? '#94A3B8' : undefined,
      strokeWidth: type === 'shape' ? 2 : undefined,
      fontSize: type === 'text' ? 24 : undefined,
      fontFamily: type === 'text' ? 'Prompt' : undefined,
      ...config,
    };
    
    const updatedSlide = {
      ...activeSlide,
      elements: [...activeSlide.elements, newElement]
    };
    updateActiveSlide(updatedSlide);
    setSelectedElementId(newElement.id);
  };

  const handleDeleteElement = (id: string) => {
    const updatedSlide = {
      ...activeSlide,
      elements: activeSlide.elements.filter(e => e.id !== id)
    };
    updateActiveSlide(updatedSlide);
    setSelectedElementId(null);
  };

  const handleDuplicateElement = (id: string) => {
    const el = activeSlide.elements.find(e => e.id === id);
    if (!el) return;
    
    const newElement: SlideElement = {
      ...el,
      id: crypto.randomUUID(),
      x: el.x + 20,
      y: el.y + 20
    };
    
    const updatedSlide = {
      ...activeSlide,
      elements: [...activeSlide.elements, newElement]
    };
    updateActiveSlide(updatedSlide);
    setSelectedElementId(newElement.id);
  };

  const handleUpdateElement = (id: string, updates: Partial<SlideElement>) => {
    const updatedSlide = {
      ...activeSlide,
      elements: activeSlide.elements.map(e => e.id === id ? { ...e, ...updates } : e)
    };
    updateActiveSlide(updatedSlide);
  };

  // Property Panel sections
  const [expandedSection, setExpandedSection] = useState<string>('all');

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? '' : section);
  };

  const SectionHeader = ({ title, id }: { title: string, id: string }) => (
    <div 
      className="flex items-center justify-between py-2 px-3 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100"
      onClick={() => toggleSection(id)}
    >
      <span className="text-sm font-semibold text-slate-700 font-heading">{title}</span>
      {expandedSection === id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800">
      <PresentationToolbar 
        projectTitle={projectTitle}
        selectedElement={selectedElement || null}
        onUpdateTitle={setProjectTitle}
        onAddElement={(type: SlideElementType, config?: Partial<SlideElement>) => handleAddElement(type, config)}
        onUpdateElement={(elementId: string, updates: Partial<SlideElement>) => handleUpdateElement(elementId, updates)}
        onPresent={() => setIsPresenting(true)}
        onExport={() => setIsExporting(true)}
        onSendToMultimedia={() => {
          if (onSendToMultimedia) onSendToMultimedia(slides);
        }}
        onGoHome={onGoHome}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[200px] border-r border-slate-200 bg-white flex flex-col">
          <SlidePanel 
            slides={slides} 
            activeSlideId={activeSlideId} 
            onSelectSlide={(id) => {
              setActiveSlideId(id);
              setSelectedElementId(null);
            }} 
            onAddSlide={handleAddSlide}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onReorderSlides={(slideIds: string[]) => {
              const reordered = slideIds.map(id => slides.find(s => s.id === id)!).filter(Boolean);
              updateSlides(reordered);
            }}
          />
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
          <div className="p-2 border-b border-slate-200 bg-white flex gap-2 justify-center items-center shadow-sm z-10">
            <button onClick={() => handleAddElement('text')} className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-slate-100 text-sm">
              <Type size={16} /> ข้อความ
            </button>
            <button onClick={() => handleAddElement('shape')} className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-slate-100 text-sm">
              <Square size={16} /> รูปร่าง
            </button>
            <button onClick={() => handleAddElement('image')} className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-slate-100 text-sm">
              <ImageIcon size={16} /> รูปภาพ
            </button>
            <div className="h-5 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <button 
                onClick={() => setZoom(z => Math.max(25, z - 10))} 
                className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded font-bold"
                title="ย่อ"
              >
                -
              </button>
              <span className="w-12 text-center font-mono">{zoom}%</span>
              <button 
                onClick={() => setZoom(z => Math.min(200, z + 10))} 
                className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded font-bold"
                title="ขยาย"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-slate-100" onClick={() => setSelectedElementId(null)}>
            <SlideCanvas 
              slide={activeSlide} 
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              zoom={zoom}
            />
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-[280px] bg-white border-l border-slate-200 overflow-y-auto shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
              <Settings size={18} className="text-slate-500"/> คุณสมบัติ
            </h2>
          </div>

          {!selectedElementId ? (
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3 text-slate-600">พื้นหลังสไลด์</h3>
              <label className="block text-xs mb-1 text-slate-500">สีพื้นหลัง</label>
              <input 
                type="color" 
                value={typeof activeSlide.background === 'string' ? activeSlide.background : activeSlide.background?.color || '#ffffff'} 
                onChange={(e) => updateActiveSlide({...activeSlide, background: e.target.value})}
                className="w-full h-10 p-1 rounded border border-slate-200 cursor-pointer"
              />
            </div>
          ) : selectedElement ? (
            <div>
              <SectionHeader title="ขนาดและตำแหน่ง" id="all" />
              {(expandedSection === 'all' || expandedSection === 'transform') && (
                <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-200">
                  <div>
                    <label className="block text-xs mb-1 text-slate-500">X (px)</label>
                    <input type="number" value={Math.round(selectedElement.x)} onChange={(e) => handleUpdateElement(selectedElement.id, { x: Number(e.target.value) })} className="w-full p-1.5 text-sm rounded border border-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-slate-500">Y (px)</label>
                    <input type="number" value={Math.round(selectedElement.y)} onChange={(e) => handleUpdateElement(selectedElement.id, { y: Number(e.target.value) })} className="w-full p-1.5 text-sm rounded border border-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-slate-500">กว้าง (px)</label>
                    <input type="number" value={Math.round(selectedElement.width)} onChange={(e) => handleUpdateElement(selectedElement.id, { width: Number(e.target.value) })} className="w-full p-1.5 text-sm rounded border border-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-slate-500">สูง (px)</label>
                    <input type="number" value={Math.round(selectedElement.height)} onChange={(e) => handleUpdateElement(selectedElement.id, { height: Number(e.target.value) })} className="w-full p-1.5 text-sm rounded border border-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-slate-500">หมุน (°)</label>
                    <input type="number" value={Math.round(selectedElement.rotation || 0)} onChange={(e) => handleUpdateElement(selectedElement.id, { rotation: Number(e.target.value) })} className="w-full p-1.5 text-sm rounded border border-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-slate-500">ความทึบ (%)</label>
                    <input type="number" min="0" max="100" value={Math.round((selectedElement.opacity ?? 1) * 100)} onChange={(e) => handleUpdateElement(selectedElement.id, { opacity: Number(e.target.value) / 100 })} className="w-full p-1.5 text-sm rounded border border-slate-300" />
                  </div>
                </div>
              )}

              {selectedElement.type === 'text' && (
                <>
                  <SectionHeader title="ข้อความ" id="all" />
                  {(expandedSection === 'all' || expandedSection === 'text') && (
                    <div className="p-4 space-y-3 border-b border-slate-200">
                      <div>
                        <label className="block text-xs mb-1 text-slate-500">แก้ไขข้อความ</label>
                        <textarea 
                          value={selectedElement.content} 
                          onChange={(e) => handleUpdateElement(selectedElement.id, { content: e.target.value })}
                          className="w-full p-2 text-sm rounded border border-slate-300 min-h-[80px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs mb-1 text-slate-500">ฟอนต์</label>
                          <select 
                            value={selectedElement.fontFamily || 'Prompt'} 
                            onChange={(e) => handleUpdateElement(selectedElement.id, { fontFamily: e.target.value })}
                            className="w-full p-1.5 text-sm rounded border border-slate-300"
                          >
                            <option value="Prompt">Prompt</option>
                            <option value="Sarabun">Sarabun</option>
                            <option value="Kanit">Kanit</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs mb-1 text-slate-500">ขนาด</label>
                          <input type="number" value={selectedElement.fontSize || 24} onChange={(e) => handleUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })} className="w-full p-1.5 text-sm rounded border border-slate-300" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs mb-1 text-slate-500">สีข้อความ</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={selectedElement.color || '#000000'} onChange={(e) => handleUpdateElement(selectedElement.id, { color: e.target.value })} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
                          <input type="text" value={selectedElement.color || '#000000'} onChange={(e) => handleUpdateElement(selectedElement.id, { color: e.target.value })} className="flex-1 p-1.5 text-sm rounded border border-slate-300 uppercase" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs mb-1 text-slate-500">การจัดเรียง และ สไตล์</label>
                        <div className="flex gap-1">
                          <button onClick={() => handleUpdateElement(selectedElement.id, { textAlign: 'left' })} className={`p-1.5 rounded ${selectedElement.textAlign === 'left' ? 'bg-slate-200' : 'hover:bg-slate-100'}`}><AlignLeft size={16}/></button>
                          <button onClick={() => handleUpdateElement(selectedElement.id, { textAlign: 'center' })} className={`p-1.5 rounded ${selectedElement.textAlign === 'center' ? 'bg-slate-200' : 'hover:bg-slate-100'}`}><AlignCenter size={16}/></button>
                          <button onClick={() => handleUpdateElement(selectedElement.id, { textAlign: 'right' })} className={`p-1.5 rounded ${selectedElement.textAlign === 'right' ? 'bg-slate-200' : 'hover:bg-slate-100'}`}><AlignRight size={16}/></button>
                          <div className="w-px h-6 bg-slate-300 mx-1 my-auto"></div>
                          <button onClick={() => handleUpdateElement(selectedElement.id, { isBold: !selectedElement.isBold })} className={`p-1.5 rounded ${selectedElement.isBold ? 'bg-slate-200' : 'hover:bg-slate-100'}`}><Bold size={16}/></button>
                          <button onClick={() => handleUpdateElement(selectedElement.id, { isItalic: !selectedElement.isItalic })} className={`p-1.5 rounded ${selectedElement.isItalic ? 'bg-slate-200' : 'hover:bg-slate-100'}`}><Italic size={16}/></button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedElement.type === 'shape' && (
                <>
                  <SectionHeader title="ลักษณะรูปร่าง" id="all" />
                  {(expandedSection === 'all' || expandedSection === 'shape') && (
                    <div className="p-4 space-y-3 border-b border-slate-200">
                      <div>
                        <label className="block text-xs mb-1 text-slate-500">สีพื้น</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={selectedElement.fill || '#E2E8F0'} onChange={(e) => handleUpdateElement(selectedElement.id, { fill: e.target.value })} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
                          <input type="text" value={selectedElement.fill || '#E2E8F0'} onChange={(e) => handleUpdateElement(selectedElement.id, { fill: e.target.value })} className="flex-1 p-1.5 text-sm rounded border border-slate-300 uppercase" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs mb-1 text-slate-500">สีเส้นขอบ</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={selectedElement.stroke || '#94A3B8'} onChange={(e) => handleUpdateElement(selectedElement.id, { stroke: e.target.value })} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
                          <input type="text" value={selectedElement.stroke || '#94A3B8'} onChange={(e) => handleUpdateElement(selectedElement.id, { stroke: e.target.value })} className="flex-1 p-1.5 text-sm rounded border border-slate-300 uppercase" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs mb-1 text-slate-500">ขนาดเส้นขอบ</label>
                        <input type="number" min="0" value={selectedElement.strokeWidth || 0} onChange={(e) => handleUpdateElement(selectedElement.id, { strokeWidth: Number(e.target.value) })} className="w-full p-1.5 text-sm rounded border border-slate-300" />
                      </div>
                      <div>
                        <label className="block text-xs mb-1 text-slate-500">ความโค้งมุม</label>
                        <input type="number" min="0" value={selectedElement.borderRadius || 0} onChange={(e) => handleUpdateElement(selectedElement.id, { borderRadius: Number(e.target.value) })} className="w-full p-1.5 text-sm rounded border border-slate-300" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedElement.type === 'image' && (
                <>
                  <SectionHeader title="รูปภาพ" id="all" />
                  {(expandedSection === 'all' || expandedSection === 'image') && (
                    <div className="p-4 space-y-3 border-b border-slate-200">
                      <div>
                        <label className="block text-xs mb-1 text-slate-500">URL รูปภาพ</label>
                        <input 
                          type="text" 
                          placeholder="https://..."
                          value={selectedElement.src || ''} 
                          onChange={(e) => handleUpdateElement(selectedElement.id, { src: e.target.value })}
                          className="w-full p-1.5 text-sm rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1 text-slate-500">การจัดวาง (Object Fit)</label>
                        <select 
                          value={selectedElement.objectFit || 'cover'} 
                          onChange={(e) => handleUpdateElement(selectedElement.id, { objectFit: e.target.value as any })}
                          className="w-full p-1.5 text-sm rounded border border-slate-300"
                        >
                          <option value="cover">เติมเต็ม (Cover)</option>
                          <option value="contain">พอดี (Contain)</option>
                          <option value="fill">ยืดเต็ม (Fill)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1 text-slate-500">ความโค้งมุม</label>
                        <input type="number" min="0" value={selectedElement.borderRadius || 0} onChange={(e) => handleUpdateElement(selectedElement.id, { borderRadius: Number(e.target.value) })} className="w-full p-1.5 text-sm rounded border border-slate-300" />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="p-4 flex gap-2">
                <button 
                  onClick={() => handleDuplicateElement(selectedElement.id)} 
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded transition-colors"
                >
                  <Copy size={14} /> ทำซ้ำ
                </button>
                <button 
                  onClick={() => handleDeleteElement(selectedElement.id)} 
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded transition-colors"
                >
                  <Trash2 size={14} /> ลบ
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {isPresenting && (
        <SlidePlayer 
          slides={slides} 
          onExit={() => setIsPresenting(false)} 
        />
      )}

      {isExporting && (
        <PresentationExporter 
          slides={slides} 
          projectTitle={projectTitle}
          onClose={() => setIsExporting(false)}
          onSendToMultimedia={onSendToMultimedia}
        />
      )}
    </div>
  );
}

export default PresentationEditor;
