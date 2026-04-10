/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body:    ['"Barlow"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg:      '#07080a',
        surface: '#0c0e12',
        card:    '#111418',
        border:  '#1e222c',
        run:     '#f0f2f5',
        str:     '#8b95a8',
        muted:   '#2c313c',
        dimtext: '#636b7a',
      },
    },
  },
  plugins: [],
}
