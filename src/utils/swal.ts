import Swal from 'sweetalert2';
import type { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

/**
 * AppSwal - SweetAlert2 instance configured according to the Multimedia Web Application UI/UX design spec
 * Features:
 * - Low border-radius (rounded-md / 6px)
 * - Tailwind slate color scheme
 * - Prompt/Inter heading and Sarabun paragraph fonts
 * - Native Tailwind button styles without default balloon styling
 */
export const AppSwal = Swal.mixin({
  customClass: {
    container: 'font-sans text-slate-800',
    popup: 'app-swal-popup bg-white rounded-md shadow-xl border border-slate-200 p-6',
    title: 'text-lg font-medium text-slate-800 tracking-tight',
    htmlContainer: 'text-sm text-slate-600 font-doc leading-relaxed mt-2',
    confirmButton: 'inline-flex items-center justify-center bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded shadow-sm hover:bg-blue-700 active:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
    cancelButton: 'inline-flex items-center justify-center bg-slate-100 text-slate-700 text-sm font-medium px-4 py-2 rounded border border-slate-300 hover:bg-slate-200 active:bg-slate-300 transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 ml-2.5',
    denyButton: 'inline-flex items-center justify-center bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded shadow-sm hover:bg-rose-700 transition focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 ml-2.5',
    actions: 'mt-6 gap-2',
    input: 'w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans',
    footer: 'text-xs text-slate-400 border-t border-slate-100 mt-4 pt-3'
  },
  buttonsStyling: false, // Turn off default SweetAlert styling to use Tailwind classes
  background: '#FFFFFF',
  backdrop: 'rgba(15, 23, 42, 0.45)', // Soft slate-900 backdrop
});

/**
 * Toast Notification Mixin (for subtle corner alerts)
 */
export const AppToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'bg-white rounded-md shadow-lg border border-slate-200 p-3 text-sm flex items-center',
    title: 'text-sm font-medium text-slate-800 ml-2 font-sans',
  },
  background: '#FFFFFF',
});

// Helper shortcuts for convenience
export const alertSuccess = (title: string, text?: string, options?: SweetAlertOptions): Promise<SweetAlertResult> => {
  return AppSwal.fire({
    icon: 'success',
    iconColor: '#10B981',
    title,
    text,
    confirmButtonText: 'ตกลง',
    ...options,
  });
};

export const alertError = (title: string, text?: string, options?: SweetAlertOptions): Promise<SweetAlertResult> => {
  return AppSwal.fire({
    icon: 'error',
    iconColor: '#EF4444',
    title,
    text,
    confirmButtonText: 'ปิด',
    ...options,
  });
};

export const alertWarning = (title: string, text?: string, options?: SweetAlertOptions): Promise<SweetAlertResult> => {
  return AppSwal.fire({
    icon: 'warning',
    iconColor: '#F59E0B',
    title,
    text,
    confirmButtonText: 'เข้าใจแล้ว',
    ...options,
  });
};

export const alertConfirm = async (
  title: string,
  text: string,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก'
): Promise<boolean> => {
  const result = await AppSwal.fire({
    title,
    text,
    icon: 'question',
    iconColor: '#3B82F6',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
  return result.isConfirmed;
};

export const notifyToast = (title: string, icon: 'success' | 'info' | 'warning' | 'error' = 'success') => {
  const iconColors = {
    success: '#10B981',
    info: '#3B82F6',
    warning: '#F59E0B',
    error: '#EF4444',
  };
  return AppToast.fire({
    icon,
    iconColor: iconColors[icon],
    title,
  });
};

export default AppSwal;
