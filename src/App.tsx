import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { AssetSidebar } from './components/AssetSidebar';
import { MediaCanvas } from './components/MediaCanvas';
import { Timeline } from './components/Timeline';
import { InspectorPanel } from './components/InspectorPanel';
import { TextEffectEditor } from './components/TextEffectEditor';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SystemUpdateModal } from './components/SystemUpdateModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { DonateModal } from './components/DonateModal';
import { InquiryWebboardModal } from './components/InquiryWebboardModal';
import { UserProfileModal } from './components/UserProfileModal';
import { RelinkMediaModal } from './components/RelinkMediaModal';
import { StudioGuideTour } from './components/StudioGuideTour';
import type { 
  MediaAsset, 
  TimelineClip, 
  TimelineTrack, 
  ProjectSettings, 
  MediaType, 
  MediaFolder, 
  UploadTask, 
  CustomFont, 
  TextEffectConfig,
  UserSession,
  SavedProject,
  TransitionType,
  MotionAnimation
} from './types';
import { AppSwal, alertSuccess, alertError } from './utils/swal';
import { getSystemLocalFonts } from './utils/fontManager';
import { googleDriveService } from './services/googleDrive';
import { authService } from './services/auth';
import { adminService } from './services/adminService';
import { renderProjectOnClient } from './utils/localRenderer';

// Initial Project Settings with 2K Option
const initialSettings: ProjectSettings = {
  name: 'New_Multimedia_Project',
  aspectRatio: '16:9',
  resolution: '2K (2560x1440)',
  fps: 30,
};

// Initial Clean State (No dummy sample files)
const initialFolders: MediaFolder[] = [];
const initialAssets: MediaAsset[] = [];
const initialClips: TimelineClip[] = [];

// Initial Tracks (Requirement 2: Exactly 1 blank track on new project)
const initialTracks: TimelineTrack[] = [
  { id: 'trk-video-1', name: 'วิดีโอ & มีเดีย (Track 1)', type: 'video', muted: false, locked: false, solo: false },
];

// Storage Keys for Refresh Persistence (Requirement 1)
const CURRENT_VIEW_KEY = 'MWA_CURRENT_VIEW';
const ACTIVE_STUDIO_STATE_KEY = 'MWA_ACTIVE_STUDIO_STATE';

function loadSavedStudioState() {
  try {
    const raw = localStorage.getItem(ACTIVE_STUDIO_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load active studio state', e);
  }
  return null;
}

export function App() {
  const savedState = loadSavedStudioState();
  const session = authService.getSession();
  const savedView = (localStorage.getItem(CURRENT_VIEW_KEY) as 'welcome' | 'studio') || 'welcome';

  // Navigation & Auth State - Persists across page refreshes
  const [currentView, setCurrentView] = useState<'welcome' | 'studio'>(
    session && savedView === 'studio' ? 'studio' : 'welcome'
  );
  const [userSession, setUserSession] = useState<UserSession | null>(session);

  // Modal & Guide Tour States
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [relinkTargetAsset, setRelinkTargetAsset] = useState<MediaAsset | null>(null);

  // Project & Studio State with Persistence
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(
    savedState?.projectSettings || initialSettings
  );
  const [folders, setFolders] = useState<MediaFolder[]>(
    savedState?.folders || initialFolders
  );
  const [assets, setAssets] = useState<MediaAsset[]>(
    savedState?.assets || initialAssets
  );
  const [tracks, setTracks] = useState<TimelineTrack[]>(
    savedState?.tracks || initialTracks
  );
  const [clips, setClips] = useState<TimelineClip[]>(
    savedState?.clips || initialClips
  );
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [focusedTrackId, setFocusedTrackId] = useState<string | null>('trk-video');
  const [editingTextClip, setEditingTextClip] = useState<TimelineClip | null>(null);

  // Auto-Save Active Studio State so browser refresh retains all current work
  useEffect(() => {
    if (userSession && currentView === 'studio') {
      localStorage.setItem(CURRENT_VIEW_KEY, 'studio');
      const serializableAssets = assets.map(a => ({
        ...a,
        file: undefined,
      }));
      localStorage.setItem(
        ACTIVE_STUDIO_STATE_KEY,
        JSON.stringify({
          projectSettings,
          folders,
          assets: serializableAssets,
          tracks,
          clips,
        })
      );
    } else if (currentView === 'welcome') {
      localStorage.setItem(CURRENT_VIEW_KEY, 'welcome');
    }
  }, [currentView, userSession, projectSettings, folders, assets, tracks, clips]);

  // Admin Notification for Pending Registrations
  useEffect(() => {
    if (userSession?.role === 'admin') {
      const pendingCount = adminService.getPendingUsersCount();
      if (pendingCount > 0) {
        AppSwal.fire({
          icon: 'info',
          title: `🔔 มีผู้สมัครขอใช้งานใหม่ ${pendingCount} รายการ`,
          html: `
            <div class="text-left font-sans text-xs space-y-2 text-slate-700">
              <p class="font-doc">
                ตรวจพบผู้ใช้งานที่ลงทะเบียนใหม่และมีสถานะ <strong>"รอยืนยันการอนุมัติ"</strong> อยู่ในระบบ
              </p>
              <div class="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 font-semibold flex items-center justify-between">
                <span>จำนวนคำขอรออนุมัติ:</span>
                <span class="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-mono font-bold">${pendingCount} รายการ</span>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: '🛡️ เปิดศูนย์ควบคุมผู้ดูแลระบบ (Admin Console)',
          cancelButtonText: 'ไว้ภายหลัง',
          confirmButtonColor: '#2563EB',
        }).then((result) => {
          if (result.isConfirmed) {
            setIsAdminModalOpen(true);
          }
        });
      }
    }
  }, [userSession]);

  // Handle Relink Success (Restores Missing Media)
  const handleRelinkSuccess = (assetId: string, newFile: File, newLocalPath?: string) => {
    const blobUrl = URL.createObjectURL(newFile);
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              file: newFile,
              blobUrl,
              isMissing: false,
              localPath: newLocalPath || a.localPath,
              size: `${(newFile.size / (1024 * 1024)).toFixed(1)} MB`,
              rawSize: newFile.size,
            }
          : a
      )
    );

    // Also update all timeline clips using this asset
    setClips((prev) =>
      prev.map((c) =>
        c.assetId === assetId
          ? {
              ...c,
              isMissing: false,
              localPath: newLocalPath || c.localPath,
            }
          : c
      )
    );
    setRelinkTargetAsset(null);
  };

  // Handle Import Project Data
  const handleImportProject = (importedData: any) => {
    if (importedData.projectSettings) setProjectSettings(importedData.projectSettings);
    if (Array.isArray(importedData.folders)) setFolders(importedData.folders);
    if (Array.isArray(importedData.assets)) setAssets(importedData.assets);
    if (Array.isArray(importedData.tracks)) setTracks(importedData.tracks);
    if (Array.isArray(importedData.clips)) setClips(importedData.clips);
    setCurrentView('studio');
  };
  
  // Timeline controls & playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [timelineHeight, setTimelineHeight] = useState(250);

  // Total Duration
  const totalDuration = Math.max(
    30,
    ...clips.map((c) => c.startTime + c.duration)
  );

  // Active items
  const activeAsset = assets.find((a) => a.id === activeAssetId) || null;
  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;
  const activeTextClips = clips.filter(
    (c) => c.type === 'text' && currentTime >= c.startTime && currentTime <= c.startTime + c.duration
  );

  // Load system fonts on startup
  useEffect(() => {
    getSystemLocalFonts().then(fonts => {
      setCustomFonts(fonts);
    });
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        if (selectedClipId) {
          handleSplitClip(selectedClipId, currentTime);
        }
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        if (selectedClipId) {
          handleDeleteClip(selectedClipId);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime((prev) => Math.max(0, prev - (e.shiftKey ? 5 : 1)));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime((prev) => Math.min(totalDuration, prev + (e.shiftKey ? 5 : 1)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, currentTime, totalDuration, clips]);

  // Playback timer
  const animFrameRef = useRef<number | null>(null);
  const lastTickTime = useRef<number>(performance.now());

  useEffect(() => {
    if (isPlaying) {
      lastTickTime.current = performance.now();
      const tick = () => {
        const now = performance.now();
        const delta = (now - lastTickTime.current) / 1000;
        lastTickTime.current = now;

        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, totalDuration]);

  // --- Handlers ---
  const handleTogglePlay = () => setIsPlaying(!isPlaying);
  const handleSeek = (time: number) => setCurrentTime(Math.max(0, Math.min(totalDuration, time)));

  const handleAddAsset = (newAsset: MediaAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
    setActiveAssetId(newAsset.id);
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    if (activeAssetId === assetId) {
      setActiveAssetId(null);
    }
    // Mark timeline clips referring to this deleted asset as isMissing = true so they show red warning in Track Editor
    setClips((prev) =>
      prev.map((c) =>
        c.assetId === assetId
          ? { ...c, isMissing: true }
          : c
      )
    );
  };

  // Replace Missing Media or Change File for Timeline Clip (Requirement 2)
  const handleReplaceClipMedia = (clipId: string, newFile: File) => {
    const fileType = newFile.type.startsWith('video/')
      ? 'video'
      : newFile.type.startsWith('audio/')
      ? 'audio'
      : 'image';
    const blobUrl = URL.createObjectURL(newFile);
    const newAsset: MediaAsset = {
      id: `ast-${Date.now()}`,
      name: newFile.name,
      type: fileType,
      file: newFile,
      blobUrl,
      localPath: newFile.name,
      duration: 8.0,
      size: `${(newFile.size / (1024 * 1024)).toFixed(1)} MB`,
      rawSize: newFile.size,
      color: fileType === 'video' ? 'bg-blue-600' : fileType === 'audio' ? 'bg-emerald-600' : 'bg-amber-600',
      createdAt: Date.now(),
    };

    // 1. Add new file into Media Library assets
    setAssets((prev) => [newAsset, ...prev]);

    // 2. Replace clip on timeline and clear isMissing
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? {
              ...c,
              assetId: newAsset.id,
              name: newFile.name,
              type: fileType,
              color: newAsset.color || c.color,
              isMissing: false,
              localPath: newFile.name,
            }
          : c
      )
    );
    setActiveAssetId(newAsset.id);
    alertSuccess('ลิงก์ไฟล์ใหม่สำเร็จ!', `เพิ่ม "${newFile.name}" เข้าสู่คลังสื่อและแทนที่บนไทม์ไลน์แล้ว`);
  };

  const handleRenameAsset = (assetId: string, newName: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, name: newName } : a))
    );
  };

  const handleMoveAssetToFolder = (assetId: string, folderId: string | null) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, folderId } : a))
    );
  };

  // Folder Operations
  const handleCreateFolder = (name: string) => {
    const newFolder: MediaFolder = {
      id: `fld-${Date.now()}`,
      name,
      createdAt: Date.now(),
      isOpen: true,
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setAssets((prev) =>
      prev.map((a) => (a.folderId === folderId ? { ...a, folderId: null } : a))
    );
  };

  const handleToggleFolder = (folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, isOpen: !f.isOpen } : f))
    );
  };

  // Upload Tasks
  const handleAddUploadTask = (task: UploadTask) => {
    setUploadTasks((prev) => [task, ...prev]);
  };

  const handleUpdateUploadTask = (taskId: string, progress: number, status: UploadTask['status']) => {
    setUploadTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, progress, status } : t))
    );
  };

  const handleRemoveUploadTask = (taskId: string) => {
    setUploadTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Add Asset to Timeline with Focused Track & Red Playhead Intersect Check
  const handleAddToTimeline = (asset: MediaAsset) => {
    let targetTrack = tracks.find((t) => t.id === focusedTrackId);
    if (!targetTrack || (asset.type === 'audio' && targetTrack.type !== 'audio') || (asset.type === 'video' && targetTrack.type === 'audio')) {
      targetTrack = tracks.find((t) => t.type === asset.type) || tracks[0];
    }

    const trackClips = clips.filter((c) => c.trackId === targetTrack!.id);
    const intersectingClip = trackClips.find(
      (c) => c.startTime <= currentTime && (c.startTime + c.duration) > currentTime
    );

    let newStartTime = currentTime;
    if (intersectingClip) {
      newStartTime = intersectingClip.startTime + intersectingClip.duration;
    }

    const newClip: TimelineClip = {
      id: `clp-${Date.now()}`,
      assetId: asset.id,
      name: asset.name,
      type: asset.type,
      trackId: targetTrack.id,
      startTime: parseFloat(newStartTime.toFixed(2)),
      duration: asset.duration || 6.0,
      color: asset.color || (asset.type === 'video' ? 'bg-blue-600' : asset.type === 'audio' ? 'bg-emerald-600' : 'bg-amber-600'),
    };

    setClips((prev) => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  };

  // Drop Asset directly from Media Library onto a Track at specific drop time
  const handleDropAssetToTrack = (asset: MediaAsset, trackId: string, startTime: number) => {
    let targetTrack = tracks.find((t) => t.id === trackId) || tracks[0];

    const newClip: TimelineClip = {
      id: `clp-${Date.now()}`,
      assetId: asset.id,
      name: asset.name,
      type: asset.type,
      trackId: targetTrack.id,
      startTime: parseFloat(startTime.toFixed(2)),
      duration: asset.duration || (asset.type === 'image' ? 5.0 : 6.0),
      color: asset.color || (asset.type === 'video' ? 'bg-blue-600' : asset.type === 'audio' ? 'bg-emerald-600' : 'bg-amber-600'),
    };

    setClips((prev) => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    setFocusedTrackId(targetTrack.id);
    alertSuccess('วางไฟล์สื่อบนไทม์ไลน์สำเร็จ!', `นำ "${asset.name}" วางบน ${targetTrack.name} ที่เวลา ${startTime.toFixed(1)}s เรียบร้อย`);
  };

  // Add Text Clip directly at Red Playhead (with optional preset styles)
  const handleAddTextClip = (preset?: { name?: string; content?: string; effect?: Partial<TextEffectConfig> }) => {
    let textTrack = tracks.find((t) => t.id === focusedTrackId && t.type === 'text') || tracks.find((t) => t.type === 'text');
    if (!textTrack) {
      textTrack = {
        id: `trk-text-${Date.now()}`,
        name: `ข้อความ & ไตเติ้ล (Text ${tracks.filter((t) => t.type === 'text').length + 1})`,
        type: 'text',
        muted: false,
        locked: false,
        solo: false,
      };
      setTracks((prev) => [textTrack!, ...prev]);
    }

    const trackClips = clips.filter((c) => c.trackId === textTrack!.id);
    const intersectingClip = trackClips.find(
      (c) => c.startTime <= currentTime && (c.startTime + c.duration) > currentTime
    );

    let newStartTime = currentTime;
    if (intersectingClip) {
      newStartTime = intersectingClip.startTime + intersectingClip.duration;
    }

    const defaultEffect: TextEffectConfig = {
      fontFamily: 'Prompt, sans-serif',
      fontSize: 28,
      color: '#FFFFFF',
      bold: true,
      italic: false,
      align: 'center',
      effectType: 'shadow',
      shadowColor: 'rgba(0,0,0,0.85)',
      ...preset?.effect,
    };

    const newTextClip: TimelineClip = {
      id: `clp-${Date.now()}`,
      name: preset?.name || 'ข้อความใหม่',
      type: 'text',
      trackId: textTrack.id,
      startTime: parseFloat(newStartTime.toFixed(2)),
      duration: 5.0,
      color: 'bg-purple-600',
      textContent: preset?.content || preset?.name || 'ข้อความใหม่ของคุณ',
      textEffect: defaultEffect,
    };

    setClips((prev) => [...prev, newTextClip]);
    setSelectedClipId(newTextClip.id);
  };

  // Move clip horizontally & vertically across tracks
  const handleMoveClip = (clipId: string, newStartTime: number, newTrackId: string) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? {
              ...c,
              startTime: Math.max(0, parseFloat(newStartTime.toFixed(2))),
              trackId: newTrackId,
            }
          : c
      )
    );
  };

  // Resize / Trim clip duration
  const handleResizeClip = (clipId: string, newStartTime: number, newDuration: number) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? {
              ...c,
              startTime: Math.max(0, parseFloat(newStartTime.toFixed(2))),
              duration: Math.max(0.5, parseFloat(newDuration.toFixed(2))),
            }
          : c
      )
    );
  };

  const handleSplitClip = (clipId: string, splitTime: number) => {
    const clipIndex = clips.findIndex((c) => c.id === clipId);
    if (clipIndex === -1) return;

    const original = clips[clipIndex];
    if (splitTime <= original.startTime || splitTime >= original.startTime + original.duration) {
      return;
    }

    const firstDuration = splitTime - original.startTime;
    const secondDuration = original.duration - firstDuration;

    const clipA: TimelineClip = {
      ...original,
      duration: parseFloat(firstDuration.toFixed(2)),
    };

    const clipB: TimelineClip = {
      ...original,
      id: `clp-${Date.now()}`,
      startTime: parseFloat(splitTime.toFixed(2)),
      duration: parseFloat(secondDuration.toFixed(2)),
    };

    const updatedClips = [...clips];
    updatedClips.splice(clipIndex, 1, clipA, clipB);
    setClips(updatedClips);
    setSelectedClipId(clipB.id);
  };

  const handleDeleteClip = (clipId: string) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId));
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
  };

  const handleRenameTrack = (trackId: string, newName: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, name: newName } : t))
    );
  };

  const handleDeleteTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setClips((prev) => prev.filter((c) => c.trackId !== trackId));
  };

  const handleToggleTrackMute = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t))
    );
  };

  const handleToggleTrackLock = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t))
    );
  };

  const isPremium = userSession?.isPremium === true || userSession?.role === 'admin';

  const handleAddTrack = (type: MediaType) => {
    const maxTracks = isPremium ? 10 : 3;
    if (tracks.length >= maxTracks) {
      alertError(
        'ถึงขีดจำกัดจำนวนแทร็ก',
        isPremium
          ? `สมาชิก Premium สามารถสร้าง Track Editor ได้สูงสุด ${maxTracks} แทร็ก`
          : `ผู้ใช้งานทั่วไปสามารถสร้าง Track Editor ได้สูงสุด ${maxTracks} แทร็ก (กรุณาอัปเกรดเป็น Premium เพื่อสร้างได้สูงสุด 10 แทร็ก)`
      );
      return;
    }

    const typeLabel = type === 'video' ? 'Video' : type === 'audio' ? 'Audio' : 'Text';
    const newTrack: TimelineTrack = {
      id: `trk-${Date.now()}`,
      name: `${typeLabel} ${tracks.filter((t) => t.type === type).length + 1}`,
      type,
      muted: false,
      locked: false,
      solo: false,
    };
    setTracks((prev) => [...prev, newTrack]);
    setFocusedTrackId(newTrack.id);
  };

  // Update text clip content & effects
  const handleSaveTextEffect = (clipId: string, text: string, effect: TextEffectConfig) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? {
              ...c,
              textContent: text,
              name: text,
              textEffect: effect,
            }
          : c
      )
    );
  };

  // Export Project with 2K & Google Drive upload support
  const handleExport = async () => {
    const { value: exportConfig } = await AppSwal.fire({
      title: 'ส่งออกไฟล์งาน (Export Multimedia Project)',
      html: `
        <div class="space-y-4 text-left font-sans text-sm pt-2">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">ฟอร์แมตไฟล์ (Format)</label>
            <select id="swal-export-fmt" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="MP4 (H.264 / AAC)">MP4 Video (H.264 + AAC High Quality)</option>
              <option value="WEBM (VP9)">WebM Video (VP9 สำหรับเว็บไซต์)</option>
              <option value="GIF Animation">Animated GIF (สำหรับแบนเนอร์ / มีม)</option>
              <option value="MP3 Audio">MP3 Audio Only (เฉพาะเสียงเพลง/บันทึกเสียง)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">คุณภาพการเรนเดอร์ (Quality Preset)</label>
            <select id="swal-export-quality" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Best">Best Quality (Bitrate สูงสุด ไม่บีบอัด)</option>
              <option value="Standard" selected>Standard (สมดุลขนาดไฟล์และความคมชัด)</option>
              <option value="Fast">Fast Web Export (บีบอัดสำหรับส่งผ่านแชท)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">ปลายทางจัดเก็บไฟล์ (Export Destination)</label>
            <select id="swal-export-dest" class="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="local" selected>💾 ดาวน์โหลดลงเครื่องคอมพิวเตอร์ (Local Download)</option>
              <option value="gdrive">☁️ อัปโหลดเก็บไว้ที่ Google Drive โดยตรง</option>
            </select>
          </div>
          <div class="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 space-y-1">
            <div class="flex justify-between"><span>ความยาวรวม:</span> <strong class="text-slate-800 font-mono">${totalDuration} วินาที</strong></div>
            <div class="flex justify-between"><span>ความละเอียด:</span> <strong class="text-slate-800 font-mono">${projectSettings.resolution}</strong></div>
            <div class="flex justify-between"><span>Frame Rate:</span> <strong class="text-slate-800 font-mono">${projectSettings.fps} FPS</strong></div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'เริ่มเรนเดอร์และส่งออก',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const fmt = (document.getElementById('swal-export-fmt') as HTMLSelectElement).value;
        const quality = (document.getElementById('swal-export-quality') as HTMLSelectElement).value;
        const dest = (document.getElementById('swal-export-dest') as HTMLSelectElement).value;
        return { fmt, quality, dest };
      }
    });

    if (exportConfig) {
      AppSwal.fire({
        title: '⚡ กำลังเรนเดอร์บนฮาร์ดแวร์เครื่อง (Client GPU)...',
        html: `
          <div class="space-y-3 pt-2 font-sans">
            <p id="export-stage-text" class="text-xs text-slate-600 font-doc">กำลังประมวลผลแทร็ก, วิดีโอ และข้อความด้วย GPU/CPU ของเครื่อง...</p>
            <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div id="export-progress-bar" class="bg-blue-600 h-3 rounded-full transition-all duration-75" style="width: 0%"></div>
            </div>
            <div class="flex justify-between items-center text-[11px] font-mono text-slate-600">
              <span id="export-frame-text">Frame 0 / 0</span>
              <span id="export-progress-text" class="font-bold text-blue-600">0%</span>
            </div>
            <div class="p-2 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-800 font-doc text-left">
              🔒 <strong>100% Client-Side:</strong> ทำงานบนทรัพยากรเครื่องของคุณโดยตรง ปราศจากการโหลดเซิร์ฟเวอร์
            </div>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: async () => {
          try {
            const format = exportConfig.fmt.startsWith('MP4') ? 'mp4' : 'webm';
            const quality = exportConfig.quality as 'Best' | 'Standard' | 'Fast';

            const outputBlob = await renderProjectOnClient({
              projectSettings,
              assets,
              clips,
              tracks,
              totalDuration: Math.max(1, totalDuration),
              format,
              quality,
              isPremium,
              onProgress: (prog) => {
                const bar = document.getElementById('export-progress-bar');
                const pText = document.getElementById('export-progress-text');
                const fText = document.getElementById('export-frame-text');
                const sText = document.getElementById('export-stage-text');
                if (bar) bar.style.width = `${prog.progress}%`;
                if (pText) pText.innerText = `${prog.progress}%`;
                if (fText) fText.innerText = `Frame ${prog.currentFrame} / ${prog.totalFrames}`;
                if (sText) sText.innerText = prog.stage;
              }
            });

            AppSwal.close();

            const cleanName = (projectSettings.name || 'project').replace(/[^\wก-๙-]/g, '_');
            const fileName = `${cleanName}.${format}`;

            if (exportConfig.dest === 'gdrive') {
              try {
                const uploaded = await googleDriveService.uploadToDrive(fileName, outputBlob, outputBlob.type);
                alertSuccess(
                  'บันทึกลง Google Drive สำเร็จ!',
                  `ไฟล์ "${fileName}" ถูกอัปโหลดขึ้น Google Drive เรียบร้อยแล้ว${
                    uploaded.webViewLink ? ` (Link: ${uploaded.webViewLink})` : ''
                  }`
                );
              } catch (err: any) {
                const url = URL.createObjectURL(outputBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 10000);
                alertSuccess('ส่งออกไฟล์งานสำเร็จ!', `ไฟล์ "${fileName}" เรนเดอร์บนเครื่องเสร็จสมบูรณ์และดาวน์โหลดแล้ว`);
              }
            } else {
              const url = URL.createObjectURL(outputBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 10000);
              alertSuccess('ส่งออกไฟล์งานสำเร็จ!', `ไฟล์ "${fileName}" เรนเดอร์บนเครื่องเสร็จสมบูรณ์และดาวน์โหลดแล้ว`);
            }
          } catch (err: any) {
            AppSwal.close();
            alertError('เกิดข้อผิดพลาดในการเรนเดอร์', err?.message || 'ไม่สามารถประมวลผลวิดีโอบนเครื่องได้');
          }
        }
      });
    }
  };

  // Open / Create Project from Welcome Screen
  const handleOpenProject = (project?: SavedProject) => {
    if (project) {
      setProjectSettings({
        name: project.name,
        aspectRatio: project.aspectRatio,
        resolution: project.resolution,
        fps: project.fps,
      });
    } else {
      const newP: SavedProject = {
        id: `proj-${Date.now()}`,
        name: `Project_${Date.now().toString().slice(-4)}`,
        aspectRatio: '16:9',
        resolution: '2K (2560x1440)',
        fps: 30,
        totalDuration: 30,
        clipCount: 0,
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      authService.saveProject(newP);
      setProjectSettings({
        name: newP.name,
        aspectRatio: newP.aspectRatio,
        resolution: newP.resolution,
        fps: newP.fps,
      });
      // Start with clean empty state: Exactly 1 blank track (Requirement 2)
      setTracks([
        { id: `trk-video-${Date.now()}`, name: 'วิดีโอ & มีเดีย (Track 1)', type: 'video', muted: false, locked: false, solo: false },
      ]);
      setAssets([]);
      setClips([]);
      setFolders([]);
      setActiveAssetId(null);
      setSelectedClipId(null);
      setFocusedTrackId(null);
      // Auto launch Interactive Studio Guide Tour
      setIsTourOpen(true);
    }
    setCurrentView('studio');
  };

  // Active video & image clips at currentTime
  const activeVideoClips = clips.filter(
    (c) => (c.type === 'video' || c.type === 'image') && currentTime >= c.startTime && currentTime <= c.startTime + c.duration
  );

  // Motion and Transition Update Handlers
  const handleUpdateClipTransition = (clipId: string, transition: TransitionType) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, transition } : c))
    );
  };

  const handleUpdateClipMotion = (clipId: string, motion: MotionAnimation) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, motion } : c))
    );
  };

  // Unified Bidirectional Selection Sync
  const handleSelectClipSync = (clipId: string | null) => {
    setSelectedClipId(clipId);
    if (clipId) {
      const foundClip = clips.find((c) => c.id === clipId);
      if (foundClip) {
        setFocusedTrackId(foundClip.trackId);
        if (foundClip.assetId) {
          setActiveAssetId(foundClip.assetId);
        }
      }
    }
  };

  const handleSelectAssetSync = (asset: MediaAsset) => {
    setActiveAssetId(asset.id);
    const matchingClip = clips.find((c) => c.assetId === asset.id);
    if (matchingClip) {
      setSelectedClipId(matchingClip.id);
      setFocusedTrackId(matchingClip.trackId);
    }
  };

  // Strict Login Guard & Welcome/Project Selection View Router:
  // If user is not logged in OR currentView is 'welcome', always render WelcomeScreen
  // (Prevents opening Editor before logging in and selecting a project)
  if (!userSession || currentView === 'welcome') {
    return (
      <>
        <WelcomeScreen
          userSession={userSession}
          onLoginSuccess={(session) => {
            setUserSession(session);
          }}
          onLogout={() => {
            authService.logout();
            setUserSession(null);
            setCurrentView('welcome');
          }}
          onOpenProject={handleOpenProject}
          onImportProject={handleImportProject}
          onOpenAdminPanel={() => setIsAdminModalOpen(true)}
          onOpenDonate={() => setIsDonateModalOpen(true)}
          onOpenInquiryWebboard={() => setIsInquiryModalOpen(true)}
          onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
        />

        {/* Global Modals in Welcome View */}
        {isAdminModalOpen && <AdminPanelModal onClose={() => setIsAdminModalOpen(false)} />}
        {isDonateModalOpen && <DonateModal onClose={() => setIsDonateModalOpen(false)} />}
        {isInquiryModalOpen && (
          <InquiryWebboardModal
            userSession={userSession}
            onClose={() => setIsInquiryModalOpen(false)}
          />
        )}
        {isUserProfileModalOpen && userSession && (
          <UserProfileModal
            userSession={userSession}
            onUpdateSession={setUserSession}
            onClose={() => setIsUserProfileModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="h-screen w-screen bg-app-bg text-app-textMain font-sans flex flex-col overflow-hidden antialiased">
      {/* Top Header */}
      <Header
        projectSettings={projectSettings}
        userSession={userSession}
        onUpdateSettings={setProjectSettings}
        onExport={handleExport}
        onNewAsset={() => {}}
        onAddTextClip={handleAddTextClip}
        onCheckUpdates={() => setIsUpdateModalOpen(true)}
        onGoHome={() => setCurrentView('welcome')}
        onStartTour={() => setIsTourOpen(true)}
        onOpenAdminPanel={() => setIsAdminModalOpen(true)}
        onOpenDonate={() => setIsDonateModalOpen(true)}
        onOpenInquiryWebboard={() => setIsInquiryModalOpen(true)}
        onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
      />

      {/* Main Workspace Area (Sidebar + Center Canvas + Properties Panel) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: 3-in-1 Primary Navigation Dock (Media, Font, Animation) & Drawer */}
        <AssetSidebar
          assets={assets}
          folders={folders}
          uploadTasks={uploadTasks}
          activeAssetId={activeAssetId}
          selectedClip={selectedClip}
          customFonts={customFonts}
          userId={userSession?.id}
          isPremium={isPremium}
          onSelectAsset={handleSelectAssetSync}
          onAddAsset={handleAddAsset}
          onDeleteAsset={handleDeleteAsset}
          onRenameAsset={handleRenameAsset}
          onMoveAssetToFolder={handleMoveAssetToFolder}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onToggleFolder={handleToggleFolder}
          onAddToTimeline={handleAddToTimeline}
          onAddUploadTask={handleAddUploadTask}
          onUpdateUploadTask={handleUpdateUploadTask}
          onRemoveUploadTask={handleRemoveUploadTask}
          onRelinkAsset={(asset) => setRelinkTargetAsset(asset)}
          onAddTextClip={handleAddTextClip}
          onAddCustomFont={(font) => setCustomFonts((prev) => [...prev, font])}
          onUpdateClipEffect={handleSaveTextEffect}
          onUpdateClipTransition={handleUpdateClipTransition}
          onUpdateClipMotion={handleUpdateClipMotion}
        />

        {/* Center: Canvas & Preview (with live text, video render & direct canvas selection) */}
        <MediaCanvas
          isPlaying={isPlaying}
          currentTime={currentTime}
          totalDuration={totalDuration}
          activeAsset={activeAsset}
          activeTextClips={activeTextClips}
          activeVideoClips={activeVideoClips}
          selectedClipId={selectedClipId}
          projectSettings={projectSettings}
          isPremium={isPremium}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          onSelectClip={handleSelectClipSync}
          onEditTextClip={setEditingTextClip}
        />

        {/* Right: Inspector Properties & Effect Panel */}
        <InspectorPanel
          selectedClip={selectedClip}
          activeAsset={activeAsset}
          customFonts={customFonts}
          userId={userSession?.id}
          onOpenTextEffectEditor={setEditingTextClip}
          onUpdateClipEffect={handleSaveTextEffect}
          onUpdateClipTransition={handleUpdateClipTransition}
          onUpdateClipMotion={handleUpdateClipMotion}
        />
      </div>

      {/* Bottom Timeline Editor with Resizer & Dragging */}
      <Timeline
        tracks={tracks}
        clips={clips}
        currentTime={currentTime}
        totalDuration={totalDuration}
        selectedClipId={selectedClipId}
        focusedTrackId={focusedTrackId}
        timelineHeight={timelineHeight}
        onHeightChange={setTimelineHeight}
        onSeek={handleSeek}
        onSelectClip={handleSelectClipSync}
        onFocusTrack={setFocusedTrackId}
        onSplitClip={handleSplitClip}
        onDeleteClip={handleDeleteClip}
        onMoveClip={handleMoveClip}
        onResizeClip={handleResizeClip}
        onToggleTrackMute={handleToggleTrackMute}
        onToggleTrackLock={handleToggleTrackLock}
        onRenameTrack={handleRenameTrack}
        onDeleteTrack={handleDeleteTrack}
        onAddTrack={handleAddTrack}
        onAddTextClip={handleAddTextClip}
        onEditTextClip={setEditingTextClip}
        onReplaceClipMedia={handleReplaceClipMedia}
        onUpdateClipTransition={handleUpdateClipTransition}
        onDropAssetToTrack={handleDropAssetToTrack}
      />

      {/* Text & Font Effects Editor Modal */}
      {editingTextClip && (
        <TextEffectEditor
          clip={editingTextClip}
          customFonts={customFonts}
          userId={userSession?.id}
          onAddCustomFont={(newFont) => setCustomFonts((prev) => [...prev, newFont])}
          onSave={handleSaveTextEffect}
          onClose={() => setEditingTextClip(null)}
        />
      )}

      {/* System Update & Health Diagnostics Modal */}
      {isUpdateModalOpen && (
        <SystemUpdateModal
          userSession={userSession}
          onClose={() => setIsUpdateModalOpen(false)}
        />
      )}

      {/* Admin Console Modal */}
      {isAdminModalOpen && (
        <AdminPanelModal onClose={() => setIsAdminModalOpen(false)} />
      )}

      {/* Donate Modal */}
      {isDonateModalOpen && (
        <DonateModal onClose={() => setIsDonateModalOpen(false)} />
      )}

      {/* Inquiry 1:1 & Community Webboard Modal */}
      {isInquiryModalOpen && (
        <InquiryWebboardModal
          userSession={userSession}
          onClose={() => setIsInquiryModalOpen(false)}
        />
      )}

      {/* User Profile & Security Settings Modal */}
      {isUserProfileModalOpen && userSession && (
        <UserProfileModal
          userSession={userSession}
          onUpdateSession={setUserSession}
          onClose={() => setIsUserProfileModalOpen(false)}
        />
      )}

      {/* Relink Missing Media Modal */}
      {relinkTargetAsset && (
        <RelinkMediaModal
          asset={relinkTargetAsset}
          onRelinkSuccess={handleRelinkSuccess}
          onClose={() => setRelinkTargetAsset(null)}
        />
      )}

      {/* Interactive Studio Onboarding & Guide Tour */}
      <StudioGuideTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}

export default App;
