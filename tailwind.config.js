/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#F8FAFC',       // พื้นหลังแอป สบายตา (slate-50)
          surface: '#FFFFFF',  // พื้นหลังหน้าต่าง Card/Modal
          surfaceSubtle: '#F1F5F9', // พื้นหลังรอง (slate-100)
          textMain: '#1E293B', // ตัวหนังสือหลัก (slate-800)
          textMuted: '#64748B',// ตัวหนังสือรอง (slate-500)
          primary: '#2563EB',  // สีฟ้าปุ่มกด (blue-600)
          primaryHover: '#1D4ED8', // blue-700
          border: '#E2E8F0',   // สีเส้นขอบ (slate-200)
          borderDark: '#CBD5E1', // slate-300
          danger: '#EF4444',   // red-500
          success: '#10B981',  // emerald-500
          warning: '#F59E0B',  // amber-500
        }
      },
      fontFamily: {
        sans: ['Prompt', 'Inter', 'sans-serif'],
        heading: ['Kanit', 'Prompt', 'sans-serif'],
        doc: ['Sarabun', 'sans-serif'],
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',  // 2px
        DEFAULT: '0.25rem',// 4px (ใช้อันนี้เป็นหลัก)
        'md': '0.375rem',  // 6px
        'lg': '0.5rem',    // 8px (สูงสุดที่ใช้สำหรับ Modal)
      }
    },
  },
  plugins: [],
}

