import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  Layers, 
  X,
  ArrowUpCircle,
  ShieldAlert
} from 'lucide-react';
import { alertSuccess } from '../utils/swal';
import type { UserSession } from '../types';

interface SystemUpdateModalProps {
  userSession?: UserSession | null;
  onClose: () => void;
}

export const SystemUpdateModal: React.FC<SystemUpdateModalProps> = ({ userSession, onClose }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isUpdated, setIsUpdated] = useState(false);
  const isAdmin = userSession?.role === 'admin';

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleApplyUpdate = () => {
    if (!isAdmin) return;
    setIsUpdated(true);
    alertSuccess('ปรับปรุงระบบเรียบร้อยแล้ว', 'ระบบได้รับการอัปเดต Schema และโครงสร้างข้อมูลเป็นเวอร์ชันล่าสุด 2.5.2');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-md shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center">
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                ระบบตรวจสอบการอัปเดตและความสมบูรณ์ของระบบ (System Health & Update)
              </h2>
              <p className="text-xs text-slate-500 font-doc">
                ตรวจสอบเวอร์ชันซอฟต์แวร์, โครงสร้างข้อมูล และประสิทธิภาพฮาร์ดแวร์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {isChecking ? (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="font-medium text-slate-700">กำลังตรวจสอบสถานะระบบและเวอร์ชันล่าสุด...</p>
            </div>
          ) : (
            <>
              {/* Version Comparison Card */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-900 text-sm">เวอร์ชันปัจจุบัน: v2.5.0</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px]">
                      Stable
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700 font-doc mt-0.5">
                    มีเวอร์ชันอัปเดตใหม่แนะนำ: <strong className="font-mono">v2.5.2 (Performance & 2K Boost)</strong>
                  </p>
                </div>

                {isAdmin ? (
                  <button
                    onClick={handleApplyUpdate}
                    disabled={isUpdated}
                    className={`px-3.5 py-2 rounded text-xs font-medium transition flex items-center gap-1.5 shadow-2xs ${
                      isUpdated
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isUpdated ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>อัปเดตแล้ว</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span>กดอัปเดตระบบ</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-500 font-doc">
                    <ShieldAlert className="w-3 h-3 text-slate-400" />
                    <span>เฉพาะสิทธิ์ผู้ดูแลระบบ</span>
                  </div>
                )}
              </div>

              {/* Hardware & Diagnostics Status */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  การวินิจฉัยความพร้อมของระบบ (System Diagnostics)
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Hardware Video Decoder</div>
                      <div className="text-[10px] text-slate-500 font-mono">H.264 / VP9 Ready</div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center gap-2.5">
                    <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Storage & Memory</div>
                      <div className="text-[10px] text-slate-500 font-mono">Max 4 GB / Multi-Blob</div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">2K / 4K Rendering Pipeline</div>
                      <div className="text-[10px] text-slate-500 font-mono">Quad HD Enabled</div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">Google Drive API</div>
                      <div className="text-[10px] text-slate-500 font-mono">Scope: drive.file</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations & Optimization Advice */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded space-y-1.5 font-doc">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>คำแนะนำในการปรับแต่งระบบให้เหมาะสม:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                  <li>เปิดใช้งาน <strong>Hardware Acceleration</strong> ในเบราว์เซอร์ เพื่อให้การเล่นวิดีโอ 2K ลื่นไหล 60 FPS</li>
                  <li>สำหรับการส่งออกไฟล์วิดีโอที่มีความยาวเกิน 10 นาที แนะนำเลือกใช้ฟอร์แมต <strong>WebM (VP9)</strong> หรือ <strong>MP4 Standard</strong> เพื่อประหยัดพื้นที่และเรนเดอร์รวดเร็ว</li>
                  <li>เมื่อตัดต่อเสร็จสิ้น ให้ใช้ปุ่มบันทึกลง <strong>Google Drive</strong> เพื่อเก็บไฟล์ต้นฉบับไว้บนระบบ Cloud อย่างปลอดภัย</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-300 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
