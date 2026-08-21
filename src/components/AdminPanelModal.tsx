import React, { useState } from 'react';
import { 
  Shield, 
  X, 
  Users, 
  Heart, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Save, 
  Search, 
  QrCode, 
  Send, 
  Coffee, 
  CreditCard, 
  UserCheck, 
  UserX,
  Download,
  Activity
} from 'lucide-react';
import type { UserAccount, DonationConfig, InquiryTicket, UserRole } from '../types';
import { adminService } from '../services/adminService';
import { auditLogger, type AuditLogEntry } from '../services/auditLogger';
import { AppSwal, alertConfirm, alertSuccess, alertError } from '../utils/swal';

interface AdminPanelModalProps {
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'donations' | 'inquiries' | 'logs'>('users');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(auditLogger.getLogs());
  const [logSearch, setLogSearch] = useState('');

  // --- Users State ---
  const [users, setUsers] = useState<UserAccount[]>(adminService.getUsers());
  const [userSearch, setUserSearch] = useState('');

  // --- Donation Config State ---
  const [donationConfig, setDonationConfig] = useState<DonationConfig>(adminService.getDonationConfig());

  // --- Inquiries State ---
  const [inquiries, setInquiries] = useState<InquiryTicket[]>(adminService.getInquiries());
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<InquiryTicket['status']>('resolved');

  // --- User Operations ---
  const handleApproveUser = (user: UserAccount) => {
    adminService.approveUser(user.id);
    setUsers(adminService.getUsers());
    auditLogger.log({
      type: 'USER_CHANGE',
      username: 'administrator',
      role: 'admin',
      action: `อนุมัติคำขอใช้งานของผู้ใช้: @${user.username} (${user.name})`,
      status: 'SUCCESS',
      details: `Role: ${user.role}`
    });
    alertSuccess('อนุมัติผู้ใช้งานสำเร็จ', `บัญชี @${user.username} ได้รับการอนุมัติให้เข้าสู่ระบบแล้ว`);
  };

  const handleRejectUser = async (user: UserAccount) => {
    const confirmed = await alertConfirm(
      'ปฏิเสธคำขอลงทะเบียน',
      `คุณต้องการปฏิเสธคำขอสมัครใช้งานของ "@${user.username}" (${user.name}) ใช่หรือไม่?`,
      'ปฏิเสธคำขอ',
      'ยกเลิก'
    );
    if (confirmed) {
      adminService.rejectUser(user.id);
      setUsers(adminService.getUsers());
      auditLogger.log({
        type: 'USER_CHANGE',
        username: 'administrator',
        role: 'admin',
        action: `ปฏิเสธคำขอสมัครใช้งาน: @${user.username} (${user.name})`,
        status: 'WARNING'
      });
      alertSuccess('ปฏิเสธคำขอเรียบร้อย', `ลบคำขอลงทะเบียนของ @${user.username} แล้ว`);
    }
  };

  const handleAddUser = async () => {
    const { value: formValues } = await AppSwal.fire({
      title: 'เพิ่มผู้ใช้งานใหม่ (Add User)',
      width: '600px',
      html: `
        <div class="space-y-3.5 text-left font-sans text-xs pt-2">
          <div>
            <label class="block font-medium text-slate-700 mb-1">ชื่อผู้ใช้งาน (Username)*</label>
            <input id="swal-user-uname" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs" placeholder="e.g. editor_team" />
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">ชื่อ-นามสกุล (Full Name)*</label>
            <input id="swal-user-name" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs" placeholder="e.g. สมชาย มัลติมีเดีย" />
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">อีเมล (Email)</label>
            <input id="swal-user-email" type="email" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs" placeholder="e.g. somchai@company.com" />
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">สิทธิ์การเข้าถึง (Role)*</label>
            <select id="swal-user-role" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs font-semibold">
              <option value="editor">Editor (ตัดต่อและจัดการสื่อได้ทั้งหมด)</option>
              <option value="admin">Administrator (ผู้ดูแลระบบสูงสุด)</option>
            </select>
          </div>

          <!-- Role Permission Explanation Guide (2 Roles Only) -->
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-[11px] font-doc">
            <div class="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <span>📋 คำอธิบายสิทธิ์การเข้าถึง (Role Permissions):</span>
            </div>
            <div class="space-y-1.5 text-slate-600">
              <div>
                <strong class="text-rose-700">👑 Administrator (ผู้ดูแลระบบสูงสุด):</strong> 
                <span>สิทธิ์สูงสุด จัดการผู้ใช้งานทั้งหมด, อนุมัติสมาชิกใหม่, ตั้งค่าระบบโดเนท (PromptPay/Stripe/Coffee), ตรวจสอบร่องรอยจราจรคอมพิวเตอร์ (Audit Logs) และตอบคำร้องเรียน 1:1</span>
              </div>
              <div>
                <strong class="text-blue-700">✂️ Editor (ตัดต่อและจัดการสื่อได้ทั้งหมด):</strong> 
                <span>สร้างโปรเจกต์, นำเข้าไฟล์สื่อ, สร้าง/แก้ไข/ตัดต่อแทร็กและคลิป, ปรับแต่งเอฟเฟกต์ Motion & Font, จัดการคลังสื่อและโฟลเดอร์, เชื่อมโยงไฟล์ (Relink), ส่งออกวิดีโอ 4K/2K และร่วมโพสต์กระทู้ใน Webboard</span>
              </div>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึกผู้ใช้',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const username = (document.getElementById('swal-user-uname') as HTMLInputElement).value;
        const name = (document.getElementById('swal-user-name') as HTMLInputElement).value;
        const email = (document.getElementById('swal-user-email') as HTMLInputElement).value;
        const role = (document.getElementById('swal-user-role') as HTMLSelectElement).value as UserRole;
        if (!username.trim() || !name.trim()) {
          AppSwal.showValidationMessage('กรุณากรอกชื่อผู้ใช้และชื่อ-นามสกุล');
          return false;
        }
        return { username: username.trim(), name: name.trim(), email: email.trim(), role, status: 'active' as const };
      }
    });

    if (formValues) {
      adminService.addUser(formValues);
      setUsers(adminService.getUsers());
      auditLogger.log({
        type: 'USER_CHANGE',
        username: 'administrator',
        role: 'admin',
        action: `เพิ่มผู้ใช้งานใหม่: @${formValues.username}`,
        status: 'SUCCESS',
        details: `Role: ${formValues.role}`
      });
      alertSuccess('เพิ่มผู้ใช้งานสำเร็จ', `บัญชี ${formValues.username} ถูกสร้างเรียบร้อยแล้ว`);
    }
  };

  const handleEditUser = async (user: UserAccount) => {
    const { value: formValues } = await AppSwal.fire({
      title: `แก้ไขข้อมูลผู้ใช้: ${user.username}`,
      width: '600px',
      html: `
        <div class="space-y-3.5 text-left font-sans text-xs pt-2">
          <div>
            <label class="block font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
            <input id="swal-edit-name" value="${user.name}" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs" />
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">อีเมล</label>
            <input id="swal-edit-email" value="${user.email || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs" />
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">สิทธิ์การเข้าถึง (Role)</label>
            <select id="swal-edit-role" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs font-semibold">
              <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Editor (ตัดต่อและจัดการสื่อได้ทั้งหมด)</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator (ผู้ดูแลระบบสูงสุด)</option>
            </select>
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">สถานะบัญชี</label>
            <select id="swal-edit-status" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs">
              <option value="active" ${user.status === 'active' ? 'selected' : ''}>🟢 ใช้งานปกติ (Active)</option>
              <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>⏳ รอยืนยันการอนุมัติ (Pending)</option>
              <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>🔴 ระงับการใช้งาน (Suspended)</option>
            </select>
          </div>

          <!-- Role Explanation Box -->
          <div class="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] font-doc text-slate-600 space-y-1">
            <strong class="text-slate-800 block">สิทธิ์การเข้าถึง (2 ระดับ):</strong>
            <div>👑 <strong>Admin</strong> = จัดการระบบทั้งหมด & อนุมัติผู้ใช้ | ✂️ <strong>Editor</strong> = ตัดต่อและจัดการโปรเจกต์เต็มรูปแบบ</div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึกการแก้ไข',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const name = (document.getElementById('swal-edit-name') as HTMLInputElement).value;
        const email = (document.getElementById('swal-edit-email') as HTMLInputElement).value;
        const role = (document.getElementById('swal-edit-role') as HTMLSelectElement).value as UserRole;
        const status = (document.getElementById('swal-edit-status') as HTMLSelectElement).value as 'active' | 'suspended' | 'pending';
        return { name: name.trim(), email: email.trim(), role, status };
      }
    });

    if (formValues) {
      adminService.updateUser(user.id, formValues);
      setUsers(adminService.getUsers());
      auditLogger.log({
        type: 'USER_CHANGE',
        username: 'administrator',
        role: 'admin',
        action: `แก้ไขข้อมูลผู้ใช้: @${user.username}`,
        status: 'SUCCESS',
        details: `Role: ${formValues.role}, Status: ${formValues.status}`
      });
      alertSuccess('อัปเดตข้อมูลสำเร็จ', `บันทึกข้อมูล ${user.username} เรียบร้อยแล้ว`);
    }
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (user.username === 'administrator') {
      alertError('ไม่สามารถลบได้', 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (Default Administrator) ได้');
      return;
    }

    const confirmed = await alertConfirm(
      'ยืนยันการลบผู้ใช้',
      `คุณต้องการลบผู้ใช้ "${user.username}" (${user.name}) ใช่หรือไม่?`,
      'ลบผู้ใช้งาน',
      'ยกเลิก'
    );

    if (confirmed) {
      adminService.deleteUser(user.id);
      setUsers(adminService.getUsers());
      auditLogger.log({
        type: 'USER_CHANGE',
        username: 'administrator',
        role: 'admin',
        action: `ลบผู้ใช้งาน: @${user.username}`,
        status: 'WARNING'
      });
      alertSuccess('ลบผู้ใช้สำเร็จ', `บัญชี ${user.username} ถูกลบออกจากระบบแล้ว`);
    }
  };

  // --- Donation Save ---
  const handleSaveDonationConfig = () => {
    adminService.saveDonationConfig(donationConfig);
    alertSuccess('บันทึกการตั้งค่าโดเนทสำเร็จ', 'ข้อมูลช่องทางการสนับสนุนถูกบันทึกเรียบร้อยแล้ว');
  };

  // --- Reply Inquiry ---
  const handleSendReply = () => {
    if (!selectedInquiry || !replyText.trim()) return;
    adminService.replyInquiry(selectedInquiry.id, replyText.trim(), replyStatus);
    setInquiries(adminService.getInquiries());
    alertSuccess('ตอบกลับสำเร็จ', 'ข้อความตอบกลับถูกบันทึกและส่งให้ผู้ใช้เรียบร้อยแล้ว');
    setSelectedInquiry(null);
    setReplyText('');
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredInquiries = inquiries.filter(i => {
    if (inquiryFilter === 'all') return true;
    return i.status === inquiryFilter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-md shadow-2xl max-w-4xl w-full h-[85vh] overflow-hidden flex flex-col font-sans">
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">ศูนย์ควบคุมผู้ดูแลระบบ (Admin Console)</h3>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-blue-500/30 text-blue-200 rounded border border-blue-400/30">
                  Administrator
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-doc">
                จัดการสิทธิ์ผู้ใช้งาน, ตั้งค่าการโดเนท (PromptPay / Stripe / Buy Me a Coffee), และตอบคำร้องเรียน 1:1
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
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 gap-2 shrink-0 text-xs font-medium">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-700 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>จัดการผู้ใช้งาน ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('donations')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition ${
              activeTab === 'donations'
                ? 'border-rose-500 text-rose-700 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>ตั้งค่าช่องทางโดเนท (PromptPay / Stripe / Coffee)</span>
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition ${
              activeTab === 'inquiries'
                ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>คำร้องเรียน 1:1 ({inquiries.filter(i => i.status === 'open').length} รอดำเนินการ)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              setAuditLogs(auditLogger.getLogs());
            }}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-700 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>ร่องรอยจราจรคอมพิวเตอร์ & Logs ({auditLogs.length})</span>
          </button>
        </div>

        {/* Main Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 min-h-0 text-xs text-slate-700">
          {/* --- TAB 1: USERS MANAGEMENT --- */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Pending Approval Alert Banner */}
              {users.filter(u => u.status === 'pending').length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-md flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-amber-200 text-amber-800 flex items-center justify-center font-bold">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-amber-900 text-xs">
                        มีผู้สมัครขอใช้งานระบบใหม่ {users.filter(u => u.status === 'pending').length} รายการ (รอดำเนินการอนุมัติ)
                      </div>
                      <div className="text-[11px] text-amber-700 font-doc">
                        รายชื่อที่รอยืนยันจะถูกจัดไว้ด้านบนสุดและเน้นแถบสีเหลือง กรุณากดปุ่ม "อนุมัติ" หรือ "ปฏิเสธ" เพื่อดำเนินการ
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-semibold">
                    {users.filter(u => u.status === 'pending').length} คำขอ
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="ค้นหาชื่อผู้ใช้, ชื่อ หรืออีเมล..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleAddUser}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-1.5 rounded transition shadow-2xs text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มผู้ใช้งานใหม่</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                      <th className="py-2.5 px-3.5">ผู้ใช้งาน (User)</th>
                      <th className="py-2.5 px-3">อีเมล</th>
                      <th className="py-2.5 px-3">สิทธิ์การเข้าถึง (Role)</th>
                      <th className="py-2.5 px-3">สถานะ</th>
                      <th className="py-2.5 px-3.5 text-right">การจัดการสิทธิ์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isPending = u.status === 'pending';
                      return (
                        <tr 
                          key={u.id} 
                          className={`transition ${
                            isPending 
                              ? 'bg-amber-50/90 hover:bg-amber-100/80 border-l-4 border-amber-500' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2">
                              {isPending && <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />}
                              <div>
                                <div className={`font-semibold ${isPending ? 'text-amber-950 font-bold' : 'text-slate-900'}`}>
                                  {u.name}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                            {u.email || '-'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                              u.role === 'admin'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : u.role === 'editor'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : u.role === 'creator'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {u.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                <span>ใช้งานปกติ</span>
                              </span>
                            ) : u.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded font-medium shadow-2xs animate-pulse">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>รอยืนยันอนุมัติ</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-medium">
                                <UserX className="w-3 h-3 text-rose-600" />
                                <span>ระงับสิทธิ์</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleApproveUser(u)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                  title="อนุมัติให้ใช้งานระบบ"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>อนุมัติ</span>
                                </button>
                                <button
                                  onClick={() => handleRejectUser(u)}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                  title="ปฏิเสธคำขอลงทะเบียน"
                                >
                                  <UserX className="w-3 h-3" />
                                  <span>ปฏิเสธ</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditUser(u)}
                                  title="แก้ไขข้อมูลและสิทธิ์"
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  title="ลบผู้ใช้งาน"
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB 2: DETAILED DONATION CONFIGURATION (PROMPTPAY / STRIPE / BUY ME A COFFEE) --- */}
          {activeTab === 'donations' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Top Banner */}
              <div className="bg-white border border-slate-200 rounded p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>ตั้งค่าช่องทางการรับโดเนท & สนับสนุนระบบ</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-doc mt-0.5">
                    กำหนดรายละเอียดช่องทางชำระเงิน PromptPay (064-3026465), Stripe และ Buy Me a Coffee
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">เปิดรับโดเนท:</label>
                  <input
                    type="checkbox"
                    checked={donationConfig.isEnabled}
                    onChange={(e) => setDonationConfig({ ...donationConfig, isEnabled: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded cursor-pointer accent-rose-600"
                  />
                </div>
              </div>

              {/* 1. PromptPay Settings */}
              <div className="bg-white border border-slate-200 rounded p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">1. ตั้งค่าพร้อมเพย์ (PromptPay QR Code)</h5>
                    <span className="text-[10px] text-slate-400 font-doc">รองรับทุกแอปธนาคารในประเทศไทย</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      หมายเลขเบอร์โทรศัพท์ / พร้อมเพย์*
                    </label>
                    <input
                      type="text"
                      value={donationConfig.promptPayNumber}
                      onChange={(e) => setDonationConfig({ ...donationConfig, promptPayNumber: e.target.value })}
                      placeholder="064-3026465"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      ชื่อบัญชีผู้รับเงิน (Account Name)*
                    </label>
                    <input
                      type="text"
                      value={donationConfig.promptPayName}
                      onChange={(e) => setDonationConfig({ ...donationConfig, promptPayName: e.target.value })}
                      placeholder="Multimedia Web Application"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Buy Me a Coffee Settings */}
              <div className="bg-white border border-slate-200 rounded p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-[#FFDD00] text-slate-900 flex items-center justify-center font-bold">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">2. ตั้งค่า Buy Me a Coffee</h5>
                    <span className="text-[10px] text-slate-400 font-doc">รับการสนับสนุนเป็นจำนวนแก้วกาแฟ ☕</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Username / Slug บัญชี (e.g. mwastudio)*
                    </label>
                    <div className="flex items-center">
                      <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l text-[10px] text-slate-500 font-mono">
                        buymeacoffee.com/
                      </span>
                      <input
                        type="text"
                        value={donationConfig.buyMeACoffeeUsername}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setDonationConfig({
                            ...donationConfig,
                            buyMeACoffeeUsername: val,
                            buyMeACoffeeUrl: `https://www.buymeacoffee.com/${val}`
                          });
                        }}
                        placeholder="mwastudio"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-r font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      ราคาเริ่มต้นต่อแก้ว (USD)*
                    </label>
                    <select
                      value={donationConfig.buyMeACoffeeDefaultCoffeePrice || 3}
                      onChange={(e) => setDonationConfig({ ...donationConfig, buyMeACoffeeDefaultCoffeePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:bg-white"
                    >
                      <option value="1">$1 USD (~35 บาท / แก้ว)</option>
                      <option value="3">$3 USD (~105 บาท / แก้ว)</option>
                      <option value="5">$5 USD (~175 บาท / แก้ว)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    ข้อความเชิญชวนบน Widget (Custom Message)
                  </label>
                  <input
                    type="text"
                    value={donationConfig.buyMeACoffeeMessage || ''}
                    onChange={(e) => setDonationConfig({ ...donationConfig, buyMeACoffeeMessage: e.target.value })}
                    placeholder="เลี้ยงกาแฟเพื่อสนับสนุนการพัฒนาโปรเจกต์มัลติมีเดีย ☕"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* 3. Stripe Payment Gateway Settings */}
              <div className="bg-white border border-slate-200 rounded p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-[#635BFF] text-white flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">3. ตั้งค่า Stripe Payment Gateway (สากล & บัตรเครดิต)</h5>
                    <span className="text-[10px] text-slate-400 font-doc">รองรับ Credit/Debit Cards, Apple Pay, Google Pay ทั่วโลก</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Stripe Payment Link / Checkout URL*
                    </label>
                    <input
                      type="url"
                      value={donationConfig.stripeUrl}
                      onChange={(e) => setDonationConfig({ ...donationConfig, stripeUrl: e.target.value })}
                      placeholder="https://buy.stripe.com/..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-[#635BFF] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Stripe Publishable Key (pk_live_... / pk_test_...)
                      </label>
                      <input
                        type="text"
                        value={donationConfig.stripePublishableKey || ''}
                        onChange={(e) => setDonationConfig({ ...donationConfig, stripePublishableKey: e.target.value })}
                        placeholder="pk_live_..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-[#635BFF] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        สกุลเงินหลัก (Currency)
                      </label>
                      <select
                        value={donationConfig.stripeCurrency}
                        onChange={(e) => setDonationConfig({ ...donationConfig, stripeCurrency: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#635BFF] focus:bg-white"
                      >
                        <option value="THB">THB (บาทไทย - ฿)</option>
                        <option value="USD">USD (ดอลลาร์สหรัฐ - $)</option>
                        <option value="EUR">EUR (ยูโร - €)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSaveDonationConfig}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium px-6 py-2.5 rounded transition shadow-sm text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่าโดเนททั้งหมด</span>
                </button>
              </div>
            </div>
          )}

          {/* --- TAB 3: 1:1 INQUIRIES MANAGEMENT --- */}
          {activeTab === 'inquiries' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Inquiries List Column */}
              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200 text-[11px]">
                  <span className="font-semibold text-slate-700">กรองสถานะ:</span>
                  <div className="flex items-center gap-1">
                    {(['all', 'open', 'in-progress', 'resolved'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setInquiryFilter(st)}
                        className={`px-2 py-0.5 rounded capitalize transition ${
                          inquiryFilter === st
                            ? 'bg-slate-900 text-white font-medium'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {filteredInquiries.map((inq) => {
                    const isSelected = selectedInquiry?.id === inq.id;
                    return (
                      <div
                        key={inq.id}
                        onClick={() => {
                          setSelectedInquiry(inq);
                          setReplyText(inq.adminReply || '');
                          setReplyStatus(inq.status);
                        }}
                        className={`p-3 rounded border transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-semibold ${
                            inq.category === 'bug'
                              ? 'bg-rose-100 text-rose-800'
                              : inq.category === 'feature'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {inq.category}
                          </span>

                          <span className={`text-[10px] font-mono flex items-center gap-1 ${
                            inq.status === 'resolved'
                              ? 'text-emerald-600'
                              : inq.status === 'in-progress'
                              ? 'text-amber-600'
                              : 'text-rose-600 font-semibold'
                          }`}>
                            {inq.status === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
                            {inq.status === 'in-progress' && <Clock className="w-3 h-3" />}
                            {inq.status === 'open' && <AlertCircle className="w-3 h-3" />}
                            <span>{inq.status}</span>
                          </span>
                        </div>

                        <h5 className="font-semibold text-slate-800 truncate text-xs">{inq.subject}</h5>
                        <p className="text-[11px] text-slate-500 font-doc line-clamp-2 mt-0.5">{inq.message}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-100">
                          <span>{inq.userName}</span>
                          <span>{new Date(inq.createdAt).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inquiry Detail & Reply Editor Column */}
              <div className="md:col-span-7">
                {selectedInquiry ? (
                  <div className="bg-white border border-slate-200 rounded p-5 space-y-4 shadow-2xs">
                    <div className="pb-3 border-b border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">ID: {selectedInquiry.id}</span>
                        <span className="text-[11px] text-slate-500 font-doc">
                          จาก: <strong>{selectedInquiry.userName}</strong> ({selectedInquiry.userEmail || 'ไม่มีอีเมล'})
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{selectedInquiry.subject}</h4>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-doc text-xs leading-relaxed">
                      {selectedInquiry.message}
                    </div>

                    {/* Reply Form */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-800 text-xs">
                          ข้อความตอบกลับจากผู้ดูแลระบบ (Admin Reply):
                        </label>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span>ปรับสถานะเป็น:</span>
                          <select
                            value={replyStatus}
                            onChange={(e) => setReplyStatus(e.target.value as any)}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs"
                          >
                            <option value="open">Open (รอดำเนินการ)</option>
                            <option value="in-progress">In-Progress (กำลังตรวจสอบ)</option>
                            <option value="resolved">Resolved (แก้ไขเสร็จสิ้น)</option>
                          </select>
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="พิมพ์คำชี้แจง ตอบข้อซักถาม หรือแจ้งผลการตรวจสอบแก่ผู้ใช้..."
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                      />

                      <button
                        onClick={handleSendReply}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-2 rounded transition shadow-2xs flex items-center justify-center gap-2 text-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>บันทึกและส่งข้อความตอบกลับ</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-white border border-slate-200 rounded p-6 text-slate-400 text-center font-doc">
                    <MessageSquare className="w-8 h-8 opacity-40 mb-2" />
                    <p className="text-xs">คลิกเลือกรายการคำร้องเรียนทางด้านซ้ายเพื่อเปิดดูรายละเอียดและตอบกลับ</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* --- TAB 4: AUDIT & TRAFFIC LOGS (ZERO-DB PERSISTENCE) --- */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="ค้นหา Action, ชื่อผู้ใช้, หรือประเภท Event..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => auditLogger.exportLogsAsJSON()}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3.5 py-1.5 rounded transition shadow-2xs text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ส่งออกไฟล์ Logs (.json)</span>
                  </button>

                  <button
                    onClick={async () => {
                      const confirmed = await alertConfirm('ยืนยันการล้างประวัติ', 'คุณต้องการล้างประวัติบันทึกร่องรอยจราจรทั้งหมดใช่หรือไม่?');
                      if (confirmed) {
                        auditLogger.clearLogs();
                        setAuditLogs(auditLogger.getLogs());
                        alertSuccess('ล้างประวัติสำเร็จ', 'ข้อมูล Logs ถูกรีเซ็ตเรียบร้อยแล้ว');
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 transition"
                    title="ล้างประวัติทั้งหมด"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-2xs">
                <div className="max-h-[55vh] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                      <tr>
                        <th className="py-2.5 px-3">เวลา (Timestamp)</th>
                        <th className="py-2.5 px-3">ผู้ใช้งาน (User)</th>
                        <th className="py-2.5 px-3">ประเภทเหตุการณ์ (Event)</th>
                        <th className="py-2.5 px-3">การกระทำ (Action / Details)</th>
                        <th className="py-2.5 px-3">IP / Host</th>
                        <th className="py-2.5 px-3 text-right">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {auditLogs
                        .filter(l => 
                          l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                          l.username.toLowerCase().includes(logSearch.toLowerCase()) ||
                          l.type.toLowerCase().includes(logSearch.toLowerCase()) ||
                          (l.details && l.details.toLowerCase().includes(logSearch.toLowerCase()))
                        )
                        .map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                              {new Date(l.timestamp).toLocaleString('th-TH')}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              @{l.username} <span className="text-[9px] text-slate-400 font-mono">({l.role})</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-semibold ${
                                l.type.includes('LOGIN')
                                  ? 'bg-blue-100 text-blue-800'
                                  : l.type.includes('PROJECT')
                                  ? 'bg-purple-100 text-purple-800'
                                  : l.type.includes('RELINK')
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {l.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-slate-800">{l.action}</div>
                              {l.details && <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{l.details}</div>}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                              {l.ipAddress}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                l.status === 'SUCCESS'
                                  ? 'text-emerald-700 bg-emerald-50'
                                  : l.status === 'WARNING'
                                  ? 'text-amber-700 bg-amber-50'
                                  : 'text-rose-700 bg-rose-50'
                              }`}>
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-doc shrink-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admin Data Persistence Active (PromptPay, Stripe, Buy Me a Coffee Ready)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium font-sans transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
