import React, { useState, useRef } from 'react';
import { 
  Plus, 
  FolderOpen, 
  FolderSearch,
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Trash2, 
  ArrowRight, 
  Film,
  Monitor,
  Cloud,
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  LogOut,
  Shield,
  MessageSquare,
  Heart,
  Edit3
} from 'lucide-react';
import type { UserSession, SavedProject } from '../types';
import { authService } from '../services/auth';
import { adminService } from '../services/adminService';
import { auditLogger } from '../services/auditLogger';
import { AppSwal, alertConfirm, alertError, alertSuccess } from '../utils/swal';

interface WelcomeScreenProps {
  userSession: UserSession | null;
  onLoginSuccess: (session: UserSession) => void;
  onLogout: () => void;
  onOpenProject: (project?: SavedProject) => void;
  onImportProject?: (projectData: any) => void;
  onOpenAdminPanel?: () => void;
  onOpenDonate?: () => void;
  onOpenInquiryWebboard?: () => void;
  onOpenUserProfile?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userSession,
  onLoginSuccess,
  onLogout,
  onOpenProject,
  onImportProject = () => {},
  onOpenAdminPanel = () => {},
  onOpenDonate = () => {},
  onOpenInquiryWebboard = () => {},
  onOpenUserProfile = () => {},
}) => {
  // Auth Mode State (Login vs Register)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Registration form state
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'editor' | 'admin'>('editor');
  const importInputRef = useRef<HTMLInputElement>(null);

  // Projects list state
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(authService.getSavedProjects());

  // Handle Register submission with Pending status and Audit Log
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regName.trim() || !regPassword.trim()) {
      alertError('กรุณากรอกข้อมูลให้ครบถ้วน', 'กรุณาระบุชื่อผู้ใช้งาน, ชื่อ-นามสกุล และรหัสผ่าน');
      return;
    }

    if (regPassword.length < 6) {
      alertError('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = adminService.registerPendingUser({
        username: regUsername.trim(),
        name: regName.trim(),
        email: regEmail.trim() || `${regUsername.trim()}@user.local`,
        role: regRole,
        password: regPassword,
      });
      setIsLoading(false);

      if (res.success) {
        auditLogger.log({
          type: 'USER_CHANGE',
          username: regUsername.trim(),
          role: regRole,
          action: 'ลงทะเบียนขอสมัครใช้งานระบบใหม่ (Status: Pending Approval)',
          status: 'WARNING',
          details: `Requested Role: ${regRole}, Name: ${regName}`
        });

        AppSwal.fire({
          icon: 'success',
          title: 'ส่งคำขอลงทะเบียนสำเร็จ!',
          html: `
            <div class="text-left font-sans text-xs space-y-2 text-slate-700">
              <div class="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 font-doc">
                <strong>สถานะ: ⏳ รอยืนยันการอนุมัติ (Pending Approval)</strong>
                <p class="mt-1 text-[11px] text-amber-800">
                  ระบบได้บันทึกข้อมูลและส่งการแจ้งเตือนไปยังผู้ดูแลระบบ (Admin) เรียบร้อยแล้ว เมื่อได้รับการอนุมัติ ท่านจะสามารถเข้าสู่ระบบเพื่อใช้งานได้ทันที
                </p>
              </div>
              <div class="text-[11px] text-slate-500 font-mono">
                ชื่อผู้ใช้งาน: <strong>@${regUsername.trim()}</strong> | สิทธิ์ที่ขอ: <strong>${regRole}</strong>
              </div>
            </div>
          `,
          confirmButtonText: 'รับทราบและกลับไปหน้าเข้าสู่ระบบ',
        }).then(() => {
          setRegUsername('');
          setRegName('');
          setRegEmail('');
          setRegPassword('');
          setAuthMode('login');
          setUsername(regUsername.trim());
        });
      } else {
        alertError('ลงทะเบียนไม่สำเร็จ', res.message);
      }
    }, 300);
  };

  // Handle Login submission with security checks and audit logging
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alertError('กรุณากรอกข้อมูล', 'กรุณาระบุชื่อผู้ใช้งานและรหัสผ่าน');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = authService.loginWithCredentials(username, password);
      setIsLoading(false);

      if (result.success && result.session) {
        setPassword('');
        auditLogger.log({
          type: 'LOGIN',
          username: result.session.username,
          role: result.session.role,
          action: 'เข้าสู่ระบบสำเร็จ (User Login)',
          status: 'SUCCESS'
        });
        alertSuccess('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับคุณ ${result.session.name}`);
        onLoginSuccess(result.session);
      } else {
        auditLogger.log({
          type: 'FAILED_LOGIN',
          username: username.trim(),
          role: 'guest',
          action: 'เข้าสู่ระบบไม่สำเร็จ (Failed Login Attempt)',
          status: 'FAILED',
          details: result.message
        });
        alertError('เข้าสู่ระบบไม่สำเร็จ', result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    }, 250);
  };

  const handleRenameProject = async (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    const { value: newName } = await AppSwal.fire({
      title: 'แก้ไขชื่อโปรเจกต์',
      input: 'text',
      inputValue: project.name,
      inputLabel: 'ชื่อโปรเจกต์ใหม่ (Project Name):',
      inputPlaceholder: 'ระบุชื่อโปรเจกต์ที่ต้องการ...',
      showCancelButton: true,
      confirmButtonText: 'บันทึกชื่อใหม่',
      cancelButtonText: 'ยกเลิก',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'กรุณากรอกชื่อโปรเจกต์';
        }
        return null;
      },
    });

    if (newName && newName.trim() !== project.name) {
      authService.updateProject(project.id, { name: newName.trim() });
      setSavedProjects(authService.getSavedProjects());
      auditLogger.log({
        type: 'PROJECT_SAVE',
        username: userSession?.username || 'user',
        role: userSession?.role || 'editor',
        action: `แก้ไขชื่อโปรเจกต์เป็น: ${newName.trim()} (เดิม: ${project.name})`,
        status: 'SUCCESS'
      });
      alertSuccess('เปลี่ยนชื่อโปรเจกต์สำเร็จ', `อัปเดตเป็น "${newName.trim()}" เรียบร้อยแล้ว`);
    }
  };

  const handleDeleteProject = async (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await alertConfirm(
      'ลบโปรเจกต์',
      `คุณต้องการลบโปรเจกต์ "${project.name}" ใช่หรือไม่?`,
      'ลบโปรเจกต์',
      'ยกเลิก'
    );
    if (confirmed) {
      authService.deleteProject(project.id);
      setSavedProjects(authService.getSavedProjects());
      auditLogger.log({
        type: 'PROJECT_SAVE',
        username: userSession?.username || 'user',
        role: userSession?.role || 'editor',
        action: `ลบโปรเจกต์: ${project.name}`,
        status: 'WARNING'
      });
    }
  };

  const handleCreateNewProject = async () => {
    const isPremium = userSession?.isPremium === true || userSession?.role === 'admin';
    if (!isPremium && savedProjects.length >= 3) {
      alertError(
        'ถึงขีดจำกัดจำนวนโปรเจกต์',
        `บัญชีผู้ใช้ทั่วไปสามารถสร้างโปรเจกต์ได้สูงสุด 3 โปรเจกต์ (ปัจจุบันคุณมี ${savedProjects.length} โปรเจกต์)\n\nกรุณาลบโปรเจกต์เดิมออก หรือติดต่อผู้ดูแลระบบเพื่ออัปเกรดเป็น Premium (สร้างได้ไม่จำกัด)`
      );
      return;
    }

    const { value: formValues } = await AppSwal.fire({
      title: 'สร้างโปรเจกต์ใหม่ (Create New Project)',
      html: `
        <div class="space-y-4 text-left font-sans text-xs pt-2">
          <div>
            <label class="block font-medium text-slate-700 mb-1">ชื่อโปรเจกต์ (Project Name)</label>
            <input 
              id="swal-new-proj-name" 
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              value="Project_${Date.now().toString().slice(-4)}"
            >
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1 font-semibold text-slate-800">สัดส่วนภาพ (Aspect Ratio)</label>
            <select id="swal-new-proj-ratio" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 font-medium">
              <option value="16:9" selected>16:9 (แนวนอน / YouTube / TV)</option>
              <option value="9:16">9:16 (แนวตั้ง / TikTok / Reels)</option>
              <option value="1:1">1:1 (สี่เหลี่ยมจัตุรัส / Instagram)</option>
              <option value="4:3">4:3 (คลาสสิก / Retro)</option>
            </select>
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">ความละเอียดเรนเดอร์ (Resolution)</label>
            <select id="swal-new-proj-res" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800">
              <option value="4K (3840x2160)">4K Ultra HD (3840x2160)</option>
              <option value="2K (2560x1440)" selected>2K Quad HD (2560x1440)</option>
              <option value="1080p (1920x1080)">1080p Full HD (1920x1080)</option>
              <option value="720p (1280x720)">720p HD (1280x720)</option>
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'เริ่มสร้างโปรเจกต์',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const name = (document.getElementById('swal-new-proj-name') as HTMLInputElement).value;
        const aspectRatio = (document.getElementById('swal-new-proj-ratio') as HTMLSelectElement).value as any;
        const resolution = (document.getElementById('swal-new-proj-res') as HTMLSelectElement).value as any;

        if (!name.trim()) {
          AppSwal.showValidationMessage('กรุณาระบุชื่อโปรเจกต์');
          return false;
        }

        return { name: name.trim(), aspectRatio, resolution };
      }
    });

    if (formValues) {
      const newP: SavedProject = {
        id: `proj-${Date.now()}`,
        name: formValues.name,
        aspectRatio: formValues.aspectRatio,
        resolution: formValues.resolution,
        fps: 30,
        totalDuration: 30,
        clipCount: 0,
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      onOpenProject(newP);
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.name.endsWith('.json') || file.name.endsWith('.mwa')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          onImportProject(parsed);
          auditLogger.log({
            type: 'PROJECT_IMPORT',
            username: userSession?.username || 'user',
            role: userSession?.role || 'editor',
            action: `นำเข้าไฟล์โปรเจกต์: ${file.name}`,
            status: 'SUCCESS'
          });
          alertSuccess('นำเข้าโปรเจกต์สำเร็จ', `โปรเจกต์ "${parsed.projectSettings?.name || file.name}" พร้อมใช้งาน`);
        } catch {
          alertError('รูปแบบไฟล์ไม่ถูกต้อง', 'ไม่สามารถอ่านโครงสร้างโปรเจกต์จากไฟล์ที่เลือกได้');
        }
      };
      reader.readAsText(file);
    } else {
      // Media file imported as project base
      const dummyProject: SavedProject = {
        id: `proj-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        aspectRatio: '16:9',
        resolution: '2K (2560x1440)',
        fps: 30,
        totalDuration: 15,
        clipCount: 1,
        localFolderPath: (file as any).path || `C:\\ImportedMedia\\${file.name}`,
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      authService.saveProject(dummyProject);
      setSavedProjects(authService.getSavedProjects());
      onOpenProject(dummyProject);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans selection:bg-blue-500 selection:text-white">
      {/* Hidden File Input for Importing Project */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,.mwa,video/*,audio/*,image/*"
        className="hidden"
        onChange={handleImportFileChange}
      />

      {/* Top Banner Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-white border border-slate-200 p-0.5 shadow-2xs flex items-center justify-center overflow-hidden">
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
            <span className="font-semibold text-sm text-slate-900 tracking-tight block">
              Multimedia Web Application
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Studio Edition • v2.5</span>
          </div>
        </div>

        {/* Action Toolbar in Header */}
        <div className="flex items-center gap-2.5">
          {/* Webboard & 1:1 Inquiry Button */}
          <button
            onClick={onOpenInquiryWebboard}
            title="เว็บบอร์ดคอมมูนิตี้ & แจ้งปัญหา/ข้อเสนอแนะ 1:1"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">เว็บบอร์ด & 1:1</span>
          </button>

          {/* Donate Button */}
          <button
            onClick={onOpenDonate}
            title="สนับสนุน & โดเนทแก่ผู้พัฒนาระบบ (PromptPay 064-3026465, Stripe)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition shadow-2xs"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span className="hidden sm:inline">โดเนท</span>
          </button>

          {/* Admin Panel Button (if logged in as admin) */}
          {userSession?.role === 'admin' && (
            <button
              onClick={onOpenAdminPanel}
              title="ศูนย์ควบคุมผู้ดูแลระบบ (Admin Console)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded border border-slate-800 transition shadow-2xs relative"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>ผู้ดูแลระบบ (Admin)</span>
              {adminService.getPendingUsersCount() > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-bold rounded-full text-[10px] animate-pulse">
                  {adminService.getPendingUsersCount()}
                </span>
              )}
            </button>
          )}

          <div className="h-5 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

          {/* User Session Info / Status */}
          {userSession ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={onOpenUserProfile}
                title="คลิกเพื่อตั้งค่าข้อมูลส่วนตัว & เปลี่ยนรหัสผ่าน"
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-200 transition text-xs group"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-[10px]">
                  {userSession.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-slate-800 group-hover:text-blue-600">{userSession.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-mono uppercase">
                  {userSession.role}
                </span>
              </button>
              <button
                onClick={onLogout}
                title="ออกจากระบบ (Sign Out)"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 font-doc">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>สิทธิ์ความปลอดภัยสูง</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Split Layout: Left Info & Right Auth / Projects */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: First Impression Details */}
        <div className="lg:col-span-7 space-y-6 pr-0 lg:pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ระบบสตูดิโอตัดต่อสื่อเว็บแอปพลิเคชันยุคใหม่</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              สร้างสรรค์ผลงานมัลติมีเดีย <br />
              <span className="text-blue-600">รวดเร็ว คมชัด และสบายตาที่สุด</span>
            </h1>
            <p className="text-sm text-slate-600 font-doc leading-relaxed max-w-xl">
              ระบบตัดต่อและจัดการวิดีโอ เสียง รูปภาพ และไตเติ้ลบนเว็บเบราว์เซอร์ 
              ออกแบบด้วยสถาปัตยกรรม <strong>Slate Palette</strong> เพื่อถนอมสายตา 
              พร้อมเชื่อมต่อ Google Drive และเครื่องมือจัดวางแบบ Multi-Track ครบวงจร
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-white border border-slate-200 rounded shadow-2xs flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800">ความละเอียด 4K & 2K Quad HD</h4>
                <p className="text-[11px] text-slate-500 font-doc mt-0.5">รองรับการส่งออกวิดีโอคุณภาพสูง 60 FPS</p>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded shadow-2xs flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800">Google Drive Service</h4>
                <p className="text-[11px] text-slate-500 font-doc mt-0.5">ดึงไฟล์และอัปโหลดผลงานสู่ Cloud โดยตรง</p>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded shadow-2xs flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800">Multi-Track & Text Effects</h4>
                <p className="text-[11px] text-slate-500 font-doc mt-0.5">ลากย้ายคลิปอิสระ, ฟอนต์ไทย, Neon & 3D</p>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded shadow-2xs flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800">Resilience Engine</h4>
                <p className="text-[11px] text-slate-500 font-doc mt-0.5">ป้องกัน Error Web และกู้คืนสถานะอัตโนมัติ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Secure Login Form OR Registration Form OR Projects Manager */}
        <div className="lg:col-span-5">
          {!userSession ? (
            authMode === 'login' ? (
              /* Secure Login Form */
              <div className="bg-white border border-slate-200 rounded-md shadow-lg p-6 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>เข้าสู่ระบบก่อนเริ่มใช้งาน (Sign In)</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-doc">
                    กรุณาระบุชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าสู่ Studio
                  </p>
                </div>

                {/* Secure Form: Protected against Browser Password Saving & Autofill */}
                <form 
                  onSubmit={handleLogin} 
                  autoComplete="off" 
                  data-lpignore="true" 
                  data-form-type="other"
                  className="space-y-4 text-xs"
                >
                  {/* Dummy hidden input to deceive standard browser autofill sniffers */}
                  <input type="text" name="prevent_autofill_user" className="hidden" tabIndex={-1} autoComplete="off" />
                  <input type="password" name="prevent_autofill_pass" className="hidden" tabIndex={-1} autoComplete="off" />

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      ชื่อผู้ใช้งาน (Username)
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="mwa_user_identity"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-form-type="other"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="ระบุชื่อผู้ใช้งาน"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      รหัสผ่าน (Password)
                    </label>
                    <div className="relative">
                      <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="mwa_secure_token"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-form-type="other"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="ระบุรหัสผ่าน"
                        className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs font-mono"
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 rounded transition shadow-sm flex items-center justify-center gap-2 text-xs"
                  >
                    {isLoading ? (
                      <span>กำลังตรวจสอบสิทธิ์...</span>
                    ) : (
                      <>
                        <span>เข้าสู่ระบบ (Sign In)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-[11px] text-slate-400 font-doc">ยังไม่มีบัญชีใช้งาน?</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Registration Switch Button */}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 font-medium py-2.5 rounded transition shadow-2xs text-xs"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>ลงทะเบียนขอสมัครใช้งานใหม่ (Register / Request Access)</span>
                </button>
              </div>
            ) : (
              /* Registration Form (Status: Pending Approval) */
              <div className="bg-white border border-slate-200 rounded-md shadow-lg p-6 space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 text-[11px] font-medium">
                    <span>⏳ สมัครสมาชิกใหม่ (รอการอนุมัติ)</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <span>แบบฟอร์มลงทะเบียนขอใช้งานระบบ</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-doc">
                    กรอกข้อมูลเพื่อขอสิทธิ์การใช้งาน ผู้ดูแลระบบจะทำการตรวจสอบและอนุมัติ
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      ชื่อผู้ใช้งานที่ต้องการ (Username)*
                    </label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. video_editor01"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      ชื่อ-นามสกุลจริง (Full Name)*
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. สมศักดิ์ มีสุข"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      อีเมลสำหรับติดต่อ (Email)*
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. somsak@example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      กำหนดรหัสผ่าน (Password)*
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      ระดับสิทธิ์ที่ขอใช้งาน (Desired Role)*
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                    >
                      <option value="editor">Editor (ตัดต่อและจัดการสื่อได้ทั้งหมด)</option>
                      <option value="admin">Administrator (ผู้ดูแลระบบ)</option>
                    </select>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 font-doc space-y-1">
                    <span className="font-semibold text-slate-800 block">📌 ข้อตกลงการใช้งาน:</span>
                    <span>เมื่อส่งคำขอแล้ว บัญชีจะมีสถานะ "รอยืนยัน" จนกว่าแอดมินจะกดยืนยันอนุมัติในระบบ</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-2.5 rounded transition shadow-sm flex items-center justify-center gap-2 text-xs"
                  >
                    {isLoading ? (
                      <span>กำลังส่งคำขอลงทะเบียน...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>ยืนยันส่งข้อมูลขอสมัครใช้งาน</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-medium hover:underline text-center block"
                  >
                    ← มีบัญชีอยู่แล้ว? กลับไปหน้าเข้าสู่ระบบ (Sign In)
                  </button>
                </form>
              </div>
            )
          ) : (
            /* Logged in: Projects List or Empty State */
            <div className="bg-white border border-slate-200 rounded-md shadow-lg p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-800">รายการโปรเจกต์ของคุณ (Projects)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => importInputRef.current?.click()}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded transition border border-slate-300"
                    title="นำเข้าไฟล์โปรเจกต์ .mwa, .json หรือไฟล์สื่อที่มีในเครื่อง"
                  >
                    <FolderSearch className="w-3.5 h-3.5 text-slate-600" />
                    <span>นำเข้าโปรเจกต์</span>
                  </button>

                  <button
                    onClick={handleCreateNewProject}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded transition shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>สร้างโปรเจกต์</span>
                  </button>
                </div>
              </div>

              {savedProjects.length === 0 ? (
                /* Empty Project State with Big Square Plus Button */
                <div className="py-8 px-4 text-center space-y-4">
                  <button
                    onClick={handleCreateNewProject}
                    className="w-24 h-24 mx-auto rounded border-2 border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/50 hover:bg-blue-100/70 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer group shadow-2xs"
                  >
                    <Plus className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                  </button>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      คุณยังไม่เคยใช้งาน ลองสร้างโปรเจ็คงานดูสิ
                    </p>
                    <p className="text-xs text-slate-500 font-doc max-w-xs mx-auto">
                      คลิกที่ปุ่มบวกด้านบนเพื่อเริ่มต้นสร้างโปรเจกต์ตัดต่อมัลติมีเดียชิ้นแรกของคุณ
                    </p>
                  </div>
                </div>
              ) : (
                /* Projects List */
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {savedProjects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => onOpenProject(proj)}
                      className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
                          <Film className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600">
                            {proj.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>{proj.resolution.split(' ')[0]}</span>
                            <span>• {proj.aspectRatio}</span>
                            <span>• {proj.clipCount} คลิป</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleRenameProject(proj, e)}
                          title="แก้ไขชื่อโปรเจกต์ (Rename Project)"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(proj, e)}
                          title="ลบโปรเจกต์"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5 ml-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Enter Studio Button */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCreateNewProject}
                  className="w-full bg-slate-900 hover:bg-black text-white font-medium py-2.5 rounded transition shadow-sm flex items-center justify-center gap-2 text-xs"
                >
                  <span>🚀 เข้าสู่หน้าตัดต่อ (Enter Studio)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-200 bg-white px-6 flex items-center justify-between text-xs text-slate-500 font-doc">
        <span>© 2026 Multimedia Web Application Studio</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span>TailwindCSS + SweetAlert2</span>
          <span>•</span>
          <span>Google Drive API Ready</span>
        </div>
      </footer>
    </div>
  );
};
