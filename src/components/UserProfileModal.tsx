import React, { useState } from 'react';
import { 
  User, 
  X, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  ShieldCheck, 
  Mail, 
  BadgeCheck, 
  CheckCircle2
} from 'lucide-react';
import type { UserSession } from '../types';
import { authService } from '../services/auth';
import { alertSuccess, alertError } from '../utils/swal';

interface UserProfileModalProps {
  userSession: UserSession;
  onUpdateSession: (updatedSession: UserSession) => void;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userSession,
  onUpdateSession,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile Form State
  const [name, setName] = useState(userSession.name);
  const [email, setEmail] = useState(userSession.email || '');

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save Profile Changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alertError('กรุณากรอกชื่อ', 'ชื่อ-นามสกุลไม่สามารถเว้นว่างได้');
      return;
    }

    const updated = authService.updateProfile(name, email);
    if (updated) {
      onUpdateSession(updated);
      alertSuccess('บันทึกข้อมูลสำเร็จ', 'ข้อมูลส่วนตัวของคุณถูกอัปเดตเรียบร้อยแล้ว');
    }
  };

  // Change Password for Any User Role
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim()) {
      alertError('กรุณาระบุรหัสผ่านเดิม', 'กรุณาระบุรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน');
      return;
    }

    if (newPassword.length < 6) {
      alertError('รหัสผ่านสั้นเกินไป', 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      alertError('รหัสผ่านไม่ตรงกัน', 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = authService.changePassword(oldPassword, newPassword);
      setIsSubmitting(false);

      if (result.success) {
        alertSuccess('เปลี่ยนรหัสผ่านสำเร็จ', result.message);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setActiveTab('profile');
      } else {
        alertError('ไม่สามารถเปลี่ยนรหัสผ่านได้', result.message);
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-md shadow-2xl max-w-lg w-full overflow-hidden flex flex-col font-sans">
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">ตั้งค่าข้อมูลส่วนตัว & รหัสผ่าน (User Profile)</h3>
              <p className="text-[11px] text-slate-400 font-doc">
                จัดการข้อมูลผู้ใช้งานและปรับเปลี่ยนรหัสผ่านความปลอดภัย
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-medium">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-700 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-blue-600" />
            <span>ข้อมูลพื้นฐานทั่วไป</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'password'
                ? 'border-blue-600 text-blue-700 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4 text-blue-600" />
            <span>เปลี่ยนรหัสผ่าน (Security)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh] text-xs text-slate-700">
          {/* --- TAB 1: BASIC PROFILE --- */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Account Status Badge Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {userSession.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">@{userSession.username}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Provider: {userSession.provider}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                    userSession.role === 'admin'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {userSession.role}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ชื่อ-นามสกุล ที่แสดง (Display Name)*</label>
                <div className="relative">
                  <BadgeCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ระบุชื่อ-นามสกุล..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">อีเมลติดต่อ (Email Address)</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 rounded transition shadow-sm flex items-center justify-center gap-2 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกการแก้ไขข้อมูลพื้นฐาน</span>
              </button>
            </form>
          )}

          {/* --- TAB 2: CHANGE PASSWORD (ANY ROLE) --- */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded text-xs text-blue-900 font-doc">
                ผู้ใช้งานทุกสิทธิ์สามารถเปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชีได้ตลอดเวลา
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">รหัสผ่านปัจจุบัน (Current Password)*</label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="ระบุรหัสผ่านปัจจุบัน"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white font-mono"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">รหัสผ่านใหม่ (New Password)*</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white font-mono"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ยืนยันรหัสผ่านใหม่ (Confirm Password)*</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-black active:bg-slate-800 text-white font-medium py-2.5 rounded transition shadow-sm flex items-center justify-center gap-2 text-xs"
              >
                {isSubmitting ? (
                  <span>กำลังดำเนินการ...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ยืนยันการเปลี่ยนรหัสผ่าน</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-doc">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Profile & Security Controls</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium font-sans transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
