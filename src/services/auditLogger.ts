// Comprehensive System Audit & Local Traffic Log Service (Zero-DB Architecture)
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PROJECT_SAVE' | 'PROJECT_IMPORT' | 'EXPORT_MEDIA' | 'USER_CHANGE' | 'RELINK_MEDIA' | 'SYSTEM_CONFIG';
  username: string;
  role: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  origin: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details?: string;
}

const AUDIT_STORAGE_KEY = 'MWA_AUDIT_TRAFFIC_LOGS';

class AuditLoggerService {
  private logs: AuditLogEntry[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const data = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (data) {
        this.logs = JSON.parse(data);
      } else {
        // Initialize default system boot trace
        this.log({
          type: 'SYSTEM_CONFIG',
          username: 'system',
          role: 'system',
          action: 'ระบบสตูดิโอเริ่มต้นทำงาน (System Boot)',
          status: 'SUCCESS',
          details: 'Local Zero-DB Storage Initialized'
        });
      }
    } catch {
      this.logs = [];
    }
  }

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  public log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress' | 'userAgent' | 'origin'> & { details?: string }): AuditLogEntry {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      ipAddress: window.location.hostname || '127.0.0.1 (Localhost)',
      userAgent: navigator.userAgent.slice(0, 120),
      origin: window.location.protocol === 'file:' ? 'file:// (Local Standalone)' : window.location.origin,
      ...entry,
    };

    this.logs.unshift(newLog);
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500); // Retain latest 500 records
    }

    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.warn('Audit log write error:', e);
    }

    return newLog;
  }

  public exportLogsAsJSON(): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mwa_traffic_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  public clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(AUDIT_STORAGE_KEY);
    this.log({
      type: 'SYSTEM_CONFIG',
      username: 'administrator',
      role: 'admin',
      action: 'ล้างประวัติร่องรอยจราจรทางคอมพิวเตอร์ (Clear Audit Logs)',
      status: 'WARNING'
    });
  }
}

export const auditLogger = new AuditLoggerService();
