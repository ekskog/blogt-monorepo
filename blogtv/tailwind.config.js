/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      fontFamily: {
        atkinson: ['"Atkinson Hyperlegible Next"', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
