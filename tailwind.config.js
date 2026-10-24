export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { paper: '#EEF2EF', ink: '#10231F', teal: '#0F5C57', rule: '#C9D6D0', hatch: '#F3E2B0', amberink: '#7A4E00' },
    fontFamily: { display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'], sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'] }
  } },
  plugins: []
}
