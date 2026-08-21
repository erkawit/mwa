import React, { useState, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  ThumbsUp, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Inbox,
  Image as ImageIcon,
  Star,
  Trash2,
  Lock,
  Search,
  MessageCircle,
  Maximize2
} from 'lucide-react';
import type { WebboardPost, InquiryTicket, UserSession } from '../types';
import { adminService } from '../services/adminService';
import { AppSwal, alertSuccess, alertError } from '../utils/swal';

interface InquiryWebboardModalProps {
  userSession: UserSession | null;
  onClose: () => void;
}

export const InquiryWebboardModal: React.FC<InquiryWebboardModalProps> = ({
  userSession,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'webboard' | 'inquiry'>('webboard');

  // --- Webboard State ---
  const [posts, setPosts] = useState<WebboardPost[]>(adminService.getWebboardPosts());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});

  // --- Create Post Modal State ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState<WebboardPost['category']>('editing-tips');
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1:1 Inquiry Form State ---
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryCategory, setInquiryCategory] = useState<'bug' | 'feature' | 'support' | 'other'>('bug');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState(userSession?.email || '');
  const [myInquiries, setMyInquiries] = useState<InquiryTicket[]>(adminService.getInquiries());

  const currentUserId = userSession?.id || userSession?.username || '';

  // --- Image Upload Handler for Webboard Post (Up to 5 images) ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - attachedImages.length;
    if (remainingSlots <= 0) {
      alertError('แนบรูปครบกำหนดแล้ว', 'สามารถแนบรูปภาพประกอบกระทู้ได้ไม่เกิน 5 รูป');
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);
    const newImages: string[] = [];

    let processedCount = 0;
    filesToRead.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
        }
        processedCount++;
        if (processedCount === filesToRead.length) {
          setAttachedImages((prev) => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (coverImageIndex >= updated.length) {
        setCoverImageIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  // --- Open Create Post ---
  const handleOpenCreateModal = () => {
    if (!userSession) {
      alertError(
        'จำเป็นต้องเข้าสู่ระบบก่อน',
        'การโพสต์ตั้งกระทู้ใน Webboard ต้องผ่านการล็อกอินแล้วเท่านั้น กรุณาเข้าสู่ระบบหรือลงทะเบียนขอใช้งาน'
      );
      return;
    }
    setShowCreateModal(true);
  };

  // --- Submit Create Post ---
  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSession) {
      alertError('กรุณาเข้าสู่ระบบก่อน', 'คุณต้องเข้าสู่ระบบเพื่อตั้งกระทู้');
      return;
    }

    if (!postTitle.trim() || !postContent.trim()) {
      alertError('กรุณากรอกข้อมูล', 'กรุณาระบุหัวข้อและเนื้อหากระทู้');
      return;
    }

    const tags = postTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    adminService.addWebboardPost({
      authorName: userSession.name,
      authorRole: userSession.role,
      authorAvatar: userSession.avatar,
      title: postTitle.trim(),
      content: postContent.trim(),
      category: postCategory,
      tags: tags.length > 0 ? tags : ['Community'],
      images: attachedImages,
      coverImageIndex: attachedImages.length > 0 ? coverImageIndex : undefined,
    });

    setPosts(adminService.getWebboardPosts());
    setShowCreateModal(false);
    setPostTitle('');
    setPostContent('');
    setPostTags('');
    setAttachedImages([]);
    setCoverImageIndex(0);

    alertSuccess('สร้างกระทู้สำเร็จ', 'กระทู้และรูปภาพของคุณถูกเผยแพร่ในเว็บบอร์ดเรียบร้อยแล้ว');
  };

  // --- 1 Like per User with Unlike Toggle (Anti-Spam) ---
  const handleLike = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userSession) {
      alertError('กรุณาเข้าสู่ระบบก่อน', 'คุณต้องเข้าสู่ระบบเพื่อกดถูกใจกระทู้');
      return;
    }

    const result = adminService.toggleLikePost(postId, currentUserId);
    setPosts(adminService.getWebboardPosts());

    if (result.isLiked) {
      // Short friendly visual feedback
      // Liked successfully
    }
  };

  const handleAddComment = (postId: string) => {
    if (!userSession) {
      alertError('จำเป็นต้องเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบเพื่อร่วมแสดงความคิดเห็นในกระทู้');
      return;
    }

    const text = newCommentText[postId];
    if (!text || !text.trim()) return;

    adminService.addComment(postId, {
      authorName: userSession.name,
      authorRole: userSession.role,
      content: text.trim(),
    });

    setPosts(adminService.getWebboardPosts());
    setNewCommentText((prev) => ({ ...prev, [postId]: '' }));
  };

  // --- 1:1 Inquiry Submit ---
  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquirySubject.trim() || !inquiryMessage.trim()) {
      alertError('กรุณากรอกข้อมูล', 'กรุณาระบุหัวข้อและรายละเอียดของคำร้องเรียน');
      return;
    }

    adminService.addInquiry({
      userId: userSession?.id || `usr-guest-${Date.now()}`,
      userName: userSession?.name || 'Guest User',
      userEmail: inquiryEmail.trim() || undefined,
      subject: inquirySubject.trim(),
      category: inquiryCategory,
      message: inquiryMessage.trim(),
    });

    setMyInquiries(adminService.getInquiries());
    setInquirySubject('');
    setInquiryMessage('');
    alertSuccess('ส่งข้อมูลเรียบร้อย', 'คำร้องเรียนของคุณถูกส่งถึงทีมงานผู้ดูแลระบบเรียบร้อยแล้ว');
  };

  const filteredPosts = posts.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = !searchQuery.trim() || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 selection:bg-blue-500 selection:text-white animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xl max-w-5xl w-full h-[88vh] overflow-hidden flex flex-col font-sans relative">
        {/* Top Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">คอมมูนิตี้ & แจ้งปัญหา 1:1 (Community & Support)</h3>
                <span className="px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded text-[10px] font-mono border border-blue-400/30">
                  MWA Studio Forum
                </span>
              </div>
              <p className="text-[11px] text-blue-200 font-doc">
                เว็บบอร์ดแลกเปลี่ยนเทคนิคตัดต่อ (แนบรูปได้ 5 รูป) และช่องทางส่งข้อเสนอแนะ 1:1 ตรงถึงผู้ดูแลระบบ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 gap-2 shrink-0 text-xs font-medium">
          <button
            onClick={() => setActiveTab('webboard')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition ${
              activeTab === 'webboard'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>เว็บบอร์ดพูดคุย ({posts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inquiry')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition ${
              activeTab === 'inquiry'
                ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4 text-indigo-600" />
            <span>แจ้งปัญหาระบบ & แนะนำ 1:1</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/70 min-h-0 text-xs text-slate-700">
          {/* --- TAB 1: WEBBOARD FORUM --- */}
          {activeTab === 'webboard' && (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Login Status Banner if not logged in */}
              {!userSession && (
                <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-lg flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>การโพสต์ตั้งกระทู้, แนบรูปภาพ และกดถูกใจ (Like) จำเป็นต้องเข้าสู่ระบบก่อน</span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                    กรุณาเข้าสู่ระบบ
                  </span>
                </div>
              )}

              {/* Action Toolbar: Search + Category Filters + Create Post */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-80">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหากระทู้, คีย์เวิร์ด หรือแท็ก..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Create Post Button */}
                  <button
                    onClick={handleOpenCreateModal}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition shadow-sm text-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ตั้งกระทู้ใหม่ (แนบได้ 5 รูป)</span>
                  </button>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-[11px]">
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'editing-tips', label: '💡 เทคนิคตัดต่อ' },
                    { id: 'qa', label: '❓ ถาม-ตอบ' },
                    { id: 'feature-updates', label: '✨ อัปเดตฟีเจอร์' },
                    { id: 'general', label: '💬 ทั่วไป' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-full transition font-medium ${
                        selectedCategory === cat.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics Feed List */}
              <div className="space-y-3.5">
                {filteredPosts.length === 0 ? (
                  <div className="p-10 bg-white border border-slate-200 rounded-lg text-center text-slate-400 font-doc space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">ไม่พบกระทู้ที่ตรงกับเงื่อนไขการค้นหา</p>
                    <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหา หรือคลิก "ตั้งกระทู้ใหม่" เพื่อเริ่มพูดคุย</p>
                  </div>
                ) : (
                  filteredPosts.map((post) => {
                    const isExpanded = expandedPostId === post.id;
                    const hasImages = post.images && post.images.length > 0;
                    const isLiked = !!(currentUserId && post.likedBy && post.likedBy.includes(currentUserId));

                    return (
                      <div
                        key={post.id}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 sm:p-5 space-y-3.5 shadow-2xs transition"
                      >
                        {/* Top Card Meta: Author, Role, Date, Category */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Author Avatar */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                              post.authorRole === 'admin' 
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {post.authorName.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-800 text-xs truncate">
                                  {post.authorName}
                                </span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold border ${
                                  post.authorRole === 'admin'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {post.authorRole}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  • {new Date(post.createdAt).toLocaleDateString('th-TH')}
                                </span>
                              </div>

                              {/* Title */}
                              <h4 
                                onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                                className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition mt-0.5 line-clamp-2"
                              >
                                {post.title}
                              </h4>
                            </div>
                          </div>

                          {/* Category Badge */}
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-medium shrink-0">
                            {post.category === 'editing-tips'
                              ? '💡 เทคนิคตัดต่อ'
                              : post.category === 'qa'
                              ? '❓ ถาม-ตอบ'
                              : post.category === 'feature-updates'
                              ? '✨ อัปเดตฟีเจอร์'
                              : '💬 ทั่วไป'}
                          </span>
                        </div>

                        {/* Post Content */}
                        <p className="text-slate-700 font-doc text-xs leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>

                        {/* Image Preview & Gallery Strip */}
                        {hasImages && (
                          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2">
                            <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                                <span>รูปภาพประกอบกระทู้ ({post.images!.length} รูป):</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-doc">
                                คลิกที่รูปเพื่อซูมดูขนาดใหญ่
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {post.images!.map((img, idx) => {
                                const isCover = idx === (post.coverImageIndex || 0);
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      AppSwal.fire({
                                        imageUrl: img,
                                        imageAlt: `Image ${idx + 1}`,
                                        showConfirmButton: false,
                                        showCloseButton: true,
                                        customClass: {
                                          popup: 'rounded-xl overflow-hidden'
                                        }
                                      });
                                    }}
                                    className={`relative rounded-md border overflow-hidden bg-white h-24 group cursor-pointer shadow-2xs transition hover:opacity-90 ${
                                      isCover
                                        ? 'border-blue-600 ring-2 ring-blue-500/40'
                                        : 'border-slate-300'
                                    }`}
                                  >
                                    <img
                                      src={img}
                                      alt={`Attached ${idx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                      <Maximize2 className="w-4 h-4 drop-shadow" />
                                    </div>
                                    {isCover && (
                                      <div className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] px-1.5 py-0.2 rounded font-medium shadow-sm flex items-center gap-0.5">
                                        <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                                        <span>หน้าปก</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {post.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-mono flex items-center gap-0.5"
                              >
                                <Tag className="w-2.5 h-2.5" />
                                <span>{tag}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Footer: Like Button (1-Like / Unlike) + Comments Toggle */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {/* Like / Unlike Button */}
                            <button
                              onClick={(e) => handleLike(post.id, e)}
                              title={isLiked ? 'กดอีกครั้งเพื่อยกเลิกถูกใจ (Unlike)' : 'กดถูกใจกระทู้นี้ (Like)'}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition cursor-pointer font-medium ${
                                isLiked
                                  ? 'bg-blue-50 text-blue-600 border-blue-300 shadow-2xs font-semibold'
                                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-blue-600 text-blue-600' : 'text-slate-500'}`} />
                              <span>{isLiked ? 'ถูกใจแล้ว' : 'ถูกใจ'}</span>
                              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[11px] ${
                                isLiked ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {post.likes || 0}
                              </span>
                            </button>

                            {/* Comment Counter Button */}
                            <button
                              onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition cursor-pointer font-medium"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                              <span>ความคิดเห็น</span>
                              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px]">
                                {post.comments.length}
                              </span>
                            </button>
                          </div>

                          <button
                            onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                            className="text-blue-600 hover:underline font-medium text-[11px]"
                          >
                            {isExpanded ? '▲ ซ่อนความคิดเห็น' : '▼ แสดงความคิดเห็น'}
                          </button>
                        </div>

                        {/* Expanded Comment Thread */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-slate-100 space-y-3 bg-slate-50/80 p-3.5 rounded-lg">
                            <div className="space-y-2">
                              {post.comments.length === 0 ? (
                                <p className="text-[11px] text-slate-400 font-doc text-center py-3">
                                  ยังไม่มีความคิดเห็น มาร่วมแสดงความคิดเห็นเป็นคนแรกในกระทู้นี้
                                </p>
                              ) : (
                                post.comments.map((cmt) => (
                                  <div key={cmt.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs">
                                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-slate-800">{cmt.authorName}</span>
                                        <span className="px-1.5 py-0.1 bg-slate-100 rounded text-[9px] font-mono uppercase text-slate-600">
                                          {cmt.authorRole}
                                        </span>
                                      </div>
                                      <span className="font-mono text-[10px] text-slate-400">
                                        {new Date(cmt.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-slate-700 font-doc pt-0.5 leading-relaxed">{cmt.content}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add Comment Input */}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                disabled={!userSession}
                                value={newCommentText[post.id] || ''}
                                onChange={(e) => setNewCommentText({ ...newCommentText, [post.id]: e.target.value })}
                                placeholder={userSession ? "ร่วมแสดงความคิดเห็น..." : "กรุณาเข้าสู่ระบบเพื่อร่วมแสดงความคิดเห็น"}
                                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                              />
                              <button
                                disabled={!userSession}
                                onClick={() => handleAddComment(post.id)}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>ส่ง</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* --- TAB 2: 1:1 INQUIRY TICKET SYSTEM --- */}
          {activeTab === 'inquiry' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Inquiry Submission Form */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
                <div className="space-y-1 pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Inbox className="w-4 h-4 text-indigo-600" />
                    <span>แบบฟอร์มส่งคำร้องเรียน / ข้อเสนอแนะ (1:1 Support)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-doc">
                    ข้อความจะถูกส่งตรงถึงผู้ดูแลระบบและตอบกลับเป็นการส่วนตัว
                  </p>
                </div>

                <form onSubmit={handleSubmitInquiry} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        หมวดหมู่คำร้อง*
                      </label>
                      <select
                        value={inquiryCategory}
                        onChange={(e) => setInquiryCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="bug">🐛 รายงานข้อผิดพลาดของระบบ (Bug Report)</option>
                        <option value="feature">💡 เสนอแนะฟีเจอร์ใหม่ (Feature Request)</option>
                        <option value="support">❓ สอบถามการใช้งานทั่วไป (Support)</option>
                        <option value="other">💬 อื่นๆ (Other)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        อีเมลสำหรับติดต่อกลับ
                      </label>
                      <input
                        type="email"
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        placeholder="yourname@domain.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      หัวข้อคำร้องเรียน / ข้อเสนอแนะ*
                    </label>
                    <input
                      type="text"
                      value={inquirySubject}
                      onChange={(e) => setInquirySubject(e.target.value)}
                      placeholder="e.g. พบปัญหาการเรนเดอร์วิดีโอ 4K บนเครื่องสเปกต่ำ"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      รายละเอียดข้อความ*
                    </label>
                    <textarea
                      rows={4}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      placeholder="อธิบายรายละเอียด อาการ หรือขั้นตอนที่ทำให้เกิดปัญหา..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md text-xs resize-none focus:ring-1 focus:ring-indigo-500"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ส่งข้อมูลคำร้องเรียนถึงผู้ดูแลระบบ</span>
                  </button>
                </form>
              </div>

              {/* My Inquiries History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>ประวัติคำร้องเรียนของคุณ ({myInquiries.length})</span>
                </h4>

                {myInquiries.length === 0 ? (
                  <div className="p-6 bg-white border border-slate-200 rounded-lg text-center text-slate-400 font-doc">
                    ยังไม่มีประวัติคำร้องเรียน
                  </div>
                ) : (
                  myInquiries.map((inq) => (
                    <div key={inq.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2.5 shadow-2xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            inq.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inq.status === 'in-progress'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {inq.status === 'resolved' ? 'ดำเนินการแก้ไขแล้ว' : inq.status === 'in-progress' ? 'กำลังตรวจสอบ' : 'รอการตอบกลับ'}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 mt-1">{inq.subject}</h5>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(inq.createdAt).toLocaleDateString('th-TH')}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 font-doc">{inq.message}</p>

                      {inq.adminReply && (
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-md text-[11px] space-y-1">
                          <div className="flex items-center gap-1 text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ข้อความตอบกลับจากผู้ดูแลระบบ:</span>
                          </div>
                          <p className="text-emerald-900 font-doc">{inq.adminReply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- DEDICATED NEW TOPIC MODAL (WITH MULTI-IMAGE ATTACHMENT UP TO 5 & COVER SELECTION) --- */}
        {showCreateModal && (
          <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white border border-slate-200 rounded-lg shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-bold">สร้างกระทู้พูดคุยใหม่ (New Topic)</h4>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitPost} className="p-5 space-y-3.5 overflow-y-auto text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    หัวข้อกระทู้ (Topic Title)*
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="ระบุหัวข้อที่ต้องการแลกเปลี่ยนหรือสอบถาม..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    หมวดหมู่ (Category)*
                  </label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="editing-tips">💡 แนะนำเทคนิคตัดต่อ (Editing Tips)</option>
                    <option value="qa">❓ ถาม-ตอบปัญหาการใช้งาน (Q&A)</option>
                    <option value="feature-updates">✨ อัปเดตฟีเจอร์ & ข่าวสาร (Feature Updates)</option>
                    <option value="general">💬 พูดคุยทั่วไป (General Discussion)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    เนื้อหากระทู้ (Content)*
                  </label>
                  <textarea
                    rows={4}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="พิมพ์รายละเอียดของกระทู้..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md text-slate-800 text-xs resize-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    แท็ก (Tags คั่นด้วยเครื่องหมายจุลภาค)
                  </label>
                  <input
                    type="text"
                    value={postTags}
                    onChange={(e) => setPostTags(e.target.value)}
                    placeholder="e.g. ตัดต่อวิดีโอ, เอฟเฟกต์, 4K"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 text-xs"
                  />
                </div>

                {/* --- Multi-Image Attachment (Max 5 Images) --- */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-slate-800">
                        📷 แนบรูปภาพประกอบกระทู้ (ไม่เกิน 5 รูป)
                      </label>
                      <span className="text-[11px] text-slate-500 font-doc">
                        คลิกเลือกรูปเป็นรูปโปรไฟล์ / หน้าปกของกระทู้ (⭐)
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={attachedImages.length >= 5}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-md text-[11px] font-medium transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-blue-600" />
                      <span>เพิ่มรูป ({attachedImages.length}/5)</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {attachedImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      {attachedImages.map((img, idx) => {
                        const isCover = idx === coverImageIndex;
                        return (
                          <div
                            key={idx}
                            className={`relative rounded-md border overflow-hidden bg-white shadow-2xs group h-24 flex flex-col ${
                              isCover ? 'border-blue-600 ring-2 ring-blue-500/40' : 'border-slate-300'
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Upload ${idx + 1}`}
                              className="w-full flex-1 object-cover"
                            />

                            {/* Set Cover Button */}
                            <button
                              type="button"
                              onClick={() => setCoverImageIndex(idx)}
                              className={`w-full py-1 text-[9px] font-medium flex items-center justify-center gap-0.5 transition ${
                                isCover
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <Star className={`w-2.5 h-2.5 ${isCover ? 'fill-amber-300 text-amber-300' : ''}`} />
                              <span>{isCover ? 'รูปโปรไฟล์' : 'เลือกหน้าปก'}</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded transition shadow-2xs"
                              title="ลบรูปนี้"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-xs transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>เผยแพร่กระทู้</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
