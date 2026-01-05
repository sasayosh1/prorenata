/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(-2%)' },
          '50%': { transform: 'translateY(0)' },
        }
      },
      colors: {
        'brand-pink': '#fff4f4',
        'brand-cyan': '#f4ffff',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'bounce-gentle': 'bounce-gentle 2s infinite',
      }
    },
  },
  plugins: [],
};
