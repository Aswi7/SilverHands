/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          DEFAULT: '#E07A5F',
          hover: '#d5684b',
        },
        forest: {
          DEFAULT: '#3D5A50',
          hover: '#2f463e',
        },
        cream: {
          DEFAULT: '#FAF6F0',
          dark: '#f0e8dc',
        },
        charcoal: {
          DEFAULT: '#2B2B2B',
          light: '#4a4a4a',
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'DM Serif Display', 'serif'],
        sans: ['Poppins', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
