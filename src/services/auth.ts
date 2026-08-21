import type { UserSession, SavedProject, UserAccount } from '../types';
import { adminService } from './adminService';

const SESSION_KEY = 'MWA_USER_SESSION';
const PROJECTS_KEY = 'MWA_SAVED_PROJECTS';
const ADMIN_PASS_KEY = 'MWA_ADMIN_PASS';

// Default Admin User credentials per requirement
export const DEFAULT_ADMIN = {
  username: 'administrator',
  password: 'caogikojt02',
  name: 'System Administrator',
  role: 'admin' as const,
};

class AuthService {
  private currentSession: UserSession | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
      }
    } catch (e) {
      this.currentSession = null;
    }
  }

  public getSession(): UserSession | null {
    if (!this.currentSession) {
      this.loadSession();
    }
    return this.currentSession;
  }

  public getAdminPassword(): string {
    return localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_ADMIN.password;
  }

  public loginWithCredentials(username: string, pass: string): { success: boolean; message?: string; session?: UserSession } {
    const cleanUser = username.trim();
    const cleanPass = pass.trim();
    const currentAdminPass = this.getAdminPassword();

    if (cleanUser === DEFAULT_ADMIN.username && cleanPass === currentAdminPass) {
      const session: UserSession = {
        id: 'usr-admin-1',
        username: cleanUser,
        name: DEFAULT_ADMIN.name,
        email: 'admin@mwa-studio.local',
        role: 'admin',
        provider: 'local',
        avatar: '/logo.png',
      };
      this.currentSession = session;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, session };
    }

    // Check registered accounts in AdminService
    const allUsers = adminService.getUsers();
    const registeredUser = allUsers.find(
      (u: UserAccount) => u.username.toLowerCase() === cleanUser.toLowerCase()
    );

    if (registeredUser) {
      // Check password if set, otherwise accept valid password
      if (registeredUser.password && registeredUser.password !== cleanPass) {
        return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' };
      }

      if (registeredUser.status === 'pending') {
        return { 
          success: false, 
          message: '⏳ บัญชีของคุณอยู่ระหว่างรอผู้ดูแลระบบตรวจสอบและอนุมัติการใช้งาน (Pending Approval)' 
        };
      }

      if (registeredUser.status === 'suspended') {
        return { 
          success: false, 
          message: '🚫 บัญชีของคุณถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ' 
        };
      }

      const session: UserSession = {
        id: registeredUser.id,
        username: registeredUser.username,
        name: registeredUser.name,
        email: registeredUser.email,
        role: registeredUser.role,
        provider: 'local',
        avatar: './logo.png',
      };
      this.currentSession = session;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, session };
    }

    return { 
      success: false, 
      message: 'ไม่พบบัญชีผู้ใช้งานนี้ หรือรหัสผ่านไม่ถูกต้อง กรุณากดปุ่ม "ลงทะเบียนขอใช้งาน" ด้านล่าง' 
    };
  }

  public loginWithGoogle(googleUser: { email: string; name: string; picture?: string }): UserSession {
    const session: UserSession = {
      id: `usr-google-${Date.now()}`,
      username: googleUser.email.split('@')[0],
      name: googleUser.name,
      email: googleUser.email,
      avatar: googleUser.picture,
      role: 'editor',
      provider: 'google',
    };
    this.currentSession = session;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  public updateProfile(name: string, email?: string, avatar?: string): UserSession | null {
    if (!this.currentSession) return null;
    this.currentSession = {
      ...this.currentSession,
      name: name.trim(),
      email: email?.trim() || undefined,
      avatar: avatar?.trim() || this.currentSession.avatar,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentSession));
    return this.currentSession;
  }

  public changePassword(oldPassword: string, newPassword: string): { success: boolean; message: string } {
    if (!this.currentSession) {
      return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนเปลี่ยนรหัสผ่าน' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
    }

    // Admin user password update
    if (this.currentSession.role === 'admin') {
      const currentAdminPass = this.getAdminPassword();
      if (oldPassword !== currentAdminPass) {
        return { success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' };
      }
      localStorage.setItem(ADMIN_PASS_KEY, newPassword);
      return { success: true, message: 'เปลี่ยนรหัสผ่านผู้ดูแลระบบสำเร็จ' };
    }

    // General user password update
    const userPassKey = `MWA_PASS_${this.currentSession.id}`;
    const storedPass = localStorage.getItem(userPassKey);
    if (storedPass && oldPassword !== storedPass) {
      return { success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' };
    }
    localStorage.setItem(userPassKey, newPassword);
    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว' };
  }

  public logout() {
    this.currentSession = null;
    localStorage.removeItem(SESSION_KEY);
  }

  // Saved Projects Management
  public getSavedProjects(): SavedProject[] {
    try {
      const data = localStorage.getItem(PROJECTS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  }

  public saveProject(project: SavedProject): void {
    const list = this.getSavedProjects();
    const index = list.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      list[index] = { ...project, updatedAt: Date.now() };
    } else {
      list.unshift(project);
    }
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
  }

  public updateProject(projectId: string, updates: Partial<SavedProject>): SavedProject | null {
    const list = this.getSavedProjects();
    const index = list.findIndex((p) => p.id === projectId);
    if (index === -1) return null;
    const updated = { ...list[index], ...updates, updatedAt: Date.now() };
    list[index] = updated;
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
    return updated;
  }

  public deleteProject(projectId: string): void {
    const list = this.getSavedProjects().filter((p) => p.id !== projectId);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
  }
}

export const authService = new AuthService();
