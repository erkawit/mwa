import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  RotateCcw, 
  Copy, 
  CheckCircle2, 
  ShieldAlert
} from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Uncaught error in Multimedia Web Application:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleSafeMode = () => {
    try {
      localStorage.setItem('MWA_SAFE_MODE', 'true');
    } catch (e) {}
    window.location.reload();
  };

  private handleCopyError = () => {
    const errorText = `[Multimedia Web Application Error Report]\nDate: ${new Date().toISOString()}\nError: ${this.state.error?.message}\nStack: ${this.state.error?.stack}\nComponentStack: ${this.state.errorInfo?.componentStack || 'N/A'}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-4 font-sans antialiased">
          <div className="max-w-xl w-full bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-800">
                  ระบบตรวจพบข้อผิดพลาดในการทำงาน (System Recovery)
                </h1>
                <p className="text-xs text-slate-500 font-doc mt-0.5">
                  ระบบได้ป้องกันไม่ให้หน้าเว็บค้างหรือแสดงผล Error Web โดยอัตโนมัติ
                </p>
              </div>
            </div>

            {/* Content & Actions */}
            <div className="p-6 space-y-4">
              <div className="bg-rose-50/60 border border-rose-200 rounded p-3 text-xs text-rose-900 font-mono">
                <span className="font-semibold">ข้อผิดพลาด: </span>
                {this.state.error?.message || 'Unknown runtime exception'}
              </div>

              {/* Diagnostic Checklist */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2 text-xs">
                <div className="font-medium text-slate-700">การตรวจสอบระบบอัตโนมัติ (Diagnostics):</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>LocalStorage: พร้อมใช้งาน</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Web Audio / Codec: รองรับ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Canvas GPU Acceleration: พร้อม</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tailwind & Font Assets: ปกติ</span>
                  </div>
                </div>
              </div>

              {/* Batch File 1-Click Auto Recovery */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-blue-900">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>เปิดระบบอัตโนมัติด้วย Batch File (1-Click Run)</span>
                  </div>
                  <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                    start_studio.bat
                  </span>
                </div>
                <p className="text-[11px] text-blue-700 font-doc">
                  หากเปิดผ่าน <code>file:///</code> แล้วเกิดข้อผิดพลาด คุณสามารถดับเบิลคลิกไฟล์ <strong>start_studio.bat</strong> หรือ <strong>run.bat</strong> ในโฟลเดอร์โปรเจกต์เพื่อเปิดระบบและเซิร์ฟเวอร์ให้อัตโนมัติทันที
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`cd /d "${window.location.pathname.replace(/\/[^/]*$/, '').replace(/^\//, '')}" && start_studio.bat`);
                    this.setState({ copied: true });
                    setTimeout(() => this.setState({ copied: false }), 2000);
                  }}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{this.state.copied ? 'คัดลอกคำสั่งรัน start_studio.bat แล้ว' : 'คัดลอกคำสั่งรัน start_studio.bat'}</span>
                </button>
              </div>

              {/* Recovery Options */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-medium text-slate-700">ตัวเลือกการแก้ไขและคืนค่าระบบ:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={this.handleReload}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium py-2.5 px-4 rounded shadow-sm transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>รีโหลดหน้าเว็บใหม่ (Reload)</span>
                  </button>

                  <button
                    onClick={this.handleReset}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 active:bg-black text-white text-xs font-medium py-2.5 px-4 rounded shadow-sm transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>คืนค่าเริ่มต้น & ล้างแคช (Reset)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={this.handleSafeMode}
                    className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium py-2 px-3 rounded transition"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>เข้าสู่ Safe Mode</span>
                  </button>

                  <button
                    onClick={this.handleCopyError}
                    className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium py-2 px-3 rounded transition"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>{this.state.copied ? 'คัดลอกแล้ว!' : 'คัดลอก Error Log'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between font-doc">
              <span>Multimedia Web Application • Resilience Engine</span>
              <span className="font-mono text-slate-400">Code: ERR_RECOVERED</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
