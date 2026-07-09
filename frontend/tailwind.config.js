// Change 153
// Change 141
// Change 129
// Change 117
// Change 105
// Change 93
// Change 81
// Change 69
// Change 57
// Change 45
// Change 33
// Change 21
// Change 9
// Update 165
// Update 153
// Update 141
// Update 129
// Update 117
// Update 105
// Update 93
// Update 81
// Update 69
// Update 57
// Update 45
// Update 33
// Update 21
// Update 9
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.21 0.04 265)',
        brand: 'oklch(0.21 0.04 265)',
        'brand-foreground': 'oklch(1 0 0)',
        surface: 'oklch(0.985 0.005 247)',
        primary: {
          DEFAULT: 'oklch(0.55 0.22 264)',
          foreground: 'oklch(1 0 0)',
        },
        secondary: {
          DEFAULT: 'oklch(0.968 0.007 247.896)',
          foreground: 'oklch(0.208 0.042 265.755)',
        },
        muted: {
          DEFAULT: 'oklch(0.968 0.007 247.896)',
          foreground: 'oklch(0.554 0.046 257.417)',
        },
        border: 'oklch(0.929 0.013 255.508)',
        input: 'oklch(0.929 0.013 255.508)',
        ring: 'oklch(0.704 0.04 256.788)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
    },
  },
  plugins: [],
}



























