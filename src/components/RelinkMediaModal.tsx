import React, { useState } from 'react';
import { 
  AlertTriangle, 
  FolderSearch, 
  X, 
  CheckCircle2, 
  FileVideo, 
  FileAudio, 
  Image as ImageIcon,
  HardDrive
} from 'lucide-react';
import type { MediaAsset } from '../types';
import { alertSuccess, alertError } from '../utils/swal';
import { auditLogger } from '../services/auditLogger';

interface RelinkMediaModalProps {
  asset: MediaAsset;
  onRelinkSuccess: (assetId: string, newFile: File, newLocalPath?: string) => void;
  onClose: () => void;
}

export const RelinkMediaModal: React.FC<RelinkMediaModalProps> = ({
  asset,
  onRelinkSuccess,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customPath, setCustomPath] = useState(asset.localPath || asset.originalPath || `C:\\Media\\${asset.name}`);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Attempt to capture path if supported
      const path = (file as any).path || `C:\\SelectedPath\\${file.name}`;
      setCustomPath(path);
    }
  };

  const handleConfirmRelink = () => {
    if (!selectedFile) {
      alertError('กรุณาเลือกไฟล์', 'กรุณาเลือกไฟล์สื่อจากเครื่องคอมพิวเตอร์ของคุณเพื่อทำการเชื่อมต่อ');
      return;
    }

    onRelinkSuccess(asset.id, selectedFile, customPath);
    auditLogger.log({
      type: 'RELINK_MEDIA',
      username: 'user',
      role: 'editor',
      action: `เชื่อมต่อไฟล์ต้นทางใหม่: ${asset.name}`,
      status: 'SUCCESS',
      details: `New Path: ${customPath}`
    });
    alertSuccess('เชื่อมต่อไฟล์สำเร็จ', `ไฟล์ "${asset.name}" ได้รับการเชื่อมโยงกับโปรเจกต์เรียบร้อยแล้ว`);
    onClose();
  };

  const IconComponent = asset.type === 'video' ? FileVideo : asset.type === 'audio' ? FileAudio : ImageIcon;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in">
      <div className="bg-white border border-amber-300 rounded-md shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">ค้นหาและเชื่อมโยงไฟล์ต้นทางใหม่ (Relink Missing Media)</h3>
              <p className="text-[11px] text-amber-100 font-doc">
                ไฟล์สื่ออาจถูกย้ายตำแหน่งหรือเปลี่ยนชื่อ กรุณาเลือกไฟล์ต้นทางใหม่เพื่อเรียกใช้งาน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white hover:bg-amber-600 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          {/* Missing Asset Summary */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-white border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 truncate">{asset.name}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                ที่ตั้งเดิม: {asset.localPath || asset.originalPath || 'ไม่ได้ระบุ (Unknown Local Path)'}
              </div>
              <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                สถานะ: ⚠️ ไฟล์ต้นทางถูกย้าย หรือไม่พบในตำแหน่งเดิม
              </div>
            </div>
          </div>

          {/* File Picker & Relink Location */}
          <div className="space-y-3 pt-1">
            <label className="block font-semibold text-slate-800 text-xs">
              เลือกไฟล์ต้นทางใหม่จากเครื่องคอมพิวเตอร์:
            </label>

            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-md p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center group">
              <FolderSearch className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition" />
              <span className="font-medium text-slate-700 group-hover:text-blue-700">
                {selectedFile ? `ไฟล์ที่เลือก: ${selectedFile.name}` : 'คลิกเพื่อค้นหาไฟล์ใหม่ในเครื่อง (Browse Files)'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'รองรับ MP4, WebM, MOV, MP3, WAV, PNG, JPG'}
              </span>
              <input
                type="file"
                className="hidden"
                accept="video/*,audio/*,image/*"
                onChange={handleFileChange}
              />
            </label>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                PATH ที่ตั้งไฟล์ในเครื่อง (สำหรับอ้างอิงและบันทึก):
              </label>
              <div className="relative">
                <HardDrive className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="e.g. C:\Users\UDTC_COM\Videos\my_file.mp4"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirmRelink}
            disabled={!selectedFile}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-5 py-2 rounded transition shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ยืนยันการเชื่อมโยงไฟล์ใหม่</span>
          </button>
        </div>
      </div>
    </div>
  );
};
