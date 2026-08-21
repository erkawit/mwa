import React, { useState } from 'react';
import { 
  FolderPlus, 
  Monitor, 
  Sliders, 
  Film, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  X, 
  Keyboard
} from 'lucide-react';

interface StudioGuideTourProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  stepNumber: number;
  targetArea: 'sidebar' | 'canvas' | 'inspector' | 'timeline' | 'header';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badgeColor: string;
  items: {
    icon: string;
    title: string;
    description: string;
  }[];
  tip: string;
  shortcuts?: string[];
}

export const StudioGuideTour: React.FC<StudioGuideTourProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const tourSteps: TourStep[] = [
    {
      stepNumber: 1,
      targetArea: 'sidebar',
      title: 'คลังสื่อและการจัดการไฟล์ (Media Assets & Folders)',
      subtitle: 'พื้นที่ฝั่งซ้ายสำหรับนำเข้าและจัดระเบียบไฟล์วิดีโอ เสียง รูปภาพ ทั้งหมดของโปรเจกต์',
      icon: <FolderPlus className="w-5 h-5 text-blue-400" />,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      items: [
        {
          icon: '📤',
          title: 'อัปโหลดสื่อ (Upload Media)',
          description: 'คลิกปุ่ม "+ เพิ่มสื่อ" เพื่อนำเข้าไฟล์วิดีโอ (MP4, WebM, MOV), ไฟล์เสียง (MP3, WAV) หรือรูปภาพ (PNG, JPG)'
        },
        {
          icon: '📂',
          title: 'จัดการโฟลเดอร์ (Folder Organization)',
          description: 'สร้างและจัดการโฟลเดอร์แยกประเภทสื่อ เช่น วิดีโอหลัก, ซาวด์เอฟเฟกต์, รูปภาพ เพื่อความสะดวกรวดเร็ว'
        },
        {
          icon: '☁️',
          title: 'เชื่อมต่อ Google Drive',
          description: 'ดึงไฟล์สื่อและทรัพยากรตรงจาก Google Drive ของคุณโดยไม่ต้องเปลืองพื้นที่จัดเก็บในเครื่อง'
        },
        {
          icon: '🔗',
          title: 'ระบบ Relink Media อัจฉริยะ',
          description: 'หากไฟล์ถูกย้ายหรือหาไม่พบ ระบบมีเครื่องมือค้นหาและเชื่อมโยงไฟล์ใหม่ให้อัตโนมัติในคลิกเดียว'
        }
      ],
      tip: '💡 เคล็ดลับ: สามารถคลิกปุ่ม "+" บนการ์ดสื่อเพื่อเพิ่มคลิปลงบนไทม์ไลน์ได้ทันที'
    },
    {
      stepNumber: 2,
      targetArea: 'canvas',
      title: 'หน้าต่างพรีวิว & เครื่องเล่น Canvas (Media Canvas)',
      subtitle: 'พื้นที่ตรงกลางสำหรับดูตัวอย่างการตัดต่อและจัดวางเลย์เอาต์แบบ Real-time',
      icon: <Monitor className="w-5 h-5 text-indigo-400" />,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      items: [
        {
          icon: '📺',
          title: 'จอแสดงผลความคมชัดสูง (4K / 2K)',
          description: 'รองรับการพรีวิวความคมชัดสูงระดับ 4K Ultra HD และ 2K Quad HD ตามสัดส่วนภาพที่กำหนด (16:9, 9:16, 1:1, 4:3)'
        },
        {
          icon: '⏯️',
          title: 'เครื่องเล่นและแถบเวลา (Playback Controls)',
          description: 'ควบคุมการเล่น/หยุดชั่วคราว แสดงเวลาปัจจุบัน (Current Time) และความยาวรวมของงานอย่างแม่นยำ'
        },
        {
          icon: '🖱️',
          title: 'คลิกเลือกบนจอโดยตรง (Direct Canvas Select)',
          description: 'สามารถคลิกที่ข้อความหรือวิดีโอบนหน้าจอเพื่อเลือกและเปิดแถบปรับแต่งได้ทันที'
        }
      ],
      tip: '⌨️ คีย์ลัด: กดปุ่ม Spacebar เพื่อ เล่น / หยุดชั่วคราว ได้ทันทีตลอดเวลา',
      shortcuts: ['Space = เล่น/หยุด', '← / → = เลื่อนเวลาทีละ 1s']
    },
    {
      stepNumber: 3,
      targetArea: 'inspector',
      title: 'แถบปรับแต่งคุณสมบัติ & เอฟเฟกต์ (Inspector Panel)',
      subtitle: 'พื้นที่ฝั่งขวาสำหรับตกแต่ง แก้ไข ปรับขนาด และใส่ลูกเล่นพิเศษให้กับคลิปที่เลือก',
      icon: <Sliders className="w-5 h-5 text-amber-400" />,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      items: [
        {
          icon: '⚙️',
          title: 'ปรับคุณสมบัติพื้นฐาน (Transform & Audio)',
          description: 'ปรับระดับเสียง (Volume), ความโปร่งใส (Opacity), ตำแหน่งพิกัด X/Y และขนาดสเกลของภาพ'
        },
        {
          icon: '✨',
          title: 'แอนิเมชันเคลื่อนไหว (Motion Animation)',
          description: 'เลือกแอนิเมชันเปิดตัว/ปิดท้าย เช่น Fade, Slide-Up, Pop-in, Bounce, Typewriter, และ Glow Wave วนซ้ำ'
        },
        {
          icon: '🔀',
          title: 'เอฟเฟกต์เปลี่ยนฉาก (Scene Transitions)',
          description: 'ใส่ทรานซิชันเชื่อมรอยต่อคลิป เช่น Cross-dissolve, Fade-black, Glitch, Blur, และ Slide'
        },
        {
          icon: '🔤',
          title: 'Text & Font Studio ภาษาไทย',
          description: 'ใส่ข้อความ 타이โป พร้อมคลังฟอนต์ภาษาไทยมาตรฐาน และลูกเล่นข้อความเรืองแสง (Neon) / 3D Shadow'
        }
      ],
      tip: '💡 เคล็ดลับ: ดับเบิ้ลคลิกที่คลิปข้อความบนไทม์ไลน์เพื่อเปิดหน้าต่าง Text Effect Editor แบบละเอียด'
    },
    {
      stepNumber: 4,
      targetArea: 'timeline',
      title: 'ไทม์ไลน์ตัดต่อมัลติแทร็ก (Multi-Track Timeline)',
      subtitle: 'พื้นที่ด้านล่างหัวใจหลักของการตัดต่อ จัดวางลำดับเวลาของเสียง วิดีโอ และข้อความ',
      icon: <Film className="w-5 h-5 text-emerald-400" />,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      items: [
        {
          icon: '🧱',
          title: 'มัลติแทร็กอิสระ (Multi-Tracks)',
          description: 'แยกแทร็กข้อความ (Text), วิดีโอหลัก/รูปภาพ (Video), และเสียงดนตรีประกอบ (Audio) ชัดเจน'
        },
        {
          icon: '🧲',
          title: 'Smart Snap Highlight (ระบบแม่เหล็กอัตโนมัติ)',
          description: 'เมื่อลากคลิปจะมีแถบไฟตรวจจับ: แถบไฟ Cyan (แทรกหน้าสื่อเดิม) หรือ แถบไฟ Amber (แทรกต่อท้าย)'
        },
        {
          icon: '✂️',
          title: 'เครื่องมือตัดแบ่งคลิป (Split Tool)',
          description: 'เลื่อนเส้น Playhead สีแดงไปยังตำแหน่งที่ต้องการ แล้วกดปุ่ม S บนคีย์บอร์ดเพื่อตัดแบ่งคลิป'
        },
        {
          icon: '↔️',
          title: 'ยืดขยายเวลาและปรับระดับความสูง',
          description: 'ลากขอบซ้าย/ขวาของคลิปเพื่อปรับความยาว และลากเส้นคั่นเพื่อปรับความสูงของไทม์ไลน์ได้อิสระ'
        }
      ],
      tip: '⌨️ คีย์ลัด: กดปุ่ม S เพื่อตัดคลิป (Split) และกดปุ่ม Del หรือ Backspace เพื่อลบคลิป',
      shortcuts: ['S = ตัดคลิป (Split)', 'Del = ลบคลิป', 'Shift + ←/→ = เลื่อน 5s']
    },
    {
      stepNumber: 5,
      targetArea: 'header',
      title: 'แถบเมนูด้านบน & ระบบจัดการโปรเจกต์ (Header & Studio)',
      subtitle: 'ศูนย์ควบคุมหลักสำหรับจัดการโปรเจกต์ ส่งออกวิดีโอ และเข้าถึงฟังก์ชันสำคัญ',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      items: [
        {
          icon: '🏠',
          title: 'ปุ่มหน้าหลัก & โปรเจกต์ (Home & Projects)',
          description: 'คลิกเพื่อย้อนกลับไปดูรายการโปรเจกต์ทั้งหมด สลับงาน หรือสร้างโปรเจกต์ใหม่ได้ตลอดเวลา'
        },
        {
          icon: '💾',
          title: 'ส่งออกวิดีโอ (Export Video)',
          description: 'ประมวลผลและดาวน์โหลดผลงานวิดีโอคุณภาพสูง (4K, 2K, Full HD, 60fps) ออกมาใช้งาน'
        },
        {
          icon: '💬',
          title: 'เว็บบอร์ดคอมมูนิตี้ & แจ้งปัญหา 1:1',
          description: 'พูดคุยแลกเปลี่ยนเทคนิคตัดต่อ แนบรูปภาพ 5 รูป หรือส่งข้อเสนอแนะตรงถึงผู้ดูแลระบบ'
        },
        {
          icon: '🎯',
          title: 'เปิดดูคำแนะนำนี้ซ้ำได้ตลอดเวลา',
          description: 'สามารถคลิกปุ่ม "แนะนำเครื่องมือ" หรือไอคอนเครื่องหมายคำถาม (?) ที่เมนูด้านบนเพื่อเปิดดูคู่มือนี้ได้เสมอ'
        }
      ],
      tip: '🎉 คุณพร้อมเริ่มต้นสร้างสรรค์ผลงานแล้ว! คลิก "เริ่มต้นใช้งาน Studio" เพื่อเริ่มสร้างงานได้เลย'
    }
  ];

  const step = tourSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 selection:bg-blue-500 selection:text-white animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col font-sans relative">
        {/* Top Progress Bar & Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shadow-md shrink-0">
              {step.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${step.badgeColor}`}>
                  ขั้นตอนที่ {step.stepNumber} จาก {tourSteps.length}
                </span>
                <span className="text-slate-400 text-xs font-mono">• Multimedia Studio Tour</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                {step.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition cursor-pointer"
            title="ปิดคำแนะนำ (Skip Tour)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-5 h-1.5 bg-slate-800">
          {tourSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-full transition-all duration-300 ${
                idx <= currentStep
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[65vh] text-xs">
          {/* Subtitle */}
          <p className="text-slate-300 font-doc leading-relaxed text-[13px]">
            {step.subtitle}
          </p>

          {/* Feature Grid / List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {step.items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg space-y-1 transition"
              >
                <div className="flex items-center gap-2 font-semibold text-slate-100 text-xs">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                <p className="text-slate-400 font-doc text-[11px] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Shortcuts Bar (if available) */}
          {step.shortcuts && (
            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-md flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-slate-400 flex items-center gap-1 font-mono">
                <Keyboard className="w-3 h-3 text-slate-400" />
                <span>คีย์ลัดด่วน:</span>
              </span>
              {step.shortcuts.map((sc, sidx) => (
                <span
                  key={sidx}
                  className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[10px]"
                >
                  {sc}
                </span>
              ))}
            </div>
          )}

          {/* Pro Tip Box */}
          <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-lg text-blue-200 text-xs font-doc flex items-center gap-2">
            <span>{step.tip}</span>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2.5 h-2.5 rounded-full transition cursor-pointer ${
                  idx === currentStep
                    ? 'bg-blue-500 w-6'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
                title={`ไปที่ขั้นตอนที่ ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-medium transition cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ย้อนกลับ</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-400 hover:text-slate-200 transition text-xs font-medium cursor-pointer"
            >
              ข้ามคำแนะนำ
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md transition shadow-md flex items-center gap-1.5 cursor-pointer text-xs"
            >
              {currentStep === tourSteps.length - 1 ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>เริ่มต้นใช้งาน Studio</span>
                </>
              ) : (
                <>
                  <span>ขั้นตอนถัดไป</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
