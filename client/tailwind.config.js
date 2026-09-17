/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        liberal: '#3b82f6', // blue-500
        fascist: '#ef4444', // red-500
        dark: '#111111'
      }
    },
  },
  plugins: [],
}
