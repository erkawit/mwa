import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Slide } from '../../types/presentation';
import { getSlideBackgroundStyle } from '../../types/presentation';

export interface SlidePlayerProps {
  slides: Slide[];
  startSlideIndex?: number;
  onExit?: () => void;
  onClose?: () => void;
}

export const SlidePlayer: React.FC<SlidePlayerProps> = ({ 
  slides, 
  startSlideIndex = 0, 
  onExit,
  onClose 
}) => {
  const handleExit = onExit || onClose || (() => {});
  const [currentIndex, setCurrentIndex] = useState(startSlideIndex);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, slides.length, handleExit]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col font-sans">
      <div 
        className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={nextSlide}
      >
        <div 
          className="relative transition-all duration-500 ease-in-out shadow-2xl"
          style={{
            width: '100%',
            maxWidth: '1920px',
            aspectRatio: '16/9',
            transform: 'scale(0.98)',
            ...getSlideBackgroundStyle(currentSlide.background)
          }}
        >
          {/* Elements would be rendered here, scaling properly via CSS or transforms */}
          {currentSlide.elements?.map(element => (
             <div
             key={element.id}
             className="absolute"
             style={{
               left: `${(element.x / 1920) * 100}%`,
               top: `${(element.y / 1080) * 100}%`,
               width: `${(element.width / 1920) * 100}%`,
               height: `${(element.height / 1080) * 100}%`,
               transform: `rotate(${element.rotation || 0}deg)`
             }}
           >
             <div className="w-full h-full flex items-center justify-center">
               {element.type === 'text' ? (
                 <div style={{ color: element.textColor || element.color || '#ffffff', fontSize: '100%' /* Needs responsive scaling */ }}>
                   {element.content}
                 </div>
               ) : null}
             </div>
           </div>
          ))}
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{formatTime(timeElapsed)}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            disabled={currentIndex === 0}
            className="p-2 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-sm">
            สไลด์ {currentIndex + 1} / {slides.length}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            disabled={currentIndex === slides.length - 1}
            className="p-2 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); handleExit(); }}
          className="p-2 hover:bg-red-500/80 rounded-full transition-colors flex items-center gap-2 px-4"
        >
          <X size={20} />
          <span className="text-sm font-medium">ออกจากการนำเสนอ</span>
        </button>
      </div>
    </div>
  );
};

export default SlidePlayer;
