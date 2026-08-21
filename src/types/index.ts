export type MediaType = 'video' | 'audio' | 'image' | 'text';

export type TransitionType = 
  | 'none' 
  | 'cross-dissolve' 
  | 'fade-black' 
  | 'slide-left' 
  | 'slide-right' 
  | 'zoom-in' 
  | 'wipe' 
  | 'glitch' 
  | 'blur';

export interface MotionAnimation {
  inAnimation?: 'none' | 'fade-in' | 'slide-up' | 'pop-in' | 'bounce-in' | 'flip-in' | 'typewriter' | 'spin-in';
  outAnimation?: 'none' | 'fade-out' | 'slide-down' | 'scale-out' | 'blur-out';
  loopAnimation?: 'none' | 'pulse' | 'floating' | 'shake' | 'glow-wave';
  duration?: number; // in seconds, default 0.6s
}

export type UserRole = 'admin' | 'editor';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  password?: string;
  createdAt: number;
}

export interface UserSession {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
  role: UserRole;
  provider: 'local' | 'google' | 'firebase';
}

export interface DonationConfig {
  promptPayNumber: string; // 064-3026465
  promptPayName: string;
  // Stripe Advanced Settings
  stripeUrl: string;
  stripePublishableKey?: string;
  stripeCurrency: 'THB' | 'USD' | 'EUR';
  stripeCustomAmountAllowed: boolean;
  // Buy Me a Coffee Advanced Settings
  buyMeACoffeeUsername: string;
  buyMeACoffeeUrl: string;
  buyMeACoffeeMessage?: string;
  buyMeACoffeeDefaultCoffeePrice?: number;
  isEnabled: boolean;
}

export interface InquiryTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  subject: string;
  category: 'bug' | 'feature' | 'support' | 'other';
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  adminReply?: string;
  createdAt: number;
  repliedAt?: number;
}

export interface WebboardComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: number;
}

export interface WebboardPost {
  id: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  title: string;
  content: string;
  category: 'editing-tips' | 'qa' | 'feature-updates' | 'general';
  tags: string[];
  images?: string[]; // Up to 5 attached images
  coverImageIndex?: number; // 0-4
  likes: number;
  likedBy?: string[]; // List of user IDs or usernames who liked this post (prevents like spamming)
  comments: WebboardComment[];
  createdAt: number;
}

export interface SavedProject {
  id: string;
  name: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  resolution: '4K (3840x2160)' | '2K (2560x1440)' | '1080p (1920x1080)' | '720p (1280x720)';
  fps: number;
  totalDuration: number;
  clipCount: number;
  localFolderPath?: string;
  thumbnail?: string;
  updatedAt: number;
  createdAt: number;
}

export interface MediaFolder {
  id: string;
  name: string;
  createdAt: number;
  isOpen?: boolean;
  localPath?: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  folderId?: string | null;
  file?: File;
  blobUrl?: string;
  localPath?: string;
  originalPath?: string;
  isMissing?: boolean;
  duration?: number;
  size?: string;
  rawSize?: number;
  thumbnail?: string;
  color?: string;
  createdAt: number;
}

export interface TextEffectConfig {
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  effectType: 'none' | 'shadow' | 'neon' | 'outline' | 'gradient' | '3d' | 'boxed';
  shadowColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  gradientColors?: [string, string];
  boxBgColor?: string;
  boxPadding?: number;
  animation?: 'none' | 'fade' | 'slide-up' | 'typewriter' | 'zoom';
}

export interface AudioSettings {
  volume: number;
  pan: number;
  equalizer: 'flat' | 'bass-boost' | 'vocal' | 'cinematic' | 'treble';
  sampleRate: '44.1 kHz' | '48.0 kHz' | '96.0 kHz';
  bitrate: '128 kbps' | '256 kbps' | '320 kbps';
  fadeInDuration: number;
  fadeOutDuration: number;
}

export interface VideoSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  playbackSpeed: number;
  opacity: number;
  filterPreset: 'Normal' | 'Cinematic' | 'Vibrant' | 'Monochrome' | 'Vintage' | 'Cool';
}

export interface TimelineClip {
  id: string;
  assetId?: string;
  name: string;
  type: MediaType;
  trackId: string;
  startTime: number;
  duration: number;
  color: string;
  localPath?: string;
  isMissing?: boolean;
  transition?: TransitionType;
  motion?: MotionAnimation;
  textContent?: string;
  textEffect?: TextEffectConfig;
  audioSettings?: AudioSettings;
  videoSettings?: VideoSettings;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: MediaType;
  muted: boolean;
  locked: boolean;
  solo: boolean;
}

export interface ProjectSettings {
  name: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  resolution: '4K (3840x2160)' | '2K (2560x1440)' | '1080p (1920x1080)' | '720p (1280x720)';
  fps: number;
  localFolderPath?: string;
}

export interface ProjectManifest {
  version: string;
  projectSettings: ProjectSettings;
  folders: MediaFolder[];
  assets: Omit<MediaAsset, 'file' | 'blobUrl'>[];
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  exportedAt: number;
}

export interface UploadTask {
  id: string;
  fileName: string;
  fileSize: string;
  rawSize: number;
  progress: number;
  status: 'uploading' | 'processing' | 'done' | 'error';
  errorMsg?: string;
}

export interface CustomFont {
  name: string;
  family: string;
  url?: string;
  isUploaded?: boolean;
}

export interface SystemUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  isUpdateAvailable: boolean;
  releaseDate: string;
  changelog: string[];
  recommendations: string[];
}
