import React, { useState, useRef } from 'react';
import { 
  FolderPlus, 
  UploadCloud, 
  Video, 
  Music, 
  Image as ImageIcon, 
  Trash2, 
  Search, 
  PlusCircle, 
  Layers, 
  Edit3, 
  FolderSearch,
  Type,
  Sparkles,
  Play,
  RotateCw,
  Zap,
  Upload
} from 'lucide-react';
import type { 
  MediaAsset, 
  MediaType, 
  MediaFolder, 
  UploadTask, 
  CustomFont, 
  TimelineClip, 
  TextEffectConfig, 
  TransitionType, 
  MotionAnimation 
} from '../types';
import { AppSwal, alertConfirm, alertError, alertSuccess } from '../utils/swal';
import { googleDriveService } from '../services/googleDrive';
import { defaultFonts, registerCustomFont } from '../utils/fontManager';

interface AssetSidebarProps {
  assets: MediaAsset[];
  folders: MediaFolder[];
  uploadTasks: UploadTask[];
  activeAssetId: string | null;
  selectedClip?: TimelineClip | null;
  customFonts?: CustomFont[];
  userId?: string;
  isPremium?: boolean;
  onSelectAsset: (asset: MediaAsset) => void;
  onAddAsset: (newAsset: MediaAsset) => void;
  onDeleteAsset: (assetId: string) => void;
  onRenameAsset: (assetId: string, newName: string) => void;
  onMoveAssetToFolder?: (assetId: string, folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onAddToTimeline: (asset: MediaAsset) => void;
  onAddUploadTask: (task: UploadTask) => void;
  onUpdateUploadTask: (taskId: string, progress: number, status: UploadTask['status']) => void;
  onRemoveUploadTask: (taskId: string) => void;
  onRelinkAsset?: (asset: MediaAsset) => void;
  onAddTextClip?: (preset?: { name?: string; content?: string; effect?: Partial<TextEffectConfig> }) => void;
  onAddCustomFont?: (font: CustomFont) => void;
  onUpdateClipEffect?: (clipId: string, text: string, effect: TextEffectConfig) => void;
  onUpdateClipTransition?: (clipId: string, transition: TransitionType) => void;
  onUpdateClipMotion?: (clipId: string, motion: MotionAnimation) => void;
}

const PREMIUM_MAX_VIDEO_SIZE = 4 * 1024 * 1024 * 1024; // 4 GB in bytes
const NORMAL_MAX_VIDEO_SIZE = 1 * 1024 * 1024 * 1024;  // 1 GB in bytes

export const AssetSidebar: React.FC<AssetSidebarProps> = ({
  assets,
  folders: _folders,
  uploadTasks: _uploadTasks,
  activeAssetId,
  selectedClip,
  customFonts = [],
  userId,
  isPremium = false,
  onSelectAsset,
  onAddAsset,
  onDeleteAsset,
  onRenameAsset,
  onMoveAssetToFolder: _onMoveAssetToFolder = () => {},
  onCreateFolder,
  onDeleteFolder: _onDeleteFolder,
  onToggleFolder: _onToggleFolder,
  onAddToTimeline,
  onAddUploadTask,
  onUpdateUploadTask,
  onRemoveUploadTask,
  onRelinkAsset: _onRelinkAsset = () => {},
  onAddTextClip = () => {},
  onAddCustomFont = () => {},
  onUpdateClipEffect = () => {},
  onUpdateClipTransition = () => {},
  onUpdateClipMotion = () => {},
}) => {
  // Navigation Dock Tab State: 'media' | 'font' | 'animation'
  const [activeTab, setActiveTab] = useState<'media' | 'font' | 'animation'>('media');

  // Media Tab States
  const [filter, setFilter] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontUploadRef = useRef<HTMLInputElement>(null);

  // Font Tab States
  const [fontSearchQuery, setFontSearchQuery] = useState('');

  // Scoped Fonts: Default system fonts + custom fonts uploaded by this user
  const visibleCustomFonts = customFonts.filter(
    (f) => !f.uploadedBy || f.uploadedBy === 'anonymous' || f.uploadedBy === userId
  );
  const allFonts = [...defaultFonts, ...visibleCustomFonts];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Process Real File Upload (Condition 1: 4GB for Premium vs 1GB for Normal)
  const handleProcessFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const maxAllowedSize = isPremium ? PREMIUM_MAX_VIDEO_SIZE : NORMAL_MAX_VIDEO_SIZE;

    for (const file of fileArray) {
      let type: MediaType | null = null;
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type.startsWith('image/')) type = 'image';

      if (!type) {
        alertError('รูปแบบไฟล์ไม่รองรับ', `ไฟล์ "${file.name}" ไม่ใช่วิดีโอ, เสียง หรือรูปภาพ`);
        continue;
      }

      if (file.size > maxAllowedSize) {
        alertError(
          'ขนาดไฟล์เกินขีดจำกัด',
          isPremium
            ? `ไฟล์ "${file.name}" มีขนาด ${formatFileSize(file.size)} ซึ่งเกินขีดจำกัดสูงสุด 4 GB สำหรับสมาชิก Premium`
            : `ไฟล์ "${file.name}" มีขนาด ${formatFileSize(file.size)} ซึ่งเกินขีดจำกัด 1 GB สำหรับผู้ใช้งานทั่วไป (กรุณาอัปเกรดเป็น Premium เพื่อรองรับไฟล์ขนาดสูงสุด 4 GB)`
        );
        continue;
      }

      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const task: UploadTask = {
        id: taskId,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        rawSize: file.size,
        progress: 0,
        status: 'uploading',
      };
      onAddUploadTask(task);

      let isSwalClosed = false;
      let modalInterval: any = null;

      AppSwal.fire({
        title: 'กำลังถ่ายโอนและประมวลผลไฟล์...',
        html: `
          <div class="space-y-3 pt-1 text-left font-sans text-xs">
            <div class="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div class="font-medium text-slate-800 truncate">${file.name}</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">ขนาด: ${formatFileSize(file.size)} • ประเภท: ${type.toUpperCase()}</div>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div id="swal-upload-bar-${taskId}" class="bg-blue-600 h-2.5 rounded-full transition-all duration-150" style="width: 5%"></div>
            </div>
            <div class="flex justify-between items-center text-[11px] font-mono text-slate-600">
              <span id="swal-upload-speed-${taskId}">ความเร็ว: 45 MB/s</span>
              <span id="swal-upload-pct-${taskId}" class="font-semibold text-blue-600">5%</span>
            </div>
            <p class="text-[11px] text-slate-400 font-doc">คุณสามารถปิดหน้าต่างนี้เพื่อทำงานอื่นต่อได้ ระบบจะประมวลผลต่อในเบื้องหลัง</p>
          </div>
        `,
        showCancelButton: true,
        cancelButtonText: 'ทำงานเบื้องหลัง (Background)',
        showConfirmButton: false,
        allowOutsideClick: true,
        didClose: () => {
          isSwalClosed = true;
          if (modalInterval) clearInterval(modalInterval);
        },
      });

      const blobUrl = URL.createObjectURL(file);
      let duration: number | undefined = undefined;

      try {
        if (type === 'video') {
          duration = await new Promise<number>((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = blobUrl;
            video.onloadedmetadata = () => resolve(video.duration || 10);
            video.onerror = () => resolve(10);
          });
        } else if (type === 'audio') {
          duration = await new Promise<number>((resolve) => {
            const audio = document.createElement('audio');
            audio.preload = 'metadata';
            audio.src = blobUrl;
            audio.onloadedmetadata = () => resolve(audio.duration || 10);
            audio.onerror = () => resolve(10);
          });
        }
      } catch (e) {
        console.warn('Metadata read fallback:', e);
      }

      let currentProg = 10;
      modalInterval = setInterval(() => {
        currentProg += Math.floor(Math.random() * 20 + 15);
        if (currentProg >= 100) {
          currentProg = 100;
          clearInterval(modalInterval);

          const newAsset: MediaAsset = {
            id: `ast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            type: type!,
            folderId: null,
            file,
            blobUrl,
            localPath: (file as any).path || file.name,
            duration: duration ? parseFloat(duration.toFixed(1)) : (type === 'image' ? 5.0 : 10.0),
            size: formatFileSize(file.size),
            rawSize: file.size,
            color: type === 'video' ? 'bg-blue-600' : type === 'audio' ? 'bg-emerald-600' : 'bg-amber-600',
            createdAt: Date.now(),
          };

          onAddAsset(newAsset);
          onUpdateUploadTask(taskId, 100, 'done');

          setTimeout(() => {
            onRemoveUploadTask(taskId);
          }, 3000);

          if (!isSwalClosed) {
            AppSwal.close();
            alertSuccess('นำเข้าไฟล์สำเร็จ!', `ไฟล์ "${file.name}" พร้อมใช้งานในคลังสื่อแล้ว`);
          }
        } else {
          onUpdateUploadTask(taskId, currentProg, 'uploading');
          const bar = document.getElementById(`swal-upload-bar-${taskId}`);
          const pct = document.getElementById(`swal-upload-pct-${taskId}`);
          const speed = document.getElementById(`swal-upload-speed-${taskId}`);
          if (bar) bar.style.width = `${currentProg}%`;
          if (pct) pct.innerText = `${currentProg}%`;
          if (speed) speed.innerText = `ความเร็ว: ${(Math.random() * 15 + 35).toFixed(1)} MB/s`;
        }
      }, 150);
    }
  };

  // Google Drive Cloud Import
  const handleImportGoogleDrive = async () => {
    try {
      await googleDriveService.openFilePicker((newAsset) => {
        onAddAsset(newAsset);
      });
      alertSuccess('เชื่อมโยง Google Drive สำเร็จ!', 'นำเข้าไฟล์จาก Google Drive เข้าสู่คลังสื่อเรียบร้อยแล้ว');
    } catch (err: any) {
      if (err?.message !== 'User cancelled') {
        alertError('เกิดข้อผิดพลาด Google Drive', err?.message || 'ไม่สามารถเชื่อมโยง Google Drive ได้');
      }
    }
  };

  // User Font Upload Handler
  const handleCustomFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const loaded = await registerCustomFont(file, userId);
      onAddCustomFont(loaded);
      alertSuccess('นำเข้าฟอนต์สำเร็จ!', `ฟอนต์ "${loaded.name}" ผูกเข้ากับบัญชีของคุณและพร้อมใช้งานแล้ว`);
    } catch (err) {
      alertError('เกิดข้อผิดพลาดในการโหลดฟอนต์', 'โปรดตรวจสอบว่าเป็นไฟล์ฟอนต์ที่ถูกต้อง (.ttf, .otf, .woff, .woff2)');
    }
    e.target.value = '';
  };

  // Motion & Transition Handlers for Animation Tab
  const currentMotion = selectedClip?.motion || {
    inAnimation: 'none',
    outAnimation: 'none',
    loopAnimation: 'none',
    duration: 0.6,
  };
  const currentTransition = selectedClip?.transition || 'none';

  const handleSelectMotion = (field: keyof MotionAnimation, value: any) => {
    if (selectedClip) {
      const updated = { ...currentMotion, [field]: value };
      onUpdateClipMotion(selectedClip.id, updated);
    }
  };

  const handleSelectTransition = (trans: TransitionType) => {
    if (selectedClip) {
      onUpdateClipTransition(selectedClip.id, trans);
    }
  };

  // Rename & Delete Actions
  const handleRename = async (asset: MediaAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    const { value: newName } = await AppSwal.fire({
      title: 'เปลี่ยนชื่อไฟล์สื่อ',
      input: 'text',
      inputValue: asset.name,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
    });
    if (newName && newName.trim() && newName !== asset.name) {
      onRenameAsset(asset.id, newName.trim());
    }
  };

  const handleDelete = async (asset: MediaAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await alertConfirm(
      'ยืนยันการลบไฟล์สื่อ',
      `คุณต้องการลบ "${asset.name}" ออกจากคลังสื่อใช่หรือไม่? (คลิปบนไทม์ไลน์จะแสดงสถานะสีแดง)`,
      'ลบไฟล์',
      'ยกเลิก'
    );
    if (confirmed) {
      onDeleteAsset(asset.id);
    }
  };

  const handleCreateNewFolder = async () => {
    const { value: folderName } = await AppSwal.fire({
      title: 'สร้างโฟลเดอร์ใหม่',
      input: 'text',
      inputPlaceholder: 'เช่น ฟุตเทจหลัก, ซาวด์เอฟเฟกต์...',
      showCancelButton: true,
      confirmButtonText: 'สร้างโฟลเดอร์',
      cancelButtonText: 'ยกเลิก',
    });
    if (folderName && folderName.trim()) {
      onCreateFolder(folderName.trim());
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesFilter = filter === 'all' || asset.type === filter;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-full shrink-0 select-none overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. FAR-LEFT VERTICAL ICON DOCK (Canva / CapCut Style Strip)
          ───────────────────────────────────────────────────────────── */}
      <nav className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-2.5 z-20 shrink-0">
        {/* Media Tab Button */}
        <button
          onClick={() => setActiveTab('media')}
          title="คลังสื่อ & โฟลเดอร์ (Media Library)"
          className={`w-full py-3 px-1 flex flex-col items-center gap-1 transition relative group ${
            activeTab === 'media'
              ? 'text-white bg-slate-800/80 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          {activeTab === 'media' && (
            <div className="absolute left-0 top-1 bottom-1 w-1 bg-blue-500 rounded-r"></div>
          )}
          <Layers className={`w-5 h-5 ${activeTab === 'media' ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className="text-[11px] font-sans tracking-tight">คลังสื่อ</span>
        </button>

        {/* Font Tab Button */}
        <button
          onClick={() => setActiveTab('font')}
          title="แบบอักษร & ข้อความ (Font & Text Studio)"
          className={`w-full py-3 px-1 flex flex-col items-center gap-1 transition relative group mt-1 ${
            activeTab === 'font'
              ? 'text-white bg-slate-800/80 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          {activeTab === 'font' && (
            <div className="absolute left-0 top-1 bottom-1 w-1 bg-purple-500 rounded-r"></div>
          )}
          <Type className={`w-5 h-5 ${activeTab === 'font' ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className="text-[11px] font-sans tracking-tight">แบบอักษร</span>
        </button>

        {/* Animation Tab Button */}
        <button
          onClick={() => setActiveTab('animation')}
          title="อนิเมชั่น & เอฟเฟกต์เคลื่อนไหว (Animation & Motion FX)"
          className={`w-full py-3 px-1 flex flex-col items-center gap-1 transition relative group mt-1 ${
            activeTab === 'animation'
              ? 'text-white bg-slate-800/80 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          {activeTab === 'animation' && (
            <div className="absolute left-0 top-1 bottom-1 w-1 bg-amber-500 rounded-r"></div>
          )}
          <Sparkles className={`w-5 h-5 ${activeTab === 'animation' ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className="text-[11px] font-sans tracking-tight">อนิเมชั่น</span>
        </button>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          2. DYNAMIC SUB-PANEL DRAWER (Content changes based on activeTab)
          ───────────────────────────────────────────────────────────── */}
      <aside className="w-80 bg-app-surface border-r border-app-border flex flex-col min-h-0 overflow-hidden shrink-0">
        
        {/* =========================================================
            TAB 1: MEDIA ASSETS (คลังสื่อ)
            ========================================================= */}
        {activeTab === 'media' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header & Quick Actions */}
            <div className="p-3 border-b border-app-border bg-slate-50/70 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>คลังสื่อ & ไฟล์ในโปรเจกต์</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-medium">
                  {assets.length} รายการ
                </span>
              </div>

              {/* Upload & Cloud Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1 shadow-2xs transition"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>+ เพิ่มสื่อ</span>
                </button>

                <button
                  onClick={handleImportGoogleDrive}
                  className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium flex items-center justify-center gap-1 shadow-2xs transition"
                >
                  <FolderSearch className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Drive</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative mt-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อไฟล์สื่อ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Media Type Filter Chips */}
              <div className="flex items-center gap-1 mt-2">
                {(['all', 'video', 'audio', 'image'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition capitalize ${
                      filter === t
                        ? 'bg-slate-800 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {t === 'all' ? 'ทั้งหมด' : t === 'video' ? 'วิดีโอ' : t === 'audio' ? 'เสียง' : 'ภาพ'}
                  </button>
                ))}

                <button
                  onClick={handleCreateNewFolder}
                  title="สร้างโฟลเดอร์ใหม่"
                  className="ml-auto p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Asset List & Drag-and-Drop Area */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                if (e.dataTransfer.files) handleProcessFiles(e.dataTransfer.files);
              }}
              className={`flex-1 overflow-y-auto p-2.5 space-y-1.5 ${isDraggingOver ? 'bg-blue-50/80 ring-2 ring-blue-400 ring-inset' : ''}`}
            >
              {filteredAssets.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <UploadCloud className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-doc">ยังไม่มีไฟล์สื่อในหมวดนี้</p>
                  <p className="text-[11px] text-slate-400">ลากไฟล์ลงที่นี่ หรือกดปุ่ม "+ เพิ่มสื่อ"</p>
                </div>
              ) : (
                filteredAssets.map((asset) => {
                  const isActive = activeAssetId === asset.id;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => onSelectAsset(asset)}
                      className={`p-2 rounded border flex items-center justify-between cursor-pointer transition ${
                        isActive
                          ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center text-white ${asset.color || 'bg-blue-600'}`}>
                          {asset.type === 'video' ? <Video className="w-4 h-4" /> : asset.type === 'audio' ? <Music className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="text-xs font-medium text-slate-800 truncate">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {asset.size} {asset.duration ? `• ${asset.duration}s` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); onAddToTimeline(asset); }}
                          title="แทรกลงไทม์ไลน์ที่ตำแหน่งเคอร์เซอร์ (Add to Timeline)"
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleRename(asset, e)}
                          title="เปลี่ยนชื่อ"
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(asset, e)}
                          title="ลบ"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleProcessFiles(e.target.files)}
              multiple
              className="hidden"
              accept="video/*,audio/*,image/*"
            />
          </div>
        )}

        {/* =========================================================
            TAB 2: FONT & TEXT STUDIO (แบบอักษร)
            ========================================================= */}
        {activeTab === 'font' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 space-y-4 font-sans">
            {/* Title */}
            <div className="border-b border-app-border pb-2.5">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-4 h-4 text-purple-600" />
                <span>แบบอักษร & ข้อความ (Font Studio)</span>
              </span>
              <p className="text-[11px] text-slate-500 font-doc mt-0.5">
                เพิ่มข้อความไตเติ้ล ซับไตเติ้ล และเลือกฟอนต์ภาษาไทยยอดนิยม
              </p>
            </div>

            {/* Quick Text Add Buttons (Canva Style) */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                ➕ เพิ่มกล่องข้อความทันที
              </label>

              <button
                onClick={() => onAddTextClip({ 
                  name: 'หัวเรื่องใหญ่', 
                  content: 'หัวเรื่องใหญ่ (Heading)',
                  effect: { fontSize: 38, bold: true, fontFamily: 'Prompt, sans-serif' }
                })}
                className="w-full p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-left font-bold text-sm shadow-2xs transition flex items-center justify-between"
              >
                <span>+ เพิ่มหัวเรื่องใหญ่ (Heading)</span>
                <span className="text-[10px] font-mono opacity-80">38px Bold</span>
              </button>

              <button
                onClick={() => onAddTextClip({ 
                  name: 'หัวข้อย่อย', 
                  content: 'หัวข้อย่อย (Subheading)',
                  effect: { fontSize: 26, bold: true, fontFamily: 'Prompt, sans-serif' }
                })}
                className="w-full p-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded text-left font-semibold text-xs transition flex items-center justify-between"
              >
                <span>+ เพิ่มหัวข้อย่อย (Subheading)</span>
                <span className="text-[10px] font-mono text-purple-600">26px Semi</span>
              </button>

              <button
                onClick={() => onAddTextClip({ 
                  name: 'เนื้อหาข้อความ', 
                  content: 'เนื้อหาข้อความและคำอธิบายของคุณ...',
                  effect: { fontSize: 18, bold: false, fontFamily: 'Sarabun, sans-serif' }
                })}
                className="w-full p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-left text-xs transition flex items-center justify-between"
              >
                <span>+ เพิ่มเนื้อหาข้อความ (Body Text)</span>
                <span className="text-[10px] font-mono text-slate-400">18px</span>
              </button>
            </div>

            {/* Text Style Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>สไตล์ข้อความสำเร็จรูป (Preset Styles)</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { name: '✨ นีออนเรืองแสง', effect: { effectType: 'neon', shadowColor: '#06B6D4', color: '#FFFFFF', fontSize: 32 } },
                  { name: '🏆 3D Shadow Gold', effect: { effectType: '3d', shadowColor: '#000000', color: '#F59E0B', fontSize: 32 } },
                  { name: '🏷️ กรอบพาดหัวข่าว', effect: { effectType: 'boxed', boxBgColor: 'rgba(15, 23, 42, 0.9)', color: '#FFFFFF', fontSize: 28 } },
                  { name: '🌈 Gradient Sunset', effect: { effectType: 'gradient', gradientColors: ['#F43F5E', '#F59E0B'] as [string, string], fontSize: 30 } },
                  { name: '⚡ Glitch Tech', effect: { effectType: 'outline', strokeColor: '#9333EA', strokeWidth: 2, color: '#00FFFF', fontSize: 30 } },
                  { name: '🎬 ซับไตเติ้ลหนัง', effect: { effectType: 'shadow', shadowColor: 'rgba(0,0,0,0.95)', color: '#FFFFFF', fontSize: 24 } },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAddTextClip({ name: p.name, content: p.name, effect: p.effect as any })}
                    className="p-2 bg-slate-900 text-white rounded text-[11px] text-center border border-slate-700 hover:border-purple-400 hover:shadow-md transition truncate"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Thai Fonts Library & Upload */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  🔤 เลือกแบบอักษร (Font Library)
                </label>
                <button
                  onClick={() => fontUploadRef.current?.click()}
                  className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded text-[10px] font-medium flex items-center gap-1 transition"
                >
                  <Upload className="w-3 h-3" />
                  <span>+ อัปโหลดฟอนต์</span>
                </button>
              </div>

              {/* Font Search */}
              <input
                type="text"
                placeholder="ค้นหาแบบอักษร..."
                value={fontSearchQuery}
                onChange={(e) => setFontSearchQuery(e.target.value)}
                className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />

              {/* Font List */}
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {allFonts
                  .filter((f) => f.name.toLowerCase().includes(fontSearchQuery.toLowerCase()))
                  .map((font, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (selectedClip?.type === 'text') {
                          onUpdateClipEffect(selectedClip.id, selectedClip.textContent || selectedClip.name, {
                            ...(selectedClip.textEffect || { fontSize: 28, color: '#FFF', bold: true, italic: false, align: 'center', effectType: 'shadow' }),
                            fontFamily: font.family,
                          });
                          alertSuccess('เปลี่ยนฟอนต์สำเร็จ!', `กำหนดแบบอักษร "${font.name}" ให้กับข้อความที่เลือกแล้ว`);
                        } else {
                          onAddTextClip({
                            name: `ข้อความ (${font.name})`,
                            content: `ข้อความแบบอักษร ${font.name}`,
                            effect: { fontFamily: font.family }
                          });
                        }
                      }}
                      className="w-full p-2 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded text-left transition flex items-center justify-between group"
                    >
                      <span style={{ fontFamily: font.family }} className="text-sm text-slate-800 group-hover:text-purple-900 truncate">
                        {font.name}
                      </span>
                      {font.isUploaded && (
                        <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-mono text-[9px]">
                          ของคุณ
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            <input
              type="file"
              ref={fontUploadRef}
              onChange={handleCustomFontUpload}
              className="hidden"
              accept=".ttf,.otf,.woff,.woff2"
            />
          </div>
        )}

        {/* =========================================================
            TAB 3: ANIMATION & MOTION FX (อนิเมชั่น)
            ========================================================= */}
        {activeTab === 'animation' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 space-y-4 font-sans">
            {/* Title */}
            <div className="border-b border-app-border pb-2.5">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>อนิเมชั่น & เอฟเฟกต์ (Animation FX)</span>
              </span>
              <p className="text-[11px] text-slate-500 font-doc mt-0.5">
                กำหนดการเคลื่อนไหว Fade In/Out และ Transition ให้กับวิดีโอ, ภาพ และข้อความ
              </p>
            </div>

            {/* Target Clip Status Badge */}
            <div className={`p-2.5 rounded border text-xs ${
              selectedClip 
                ? 'bg-blue-50 border-blue-200 text-blue-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              {selectedClip ? (
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate">🎯 คลิปที่เลือก: {selectedClip.name}</span>
                  <span className="px-1.5 py-0.2 bg-blue-200 text-blue-900 rounded font-mono text-[10px] capitalize">
                    {selectedClip.type}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-semibold">💡 ยังไม่ได้เลือกคลิป:</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    คลิกเลือกคลิปบนไทม์ไลน์เพื่อกำหนดแอนิเมชั่นให้ตรงเป้าหมาย
                  </p>
                </div>
              )}
            </div>

            {/* In Animation (เปิดตัว) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-700 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                  <span>เปิดตัว (In Animation):</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold capitalize">
                  {currentMotion.inAnimation || 'none'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'fade-in', label: 'Fade In' },
                  { id: 'slide-up', label: 'Slide Up' },
                  { id: 'slide-down', label: 'Slide Down' },
                  { id: 'slide-left', label: 'Slide L' },
                  { id: 'slide-right', label: 'Slide R' },
                  { id: 'pop-in', label: 'Pop In' },
                  { id: 'bounce-in', label: 'Bounce' },
                  { id: 'flip-in', label: 'Flip 3D' },
                  { id: 'typewriter', label: 'Typewriter' },
                  { id: 'spin-in', label: 'Spin In' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMotion('inAnimation', m.id)}
                    className={`py-1.5 px-1 rounded text-center text-[10px] border transition ${
                      currentMotion.inAnimation === m.id
                        ? 'bg-emerald-600 text-white border-emerald-600 font-medium shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Out Animation (ปิดท้าย) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-slate-700 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <Play className="w-3.5 h-3.5 text-rose-600 rotate-180" />
                  <span>ปิดท้าย (Out Animation):</span>
                </span>
                <span className="text-[10px] font-mono text-rose-600 font-bold capitalize">
                  {currentMotion.outAnimation || 'none'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'fade-out', label: 'Fade Out' },
                  { id: 'slide-down', label: 'Slide Down' },
                  { id: 'slide-up', label: 'Slide Up' },
                  { id: 'slide-left', label: 'Slide L' },
                  { id: 'slide-right', label: 'Slide R' },
                  { id: 'scale-out', label: 'Scale Out' },
                  { id: 'blur-out', label: 'Blur Out' },
                  { id: 'fade-black', label: 'Fade Black' },
                ].map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleSelectMotion('outAnimation', o.id)}
                    className={`py-1.5 px-1 rounded text-center text-[10px] border transition ${
                      currentMotion.outAnimation === o.id
                        ? 'bg-rose-600 text-white border-rose-600 font-medium shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Loop Animation (วนซ้ำต่อเนื่อง) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-slate-700 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>วนซ้ำต่อเนื่อง (Loop / Hover):</span>
                </span>
                <span className="text-[10px] font-mono text-blue-600 font-bold capitalize">
                  {currentMotion.loopAnimation || 'none'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'pulse', label: 'Pulse เต้น' },
                  { id: 'floating', label: 'Floating ลอย' },
                  { id: 'shake', label: 'Shake สั่น' },
                  { id: 'glow-wave', label: 'Glow Wave' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleSelectMotion('loopAnimation', l.id)}
                    className={`py-1.5 px-1 rounded text-center text-[10px] border transition ${
                      currentMotion.loopAnimation === l.id
                        ? 'bg-blue-600 text-white border-blue-600 font-medium shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transitions (เปลี่ยนฉาก) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-slate-700 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เอฟเฟกต์เปลี่ยนผ่าน (Transitions):</span>
                </span>
                <span className="text-[10px] font-mono text-indigo-600 font-bold capitalize">
                  {currentTransition}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'none', label: 'ไม่มี' },
                  { id: 'fade-in', label: 'Fade In' },
                  { id: 'fade-out', label: 'Fade Out' },
                  { id: 'cross-dissolve', label: 'Dissolve' },
                  { id: 'fade-black', label: 'Fade Black' },
                  { id: 'slide-left', label: 'Slide L' },
                  { id: 'slide-right', label: 'Slide R' },
                  { id: 'zoom-in', label: 'Zoom In' },
                  { id: 'wipe', label: 'Wipe' },
                  { id: 'glitch', label: 'Glitch' },
                  { id: 'blur', label: 'Blur' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTransition(t.id as TransitionType)}
                    className={`py-1.5 px-1 rounded text-center text-[10px] border transition ${
                      currentTransition === t.id
                        ? 'bg-indigo-600 text-white border-indigo-600 font-medium shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time-Based In / Out Animation Timing Settings */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-1">
                <div className="font-semibold text-slate-700 flex items-center gap-1">
                  <span>⏱️ การกำหนดช่วงเวลาทำงาน (Animation Timing)</span>
                </div>
                <div className="text-[10px] text-slate-500 leading-relaxed font-doc">
                  {selectedClip?.type === 'video' || selectedClip?.type === 'audio' ? (
                    <span className="text-blue-700 font-medium">
                      🎬 สำหรับไฟล์วิดีโอ/เสียง: แอนิเมชั่นจะทำงานช่วงต้นและช่วงท้าย โดยอิงตามระยะเวลาจริงของไฟล์
                    </span>
                  ) : (
                    <span className="text-purple-700 font-medium">
                      ✍️ สำหรับไฟล์ภาพ/ข้อความ: แอนิเมชั่นจะทำงานช่วงต้นและช่วงท้าย โดยอิงตามความยาวของคลิปบนไทม์ไลน์ ({selectedClip?.duration || 5.0}s)
                    </span>
                  )}
                </div>
              </div>

              {/* In-Animation Duration Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-700 font-semibold">
                  <span className="text-emerald-700">⏱️ ช่วงเวลาเปิดตัว (In Duration):</span>
                  <span className="font-mono text-emerald-600 font-bold">{currentMotion.inDuration ?? currentMotion.duration ?? 0.8}s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={currentMotion.inDuration ?? currentMotion.duration ?? 0.8}
                  onChange={(e) => handleSelectMotion('inDuration', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Out-Animation Duration Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-700 font-semibold">
                  <span className="text-rose-700">⏱️ ช่วงเวลาปิดท้าย (Out Duration):</span>
                  <span className="font-mono text-rose-600 font-bold">{currentMotion.outDuration ?? currentMotion.duration ?? 0.8}s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={currentMotion.outDuration ?? currentMotion.duration ?? 0.8}
                  onChange={(e) => handleSelectMotion('outDuration', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
