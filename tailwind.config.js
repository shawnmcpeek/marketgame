const colors = {
  clover: {
    black: '#0e1104',    // Dark background
    dark: '#344912',     // Dark accent
    gray: '#616d53',     // Neutral text/borders
    green: '#4d671e',    // Primary buttons/links
    pink: '#ee8c8d'      // Highlights/accents
  }
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: colors,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace']
      }
    }
  },
  plugins: []
}; 