import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  ZoomIn
} from 'lucide-react';
import type { MediaAsset, ProjectSettings, TimelineClip } from '../types';
import { getTextEffectStyles } from '../utils/fontManager';

interface MediaCanvasProps {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  assets?: MediaAsset[];
  activeAsset: MediaAsset | null;
  activeTextClips: TimelineClip[];
  activeVideoClips?: TimelineClip[];
  selectedClipId: string | null;
  projectSettings: ProjectSettings;
  isPremium?: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSelectClip: (clipId: string | null) => void;
  onEditTextClip: (clip: TimelineClip) => void;
}

export const MediaCanvas: React.FC<MediaCanvasProps> = ({
  isPlaying,
  currentTime,
  totalDuration,
  assets = [],
  activeAsset,
  activeTextClips,
  activeVideoClips = [],
  selectedClipId,
  projectSettings,
  isPremium = false,
  onTogglePlay,
  onSeek,
  onSelectClip,
  onEditTextClip,
}) => {
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewScale, setPreviewScale] = useState(100);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activePrimaryVideoClip = activeVideoClips[0];
  const isVideoSelected = activePrimaryVideoClip && selectedClipId === activePrimaryVideoClip.id;

  // Resolve current active playing asset from timeline clip or direct asset selection
  const currentMediaAsset = useMemo(() => {
    if (activePrimaryVideoClip?.assetId) {
      const found = assets.find((a) => a.id === activePrimaryVideoClip.assetId);
      if (found) return found;
    }
    return activeAsset;
  }, [activePrimaryVideoClip, assets, activeAsset]);

  // Calculate video target time inside its clip
  const targetVideoTime = useMemo(() => {
    if (!currentMediaAsset) return 0;
    if (activePrimaryVideoClip) {
      const offset = currentTime - activePrimaryVideoClip.startTime;
      const dur = currentMediaAsset.duration || 10;
      return Math.max(0, dur > 0 ? offset % dur : offset);
    }
    return Math.max(0, currentTime % (currentMediaAsset.duration || 10));
  }, [activePrimaryVideoClip, currentMediaAsset, currentTime]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Set volume and muted state on video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Sync real video element playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      if (Math.abs(video.currentTime - targetVideoTime) > 0.3) {
        video.currentTime = targetVideoTime;
      }
      video.play().catch((err) => {
        console.warn('Video play was prevented:', err);
      });
    } else {
      video.pause();
      video.currentTime = targetVideoTime;
    }
  }, [isPlaying]);

  // Sync time when scrubbing or when paused (avoiding continuous seek on every frame during smooth playback)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isPlaying) {
      video.currentTime = targetVideoTime;
    } else {
      const drift = Math.abs(video.currentTime - targetVideoTime);
      if (drift > 0.45) {
        video.currentTime = targetVideoTime;
      }
    }
  }, [targetVideoTime, isPlaying]);

  const toggleCanvasFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (canvasContainerRef.current) {
          await canvasContainerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } else {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const formatTimecode = (seconds: number) => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const frames = Math.floor((s % 1) * projectSettings.fps);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  const getAspectRatioClasses = () => {
    switch (projectSettings.aspectRatio) {
      case '16:9':
        return 'aspect-video w-full max-w-3xl';
      case '9:16':
        return 'aspect-[9/16] h-full max-h-[380px]';
      case '1:1':
        return 'aspect-square h-full max-h-[380px]';
      case '4:3':
        return 'aspect-[4/3] w-full max-w-2xl';
      default:
        return 'aspect-video w-full max-w-3xl';
    }
  };

  // Time-Based Animation Evaluator (Checks In/Out phases based on clip duration & playback time)
  const getClipTimeBasedAnimation = (
    clip?: TimelineClip,
    time: number = currentTime
  ): {
    className: string;
    style?: React.CSSProperties;
    phase: 'in' | 'out' | 'loop' | 'idle';
  } => {
    if (!clip) return { className: '', phase: 'idle' };
    const motion = clip.motion;
    const transition = clip.transition;
    if (!motion && (!transition || transition === 'none')) {
      return { className: '', phase: 'idle' };
    }

    const clipStart = clip.startTime;
    const clipDuration = Math.max(0.2, clip.duration);
    const timeWithin = Math.max(0, Math.min(clipDuration, time - clipStart));

    // Calculate In & Out durations (proportional scale down if clip is short)
    const rawInDur = motion?.inDuration ?? motion?.duration ?? 0.8;
    const rawOutDur = motion?.outDuration ?? motion?.duration ?? 0.8;
    const inDur = Math.min(rawInDur, Math.max(0.1, clipDuration * 0.45));
    const outDur = Math.min(rawOutDur, Math.max(0.1, clipDuration * 0.45));

    const classes: string[] = [];

    // Phase 1: In-Animation (ช่วงต้นของเวลา / Opening Phase)
    if (timeWithin <= inDur) {
      const inType = motion?.inAnimation;
      if (inType && inType !== 'none') {
        if (inType === 'fade-in') classes.push('motion-fade-in');
        else if (inType === 'slide-up') classes.push('motion-slide-up');
        else if (inType === 'slide-down') classes.push('motion-slide-down');
        else if (inType === 'slide-left') classes.push('motion-slide-left');
        else if (inType === 'slide-right') classes.push('motion-slide-right');
        else if (inType === 'pop-in') classes.push('motion-pop-in');
        else if (inType === 'bounce-in') classes.push('animate-bounce');
        else if (inType === 'flip-in') classes.push('motion-flip-in');
        else if (inType === 'spin-in') classes.push('motion-spin-in');
        else if (inType === 'typewriter') classes.push('motion-slide-up');
      } else if (transition === 'fade-in' || transition === 'cross-dissolve') {
        classes.push('motion-fade-in');
      } else if (transition === 'slide-left') {
        classes.push('motion-slide-left');
      } else if (transition === 'slide-right') {
        classes.push('motion-slide-right');
      }

      return {
        className: classes.join(' '),
        style: { animationDuration: `${inDur}s` },
        phase: 'in',
      };
    }

    // Phase 2: Out-Animation (ช่วงท้ายของเวลา / Closing Phase)
    if (timeWithin >= (clipDuration - outDur)) {
      const outType = motion?.outAnimation;
      if (outType && outType !== 'none') {
        if (outType === 'fade-out' || outType === 'fade-black') classes.push('motion-fade-out');
        else if (outType === 'slide-down') classes.push('motion-slide-down');
        else if (outType === 'slide-up') classes.push('motion-slide-up');
        else if (outType === 'slide-left') classes.push('motion-slide-left');
        else if (outType === 'slide-right') classes.push('motion-slide-right');
        else if (outType === 'scale-out') classes.push('motion-scale-out');
        else if (outType === 'blur-out') classes.push('motion-blur-out');
      } else if (transition === 'fade-out' || transition === 'fade-black') {
        classes.push('motion-fade-out');
      }

      return {
        className: classes.join(' '),
        style: { animationDuration: `${outDur}s` },
        phase: 'out',
      };
    }

    // Phase 3: Main Steady State / Loop Animation (ช่วงกลาง)
    const loopType = motion?.loopAnimation;
    if (loopType && loopType !== 'none') {
      if (loopType === 'pulse') classes.push('animate-pulse');
      else if (loopType === 'floating') classes.push('motion-floating');
      else if (loopType === 'shake') classes.push('motion-shake');
      else if (loopType === 'glow-wave') classes.push('motion-glow-wave');
      return { className: classes.join(' '), phase: 'loop' };
    }

    return { className: '', phase: 'idle' };
  };

  const primaryVideoAnim = getClipTimeBasedAnimation(activePrimaryVideoClip, currentTime);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-100/70 p-4 select-none">
      {/* Top Canvas Bar */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">พื้นที่แสดงผลสื่อ (Media Canvas)</span>
          <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded font-mono text-[11px]">
            {projectSettings.aspectRatio} • {projectSettings.resolution}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-doc">ขนาดพรีวิว:</span>
          <span className="px-2 py-0.5 bg-white border border-slate-200 text-blue-600 rounded font-mono text-[11px] font-semibold">
            {previewScale}%
          </span>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div 
        ref={canvasContainerRef}
        onClick={() => onSelectClip(null)}
        className={`flex-1 min-h-0 bg-slate-200/90 rounded border border-app-border flex items-center justify-center relative overflow-hidden shadow-inner p-4 group/viewport ${
          isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''
        }`}
      >
        {/* Fullscreen Exit Button */}
        {isFullscreen && (
          <button
            onClick={toggleCanvasFullscreen}
            className="absolute top-4 right-4 z-30 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition border border-white/30"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>ปิดการแสดงผลเต็มหน้าจอ (Esc)</span>
          </button>
        )}

        {/* Virtual Monitor / Canvas Screen */}
        <div 
          style={{ transform: `scale(${previewScale / 100})` }}
          className={`${getAspectRatioClasses()} bg-slate-900 rounded-sm shadow-2xl relative flex items-center justify-center overflow-hidden border border-slate-700 transition-transform duration-100 group/canvas`}
        >
          {/* Real Media Rendering Background with Selection Frame (Requirement 3) */}
          <div 
            onClick={(e) => {
              if (activePrimaryVideoClip) {
                e.stopPropagation();
                onSelectClip(activePrimaryVideoClip.id);
              }
            }}
            className={`absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer transition-all ${
              isVideoSelected ? 'ring-2 ring-blue-500 ring-inset' : ''
            }`}
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

            {/* Video playback with real-time time-based in/out motion & transitions */}
            {currentMediaAsset?.type === 'video' && currentMediaAsset.blobUrl ? (
              <video
                ref={videoRef}
                key={currentMediaAsset.id}
                src={currentMediaAsset.blobUrl}
                muted={isMuted}
                playsInline
                preload="auto"
                style={primaryVideoAnim.style}
                className={`w-full h-full object-contain ${primaryVideoAnim.className}`}
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  video.currentTime = targetVideoTime;
                  if (isPlaying) {
                    video.play().catch(() => {});
                  }
                }}
              />
            ) : currentMediaAsset?.type === 'image' && currentMediaAsset.blobUrl ? (
              <img
                key={currentMediaAsset.id}
                src={currentMediaAsset.blobUrl}
                alt={currentMediaAsset.name}
                style={primaryVideoAnim.style}
                className={`w-full h-full object-contain ${primaryVideoAnim.className}`}
              />
            ) : currentMediaAsset ? (
              <div className="text-center p-6 z-10 space-y-3">
                <div className="inline-flex p-3 rounded-md bg-white/10 backdrop-blur-md border border-white/20 text-blue-400">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <div className="text-white font-medium text-sm drop-shadow">{currentMediaAsset.name}</div>
                <div className="text-slate-400 text-xs font-mono">
                  Time: {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-slate-500 text-center">
                <FilmIconFallback />
                <p className="text-xs font-medium text-slate-400">เลือกไฟล์จากคลังสื่อหรือไทม์ไลน์เพื่อเล่นตัวอย่าง</p>
              </div>
            )}

            {/* Active Selection Badge on Canvas */}
            {isVideoSelected && (
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-sans font-medium rounded shadow flex items-center gap-1 z-30 pointer-events-none animate-in fade-in">
                <span>เลือกวิดีโออยู่ {primaryVideoAnim.phase !== 'idle' ? `(${primaryVideoAnim.phase.toUpperCase()})` : ''}</span>
              </div>
            )}

            {/* Render Active Text Clips on Top with Time-Based In/Out Motion Animation */}
            {activeTextClips.map((clip) => {
              const effectStyle = clip.textEffect 
                ? getTextEffectStyles(clip.textEffect) 
                : { color: '#FFF', fontSize: '28px', fontWeight: 'bold' };

              const isTextSelected = selectedClipId === clip.id;
              const textAnim = getClipTimeBasedAnimation(clip, currentTime);

              return (
                <div 
                  key={clip.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectClip(clip.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onEditTextClip(clip);
                  }}
                  title="คลิกเพื่อเลือก • ดับเบิลคลิกเพื่อแก้ไขข้อความ & Effect"
                  className={`absolute bottom-8 left-6 right-6 text-center cursor-pointer group/text transition-all ${
                    isTextSelected ? 'ring-2 ring-purple-500 p-2 rounded-sm bg-purple-950/20' : ''
                  }`}
                >
                  <span 
                    style={{ ...effectStyle, ...textAnim.style }}
                    className={`inline-block relative transition transform group-hover/text:scale-105 ${textAnim.className}`}
                  >
                    {clip.textContent || clip.name}
                    
                    {/* Hover Hint */}
                    <span className="opacity-0 group-hover/text:opacity-100 absolute -top-6 right-0 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                      ดับเบิลคลิกเพื่อแก้ไข
                    </span>
                  </span>

                  {isTextSelected && (
                    <div className="absolute -top-3 left-0 bg-purple-600 text-white text-[9px] px-1.5 py-0.2 rounded font-sans font-medium">
                      เลือกข้อความอยู่
                    </div>
                  )}
                </div>
              );
            })}

            {/* Central Play/Pause Watermark with Mouse Hover Fade-in Detection */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              {isPlaying ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
                  title="หยุดชั่วคราว (Pause - Space)"
                  className="pointer-events-auto w-14 h-14 bg-black/50 hover:bg-black/80 backdrop-blur-xs text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover/canvas:opacity-90 hover:opacity-100 border border-white/30 transform hover:scale-110 shadow-2xl"
                >
                  <Pause className="w-6 h-6 fill-white" />
                </button>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
                  title="เล่น (Play - Space)"
                  className="pointer-events-auto w-14 h-14 bg-black/50 hover:bg-black/80 backdrop-blur-xs text-white rounded-full flex items-center justify-center transition-all opacity-90 hover:opacity-100 border border-white/30 transform hover:scale-110 shadow-2xl"
                >
                  <Play className="w-6 h-6 ml-1 fill-white" />
                </button>
              )}
            </div>
          </div>

          {/* Timecode Badge on Canvas */}
          <div className="absolute top-2.5 right-2.5 px-2 py-1 bg-black/60 backdrop-blur-md text-emerald-400 font-mono text-[11px] rounded border border-white/10 select-none z-10">
            {formatTimecode(currentTime)}
          </div>

          {/* Watermark "MWA" for Normal Users (Bottom Right) */}
          {!isPremium && (
            <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/40 backdrop-blur-xs text-white/80 font-black font-sans text-sm tracking-wider rounded border border-white/20 select-none pointer-events-none z-10 drop-shadow-md">
              MWA
            </div>
          )}
        </div>
      </div>

      {/* Player Controls Bar */}
      <div className="mt-3 bg-app-surface border border-app-border rounded p-2.5 flex items-center justify-between gap-4 shadow-xs">
        {/* Left: Playback buttons */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => onSeek(0)}
            title="กลับไปจุดเริ่มต้น" 
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onSeek(Math.max(0, currentTime - 1))}
            title="ย้อนหลัง 1 วินาที (Left Arrow)" 
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded flex items-center justify-center transition shadow-xs"
            title={isPlaying ? 'หยุดชั่วคราว (Space)' : 'เล่น (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
          </button>

          <button 
            onClick={() => onSeek(Math.min(totalDuration, currentTime + 1))}
            title="เดินหน้า 1 วินาที (Right Arrow)" 
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Timecode readout */}
        <div className="flex items-center gap-2 font-mono text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
          <span className="font-semibold text-blue-600">{formatTimecode(currentTime)}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-500">{formatTimecode(totalDuration)}</span>
        </div>

        {/* Right: Scale Trackbar & Volume & Fullscreen */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" title="ปรับย่อ/ขยายขนาดจอแสดงผลพรีวิว">
            <ZoomIn className="w-4 h-4 text-slate-500" />
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={previewScale}
              onChange={(e) => setPreviewScale(Number(e.target.value))}
              className="w-18 sm:w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[10px] font-mono text-slate-600 w-8">{previewScale}%</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200"></div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 text-slate-600 hover:text-slate-900 transition"
              title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-16 sm:w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="h-4 w-[1px] bg-slate-200"></div>

          <button
            onClick={toggleCanvasFullscreen}
            title={isFullscreen ? 'ปิดการแสดงผลเต็มหน้าจอ' : 'แสดงผลเต็มหน้าจอเฉพาะหน้าพรีวิว'}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-600" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const FilmIconFallback = () => (
  <svg className="w-10 h-10 mx-auto text-slate-500 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <rect width="18" height="18" x="3" y="3" rx="2" strokeWidth="1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4" />
  </svg>
);
