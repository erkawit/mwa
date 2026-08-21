import type { 
  UserAccount, 
  DonationConfig, 
  InquiryTicket, 
  WebboardPost, 
  WebboardComment
} from '../types';

const USERS_STORAGE_KEY = 'MWA_USERS_LIST';
const DONATION_STORAGE_KEY = 'MWA_DONATION_CONFIG';
const INQUIRIES_STORAGE_KEY = 'MWA_INQUIRIES_LIST';
const WEBBOARD_STORAGE_KEY = 'MWA_WEBBOARD_POSTS';

// Initial Users
const initialUsers: UserAccount[] = [
  {
    id: 'usr-admin-1',
    username: 'administrator',
    name: 'System Administrator',
    email: 'admin@mwa-studio.local',
    role: 'admin',
    status: 'active',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'usr-creator-2',
    username: 'somchai_editor',
    name: 'Somchai Editor',
    email: 'somchai@creative.co.th',
    role: 'editor',
    status: 'active',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'usr-viewer-3',
    username: 'studio_user01',
    name: 'Studio Team Editor',
    email: 'team@media.org',
    role: 'editor',
    status: 'active',
    createdAt: Date.now() - 86400000 * 3,
  }
];

// Initial Donation Config with PromptPay 064-3026465, Stripe, and Buy Me a Coffee
const initialDonation: DonationConfig = {
  promptPayNumber: '064-3026465',
  promptPayName: 'Multimedia Web Application (Support Dev)',
  stripeUrl: 'https://buy.stripe.com/demo_mwa_studio',
  stripePublishableKey: 'pk_live_51MWAStudioLiveKey99283741',
  stripeCurrency: 'THB',
  stripeCustomAmountAllowed: true,
  buyMeACoffeeUsername: 'mwastudio',
  buyMeACoffeeUrl: 'https://www.buymeacoffee.com/mwastudio',
  buyMeACoffeeMessage: 'เลี้ยงกาแฟเพื่อสนับสนุนการพัฒนาโปรเจกต์มัลติมีเดีย ☕',
  buyMeACoffeeDefaultCoffeePrice: 3,
  isEnabled: true,
};

// Initial Inquiries
const initialInquiries: InquiryTicket[] = [
  {
    id: 'inq-1',
    userId: 'usr-creator-2',
    userName: 'Somchai Editor',
    userEmail: 'somchai@creative.co.th',
    subject: 'ขอเสนอแนะเพิ่ม Effect ซับไตเติ้ลแบบ Glow Wave',
    category: 'feature',
    message: 'อยากให้มีตัวเลือก Effect ตัวอักษรที่มีคลื่นแสงนีออนเคลื่อนไหวต่อเนื่องสำหรับคลิป Shorts ครับ',
    status: 'resolved',
    adminReply: 'ทีมงานได้พัฒนาและอัปเดตแอนิเมชัน Glow Wave ในแถบ Motion FX เรียบร้อยแล้วครับ ขอบคุณสำหรับข้อเสนอแนะ!',
    createdAt: Date.now() - 86400000 * 2,
    repliedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'inq-2',
    userId: 'usr-viewer-3',
    userName: 'Guest Reviewer',
    userEmail: 'guest@media.org',
    subject: 'พบปัญหาขนาดไฟล์วิดีโอ 2K Export ช้าบนบางเบราว์เซอร์',
    category: 'bug',
    message: 'เมื่อ Export วิดีโอความยาวเกิน 5 นาทีบน Safari บางครั้งใช้เวลาประมวลผลนานกว่าปกติครับ',
    status: 'in-progress',
    adminReply: 'กำลังดำเนินการตรวจสอบ Hardware Acceleration บน WebKit ครับ เบื้องต้นแนะนำใช้งานผ่าน Chrome/Edge เพื่อความเร็วสูงสุดครับ',
    createdAt: Date.now() - 86400000 * 1,
    repliedAt: Date.now() - 3600000 * 4,
  }
];

// Initial Webboard Posts
const initialWebboardPosts: WebboardPost[] = [
  {
    id: 'post-1',
    authorName: 'System Administrator',
    authorRole: 'admin',
    title: '📢 ยินดีต้อนรับสู่พื้นที่พูดคุยและแลกเปลี่ยนเทคนิคการตัดต่อ MWA Studio',
    content: 'ยินดีต้อนรับทุกท่านสู่คอมมูนิตี้สำหรับผู้ใช้งาน Multimedia Studio ท่านสามารถร่วมแบ่งปันเทคนิคการจัดวางไทม์ไลน์ การเลือกใช้ฟอนต์ภาษาไทย และการใช้งาน Google Drive ได้ที่นี่เลยครับ!',
    category: 'general',
    tags: ['ยินดีต้อนรับ', 'Announcement', 'MWA_Studio'],
    likes: 18,
    createdAt: Date.now() - 86400000 * 5,
    comments: [
      {
        id: 'cmt-1',
        authorName: 'Somchai Editor',
        authorRole: 'editor',
        content: 'ระบบใช้งานง่ายและตัดต่อสะดวกมากครับ ชอบแถบ Inspector ที่ปรับแต่งเสียงและสีภาพได้ครบเลย',
        createdAt: Date.now() - 86400000 * 4,
      }
    ]
  },
  {
    id: 'post-2',
    authorName: 'Somchai Editor',
    authorRole: 'editor',
    title: '💡 เทคนิคการจัดวางคลิปและใช้ Snap Highlight ให้ตัดงานได้ไวขึ้น 2 เท่า',
    content: 'แนะนำการใช้งานเส้น Playhead สีแดง และการลากคลิปให้ขึ้นแถบไฟ Cyan (ด้านหน้า) หรือ Amber (ต่อท้าย) จะช่วยให้ไม่ต้องเสียเวลาขยับคลิปซ้ำซ้อนเลยครับ ลองนำไปใช้กันดูนะครับ',
    category: 'editing-tips',
    tags: ['EditingTips', 'Timeline', 'Workflow'],
    likes: 12,
    createdAt: Date.now() - 86400000 * 2,
    comments: []
  }
];

class AdminService {
  // --- USERS MANAGEMENT ---
  public getUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      const rawList: UserAccount[] = data ? JSON.parse(data) : initialUsers;
      // Sort pending users to the top, then newest created
      return [...rawList].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    } catch {
      return initialUsers;
    }
  }

  public getPendingUsersCount(): number {
    return this.getUsers().filter(u => u.status === 'pending').length;
  }

  public saveUsers(users: UserAccount[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  public registerPendingUser(account: {
    username: string;
    name: string;
    email?: string;
    role?: UserAccount['role'];
    password?: string;
  }): { success: boolean; message: string; user?: UserAccount } {
    const users = this.getUsers();
    const existing = users.find(
      u => u.username.toLowerCase() === account.username.toLowerCase() || 
      (account.email && u.email && u.email.toLowerCase() === account.email.toLowerCase())
    );
    if (existing) {
      return { success: false, message: 'ชื่อผู้ใช้งานหรืออีเมลนี้มีอยู่ในระบบแล้ว' };
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      username: account.username.trim(),
      name: account.name.trim(),
      email: account.email?.trim() || `${account.username.trim()}@user.local`,
      role: account.role || 'editor',
      status: 'pending', // Pending Admin approval
      password: account.password || '123456',
      createdAt: Date.now(),
    };

    const updated = [newUser, ...users];
    this.saveUsers(updated);
    return { success: true, message: 'ส่งคำขอลงทะเบียนสำเร็จ กรุณารอผู้ดูแลระบบยืนยันสิทธิ์', user: newUser };
  }

  public approveUser(id: string): UserAccount | null {
    return this.updateUser(id, { status: 'active' });
  }

  public rejectUser(id: string): boolean {
    return this.deleteUser(id);
  }

  public addUser(user: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount {
    const users = this.getUsers();
    const newUser: UserAccount = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: Date.now(),
    };
    const updated = [newUser, ...users];
    this.saveUsers(updated);
    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserAccount>): UserAccount | null {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    const updatedUser = { ...users[index], ...updates };
    users[index] = updatedUser;
    this.saveUsers(users);
    return updatedUser;
  }

  public deleteUser(id: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    this.saveUsers(filtered);
    return true;
  }

  // --- DONATION CONFIG ---
  public getDonationConfig(): DonationConfig {
    try {
      const data = localStorage.getItem(DONATION_STORAGE_KEY);
      return data ? JSON.parse(data) : initialDonation;
    } catch {
      return initialDonation;
    }
  }

  public saveDonationConfig(config: DonationConfig): void {
    localStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(config));
  }

  // --- 1:1 INQUIRIES ---
  public getInquiries(): InquiryTicket[] {
    try {
      const data = localStorage.getItem(INQUIRIES_STORAGE_KEY);
      return data ? JSON.parse(data) : initialInquiries;
    } catch {
      return initialInquiries;
    }
  }

  public saveInquiries(inquiries: InquiryTicket[]): void {
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(inquiries));
  }

  public addInquiry(inquiry: Omit<InquiryTicket, 'id' | 'status' | 'createdAt'>): InquiryTicket {
    const list = this.getInquiries();
    const newInquiry: InquiryTicket = {
      ...inquiry,
      id: `inq-${Date.now()}`,
      status: 'open',
      createdAt: Date.now(),
    };
    this.saveInquiries([newInquiry, ...list]);
    return newInquiry;
  }

  public replyInquiry(id: string, reply: string, status: InquiryTicket['status']): InquiryTicket | null {
    const list = this.getInquiries();
    const index = list.findIndex(i => i.id === id);
    if (index === -1) return null;
    list[index].adminReply = reply;
    list[index].status = status;
    list[index].repliedAt = Date.now();
    this.saveInquiries(list);
    return list[index];
  }

  // --- WEBBOARD ---
  public getWebboardPosts(): WebboardPost[] {
    try {
      const data = localStorage.getItem(WEBBOARD_STORAGE_KEY);
      return data ? JSON.parse(data) : initialWebboardPosts;
    } catch {
      return initialWebboardPosts;
    }
  }

  public saveWebboardPosts(posts: WebboardPost[]): void {
    localStorage.setItem(WEBBOARD_STORAGE_KEY, JSON.stringify(posts));
  }

  public addWebboardPost(post: Omit<WebboardPost, 'id' | 'likes' | 'comments' | 'createdAt'>): WebboardPost {
    const posts = this.getWebboardPosts();
    const newPost: WebboardPost = {
      ...post,
      id: `post-${Date.now()}`,
      likes: 0,
      comments: [],
      createdAt: Date.now(),
    };
    this.saveWebboardPosts([newPost, ...posts]);
    return newPost;
  }

  public addComment(postId: string, comment: Omit<WebboardComment, 'id' | 'createdAt'>): WebboardComment | null {
    const posts = this.getWebboardPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return null;
    const newComment: WebboardComment = {
      ...comment,
      id: `cmt-${Date.now()}`,
      createdAt: Date.now(),
    };
    post.comments.push(newComment);
    this.saveWebboardPosts(posts);
    return newComment;
  }

  public toggleLikePost(postId: string, userId: string): { likes: number; isLiked: boolean } {
    const posts = this.getWebboardPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return { likes: 0, isLiked: false };

    if (!post.likedBy) {
      post.likedBy = [];
    }

    const hasLiked = post.likedBy.includes(userId);
    if (hasLiked) {
      // Unlike: remove userId and decrement likes
      post.likedBy = post.likedBy.filter(id => id !== userId);
      post.likes = Math.max(0, (post.likes || 1) - 1);
    } else {
      // Like: add userId and increment likes
      post.likedBy.push(userId);
      post.likes = (post.likes || 0) + 1;
    }

    this.saveWebboardPosts(posts);
    return { likes: post.likes, isLiked: !hasLiked };
  }
}

export const adminService = new AdminService();
