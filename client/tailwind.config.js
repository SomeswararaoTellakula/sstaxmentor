/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:   '#0B1B3A',
          blue:   '#1A4FD6',
          blueLt: '#7B9CF5',
          sky:    '#BBD3FB',
          bg:     '#FFFFFF',
          bgSoft: '#F5F8FF',
          text:   '#111827',
          muted:  '#6B7280',
          line:   '#E5E7EB',
          ok:     '#16A34A',
          amber:  '#E8A33D',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
}
