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
import type { MediaAsset, ProjectSettings, TimelineClip, ClipTransform } from '../types';
import { getTextEffectStyles } from '../utils/fontManager';

interface MediaCanvasProps {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  assets?: MediaAsset[];
  activeAsset: MediaAsset | null;
  activeTextClips: TimelineClip[];
  activeVideoClips?: TimelineClip[];
  activeElementClips?: TimelineClip[];
  selectedClipId: string | null;
  projectSettings: ProjectSettings;
  isPremium?: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSelectClip: (clipId: string | null) => void;
  onEditTextClip: (clip: TimelineClip) => void;
  onUpdateClipTransform?: (clipId: string, transform: ClipTransform) => void;
}

export const MediaCanvas: React.FC<MediaCanvasProps> = ({
  isPlaying,
  currentTime,
  totalDuration,
  assets = [],
  activeAsset,
  activeTextClips,
  activeVideoClips = [],
  activeElementClips = [],
  selectedClipId,
  projectSettings,
  isPremium = false,
  onTogglePlay,
  onSeek,
  onSelectClip,
  onEditTextClip,
  onUpdateClipTransform,
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

  // Audio Context & Gain Node for up to 4x (400%) live audio amplification
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Set volume and boosted gain state on video element (up to 4x / 400%)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const clipVolBoost = (activePrimaryVideoClip?.audioSettings?.volume ?? 100) / 100; // e.g. 0.0 to 4.0
    const masterVol = isMuted ? 0 : volume / 100; // 0.0 to 1.0
    const totalGain = clipVolBoost * masterVol;

    try {
      if (!audioCtxRef.current && totalGain > 1.0) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const gainNode = ctx.createGain();
          const source = ctx.createMediaElementSource(video);
          source.connect(gainNode);
          gainNode.connect(ctx.destination);

          audioCtxRef.current = ctx;
          gainNodeRef.current = gainNode;
          sourceNodeRef.current = source;
        }
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = totalGain;
        video.volume = 1.0;
        video.muted = isMuted;
      } else {
        video.volume = Math.min(1.0, totalGain);
        video.muted = isMuted;
      }
    } catch {
      video.volume = Math.min(1.0, totalGain);
      video.muted = isMuted;
    }
  }, [volume, isMuted, activePrimaryVideoClip?.audioSettings?.volume]);

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

  const handleResetTransform = (e: React.MouseEvent, clip: TimelineClip) => {
    e.stopPropagation();
    if (onUpdateClipTransform) {
      onUpdateClipTransform(clip.id, { scale: 1.0, x: 0, y: 0 });
    }
  };

  const handleTransformStart = (
    e: React.MouseEvent,
    clip: TimelineClip,
    handleType: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move'
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialTransform = clip.transform || { scale: 1.0, x: 0, y: 0 };
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2 + initialTransform.x;
    const centerY = rect.top + rect.height / 2 + initialTransform.y;
    
    // Canvas viewport dimensions
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;
    const canvasCenterX = rect.left + rect.width / 2;
    const canvasCenterY = rect.top + rect.height / 2;

    // Dynamically calculate base dimensions (Full viewport for Video/Image, 176px for Elements)
    const isFullCanvasMedia = clip.type === 'video' || clip.type === 'image';
    const baseW = isFullCanvasMedia ? viewportWidth : 176;
    const baseH = isFullCanvasMedia ? viewportHeight : 176;

    // Half width & height of the bounding box at current initial scale
    const hw0 = (baseW * initialTransform.scale) / 2;
    const hh0 = (baseH * initialTransform.scale) / 2;

    // Requirement 1 & 2: Fixed Opposite Anchor Point in screen client coordinates
    // For Top-Left (NW) -> Bottom-Right (SE) is locked!
    // For Bottom-Right (SE) -> Top-Left (NW) is locked!
    let anchorScreenX = centerX;
    let anchorScreenY = centerY;

    if (handleType === 'nw') {
      anchorScreenX = centerX + hw0;
      anchorScreenY = centerY + hh0;
    } else if (handleType === 'ne') {
      anchorScreenX = centerX - hw0;
      anchorScreenY = centerY + hh0;
    } else if (handleType === 'se') {
      anchorScreenX = centerX - hw0;
      anchorScreenY = centerY - hh0;
    } else if (handleType === 'sw') {
      anchorScreenX = centerX + hw0;
      anchorScreenY = centerY - hh0;
    } else if (handleType === 'n') {
      anchorScreenX = centerX;
      anchorScreenY = centerY + hh0;
    } else if (handleType === 's') {
      anchorScreenX = centerX;
      anchorScreenY = centerY - hh0;
    } else if (handleType === 'w') {
      anchorScreenX = centerX + hw0;
      anchorScreenY = centerY;
    } else if (handleType === 'e') {
      anchorScreenX = centerX - hw0;
      anchorScreenY = centerY;
    }

    const initialDiagDist = Math.max(20, Math.hypot(startX - anchorScreenX, startY - anchorScreenY));

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      if (handleType === 'move') {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let rawX = initialTransform.x + deltaX;
        let rawY = initialTransform.y + deltaY;

        // Requirement 1: Canvas Boundary Locking on Move / Drag (Media stays within canvas)
        const limitX = Math.max(20, viewportWidth * 0.45);
        const limitY = Math.max(20, viewportHeight * 0.45);

        const clampedX = Math.max(-limitX, Math.min(limitX, rawX));
        const clampedY = Math.max(-limitY, Math.min(limitY, rawY));

        const newTransform: ClipTransform = {
          ...initialTransform,
          x: Math.round(clampedX),
          y: Math.round(clampedY),
        };
        if (onUpdateClipTransform) {
          onUpdateClipTransform(clip.id, newTransform);
        }
      } else {
        // Requirement 2: Anchor-Locked Scaling (Opposite anchor point stays 100% stationary)
        const currentDiagDist = Math.hypot(moveEvent.clientX - anchorScreenX, moveEvent.clientY - anchorScreenY);
        const scaleFactor = Math.max(0.1, currentDiagDist / initialDiagDist);

        let newScale = parseFloat((initialTransform.scale * scaleFactor).toFixed(2));
        newScale = Math.max(0.15, Math.min(4.0, newScale));

        const newHw = (baseW * newScale) / 2;
        const newHh = (baseH * newScale) / 2;

        let newCenterScreenX = centerX;
        let newCenterScreenY = centerY;

        // Reposition center strictly relative to the fixed opposite anchor point
        if (handleType === 'nw') {
          newCenterScreenX = anchorScreenX - newHw;
          newCenterScreenY = anchorScreenY - newHh;
        } else if (handleType === 'ne') {
          newCenterScreenX = anchorScreenX + newHw;
          newCenterScreenY = anchorScreenY - newHh;
        } else if (handleType === 'se') {
          newCenterScreenX = anchorScreenX + newHw;
          newCenterScreenY = anchorScreenY + newHh;
        } else if (handleType === 'sw') {
          newCenterScreenX = anchorScreenX - newHw;
          newCenterScreenY = anchorScreenY + newHh;
        } else if (handleType === 'n') {
          newCenterScreenX = anchorScreenX;
          newCenterScreenY = anchorScreenY - newHh;
        } else if (handleType === 's') {
          newCenterScreenX = anchorScreenX;
          newCenterScreenY = anchorScreenY + newHh;
        } else if (handleType === 'w') {
          newCenterScreenX = anchorScreenX - newHw;
          newCenterScreenY = anchorScreenY;
        } else if (handleType === 'e') {
          newCenterScreenX = anchorScreenX + newHw;
          newCenterScreenY = anchorScreenY;
        }

        const newX = Math.round(newCenterScreenX - canvasCenterX);
        const newY = Math.round(newCenterScreenY - canvasCenterY);

        const newTransform: ClipTransform = {
          scale: newScale,
          x: newX,
          y: newY,
        };
        if (onUpdateClipTransform) {
          onUpdateClipTransform(clip.id, newTransform);
        }
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const primaryVideoAnim = getClipTimeBasedAnimation(activePrimaryVideoClip, currentTime);

  const renderElementContent = (clip: TimelineClip) => {
    const cfg = clip.elementConfig;
    if (!cfg) return null;

    if (cfg.type === 'shape' && cfg.shape) {
      const s = cfg.shape;
      return (
        <svg className="w-full h-full drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none">
          {s.shapeType === 'rectangle' && (
            <rect x="5" y="5" width="90" height="90" rx={s.cornerRadius || 0} fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'rounded-rect' && (
            <rect x="5" y="5" width="90" height="90" rx={s.cornerRadius || 16} fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'circle' && (
            <circle cx="50" cy="50" r="45" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'ellipse' && (
            <ellipse cx="50" cy="50" rx="45" ry="30" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'triangle' && (
            <polygon points="50,5 95,95 5,95" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'triangle-right' && (
            <polygon points="5,5 95,50 5,95" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'star-5' && (
            <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'star-6' && (
            <polygon points="50,2 62,28 92,20 74,45 92,70 62,62 50,88 38,62 8,70 26,45 8,20 38,28" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'heart' && (
            <path d="M50 88 C20 60 5 40 5 25 A 20 20 0 0 1 45 15 L 50 20 L 55 15 A 20 20 0 0 1 95 25 C 95 40 80 60 50 88 Z" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'diamond' && (
            <polygon points="50,5 95,50 50,95 5,50" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'pentagon' && (
            <polygon points="50,5 95,38 78,95 22,95 5,38" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'hexagon' && (
            <polygon points="25,5 75,5 95,50 75,95 25,95 5,50" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'octagon' && (
            <polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'arrow-right' && (
            <polygon points="5,35 60,35 60,15 95,50 60,85 60,65 5,65" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'arrow-left' && (
            <polygon points="95,35 40,35 40,15 5,50 40,85 40,65 95,65" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'arrow-up' && (
            <polygon points="35,95 35,40 15,40 50,5 85,40 65,40 65,95" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'arrow-down' && (
            <polygon points="35,5 35,60 15,60 50,95 85,60 65,60 65,5" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'speech-bubble' && (
            <path d="M10,15 Q10,10 15,10 L85,10 Q90,10 90,15 L90,65 Q90,70 85,70 L35,70 L20,88 L25,70 L15,70 Q10,70 10,65 Z" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'cross' && (
            <polygon points="35,5 65,5 65,35 95,35 95,65 65,65 65,95 35,95 35,65 5,65 5,35 35,35" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'ring' && (
            <path d="M50 5 A45 45 0 1 0 50 95 A45 45 0 1 0 50 5 M50 25 A25 25 0 1 1 50 75 A25 25 0 1 1 50 25" fill={s.fillColor} opacity={s.opacity || 1} fillRule="evenodd" />
          )}
          {s.shapeType === 'trapezoid' && (
            <polygon points="20,10 80,10 95,90 5,90" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
          {s.shapeType === 'parallelogram' && (
            <polygon points="25,10 95,10 75,90 5,90" fill={s.fillColor} stroke={s.strokeColor} strokeWidth={s.strokeWidth || 0} opacity={s.opacity || 1} />
          )}
        </svg>
      );
    }

    if (cfg.type === 'frame' && cfg.frame) {
      const f = cfg.frame;
      const getMaskStyle = (): React.CSSProperties => {
        if (f.frameShape === 'circle') return { borderRadius: '50%', overflow: 'hidden' };
        if (f.frameShape === 'squircle') return { borderRadius: '24%', overflow: 'hidden' };
        if (f.frameShape === 'triangle') return { clipPath: 'polygon(50% 5%, 95% 95%, 5% 95%)' };
        if (f.frameShape === 'star') return { clipPath: 'polygon(50% 5%, 64% 36%, 98% 36%, 70% 57%, 81% 91%, 50% 70%, 19% 91%, 30% 57%, 2% 36%, 36% 36%)' };
        if (f.frameShape === 'heart') return { clipPath: 'path("M 50,85 C 20,55 5,35 5,20 A 20,20 0 0 1 45,15 L 50,20 L 55,15 A 20,20 0 0 1 95,20 C 95,35 80,55 50,85 Z")' };
        if (f.frameShape === 'hexagon') return { clipPath: 'polygon(25% 5%, 75% 5%, 95% 50%, 75% 95%, 25% 95%, 5% 50%)' };
        if (f.frameShape === 'diamond') return { clipPath: 'polygon(50% 5%, 95% 50%, 50% 95%, 5% 50%)' };
        return { borderRadius: '8px', overflow: 'hidden' };
      };

      return (
        <div style={getMaskStyle()} className="w-full h-full bg-slate-800 border-2 border-cyan-400/40 relative flex items-center justify-center shadow-lg">
          {f.mediaUrl ? (
            <img src={f.mediaUrl} alt="Frame Media" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-3 text-cyan-300 space-y-1">
              <Sparkles className="w-6 h-6 mx-auto animate-pulse" />
              <span className="text-[10px] block font-sans">ลากรูปภาพมาวางในเฟรม</span>
            </div>
          )}
        </div>
      );
    }

    if (cfg.type === 'chart' && cfg.chart) {
      const c = cfg.chart;
      const maxVal = Math.max(...c.data.map(d => d.value), 1);
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];

      return (
        <div className="w-full h-full bg-slate-900/95 border border-slate-700 rounded-md p-3 text-white flex flex-col justify-between shadow-2xl backdrop-blur-md">
          {c.title && <div className="text-xs font-bold text-slate-200 border-b border-slate-700 pb-1">{c.title}</div>}
          
          <div className="flex-1 flex items-end justify-around gap-2 py-2 min-h-0">
            {c.data.map((dp, i) => {
              const hPct = Math.round((dp.value / maxVal) * 80);
              const color = dp.color || colors[i % colors.length];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[9px] font-mono text-slate-300">{dp.value}</span>
                  <div 
                    style={{ height: `${hPct}%`, backgroundColor: color }} 
                    className="w-full max-w-[28px] rounded-t-xs transition-all shadow-sm"
                  />
                  <span className="text-[8px] font-sans text-slate-400 truncate w-full text-center">{dp.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if ((cfg.type === 'sheet' && cfg.sheet) || (cfg.type === 'table' && cfg.table)) {
      const t = cfg.sheet || cfg.table;
      if (!t) return null;
      return (
        <div className="w-full h-full bg-slate-900/95 border border-slate-700 rounded-md overflow-hidden text-xs shadow-2xl backdrop-blur-md flex flex-col">
          {t.title && <div className="bg-slate-800 px-3 py-1 font-bold text-slate-200 text-[11px] border-b border-slate-700">{t.title}</div>}
          <div className="overflow-x-auto flex-1 p-1">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-blue-900/40 text-blue-200 border-b border-blue-700/50">
                  {t.headers.map((h, i) => (
                    <th key={i} className="px-2 py-1 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-slate-800 hover:bg-slate-800/50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-2 py-1 text-slate-300 font-mono">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

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
          {/* Real Media Rendering Background */}
          <div 
            onClick={(e) => {
              if (activePrimaryVideoClip) {
                e.stopPropagation();
                onSelectClip(activePrimaryVideoClip.id);
              }
            }}
            className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer"
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

            {/* Media Container with Symmetrical Scaling & Position Transform */}
            <div
              style={{
                transform: `translate(${activePrimaryVideoClip?.transform?.x || 0}px, ${activePrimaryVideoClip?.transform?.y || 0}px) scale(${activePrimaryVideoClip?.transform?.scale || 1})`,
                transformOrigin: 'center center',
              }}
              className="w-full h-full relative flex items-center justify-center transition-transform duration-75"
            >
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

              {/* Selection Bounding Box with 8 Symmetrical Transform Handles */}
              {isVideoSelected && activePrimaryVideoClip && (
                <>
                  {/* Central Play/Pause button: Render ONLY on selected Video media item */}
                  {currentMediaAsset?.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                      {isPlaying ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
                          title="หยุดชั่วคราว (Pause - Space)"
                          className="pointer-events-auto w-12 h-12 bg-black/60 hover:bg-black/85 backdrop-blur-xs text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover/canvas:opacity-90 hover:opacity-100 border border-white/30 transform hover:scale-110 shadow-2xl"
                        >
                          <Pause className="w-5 h-5 fill-white" />
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
                          title="เล่นวิดีโอ (Play - Space)"
                          className="pointer-events-auto w-12 h-12 bg-black/60 hover:bg-black/85 backdrop-blur-xs text-white rounded-full flex items-center justify-center transition-all opacity-90 hover:opacity-100 border border-white/30 transform hover:scale-110 shadow-2xl"
                        >
                          <Play className="w-5 h-5 ml-0.5 fill-white" />
                        </button>
                      )}
                    </div>
                  )}

                  <div 
                    onMouseDown={(e) => handleTransformStart(e, activePrimaryVideoClip, 'move')}
                    title="คลิกค้างเพื่อเลื่อนตำแหน่งสื่อ • ลากหมากทั้ง 8 จุดเพื่อยืดขยายแบบสมมาตร"
                  className="absolute inset-0 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] pointer-events-auto cursor-move z-30 group/box"
                >
                  {/* Top-Left Corner Handle (NW) */}
                  <div
                    onMouseDown={(e) => handleTransformStart(e, activePrimaryVideoClip, 'nw')}
                    title="ลากเพื่อยืด/ขยายขนาดแบบสมมาตร (NW)"
                    className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-cyan-500 rounded-xs shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                  />

                  {/* Top-Center Edge Handle (N) */}
                  <div
                    onMouseDown={(e) => handleTransformStart(e, activePrimaryVideoClip, 'n')}
                    title="ลากเพื่อยืด/ขยายขนาดแบบสมมาตร (Top)"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-cyan-500 rounded-xs shadow-md cursor-ns-resize hover:scale-125 transition-transform"
                  />

                  {/* Top-Right Corner Handle (NE) */}
                  <div
                    onMouseDown={(e) => handleTransformStart(e, activePrimaryVideoClip, 'ne')}
                    title="ลากเพื่อยืด/ขยายขนาดแบบสมมาตร (NE)"
                    className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-cyan-500 rounded-xs shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                  />

                  {/* Right-Center Edge Handle (E) */}
                  <div
                    onMouseDown={(e) => handleTransformStart(e, activePrimaryVideoClip, 'e')}
                    title="ลากเพื่อยืด/ขยายขนาดแบบสมมาตร (Right)"
                    className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 bg-white border-2 border-cyan-500 rounded-xs shadow-md cursor-ew-resize hover:scale-125 transition-transform"
                  />

                  {/* Bottom-Right Corner Handle (SE) */}
                  <div
                    onMouseDown={(e) => handleTransformStart(e, activePrimaryVideoClip, 'se')}
                    title="ลากเพื่อยืด/ขยายขนาดแบบสมมาตร (SE)"
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-cyan-500 rounded-xs shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                  />

                  {/* Bottom-Center Edge Handle (S) */}
                  <div
                    onMouseDown={(e) => handleTransformStart(e, activePrimaryVideoClip, 's')}
                    title="ลากเพื่อยืด/ขยายขนาดแบบสมมาตร (Bottom)"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-cyan-500 rounded-xs shadow-md cursor-ns-resize hover:scale-125 transition-transform"
                  />

                  {/* Bottom-Left Corner Handle (SW) */}
                  <div
                    onMouseDown={(e) => handleTransformStart(e, activePrimaryVideoClip, 'sw')}
                    title="ลากเพื่อยืด/ขยายขนาดแบบสมมาตร (SW)"
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-cyan-500 rounded-xs shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                  />

                  {/* Left-Center Edge Handle (W) */}
                  <div
                    onMouseDown={(e) => handleTransformStart(e, activePrimaryVideoClip, 'w')}
                    title="ลากเพื่อยืด/ขยายขนาดแบบสมมาตร (Left)"
                    className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 bg-white border-2 border-cyan-500 rounded-xs shadow-md cursor-ew-resize hover:scale-125 transition-transform"
                  />

                  {/* Center Floating Scale Info & 1-Click Reset Control */}
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-slate-950/90 text-cyan-300 font-mono text-[11px] font-bold rounded-full border border-cyan-500/50 shadow-xl flex items-center gap-2 pointer-events-auto"
                  >
                    <span>{Math.round((activePrimaryVideoClip.transform?.scale || 1.0) * 100)}%</span>
                    <button
                      onClick={(e) => handleResetTransform(e, activePrimaryVideoClip)}
                      title="รีเซ็ตขนาดและตำแหน่งกลับสู่ค่าเริ่มต้น (100% Center)"
                      className="text-slate-400 hover:text-white hover:bg-slate-800 p-0.5 rounded transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </>
            )}
            </div>

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

              {/* Render Active Element Clips (Shape, Frame, Chart, Sheet, Table) with 8-Handle Symmetrical Scaling */}
              {activeElementClips.map((clip) => {
                const isElementSelected = selectedClipId === clip.id;
                const scale = clip.transform?.scale || 1.0;
                const posX = clip.transform?.x || 0;
                const posY = clip.transform?.y || 0;

                return (
                  <div
                    key={clip.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClip(clip.id);
                    }}
                    style={{
                      transform: `translate(${posX}px, ${posY}px) scale(${scale})`,
                      transformOrigin: 'center center',
                    }}
                    className="absolute w-44 h-44 cursor-pointer flex items-center justify-center select-none z-20 group/element"
                  >
                    {/* Element Inner Graphic */}
                    <div className="w-full h-full relative flex items-center justify-center">
                      {renderElementContent(clip)}
                    </div>

                    {/* 8-Handle Symmetrical Transform Bounding Box for Elements */}
                    {isElementSelected && (
                      <div 
                        onMouseDown={(e) => handleTransformStart(e, clip, 'move')}
                        title="คลิกค้างเพื่อเลื่อนตำแหน่ง • ลากหมากทั้ง 8 จุดเพื่อยืดขยาย"
                        className="absolute -inset-1 border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] pointer-events-auto cursor-move z-30"
                      >
                        {/* Top-Left Handle (NW) */}
                        <div
                          onMouseDown={(e) => handleTransformStart(e, clip, 'nw')}
                          title="ลากเพื่อยืด/ขยาย (NW)"
                          className="absolute -top-2 -left-2 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                        />
                        {/* Top-Center Handle (N) */}
                        <div
                          onMouseDown={(e) => handleTransformStart(e, clip, 'n')}
                          title="ลากเพื่อยืด/ขยาย (Top)"
                          className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-ns-resize hover:scale-125 transition-transform"
                        />
                        {/* Top-Right Handle (NE) */}
                        <div
                          onMouseDown={(e) => handleTransformStart(e, clip, 'ne')}
                          title="ลากเพื่อยืด/ขยาย (NE)"
                          className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                        />
                        {/* Right-Center Handle (E) */}
                        <div
                          onMouseDown={(e) => handleTransformStart(e, clip, 'e')}
                          title="ลากเพื่อยืด/ขยาย (Right)"
                          className="absolute top-1/2 -translate-y-1/2 -right-2 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-ew-resize hover:scale-125 transition-transform"
                        />
                        {/* Bottom-Right Handle (SE) */}
                        <div
                          onMouseDown={(e) => handleTransformStart(e, clip, 'se')}
                          title="ลากเพื่อยืด/ขยาย (SE)"
                          className="absolute -bottom-2 -right-2 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                        />
                        {/* Bottom-Center Handle (S) */}
                        <div
                          onMouseDown={(e) => handleTransformStart(e, clip, 's')}
                          title="ลากเพื่อยืด/ขยาย (Bottom)"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-ns-resize hover:scale-125 transition-transform"
                        />
                        {/* Bottom-Left Handle (SW) */}
                        <div
                          onMouseDown={(e) => handleTransformStart(e, clip, 'sw')}
                          title="ลากเพื่อยืด/ขยาย (SW)"
                          className="absolute -bottom-2 -left-2 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                        />
                        {/* Left-Center Handle (W) */}
                        <div
                          onMouseDown={(e) => handleTransformStart(e, clip, 'w')}
                          title="ลากเพื่อยืด/ขยาย (Left)"
                          className="absolute top-1/2 -translate-y-1/2 -left-2 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-ew-resize hover:scale-125 transition-transform"
                        />

                        {/* Floating Scale Badge & 1-Click Reset */}
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.2 bg-slate-950/90 text-amber-300 font-mono text-[10px] rounded-full border border-amber-500/50 shadow flex items-center gap-1.5 pointer-events-auto"
                        >
                          <span>{Math.round(scale * 100)}%</span>
                          <button
                            onClick={(e) => handleResetTransform(e, clip)}
                            title="รีเซ็ตขนาดและตำแหน่งกลับสู่ค่าเริ่มต้น"
                            className="text-slate-400 hover:text-white hover:bg-slate-800 p-0.5 rounded transition"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
