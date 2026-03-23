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
          50: '#f0f4ff',
          100: '#d9e2ff',
          200: '#b3c5ff',
          300: '#8da8ff',
          400: '#678bff',
          500: '#000080', // Navy Blue from Logo
          600: '#000073',
          700: '#000066',
          800: '#000059',
          900: '#00004d',
        },
        gold: {
          DEFAULT: '#D4AF37', // Metallic Gold
          light: '#F9E27D',
          dark: '#AA8A2E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
