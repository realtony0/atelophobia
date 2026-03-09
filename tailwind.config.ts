import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#05000a',
        surface: '#0d0010',
        'text-primary': '#e8d5f5',
        'mauve-dim': 'rgba(160, 80, 200, 0.12)',
        'mauve-muted': 'rgba(200, 170, 220, 0.4)',
        'mauve-accent': 'rgba(190, 120, 230, 0.9)'
      },
      letterSpacing: {
        logo: '0.35em',
        nav: '0.04em',
        meta: '0.22em',
        size: '0.2em',
        cta: '0.35em'
      },
      fontFamily: {
        display: ['var(--font-bebas)'],
        condensed: ['var(--font-barlow)']
      },
      boxShadow: {
        mauve: '0 0 20px rgba(160, 60, 200, 0.4)',
        logo: '0 0 30px rgba(160, 60, 200, 0.3)',
        nav: '0 0 60px rgba(160, 60, 200, 0.4)'
      }
    }
  },
  plugins: []
};

export default config;
