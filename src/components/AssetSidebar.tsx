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
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Edit3, 
  Loader2,
  AlertTriangle,
  FolderSearch
} from 'lucide-react';
import type { MediaAsset, MediaType, MediaFolder, UploadTask } from '../types';
import { AppSwal, alertConfirm, alertError } from '../utils/swal';
import { googleDriveService } from '../services/googleDrive';

interface AssetSidebarProps {
  assets: MediaAsset[];
  folders: MediaFolder[];
  uploadTasks: UploadTask[];
  activeAssetId: string | null;
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
}

const MAX_VIDEO_SIZE = 4 * 1024 * 1024 * 1024; // 4 GB in bytes

export const AssetSidebar: React.FC<AssetSidebarProps> = ({
  assets,
  folders,
  uploadTasks,
  activeAssetId,
  onSelectAsset,
  onAddAsset,
  onDeleteAsset,
  onRenameAsset,
  onMoveAssetToFolder = () => {},
  onCreateFolder,
  onDeleteFolder,
  onToggleFolder,
  onAddToTimeline,
  onAddUploadTask,
  onUpdateUploadTask,
  onRemoveUploadTask,
  onRelinkAsset = () => {},
}) => {
  const [filter, setFilter] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);
  const touchHoldTimer = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Process Real File Upload
  const handleProcessFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      // 1. Determine media type
      let type: MediaType | null = null;
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type.startsWith('image/')) type = 'image';

      if (!type) {
        alertError('รูปแบบไฟล์ไม่รองรับ', `ไฟล์ "${file.name}" ไม่ใช่วิดีโอ, เสียง หรือรูปภาพ`);
        continue;
      }

      // 2. Validate max size for video (Max 4GB)
      if (type === 'video' && file.size > MAX_VIDEO_SIZE) {
        alertError(
          'ขนาดไฟล์เกินขีดจำกัด',
          `ไฟล์ "${file.name}" มีขนาด ${formatFileSize(file.size)} ซึ่งเกินขีดจำกัดที่กำหนดไว้สูงสุด 4 GB`
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

      // SweetAlert Progress modal with "Run in Background" option
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

      // Duration extraction
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

      // Simulate realistic upload progress
      let currentProg = 10;
      modalInterval = setInterval(() => {
        currentProg += Math.floor(Math.random() * 20 + 15);
        if (currentProg >= 100) {
          currentProg = 100;
          clearInterval(modalInterval);
          onUpdateUploadTask(taskId, 100, 'done');

          const colorMap: Record<MediaType, string> = {
            video: 'bg-blue-600',
            audio: 'bg-emerald-600',
            image: 'bg-amber-600',
            text: 'bg-purple-600',
          };

          const newAsset: MediaAsset = {
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            type,
            folderId: null,
            file,
            blobUrl,
            duration: duration ? parseFloat(duration.toFixed(1)) : undefined,
            size: formatFileSize(file.size),
            rawSize: file.size,
            color: colorMap[type],
            createdAt: Date.now(),
          };

          onAddAsset(newAsset);

          if (!isSwalClosed && AppSwal.isVisible()) {
            AppSwal.close();
          }

          setTimeout(() => {
            onRemoveUploadTask(taskId);
          }, 3000);
        } else {
          onUpdateUploadTask(taskId, currentProg, 'uploading');
          if (!isSwalClosed) {
            const bar = document.getElementById(`swal-upload-bar-${taskId}`);
            const pct = document.getElementById(`swal-upload-pct-${taskId}`);
            if (bar && pct) {
              bar.style.width = `${currentProg}%`;
              pct.innerText = `${currentProg}%`;
            }
          }
        }
      }, 150);
    }
  };

  const handleImportFromGoogleDrive = async () => {
    const isReady = googleDriveService.isConfigured();
    if (!isReady) {
      const { value: configValues } = await AppSwal.fire({
        title: 'ตั้งค่า Google Drive API (เชื่อมต่อครั้งแรก)',
        html: `
          <div class="space-y-3 text-left font-sans text-xs pt-1 text-slate-700">
            <p class="font-doc text-slate-600">
              กรุณาระบุ <strong>Client ID</strong> และ <strong>API Key</strong> จาก Google Cloud Console (หรือตั้งค่าผ่าน <code>.env</code> / Vercel Environment Variables):
            </p>
            <div>
              <label class="block font-medium mb-1">Google OAuth 2.0 Client ID:</label>
              <input id="swal-gd-client" placeholder="xxx.apps.googleusercontent.com" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white" value="${googleDriveService.getCredentials().clientId}" />
            </div>
            <div>
              <label class="block font-medium mb-1">Google API Key:</label>
              <input id="swal-gd-key" type="password" placeholder="AIzaSy..." class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white" value="${googleDriveService.getCredentials().apiKey}" />
            </div>
            <div class="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] font-doc">
              🔒 <strong>ความปลอดภัย:</strong> ข้อมูลนี้จะถูกเก็บเฉพาะใน Browser ของคุณเพื่อใช้ดึงไฟล์โดยตรงจาก Google Drive และใช้สิทธิ์ขั้นต่ำ (drive.file)
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'บันทึก & เปิด Google Drive',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
          const clientId = (document.getElementById('swal-gd-client') as HTMLInputElement).value;
          const apiKey = (document.getElementById('swal-gd-key') as HTMLInputElement).value;
          if (!clientId.trim() || !apiKey.trim()) {
            AppSwal.showValidationMessage('กรุณากรอก Client ID และ API Key ให้ครบถ้วน');
            return false;
          }
          return { clientId, apiKey };
        }
      });

      if (configValues) {
        googleDriveService.setCredentials(configValues.clientId, configValues.apiKey);
      } else {
        return;
      }
    }

    try {
      await googleDriveService.openFilePicker((newAsset) => {
        onAddAsset(newAsset);
      });
    } catch (err: any) {
      if (err?.error !== 'popup_closed_by_user') {
        alertError('การเชื่อมต่อ Google Drive ขัดข้อง', err?.message || 'โปรดตรวจสอบการตั้งค่า OAuth Client ID และ Authorized Origins');
      }
    }
  };

  const handleCreateNewFolder = async () => {
    const { value: folderName } = await AppSwal.fire({
      title: 'สร้างโฟลเดอร์ใหม่ (Create Folder)',
      html: `
        <div class="space-y-3 text-left font-sans text-xs pt-1 text-slate-700">
          <div class="flex items-center gap-3 p-3 bg-amber-50/80 border border-amber-200 rounded">
            <div class="w-8 h-8 rounded bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
            </div>
            <div>
              <div class="font-semibold text-slate-800">จัดหมวดหมู่คลังสื่อ</div>
              <div class="text-[11px] text-slate-500 font-doc">สร้างโฟลเดอร์เพื่อจัดระเบียบฟุตเทจ, เพลง, กราฟิก</div>
            </div>
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">ชื่อโฟลเดอร์:</label>
            <input 
              id="swal-new-folder-name" 
              type="text" 
              placeholder="เช่น Footage_Scene_1, Sound_Effects..." 
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none font-sans" 
            />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'สร้างโฟลเดอร์',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const input = document.getElementById('swal-new-folder-name') as HTMLInputElement;
        const val = input?.value?.trim();
        if (!val) {
          AppSwal.showValidationMessage('กรุณาระบุชื่อโฟลเดอร์');
          return false;
        }
        return val;
      }
    });

    if (folderName) {
      onCreateFolder(folderName);
    }
  };

  const handleRename = async (asset: MediaAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    const { value: newName } = await AppSwal.fire({
      title: 'เปลี่ยนชื่อไฟล์สื่อ (Rename Asset)',
      input: 'text',
      inputValue: asset.name,
      showCancelButton: true,
      confirmButtonText: 'บันทึกชื่อใหม่',
      cancelButtonText: 'ยกเลิก',
      inputValidator: (val) => {
        if (!val || !val.trim()) return 'กรุณาระบุชื่อไฟล์';
      }
    });

    if (newName && newName.trim() && newName !== asset.name) {
      onRenameAsset(asset.id, newName.trim());
    }
  };

  const handleDelete = async (asset: MediaAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await alertConfirm(
      'ยืนยันการลบไฟล์สื่อ',
      `คุณต้องการลบ "${asset.name}" ออกจากคลังสื่อใช่หรือไม่?`,
      'ลบไฟล์',
      'ยกเลิก'
    );
    if (confirmed) {
      onDeleteAsset(asset.id);
    }
  };

  const handleDeleteFolder = async (folder: MediaFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await alertConfirm(
      'ลบโฟลเดอร์',
      `คุณต้องการลบโฟลเดอร์ "${folder.name}" หรือไม่? ไฟล์ที่อยู่ในโฟลเดอร์นี้จะถูกย้ายออกมาที่รูทหลัก`,
      'ลบโฟลเดอร์',
      'ยกเลิก'
    );
    if (confirmed) {
      onDeleteFolder(folder.id);
    }
  };

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesFilter = filter === 'all' || asset.type === filter;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'audio':
        return <Music className="w-4 h-4 text-emerald-600" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-amber-600" />;
      default:
        return <Layers className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <aside 
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleProcessFiles(e.dataTransfer.files);
        }
      }}
      className={`w-80 bg-app-surface border-r border-app-border flex flex-col shrink-0 select-none transition-colors ${
        isDraggingOver ? 'bg-blue-50/40 ring-2 ring-blue-400 ring-inset' : ''
      }`}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleProcessFiles(e.target.files)}
        multiple
        accept="video/*,audio/*,image/*"
        className="hidden"
      />

      {/* Top Header & Actions */}
      <div className="p-3.5 border-b border-app-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              คลังไฟล์สื่อ (Media Assets)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {assets.length} ไฟล์
          </span>
        </div>

        {/* Buttons: Import Real File, Google Drive & Create Folder */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-2 rounded transition shadow-xs"
            title="นำเข้าไฟล์จากเครื่องของคุณ"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="truncate">ไฟล์ในเครื่อง</span>
          </button>

          <button
            onClick={handleImportFromGoogleDrive}
            className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 px-2 rounded transition shadow-xs"
            title="ดึงไฟล์จาก Google Drive"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M7.71 3.5L1.15 15l3.43 6l6.55-11.5L7.71 3.5zm4.86 6l3.43 6h7.71L20.29 9.5h-7.72zm3.43 6l-3.43 6h13.14l3.43-6H16z"/>
            </svg>
            <span className="truncate">Google Drive</span>
          </button>

          <button
            onClick={handleCreateNewFolder}
            className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium py-2 px-2 rounded transition"
            title="สร้างโฟลเดอร์ใหม่"
          >
            <FolderPlus className="w-3.5 h-3.5 text-slate-600" />
            <span className="truncate">โฟลเดอร์</span>
          </button>
        </div>
      </div>

      {/* Search & Type Filters */}
      <div className="p-3 border-b border-app-border space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="ค้นหาชื่อไฟล์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-0.5 text-[11px]">
          {(['all', 'video', 'audio', 'image'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-2 py-1 rounded capitalize transition shrink-0 font-medium ${
                filter === t
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {t === 'all' ? 'ทั้งหมด' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Active Background Transfer Progress List (Requirement 9) */}
      {uploadTasks.length > 0 && (
        <div className="p-2.5 bg-blue-50/70 border-b border-blue-200 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-blue-900">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>การถ่ายโอนไฟล์เบื้องหลัง ({uploadTasks.length})</span>
            </span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {uploadTasks.map((t) => (
              <div key={t.id} className="p-2 bg-white rounded border border-blue-200 text-xs shadow-2xs">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-medium text-slate-800 truncate max-w-[170px]" title={t.fileName}>
                    {t.fileName}
                  </span>
                  <span className="font-mono text-blue-600 font-semibold">{t.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-150" 
                    style={{ width: `${t.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>{t.fileSize}</span>
                  <span>{t.status === 'done' ? 'เสร็จสมบูรณ์' : 'กำลังนำเข้า...'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Folders & Asset Tree List (List-Down View) */}
      <div 
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => {
          e.preventDefault();
          const aId = e.dataTransfer.getData('text/asset-id');
          if (aId) onMoveAssetToFolder(aId, null);
        }}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {/* Folders Section */}
        {folders.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-semibold text-slate-400 px-1 tracking-wider">
              โฟลเดอร์จัดเก็บ (Folders) - ลากไฟล์มาวางที่โฟลเดอร์ได้
            </div>

            {folders.map((folder) => {
              const folderAssets = filteredAssets.filter((a) => a.folderId === folder.id);
              const isOpen = folder.isOpen !== false;
              const isDropTarget = dropTargetFolderId === folder.id;

              return (
                <div 
                  key={folder.id} 
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDropTargetFolderId(folder.id);
                  }}
                  onDragLeave={(e) => {
                    e.stopPropagation();
                    if (dropTargetFolderId === folder.id) setDropTargetFolderId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const aId = e.dataTransfer.getData('text/asset-id');
                    if (aId) {
                      onMoveAssetToFolder(aId, folder.id);
                    }
                    setDropTargetFolderId(null);
                  }}
                  className={`rounded border transition-all overflow-hidden ${
                    isDropTarget 
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400 ring-inset shadow-md' 
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  {/* Folder Header */}
                  <div
                    onClick={() => onToggleFolder(folder.id)}
                    className="p-2 flex items-center justify-between hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-800 group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      {isOpen ? (
                        <FolderOpen className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="truncate">{folder.name}</span>
                      {isDropTarget && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 px-1 py-0.2 rounded font-doc animate-pulse">
                          วางไฟล์ลงที่นี่
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {folderAssets.length}
                      </span>
                      <button
                        onClick={(e) => handleDeleteFolder(folder, e)}
                        title="ลบโฟลเดอร์"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* List-Down Assets inside this folder */}
                  {isOpen && (
                    <div className="p-1.5 pt-0 space-y-1 bg-white border-t border-slate-200">
                      {folderAssets.length === 0 ? (
                        <div className="py-3 text-center text-[11px] text-slate-400 font-doc">
                          {isDropTarget ? 'ปล่อยเมาส์เพื่อวางไฟล์ในโฟลเดอร์นี้' : 'โฟลเดอร์ว่างเปล่า (ลากไฟล์มาใส่ได้)'}
                        </div>
                      ) : (
                        folderAssets.map((asset) => renderAssetItem(asset))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Root Assets (Not in folder) */}
        <div 
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            const aId = e.dataTransfer.getData('text/asset-id');
            if (aId) onMoveAssetToFolder(aId, null);
          }}
          className="space-y-1.5"
        >
          <div className="text-[10px] uppercase font-semibold text-slate-400 px-1 tracking-wider flex justify-between">
            <span>{folders.length > 0 ? 'ไฟล์ทั่วไป (General Assets)' : 'รายการไฟล์ทั้งหมด (All Assets)'}</span>
            {folders.length > 0 && <span className="text-[9px] text-slate-400 font-doc font-normal">ลากไฟล์ลงด้านล่างนี้เพื่อนำออกจากโฟลเดอร์</span>}
          </div>

          {filteredAssets.filter((a) => (folders.length > 0 ? !a.folderId : true)).length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded text-slate-400">
              <UploadCloud className="w-7 h-7 mx-auto mb-1.5 opacity-40 text-slate-400" />
              <p className="text-xs font-doc">ยังไม่มีไฟล์สื่อในคลัง</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs text-blue-600 hover:underline font-medium"
              >
                + นำเข้าไฟล์จริงจากเครื่อง
              </button>
            </div>
          ) : (
            filteredAssets
              .filter((a) => (folders.length > 0 ? !a.folderId : true))
              .map((asset) => renderAssetItem(asset))
          )}
        </div>
      </div>

      {/* Footer Storage Spec */}
      <div className="p-3 border-t border-app-border bg-slate-50 text-[11px] text-slate-500 flex justify-between items-center">
        <span>จำกัดขนาดวิดีโอ</span>
        <span className="font-mono text-slate-700 font-medium">สูงสุด 4 GB / ไฟล์</span>
      </div>
    </aside>
  );

  function renderAssetItem(asset: MediaAsset) {
    const isSelected = activeAssetId === asset.id;
    const isMissing = !!asset.isMissing;

    return (
      <div
        key={asset.id}
        draggable={!isMissing}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/asset-id', asset.id);
          e.dataTransfer.setData('text/plain', asset.id);
        }}
        onTouchStart={() => {
          touchHoldTimer.current = setTimeout(async () => {
            // Touch hold action to move folder
            if (folders.length > 0) {
              const options: Record<string, string> = { 'root': '📂 ย้ายออกไปที่รูทหลัก (General Assets)' };
              folders.forEach(f => {
                options[f.id] = `📁 ${f.name}`;
              });
              const { value: targetFId } = await AppSwal.fire({
                title: 'ย้ายไฟล์ไปยังโฟลเดอร์',
                input: 'select',
                inputOptions: options,
                inputValue: asset.folderId || 'root',
                showCancelButton: true,
                confirmButtonText: 'ย้ายไฟล์',
                cancelButtonText: 'ยกเลิก',
              });
              if (targetFId) {
                onMoveAssetToFolder(asset.id, targetFId === 'root' ? null : targetFId);
              }
            }
          }, 1500);
        }}
        onTouchEnd={() => {
          if (touchHoldTimer.current) clearTimeout(touchHoldTimer.current);
        }}
        onClick={() => {
          if (isMissing) {
            onRelinkAsset(asset);
          } else {
            onSelectAsset(asset);
          }
        }}
        onDoubleClick={(e) => handleRename(asset, e)}
        title={isMissing ? `⚠️ ไม่พบไฟล์: ${asset.name}\nคลิกเพื่อค้นหาและเชื่อมโยงไฟล์ใหม่ (Relink)` : `${asset.name}\n• คลิกซ้ายเพื่อเลือกและแทรกที่เส้นแดง Timeline\n• ดับเบิลคลิกเพื่อเปลี่ยนชื่อ\n• คลิกค้างเพื่อลากไปใส่ในโฟลเดอร์`}
        className={`group relative p-2.5 rounded border transition cursor-grab active:cursor-grabbing flex items-center justify-between ${
          isMissing 
            ? 'opacity-60 bg-amber-50/50 border-amber-300 border-dashed hover:opacity-100 hover:border-amber-400' 
            : isSelected
            ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-1">
          <div className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 ${
            isMissing ? 'bg-amber-100/80 border-amber-300 text-amber-600' : 'bg-slate-100 border-slate-200'
          }`}>
            {isMissing ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : getMediaIcon(asset.type)}
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-medium truncate ${isMissing ? 'text-amber-900 font-semibold line-through decoration-amber-400' : 'text-slate-800'}`}>
              {asset.name}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
              {isMissing ? (
                <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1 py-0.2 rounded font-sans font-medium">
                  ⚠️ ไม่พบไฟล์ (คลิกเพื่อ Relink)
                </span>
              ) : (
                <>
                  <span className="capitalize px-1 py-0.2 bg-slate-100 rounded text-slate-600 border border-slate-200">{asset.type}</span>
                  {asset.duration && <span>{asset.duration}s</span>}
                  {asset.size && <span>• {asset.size}</span>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Icons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          {isMissing ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRelinkAsset(asset);
              }}
              title="ค้นหาและเชื่อมโยงไฟล์ใหม่ (Relink)"
              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-medium flex items-center gap-1 shadow-2xs"
            >
              <FolderSearch className="w-3 h-3" />
              <span>Relink</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToTimeline(asset);
              }}
              title="แทรกลงในไทม์ไลน์ที่ตำแหน่งเส้นแดง (Add to Timeline at Playhead)"
              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={(e) => handleRename(asset, e)}
            title="เปลี่ยนชื่อไฟล์ (Rename)"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => handleDelete(asset, e)}
            title="ลบไฟล์สื่อ"
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }
};
