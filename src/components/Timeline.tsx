import React, { useRef, useState, useEffect } from 'react';
import { 
  Scissors, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  Plus,
  Type,
  Sparkles,
  Zap,
  Link2
} from 'lucide-react';
import type { TimelineClip, TimelineTrack, MediaType, TransitionType } from '../types';
import { AppSwal, alertConfirm } from '../utils/swal';

interface TimelineProps {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  currentTime: number;
  totalDuration: number;
  selectedClipId: string | null;
  focusedTrackId: string | null;
  timelineHeight: number;
  onHeightChange: (height: number) => void;
  onSeek: (time: number) => void;
  onSelectClip: (clipId: string | null) => void;
  onFocusTrack: (trackId: string) => void;
  onSplitClip: (clipId: string, splitTime: number) => void;
  onDeleteClip: (clipId: string) => void;
  onMoveClip: (clipId: string, newStartTime: number, newTrackId: string) => void;
  onResizeClip: (clipId: string, newStartTime: number, newDuration: number) => void;
  onToggleTrackMute: (trackId: string) => void;
  onToggleTrackLock: (trackId: string) => void;
  onRenameTrack: (trackId: string, newName: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onAddTrack: (type: MediaType) => void;
  onAddTextClip: () => void;
  onEditTextClip: (clip: TimelineClip) => void;
  onReplaceClipMedia?: (clipId: string, file: File) => void;
  onUpdateClipTransition?: (clipId: string, transition: TransitionType) => void;
}

interface SnapTarget {
  clipId: string;
  side: 'left' | 'right';
  targetTime: number;
  trackId: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  clips,
  currentTime,
  totalDuration,
  selectedClipId,
  focusedTrackId,
  timelineHeight,
  onHeightChange,
  onSeek,
  onSelectClip,
  onFocusTrack,
  onSplitClip,
  onDeleteClip,
  onMoveClip,
  onResizeClip,
  onToggleTrackMute,
  onToggleTrackLock,
  onRenameTrack,
  onDeleteTrack,
  onAddTrack,
  onAddTextClip,
  onEditTextClip,
  onReplaceClipMedia,
  onUpdateClipTransition,
}) => {
  const [zoom, setZoom] = useState(40); // Pixels per second
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetReplacingClipId, setTargetReplacingClipId] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Resizer state (Requirement 6)
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(timelineHeight);
  const touchHoldTimer = useRef<any>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && targetReplacingClipId && onReplaceClipMedia) {
      onReplaceClipMedia(targetReplacingClipId, file);
      setTargetReplacingClipId(null);
    }
    e.target.value = '';
  };

  // Dragging clip state (Requirement 1 & 5)
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [hoverSnapTarget, setHoverSnapTarget] = useState<SnapTarget | null>(null);
  const dragStartPos = useRef<{ x: number; y: number; clipStartTime: number; clipTrackId: string; clipDuration: number }>({
    x: 0,
    y: 0,
    clipStartTime: 0,
    clipTrackId: '',
    clipDuration: 0,
  });

  // Clip Trimming / Duration Stretching state (Requirement 8)
  const [resizingClip, setResizingClip] = useState<{
    clipId: string;
    edge: 'left' | 'right';
    initialStartTime: number;
    initialDuration: number;
    startX: number;
  } | null>(null);

  const timelineWidth = Math.max(900, totalDuration * zoom + 300);

  // --- Top Border Resizer Handler ---
  const handleResizeStart = (clientY: number) => {
    setIsResizing(true);
    resizeStartY.current = clientY;
    resizeStartHeight.current = timelineHeight;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const delta = resizeStartY.current - e.clientY;
        const newHeight = Math.max(160, Math.min(550, resizeStartHeight.current + delta));
        onHeightChange(newHeight);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onHeightChange]);

  // Touch Holding (~2s) for resizer
  const handleTouchStartResizer = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchHoldTimer.current = setTimeout(() => {
      handleResizeStart(touch.clientY);
    }, 400);
  };

  const handleTouchEndResizer = () => {
    if (touchHoldTimer.current) clearTimeout(touchHoldTimer.current);
    setIsResizing(false);
  };

  // --- Scrubber Playhead Handler ---
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingClipId || resizingClip) return;
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const newTime = Math.max(0, Math.min(totalDuration, clickX / zoom));
    onSeek(newTime);
    setIsScrubbing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isScrubbing || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left + timelineRef.current.scrollLeft;
      const newTime = Math.max(0, Math.min(totalDuration, clickX / zoom));
      onSeek(newTime);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
    };

    if (isScrubbing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, zoom, totalDuration, onSeek]);

  // --- Clip Dragging Across Time & Tracks with Smart Insertion Snap & Highlights (Requirement 1) ---
  const handleClipMouseDown = (e: React.MouseEvent, clip: TimelineClip) => {
    if (resizingClip) return;
    e.stopPropagation();
    onSelectClip(clip.id);
    onFocusTrack(clip.trackId);

    setDraggingClipId(clip.id);
    setHoverSnapTarget(null);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      clipStartTime: clip.startTime,
      clipTrackId: clip.trackId,
      clipDuration: clip.duration,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingClipId) return;
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaTime = deltaX / zoom;
      const rawNewStartTime = Math.max(0, dragStartPos.current.clipStartTime + deltaTime);

      const deltaY = e.clientY - dragStartPos.current.y;
      const currentTrackIndex = tracks.findIndex(t => t.id === dragStartPos.current.clipTrackId);
      const trackHeight = 56;
      const trackOffset = Math.round(deltaY / trackHeight);
      const newTrackIndex = Math.max(0, Math.min(tracks.length - 1, currentTrackIndex + trackOffset));
      const targetTrack = tracks[newTrackIndex];

      // Smart Collision & Highlight Detection (Requirement 1)
      const otherClips = clips.filter(c => c.trackId === targetTrack.id && c.id !== draggingClipId);
      let detectedSnap: SnapTarget | null = null;

      for (const other of otherClips) {
        const otherStart = other.startTime;
        const otherEnd = other.startTime + other.duration;
        const clipEnd = rawNewStartTime + dragStartPos.current.clipDuration;

        // Case A: Dragging to the left / front of other clip
        if (rawNewStartTime < otherStart && clipEnd >= otherStart - 0.5) {
          detectedSnap = {
            clipId: other.id,
            side: 'left',
            targetTime: Math.max(0, otherStart - dragStartPos.current.clipDuration),
            trackId: targetTrack.id,
          };
          break;
        }

        // Case B: Dragging overlapping with other clip or towards right edge of other clip
        if (
          (rawNewStartTime >= otherStart && rawNewStartTime <= otherEnd) ||
          (rawNewStartTime < otherStart && clipEnd > otherStart) ||
          (rawNewStartTime >= otherEnd && rawNewStartTime <= otherEnd + 1.2)
        ) {
          detectedSnap = {
            clipId: other.id,
            side: 'right',
            targetTime: otherEnd,
            trackId: targetTrack.id,
          };
          break;
        }
      }

      setHoverSnapTarget(detectedSnap);

      const finalStartTime = detectedSnap ? detectedSnap.targetTime : rawNewStartTime;
      onMoveClip(draggingClipId, finalStartTime, targetTrack.id);
    };

    const handleMouseUp = () => {
      if (draggingClipId) {
        setDraggingClipId(null);
        setHoverSnapTarget(null);
      }
    };

    if (draggingClipId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingClipId, zoom, tracks, clips, onMoveClip]);

  // --- Clip Duration Resizing / Trimming Handlers (Requirement 8) ---
  const handleTrimStart = (e: React.MouseEvent, clip: TimelineClip, edge: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    onSelectClip(clip.id);
    onFocusTrack(clip.trackId);

    setResizingClip({
      clipId: clip.id,
      edge,
      initialStartTime: clip.startTime,
      initialDuration: clip.duration,
      startX: e.clientX,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingClip) return;
      const deltaX = e.clientX - resizingClip.startX;
      const deltaTime = deltaX / zoom;

      if (resizingClip.edge === 'right') {
        const newDuration = Math.max(0.5, resizingClip.initialDuration + deltaTime);
        onResizeClip(resizingClip.clipId, resizingClip.initialStartTime, parseFloat(newDuration.toFixed(2)));
      } else {
        const maxDelta = resizingClip.initialDuration - 0.5;
        const boundedDelta = Math.min(maxDelta, deltaTime);
        const newStartTime = Math.max(0, resizingClip.initialStartTime + boundedDelta);
        const newDuration = Math.max(0.5, resizingClip.initialDuration - boundedDelta);
        onResizeClip(resizingClip.clipId, parseFloat(newStartTime.toFixed(2)), parseFloat(newDuration.toFixed(2)));
      }
    };

    const handleMouseUp = () => {
      if (resizingClip) setResizingClip(null);
    };

    if (resizingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingClip, zoom, onResizeClip]);

  const handleClipTouchStart = (e: React.TouchEvent, clip: TimelineClip) => {
    onSelectClip(clip.id);
    onFocusTrack(clip.trackId);
    const touch = e.touches[0];
    touchHoldTimer.current = setTimeout(() => {
      setDraggingClipId(clip.id);
      dragStartPos.current = {
        x: touch.clientX,
        y: touch.clientY,
        clipStartTime: clip.startTime,
        clipTrackId: clip.trackId,
        clipDuration: clip.duration,
      };
    }, 500);
  };

  // Track Renaming & Delete Track
  const handleTrackDoubleClick = async (track: TimelineTrack) => {
    const { value: newName } = await AppSwal.fire({
      title: 'แก้ไขชื่อแทร็ก (Rename Track)',
      input: 'text',
      inputValue: track.name,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      inputValidator: (val) => {
        if (!val || !val.trim()) return 'กรุณาระบุชื่อแทร็ก';
      }
    });

    if (newName && newName.trim() && newName !== track.name) {
      onRenameTrack(track.id, newName.trim());
    }
  };

  const handleDeleteTrackConfirm = async (track: TimelineTrack) => {
    const trackClips = clips.filter(c => c.trackId === track.id);
    const confirmed = await alertConfirm(
      'ยืนยันการลบแทร็ก',
      `คุณต้องการลบ "${track.name}" หรือไม่? ${
        trackClips.length > 0
          ? `(มีคลิป ${trackClips.length} รายการในแทร็กนี้ที่จะถูกลบออกด้วย)`
          : ''
      }`,
      'ลบแทร็กและรายการทั้งหมด',
      'ยกเลิก'
    );

    if (confirmed) {
      onDeleteTrack(track.id);
    }
  };

  const handleSplitSelected = () => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (clip && currentTime > clip.startTime && currentTime < clip.startTime + clip.duration) {
      onSplitClip(selectedClipId, currentTime);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;

    const confirmed = await alertConfirm(
      'ลบคลิปจากไทม์ไลน์',
      `คุณต้องการลบ "${clip.name}" ออกจากไทม์ไลน์ใช่หรือไม่?`,
      'ลบ',
      'ยกเลิก'
    );

    if (confirmed) {
      onDeleteClip(selectedClipId);
    }
  };

  const handleCreateTrack = async () => {
    const { value: trackType } = await AppSwal.fire({
      title: 'เพิ่มแทร็กใหม่ (Add Track)',
      input: 'select',
      inputOptions: {
        'video': 'วิดีโอ / กราฟิก (Video Track)',
        'audio': 'เสียง / ดนตรี (Audio Track)',
        'text': 'ข้อความ / ซับไตเติ้ล (Text Track)'
      },
      inputPlaceholder: 'เลือกประเภทแทร็ก',
      showCancelButton: true,
      confirmButtonText: 'สร้างแทร็ก',
      cancelButtonText: 'ยกเลิก'
    });

    if (trackType) {
      onAddTrack(trackType as MediaType);
    }
  };

  const handleOpenTransitionPicker = async (clip: TimelineClip) => {
    const transitions: { id: TransitionType; label: string; icon: string }[] = [
      { id: 'none', label: 'ไม่มี (None)', icon: '🚫' },
      { id: 'cross-dissolve', label: 'ละลายจาง (Cross Dissolve)', icon: '✨' },
      { id: 'fade-black', label: 'จางลงดำ (Fade to Black)', icon: '🌑' },
      { id: 'fade-in', label: 'Fade In (ค่อยๆ ปรากฏ)', icon: '🌟' },
      { id: 'fade-out', label: 'Fade Out (ค่อยๆ จางดับ)', icon: '🌙' },
      { id: 'slide-left', label: 'สไลด์ซ้าย (Slide Left)', icon: '⬅️' },
      { id: 'slide-right', label: 'สไลด์ขวา (Slide Right)', icon: '➡️' },
      { id: 'zoom-in', label: 'ซูมเข้า (Zoom In)', icon: '🔍' },
      { id: 'wipe', label: 'กวาดภาพ (Wipe)', icon: '🧹' },
      { id: 'glitch', label: 'กลิตช์ดิจิทัล (Glitch FX)', icon: '⚡' },
      { id: 'blur', label: 'เบลอเปลี่ยนฉาก (Blur)', icon: '🌫️' },
    ];

    const inputOptions = transitions.reduce((acc, curr) => {
      acc[curr.id] = `${curr.icon} ${curr.label}`;
      return acc;
    }, {} as Record<string, string>);

    const { value: selectedTrans } = await AppSwal.fire({
      title: 'เลือก Transition รอยต่อระหว่างคลิป',
      text: `กำหนดเอฟเฟกต์เปลี่ยนผ่านสำหรับคลิป "${clip.name}"`,
      input: 'select',
      inputOptions,
      inputValue: clip.transition || 'cross-dissolve',
      showCancelButton: true,
      confirmButtonText: 'บันทึก Transition',
      cancelButtonText: 'ยกเลิก',
    });

    if (selectedTrans && onUpdateClipTransition) {
      onUpdateClipTransition(clip.id, selectedTrans as TransitionType);
    }
  };

  return (
    <div 
      style={{ height: `${timelineHeight}px` }}
      className="bg-app-surface border-t border-app-border flex flex-col select-none shrink-0 relative transition-all duration-75"
    >
      {/* Top Resizer Handle Bar */}
      <div
        onMouseDown={(e) => handleResizeStart(e.clientY)}
        onTouchStart={handleTouchStartResizer}
        onTouchEnd={handleTouchEndResizer}
        title="คลิกซ้ายค้างหรือแตะค้าง 2 วินาทีเพื่อปรับขนาดความสูงของ Timeline"
        className="h-2 w-full bg-slate-200/80 hover:bg-blue-500 active:bg-blue-600 cursor-ns-resize flex items-center justify-center transition-colors group z-30"
      >
        <div className="w-12 h-1 bg-slate-400 group-hover:bg-white rounded-full transition-colors"></div>
      </div>

      {/* Timeline Toolbar */}
      <div className="h-10 bg-slate-50 border-b border-app-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            ลำดับเวลา (Timeline)
          </span>

          <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>

          {/* Action Tools */}
          <button
            onClick={handleSplitSelected}
            disabled={!selectedClipId}
            title="ตัดคลิปที่ตำแหน่งเคอร์เซอร์ (Split Clip - 'S')"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition ${
              selectedClipId
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                : 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-blue-600" />
            <span>ตัดคลิป (Split)</span>
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!selectedClipId}
            title="ลบคลิปที่เลือก (Delete)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition ${
              selectedClipId
                ? 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200 shadow-2xs'
                : 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ลบ (Delete)</span>
          </button>

          {/* Add Text */}
          <button
            onClick={onAddTextClip}
            title="เพิ่มข้อความซับไตเติ้ล / ไตเติ้ล (Add Text Clip)"
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition shadow-2xs"
          >
            <Type className="w-3.5 h-3.5 text-purple-600" />
            <span>+ ข้อความ (Add Text)</span>
          </button>

          <button
            onClick={handleCreateTrack}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>เพิ่มแทร็ก</span>
          </button>
        </div>

        {/* Zoom Controls & Local Engine Hardware Badge */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] font-medium text-emerald-800 shadow-2xs" title="การตัดต่อทั้งหมดประมวลผลบนการ์ดจอและ CPU ของเครื่อง 100% ปราศจากการโหลดเซิร์ฟเวอร์">
            <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
            <span>Local Engine (Zero Server Load)</span>
          </div>

          <button 
            onClick={() => setZoom(Math.max(15, zoom - 10))}
            title="ย่อมุมมองไทม์ไลน์ (Zoom Out)"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-[11px] font-mono text-slate-500 w-12 text-center">
            {Math.round((zoom / 40) * 100)}%
          </span>

          <button 
            onClick={() => setZoom(Math.min(100, zoom + 10))}
            title="ขยายมุมมองไทม์ไลน์ (Zoom In)"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Timeline Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Track Headers (Left column) */}
        <div className="w-60 bg-slate-50 border-r border-app-border flex flex-col shrink-0">
          <div className="h-6 border-b border-app-border bg-slate-100 flex items-center justify-between px-3">
            <span className="text-[10px] uppercase font-mono font-medium text-slate-400">แทร็ก (Tracks)</span>
            <span className="text-[9px] text-slate-400 font-doc">คลิกเพื่อโฟกัสแทร็ก</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
            {tracks.map((track) => {
              const isFocused = focusedTrackId === track.id;
              return (
                <div 
                  key={track.id} 
                  onClick={() => onFocusTrack(track.id)}
                  onDoubleClick={() => handleTrackDoubleClick(track)}
                  className={`h-14 px-3 flex items-center justify-between text-xs transition group cursor-pointer ${
                    isFocused 
                      ? 'bg-blue-50/90 border-l-4 border-l-blue-600 shadow-inner' 
                      : 'hover:bg-slate-100'
                  }`}
                  title={`${track.name}\n• คลิกซ้ายเพื่อโฟกัสแทร็กนี้\n• ดับเบิลคลิกเพื่อเปลี่ยนชื่อ`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <span className={`w-2 h-2 rounded-none shrink-0 ${
                      track.type === 'video' ? 'bg-blue-500' : track.type === 'audio' ? 'bg-emerald-500' : 'bg-purple-500'
                    }`}></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-800 truncate block">
                          {track.name}
                        </span>
                        {isFocused && (
                          <span className="text-[9px] bg-blue-600 text-white px-1 py-0.2 rounded font-sans font-normal shrink-0">
                            โฟกัส
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize font-mono block">
                        {track.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleTrackMute(track.id); }}
                      title={track.muted ? 'เปิดเสียง' : 'ปิดเสียง'}
                      className={`p-1 rounded transition ${track.muted ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      {track.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleTrackLock(track.id); }}
                      title={track.locked ? 'ปลดล็อกแทร็ก' : 'ล็อกแทร็ก'}
                      className={`p-1 rounded transition ${track.locked ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      {track.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTrackConfirm(track); }}
                      title="ลบแทร็กนี้ (Delete Track)"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Tracks & Scrubber Canvas (Right column) */}
        <div 
          ref={timelineRef}
          onMouseDown={handleTimelineMouseDown}
          className="flex-1 overflow-x-auto overflow-y-auto bg-slate-100/50 relative cursor-crosshair"
        >
          <div style={{ width: `${timelineWidth}px` }} className="min-h-full relative">
            {/* Time Ruler */}
            <div className="h-6 bg-slate-100 border-b border-app-border sticky top-0 z-10 flex select-none">
              {Array.from({ length: Math.ceil(totalDuration) + 10 }).map((_, sec) => (
                <div
                  key={sec}
                  style={{ width: `${zoom}px` }}
                  className="h-full border-r border-slate-300 relative text-[9px] font-mono text-slate-500 pl-1 shrink-0"
                >
                  {sec % 2 === 0 ? `${sec}s` : ''}
                </div>
              ))}
            </div>

            {/* Playhead Vertical Line (Red Line) */}
            <div
              style={{ left: `${currentTime * zoom}px` }}
              className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20 pointer-events-none"
            >
              <div className="w-3.5 h-4 bg-red-500 rounded-none -ml-[6px] -mt-[1px] flex items-center justify-center shadow">
                <div className="w-1 h-2 bg-white/80 rounded-none"></div>
              </div>
            </div>

            {/* Track Lanes */}
            <div className="divide-y divide-slate-200">
              {tracks.map((track) => {
                const trackClips = clips.filter((c) => c.trackId === track.id);
                const sortedTrackClips = [...trackClips].sort((a, b) => a.startTime - b.startTime);
                const isFocused = focusedTrackId === track.id;

                return (
                  <div 
                    key={track.id} 
                    onClick={() => onFocusTrack(track.id)}
                    className={`h-14 relative transition-colors ${
                      isFocused ? 'bg-blue-50/30 ring-1 ring-blue-300 ring-inset' : 'bg-slate-50/50'
                    } ${
                      track.locked ? 'bg-slate-200/40 pointer-events-none' : ''
                    }`}
                  >
                    {/* Clips inside this track */}
                    {trackClips.map((clip) => {
                      const isSelected = selectedClipId === clip.id;
                      const isDragging = draggingClipId === clip.id;
                      const isTextClip = clip.type === 'text';
                      
                      // Highlight Indicator Checks (Requirement 1)
                      const isSnapLeftTarget = hoverSnapTarget?.clipId === clip.id && hoverSnapTarget.side === 'left';
                      const isSnapRightTarget = hoverSnapTarget?.clipId === clip.id && hoverSnapTarget.side === 'right';

                      return (
                        <div
                          key={clip.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClip(clip.id);
                            onFocusTrack(track.id);
                          }}
                          onMouseDown={(e) => handleClipMouseDown(e, clip)}
                          onTouchStart={(e) => handleClipTouchStart(e, clip)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (isTextClip) {
                              onEditTextClip(clip);
                            }
                          }}
                          style={{
                            left: `${clip.startTime * zoom}px`,
                            width: `${Math.max(30, clip.duration * zoom)}px`,
                          }}
                          title={isTextClip ? 'ดับเบิลคลิกเพื่อแก้ไขข้อความ & Effect' : 'คลิกค้างเพื่อลากเลื่อน หรือลากขอบซ้าย/ขวาเพื่อยืดขยายความยาว'}
                          className={`absolute top-1.5 bottom-1.5 rounded-sm border px-2 py-1 flex items-center justify-between text-xs cursor-move transition-all select-none group/clip ${
                            clip.isMissing
                              ? 'bg-rose-900/90 border-2 border-rose-500 text-rose-100 ring-1 ring-rose-400 shadow-md font-medium'
                              : isDragging 
                              ? 'opacity-70 ring-2 ring-amber-400 z-30 shadow-md' 
                              : isSelected
                              ? 'ring-2 ring-blue-500 border-white bg-blue-600 text-white font-medium shadow-xs'
                              : isTextClip
                              ? 'bg-purple-50 text-purple-900 border-purple-300 hover:border-purple-400'
                              : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
                          }`}
                        >
                          {/* Visual Highlight: Left Side Drop Indicator (Requirement 1) */}
                          {isSnapLeftTarget && (
                            <div className="absolute -left-1.5 -top-2 -bottom-2 w-3 bg-cyan-400 shadow-[0_0_12px_#22d3ee] rounded-sm z-40 animate-pulse border-2 border-white flex items-center justify-center pointer-events-none">
                              <div className="w-1 h-4 bg-white rounded-full"></div>
                              <span className="absolute -top-5 left-0 bg-cyan-600 text-white text-[9px] px-1 py-0.2 rounded shadow font-sans whitespace-nowrap">
                                แทรกด้านหน้า (Left Snap)
                              </span>
                            </div>
                          )}

                          {/* Visual Highlight: Right Side Drop Indicator (Requirement 1) */}
                          {isSnapRightTarget && (
                            <div className="absolute -right-1.5 -top-2 -bottom-2 w-3 bg-amber-400 shadow-[0_0_12px_#fbbf24] rounded-sm z-40 animate-pulse border-2 border-white flex items-center justify-center pointer-events-none">
                              <div className="w-1 h-4 bg-white rounded-full"></div>
                              <span className="absolute -top-5 right-0 bg-amber-600 text-white text-[9px] px-1 py-0.2 rounded shadow font-sans whitespace-nowrap">
                                แทรกต่อท้าย (Right Snap)
                              </span>
                            </div>
                          )}

                          {/* Left Trim Handle (Requirement 8) */}
                          <div
                            onMouseDown={(e) => handleTrimStart(e, clip, 'left')}
                            title="ลากเพื่อยืด/หดความยาวจุดเริ่มต้น (Trim Start)"
                            className="absolute left-0 top-0 bottom-0 w-2 hover:w-3 bg-blue-500/20 hover:bg-blue-600 cursor-ew-resize rounded-l-sm transition-all z-10 opacity-0 group-hover/clip:opacity-100"
                          >
                            <div className="w-[1px] h-3 bg-white mx-auto my-auto mt-2"></div>
                          </div>

                          {/* Content */}
                          <div className="flex items-center gap-1.5 min-w-0 pr-1 pl-1">
                            {clip.isMissing && (
                              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded font-sans text-[9px] shrink-0 font-bold flex items-center gap-0.5 animate-pulse">
                                ⚠️ ไฟล์ถูกลบจากคลัง
                              </span>
                            )}

                            {isTextClip && <Type className="w-3 h-3 text-purple-600 shrink-0" />}
                            
                            {/* Motion / Transition Badge Indicator */}
                            {clip.transition && clip.transition !== 'none' && (
                              <span title={`Transition: ${clip.transition}`} className="px-1 py-0.2 bg-indigo-100 text-indigo-800 rounded text-[9px] font-mono shrink-0 flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 text-indigo-600" />
                                <span>{clip.transition.split('-')[0]}</span>
                              </span>
                            )}

                            {clip.motion?.inAnimation && clip.motion.inAnimation !== 'none' && (
                              <span title={`Motion In: ${clip.motion.inAnimation}`} className="p-0.5 bg-amber-100 text-amber-800 rounded shrink-0">
                                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                              </span>
                            )}

                            <span className="truncate font-sans text-xs">
                              {clip.textContent || clip.name}
                            </span>
                          </div>

                          {/* Action Buttons: Relink & Quick Delete (Requirement 2) */}
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {clip.isMissing && onReplaceClipMedia && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTargetReplacingClipId(clip.id);
                                  fileInputRef.current?.click();
                                }}
                                title="คลิกเพื่อเลือกไฟล์ใหม่มาแทนที่ และนำเข้าสู่คลังสื่ออัตโนมัติ"
                                className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white border border-rose-300 rounded text-[10px] font-medium flex items-center gap-1 shadow-sm transition"
                              >
                                <Link2 className="w-3 h-3" />
                                <span>ลิงก์ไฟล์ใหม่</span>
                              </button>
                            )}

                            {isSelected && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteClip(clip.id);
                                }}
                                title="ลบคลิปนี้ออกจาก Track Editor (Delete)"
                                className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded transition shadow-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}

                            <span className="text-[10px] opacity-75 font-mono shrink-0 pl-0.5">
                              {clip.duration.toFixed(1)}s
                            </span>
                          </div>

                          {/* Right Trim Handle (Requirement 8) */}
                          <div
                            onMouseDown={(e) => handleTrimStart(e, clip, 'right')}
                            title="ลากเพื่อยืด/หดความยาวจุดสิ้นสุด (Extend / Trim End)"
                            className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 bg-blue-500/20 hover:bg-blue-600 cursor-ew-resize rounded-r-sm transition-all z-10 opacity-0 group-hover/clip:opacity-100"
                          >
                            <div className="w-[1px] h-3 bg-white mx-auto my-auto mt-2"></div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Transition [+] Junction Button between adjacent clips (Requirement 1) */}
                    {sortedTrackClips.map((clipA, idx) => {
                      if (idx === sortedTrackClips.length - 1) return null;
                      const clipB = sortedTrackClips[idx + 1];
                      const junctionX = (clipA.startTime + clipA.duration) * zoom;
                      const hasTransition = clipB.transition && clipB.transition !== 'none';

                      return (
                        <div
                          key={`trans-junc-${clipA.id}-${clipB.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTransitionPicker(clipB);
                          }}
                          style={{
                            left: `${junctionX - 12}px`,
                          }}
                          title={
                            hasTransition
                              ? `Transition: ${clipB.transition} (คลิกเพื่อแก้ไข/เปลี่ยน)`
                              : 'คลิกเพื่อเพิ่ม Animation Transition รอยต่อระหว่างคลิป'
                          }
                          className={`absolute top-4 z-30 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-md group/trans ${
                            hasTransition
                              ? 'bg-indigo-600 text-white ring-2 ring-white hover:scale-115 animate-in fade-in'
                              : 'bg-white border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:scale-115 opacity-0 hover:!opacity-100 group-hover/track:opacity-90'
                          }`}
                        >
                          {hasTransition ? (
                            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Picker for Relinking / Replacing Missing Media */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept="video/*,audio/*,image/*"
      />
    </div>
  );
};
