/** Tailwind config for the Ethan Tiong portfolio shell.
 *  Add the Google Fonts <link> from export/README to your index.html:
 *  Fraunces (display), IBM Plex Sans (body), IBM Plex Mono (labels).
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f4f1e9',
        ink: '#15110d',
        seal: '#7A1712',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        revealUp: { from: { opacity: '0', transform: 'translateY(42px)' }, to: { opacity: '1', transform: 'none' } },
        heroRise: { from: { transform: 'translateY(44px)' }, to: { transform: 'none' } },
        statusPulse: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.25' } },
      },
      animation: {
        revealUp: 'revealUp 0.9s cubic-bezier(.2,.7,.2,1) both',
        heroRise: 'heroRise 1.1s cubic-bezier(.2,.7,.2,1) both',
        statusPulse: 'statusPulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
