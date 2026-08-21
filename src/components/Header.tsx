import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Settings, 
  HelpCircle, 
  Undo2, 
  Redo2,
  Maximize,
  Minimize,
  Terminal,
  RefreshCw,
  Shield,
  Heart,
  MessageSquare,
  Home
} from 'lucide-react';
import { AppSwal } from '../utils/swal';
import { adminService } from '../services/adminService';
import type { ProjectSettings, UserSession } from '../types';

interface HeaderProps {
  projectSettings: ProjectSettings;
  userSession: UserSession | null;
  onUpdateSettings: (settings: ProjectSettings) => void;
  onExport: () => void;
  onNewAsset: () => void;
  onAddTextClip: () => void;
  onCheckUpdates: () => void;
  onGoHome: () => void;
  onOpenAdminPanel: () => void;
  onOpenDonate: () => void;
  onOpenInquiryWebboard: () => void;
  onOpenUserProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectSettings,
  userSession,
  onUpdateSettings,
  onExport,
  onCheckUpdates,
  onGoHome,
  onOpenAdminPanel,
  onOpenDonate,
  onOpenInquiryWebboard,
  onOpenUserProfile,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with browser events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const handleOpenDevServerModal = () => {
    AppSwal.fire({
      title: 'รันคำสั่งเซิร์ฟเวอร์ (Development Server)',
      html: `
        <div class="space-y-4 text-left font-sans text-xs pt-2 text-slate-700">
          <p class="font-doc text-slate-600">
            ระบบทำงานบน Vite Development Server สามารถรันคำสั่งผ่าน Terminal หรือดับเบิลคลิกไฟล์สคริปต์อัตโนมัติได้ทันที:
          </p>

          <div class="space-y-2">
            <label class="font-semibold text-slate-800">คำสั่งรันระบบ (CLI Command):</label>
            <div class="flex items-center justify-between p-2.5 bg-slate-900 text-emerald-400 font-mono rounded text-xs">
              <span>npm run dev</span>
              <button 
                id="btn-copy-cmd"
                class="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
              >
                คัดลอก
              </button>
            </div>
          </div>

          <div class="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 space-y-1.5 font-doc">
            <div class="font-semibold flex items-center gap-1.5">
              <span>💡 ช่องทางรันแบบคลิกเดียว (1-Click Run):</span>
            </div>
            <p>
              ได้สร้างไฟล์สคริปต์ <strong>start_dev.bat</strong> ไว้ที่โฟลเดอร์โปรเจกต์ <code>C:\\Users\\UDTC_COM\\Documents\\mwa\\start_dev.bat</code> เพียงดับเบิลคลิกก็สามารถเปิดรันได้ทันที
            </p>
          </div>

          <div class="flex justify-between items-center text-[11px] text-slate-500 font-mono pt-1">
            <span>สถานะระบบ: ทำงานปกติ (Active)</span>
            <span>Port: http://localhost:5173</span>
          </div>
        </div>
      `,
      confirmButtonText: 'รับทราบ',
      didOpen: () => {
        const btn = document.getElementById('btn-copy-cmd');
        if (btn) {
          btn.onclick = () => {
            navigator.clipboard.writeText('npm run dev');
            btn.innerText = 'คัดลอกแล้ว!';
            setTimeout(() => { btn.innerText = 'คัดลอก'; }, 2000);
          };
        }
      }
    });
  };

  const handleOpenSettings = async () => {
    const { value: formValues } = await AppSwal.fire({
      title: 'ตั้งค่าโปรเจกต์ (Project Settings)',
      html: `
        <div class="space-y-4 text-left font-sans text-xs pt-2">
          <div>
            <label class="block font-medium text-slate-700 mb-1">ชื่อโปรเจกต์ (Project Name)</label>
            <input 
              id="swal-proj-name" 
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              value="${projectSettings.name}"
            >
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">สัดส่วนภาพ (Aspect Ratio)</label>
            <select id="swal-proj-ratio" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800">
              <option value="16:9" ${projectSettings.aspectRatio === '16:9' ? 'selected' : ''}>16:9 (แนวนอน / YouTube / TV)</option>
              <option value="9:16" ${projectSettings.aspectRatio === '9:16' ? 'selected' : ''}>9:16 (แนวตั้ง / TikTok / Reels)</option>
              <option value="1:1" ${projectSettings.aspectRatio === '1:1' ? 'selected' : ''}>1:1 (สี่เหลี่ยมจัตุรัส / Instagram)</option>
              <option value="4:3" ${projectSettings.aspectRatio === '4:3' ? 'selected' : ''}>4:3 (คลาสสิก / Retro)</option>
            </select>
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">ความละเอียดเรนเดอร์ (Resolution)</label>
            <select id="swal-proj-res" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800">
              <option value="4K (3840x2160)" ${projectSettings.resolution === '4K (3840x2160)' ? 'selected' : ''}>4K Ultra HD (3840x2160)</option>
              <option value="2K (2560x1440)" ${projectSettings.resolution === '2K (2560x1440)' ? 'selected' : ''}>2K Quad HD (2560x1440)</option>
              <option value="1080p (1920x1080)" ${projectSettings.resolution === '1080p (1920x1080)' ? 'selected' : ''}>1080p Full HD (1920x1080)</option>
              <option value="720p (1280x720)" ${projectSettings.resolution === '720p (1280x720)' ? 'selected' : ''}>720p HD (1280x720)</option>
            </select>
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">อัตราเฟรมเรต (FPS)</label>
            <select id="swal-proj-fps" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800">
              <option value="60" ${projectSettings.fps === 60 ? 'selected' : ''}>60 FPS (ลื่นไหลพิเศษ / Gaming / Motion)</option>
              <option value="30" ${projectSettings.fps === 30 ? 'selected' : ''}>30 FPS (มาตรฐานทั่วไป / Web Video)</option>
              <option value="24" ${projectSettings.fps === 24 ? 'selected' : ''}>24 FPS (ภาพยนตร์ / Cinematic)</option>
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึกการตั้งค่า',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const name = (document.getElementById('swal-proj-name') as HTMLInputElement).value;
        const aspectRatio = (document.getElementById('swal-proj-ratio') as HTMLSelectElement).value as any;
        const resolution = (document.getElementById('swal-proj-res') as HTMLSelectElement).value as any;
        const fps = Number((document.getElementById('swal-proj-fps') as HTMLSelectElement).value);

        if (!name.trim()) {
          AppSwal.showValidationMessage('กรุณาระบุชื่อโปรเจกต์');
          return false;
        }

        return { name: name.trim(), aspectRatio, resolution, fps };
      }
    });

    if (formValues) {
      onUpdateSettings(formValues);
    }
  };

  const handleShowShortcuts = () => {
    AppSwal.fire({
      title: 'คีย์ลัดสำหรับสตูดิโอ (Keyboard Shortcuts)',
      html: `
        <div class="space-y-2 text-left font-sans text-xs pt-2 text-slate-700">
          <div class="flex justify-between py-1.5 border-b border-slate-100">
            <span class="font-medium">เล่น / หยุดชั่วคราว</span>
            <kbd class="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">Space</kbd>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100">
            <span class="font-medium">ตัดคลิปที่เลือก (Split)</span>
            <kbd class="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">S</kbd>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100">
            <span class="font-medium">ลบคลิปที่เลือก (Delete)</span>
            <kbd class="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">Del / Backspace</kbd>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100">
            <span class="font-medium">เลื่อนเวลาทีละ 1 วินาที</span>
            <kbd class="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">← / →</kbd>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="font-medium">เลื่อนเวลาทีละ 5 วินาที</span>
            <kbd class="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">Shift + ← / →</kbd>
          </div>
        </div>
      `,
      confirmButtonText: 'ปิด',
    });
  };

  return (
    <header className="h-14 bg-app-surface border-b border-app-border flex items-center justify-between px-4 select-none shrink-0 z-20">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        {/* Custom Logo & Go Home button */}
        <button
          onClick={onGoHome}
          title="กลับไปยังหน้ารายการโปรเจกต์ & ข้อมูลระบบ"
          className="flex items-center gap-2.5 hover:opacity-85 transition group text-left"
        >
          <div className="w-8 h-8 rounded bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-2xs p-0.5 group-hover:border-blue-400">
            <img 
              src="./logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }} 
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm text-slate-800 tracking-tight">Multimedia Studio</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200 font-mono">v2.5</span>
            </div>
          </div>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Project Name and Quick Status */}
        <button 
          onClick={handleOpenSettings}
          title="คลิกเพื่อแก้ไขชื่อและตั้งค่าโปรเจกต์"
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded hover:bg-slate-100 text-left transition group border border-transparent hover:border-slate-200"
        >
          <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600">
            {projectSettings.name}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            [{projectSettings.aspectRatio} • {projectSettings.resolution.split(' ')[0]} • {projectSettings.fps}fps]
          </span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

        {/* Back to Home & Projects Button */}
        <button
          onClick={onGoHome}
          title="ย้อนกลับไปหน้าเริ่มต้น / สลับโปรเจกต์ (Back to Projects List)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition shadow-2xs text-xs font-medium"
        >
          <Home className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">หน้าหลัก & โปรเจกต์</span>
        </button>
      </div>

      {/* Menu / Action Toolbar */}
      <div className="flex items-center gap-1.5">
        {/* Admin Console Button (Top-Right Admin Management) */}
        {userSession?.role === 'admin' && (
          <button
            onClick={onOpenAdminPanel}
            title="ศูนย์ควบคุมผู้ดูแลระบบ (จัดการผู้ใช้, โดเนท, คำร้องเรียน)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded border border-slate-800 transition shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">ผู้ดูแลระบบ (Admin)</span>
            {adminService.getPendingUsersCount() > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-bold rounded-full text-[10px] animate-pulse">
                {adminService.getPendingUsersCount()}
              </span>
            )}
          </button>
        )}

        {/* Community Webboard & 1:1 Inquiry Button */}
        <button
          onClick={onOpenInquiryWebboard}
          title="เว็บบอร์ดคอมมูนิตี้ & แจ้งปัญหา/ข้อเสนอแนะ 1:1"
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition shadow-2xs"
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden lg:inline">เว็บบอร์ด & 1:1</span>
        </button>

        {/* Donate Button */}
        <button
          onClick={onOpenDonate}
          title="สนับสนุน & โดเนทแก่ผู้พัฒนาระบบ (PromptPay 064-3026465, Stripe)"
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition shadow-2xs"
        >
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          <span className="hidden sm:inline">โดเนท</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

        {/* System Health & Update Checker Button */}
        <button
          onClick={onCheckUpdates}
          title="ตรวจสอบการอัปเดตระบบและความสมบูรณ์ (Check System Updates)"
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden xl:inline">อัปเดต</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>
        <button 
          title="Undo (Ctrl+Z)" 
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button 
          title="Redo (Ctrl+Y)" 
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

        {/* NPM RUN DEV Runner / Server Helper button */}
        <button 
          onClick={handleOpenDevServerModal}
          title="จัดการเซิร์ฟเวอร์ (npm run dev)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition shadow-2xs"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden md:inline font-mono">npm run dev</span>
        </button>

        {/* Fullscreen Toggle Button with State Display */}
        <button 
          onClick={toggleFullscreen}
          title={isFullscreen ? 'ปิดการแสดงผลเต็มหน้าจอ (Esc)' : 'แสดงผลเต็มหน้าจอ (Fullscreen)'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border transition shadow-2xs ${
            isFullscreen 
              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {isFullscreen ? (
            <>
              <Minimize className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">ปิดเต็มจอ</span>
            </>
          ) : (
            <>
              <Maximize className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">เต็มจอ</span>
            </>
          )}
        </button>

        <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

        <button 
          onClick={handleOpenSettings}
          title="ตั้งค่าโปรเจกต์" 
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition shadow-2xs"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden lg:inline">ตั้งค่า</span>
        </button>

        <button 
          onClick={handleShowShortcuts}
          title="คีย์ลัด" 
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile & Change Password Trigger for all users */}
        {userSession && (
          <button
            onClick={onOpenUserProfile}
            title={`ตั้งค่าโปรไฟล์ & เปลี่ยนรหัสผ่าน (${userSession.name})`}
            className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200 transition text-xs font-medium"
          >
            <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[9px]">
              {userSession.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden xl:inline max-w-[90px] truncate">{userSession.name}</span>
          </button>
        )}

        <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

        {/* Primary Export Action */}
        <button 
          onClick={onExport}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium px-4 py-1.5 rounded shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Project</span>
        </button>
      </div>
    </header>
  );
};
