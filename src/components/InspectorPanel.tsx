import React from 'react';
import { 
  Sliders, 
  Info, 
  CheckCircle2,
  Edit,
  Volume2,
  Video,
  Sparkles,
  Zap,
  Play,
  RotateCw
} from 'lucide-react';
import type { 
  TimelineClip, 
  MediaAsset, 
  CustomFont, 
  TextEffectConfig, 
  AudioSettings, 
  VideoSettings,
  TransitionType,
  MotionAnimation
} from '../types';
import { defaultFonts } from '../utils/fontManager';

interface InspectorPanelProps {
  selectedClip: TimelineClip | null;
  activeAsset: MediaAsset | null;
  customFonts: CustomFont[];
  userId?: string;
  onOpenTextEffectEditor: (clip: TimelineClip) => void;
  onUpdateClipEffect: (clipId: string, text: string, effect: TextEffectConfig) => void;
  onUpdateClipTransition?: (clipId: string, transition: TransitionType) => void;
  onUpdateClipMotion?: (clipId: string, motion: MotionAnimation) => void;
  onUpdateClipAudio?: (clipId: string, audio: AudioSettings) => void;
  onUpdateClipVideo?: (clipId: string, video: VideoSettings) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedClip,
  customFonts,
  userId,
  onOpenTextEffectEditor,
  onUpdateClipEffect,
  onUpdateClipTransition = () => {},
  onUpdateClipMotion = () => {},
}) => {
  // Audio state
  const [audioSettings, setAudioSettings] = React.useState<AudioSettings>(
    selectedClip?.audioSettings || {
      volume: 100,
      pan: 0,
      equalizer: 'flat',
      sampleRate: '48.0 kHz',
      bitrate: '320 kbps',
      fadeInDuration: 0,
      fadeOutDuration: 0,
    }
  );

  // Video state
  const [videoSettings, setVideoSettings] = React.useState<VideoSettings>(
    selectedClip?.videoSettings || {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      playbackSpeed: 1,
      opacity: 100,
      filterPreset: 'Normal',
    }
  );

  // Scoped Fonts: Default system fonts + custom fonts uploaded by this specific user
  const visibleCustomFonts = customFonts.filter(
    (f) => !f.uploadedBy || f.uploadedBy === 'anonymous' || f.uploadedBy === userId
  );
  const allFonts = [...defaultFonts, ...visibleCustomFonts];

  // Motion and Transition handlers
  const currentTransition = selectedClip?.transition || 'none';
  const currentMotion = selectedClip?.motion || {
    inAnimation: 'none',
    outAnimation: 'none',
    loopAnimation: 'none',
    duration: 0.6,
  };

  const handleSelectTransition = (trans: TransitionType) => {
    if (selectedClip) {
      onUpdateClipTransition(selectedClip.id, trans);
    }
  };

  const handleSelectMotion = (field: keyof MotionAnimation, value: any) => {
    if (selectedClip) {
      const updated = { ...currentMotion, [field]: value };
      onUpdateClipMotion(selectedClip.id, updated);
    }
  };

  return (
    <aside className="w-80 bg-app-surface border-l border-app-border flex flex-col shrink-0 select-none overflow-y-auto">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-app-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            คุณสมบัติ & เอฟเฟกต์ (Inspector)
          </span>
        </div>
      </div>

      <div className="p-4 space-y-5 text-xs text-slate-700 font-sans">
        {selectedClip ? (
          <div className="space-y-4">
            {/* Header Badge of Selected Item */}
            <div className={`border rounded p-2.5 ${
              selectedClip.type === 'text' 
                ? 'bg-purple-50 border-purple-200' 
                : 'bg-blue-50/70 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 truncate pr-2">
                  {selectedClip.textContent || selectedClip.name}
                </span>
                {selectedClip.type === 'text' && (
                  <button
                    onClick={() => onOpenTextEffectEditor(selectedClip)}
                    className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-medium transition flex items-center gap-1 shrink-0"
                  >
                    <Edit className="w-3 h-3" />
                    <span>แก้ไขข้อความ</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1">
                <span className="capitalize px-1.5 py-0.2 bg-white rounded border border-slate-200 font-sans">
                  {selectedClip.type}
                </span>
                <span>{selectedClip.duration.toFixed(1)}s (เริ่ม: {selectedClip.startTime.toFixed(1)}s)</span>
              </div>
            </div>

            {/* --- SECTION 1: Transitions Tool (Requirement 2) --- */}
            <div className="space-y-2.5 pt-1 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เอฟเฟกต์เปลี่ยนผ่าน (Transitions)</span>
                </label>
                {currentTransition !== 'none' && (
                  <span className="text-[10px] font-mono text-indigo-600 font-medium capitalize">
                    {currentTransition}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'none', label: 'ไม่มี (None)' },
                  { id: 'fade-in', label: 'ค่อยๆ ปรากฏ (Fade In)' },
                  { id: 'fade-out', label: 'ค่อยๆ ดับ (Fade Out)' },
                  { id: 'cross-dissolve', label: 'ละลายจาง (Dissolve)' },
                  { id: 'fade-black', label: 'มืดดับ (Fade Black)' },
                  { id: 'slide-left', label: 'เลื่อนซ้าย (Slide L)' },
                  { id: 'slide-right', label: 'เลื่อนขวา (Slide R)' },
                  { id: 'zoom-in', label: 'ซูมเข้า (Zoom In)' },
                  { id: 'wipe', label: 'ปัดรูด (Wipe)' },
                  { id: 'glitch', label: 'กลิตช์ (Glitch)' },
                  { id: 'blur', label: 'เบลอ (Blur)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTransition(t.id as TransitionType)}
                    className={`py-1 px-1.5 rounded text-center text-[10px] border transition ${
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

            {/* --- SECTION 2: Motion Animations Tool for Video, Image, and Text --- */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>แอนิเมชันภาพ & ข้อความ (Motion FX)</span>
                </label>
                <span className="text-[10px] font-mono text-amber-600 font-medium">
                  {currentMotion.duration}s
                </span>
              </div>

              {/* In Animation (เปิดตัว) */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3 text-emerald-600" />
                    <span>เปิดตัว (In Animation):</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'fade-in', label: 'Fade In' },
                    { id: 'slide-up', label: 'Slide Up' },
                    { id: 'slide-down', label: 'Slide Down' },
                    { id: 'slide-left', label: 'Slide Left' },
                    { id: 'slide-right', label: 'Slide Right' },
                    { id: 'pop-in', label: 'Pop In' },
                    { id: 'bounce-in', label: 'Bounce' },
                    { id: 'flip-in', label: 'Flip 3D' },
                    { id: 'typewriter', label: 'Typewriter' },
                    { id: 'spin-in', label: 'Spin In' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMotion('inAnimation', m.id)}
                      className={`py-1 px-1 rounded text-center text-[10px] border transition ${
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
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3 text-rose-600 rotate-180" />
                    <span>ปิดท้าย (Out Animation):</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'fade-out', label: 'Fade Out' },
                    { id: 'slide-down', label: 'Slide Down' },
                    { id: 'slide-up', label: 'Slide Up' },
                    { id: 'slide-left', label: 'Slide Left' },
                    { id: 'slide-right', label: 'Slide Right' },
                    { id: 'scale-out', label: 'Scale Out' },
                    { id: 'blur-out', label: 'Blur Out' },
                    { id: 'fade-black', label: 'Fade Black' },
                  ].map((o) => (
                    <button
                      key={o.id}
                      onClick={() => handleSelectMotion('outAnimation', o.id)}
                      className={`py-1 px-1 rounded text-center text-[10px] border transition ${
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

              {/* Loop / Ongoing Animation */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span className="flex items-center gap-1">
                    <RotateCw className="w-3 h-3 text-blue-600" />
                    <span>วนซ้ำต่อเนื่อง (Loop / Hover):</span>
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
                      className={`py-1 px-1 rounded text-center text-[10px] border transition ${
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

              {/* Animation Speed Slider */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>ความเร็วแอนิเมชัน (Duration)</span>
                  <span className="font-mono text-slate-800">{currentMotion.duration || 0.6}s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={currentMotion.duration || 0.6}
                  onChange={(e) => handleSelectMotion('duration', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            {/* --- SECTION 3: Text Specific Controls --- */}
            {selectedClip.type === 'text' && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">ข้อความ:</label>
                  <input
                    type="text"
                    value={selectedClip.textContent || selectedClip.name}
                    onChange={(e) => {
                      if (selectedClip.textEffect) {
                        onUpdateClipEffect(selectedClip.id, e.target.value, selectedClip.textEffect);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">ฟอนต์ (Font Family):</label>
                  <select
                    value={selectedClip.textEffect?.fontFamily || 'Prompt, sans-serif'}
                    onChange={(e) => {
                      const currentEff = selectedClip.textEffect || {
                        fontFamily: e.target.value,
                        fontSize: 28,
                        color: '#FFF',
                        bold: true,
                        italic: false,
                        align: 'center',
                        effectType: 'shadow',
                      };
                      onUpdateClipEffect(selectedClip.id, selectedClip.textContent || selectedClip.name, {
                        ...currentEff,
                        fontFamily: e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {allFonts.map((f, idx) => (
                      <option key={idx} value={f.family}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* --- SECTION 4: Video / Audio Quality Settings --- */}
            {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
                  <Video className="w-3.5 h-3.5 text-blue-600" />
                  <span>การตั้งค่าภาพ & สี (Visual Settings)</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>ความโปร่งใส (Opacity)</span>
                    <span className="font-mono text-slate-800">{videoSettings.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={videoSettings.opacity}
                    onChange={(e) => setVideoSettings(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>ความสว่าง</span>
                      <span className="font-mono">{videoSettings.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={videoSettings.brightness}
                      onChange={(e) => setVideoSettings(prev => ({ ...prev, brightness: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>ความต่างสี</span>
                      <span className="font-mono">{videoSettings.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={videoSettings.contrast}
                      onChange={(e) => setVideoSettings(prev => ({ ...prev, contrast: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Audio Settings */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>ระดับเสียง & Audio Bitrate</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>ระดับความดัง (Volume)</span>
                  <span className="font-mono text-slate-800">{audioSettings.volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={audioSettings.volume}
                  onChange={(e) => setAudioSettings(prev => ({ ...prev, volume: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 font-doc">
            <Info className="w-7 h-7 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs">คลิกเลือกคลิปบนไทม์ไลน์ หรือคลิกบนหน้าจอ Preview Video เพื่อเลือกใส่แอนิเมชัน</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-auto p-3 border-t border-app-border bg-slate-50 text-[11px] text-slate-500 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="truncate">Active Selection Synced</span>
      </div>
    </aside>
  );
};
