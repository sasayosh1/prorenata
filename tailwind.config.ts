import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Medical-themed color palette
      colors: {
        // Primary medical colors
        medical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Main medical blue
          600: '#0284c7', // Darker medical blue
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Clean accent colors
        clean: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Clean green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Professional grays
        professional: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', // Professional gray
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        'sans': ['var(--font-inter)', 'var(--font-noto-sans-jp)', 'system-ui', 'sans-serif'],
        'inter': ['var(--font-inter)', 'sans-serif'],
        'noto': ['var(--font-noto-sans-jp)', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.6', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.7', letterSpacing: '0.025em' }],
        'lg': ['1.125rem', { lineHeight: '1.7', letterSpacing: '0.025em' }],
        'xl': ['1.25rem', { lineHeight: '1.6', letterSpacing: '0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '1.4', letterSpacing: '0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '1.3', letterSpacing: '0.025em' }],
      },
      lineHeight: {
        'relaxed': '1.75',
        'prose': '1.8',
      },
      letterSpacing: {
        'prose': '0.025em',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      boxShadow: {
        'medical': '0 2px 8px rgba(14, 165, 233, 0.08)',
        'medical-lg': '0 8px 24px rgba(14, 165, 233, 0.12)',
        'clean': '0 2px 8px rgba(34, 197, 94, 0.08)',
        'professional': '0 2px 8px rgba(100, 116, 139, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      typography: ({ theme }: any) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.professional.700'),
            fontSize: theme('fontSize.base[0]'),
            lineHeight: theme('lineHeight.prose'),
            letterSpacing: theme('letterSpacing.prose'),
            p: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
              lineHeight: theme('lineHeight.prose'),
            },
            h1: {
              fontSize: theme('fontSize.3xl[0]'),
              fontWeight: '700',
              lineHeight: theme('fontSize.3xl[1].lineHeight'),
              color: theme('colors.professional.900'),
              marginTop: '0',
              marginBottom: '1rem',
            },
            h2: {
              fontSize: theme('fontSize.2xl[0]'),
              fontWeight: '600',
              lineHeight: theme('fontSize.2xl[1].lineHeight'),
              color: theme('colors.professional.800'),
              marginTop: '2rem',
              marginBottom: '1rem',
            },
            h3: {
              fontSize: theme('fontSize.xl[0]'),
              fontWeight: '600',
              lineHeight: theme('fontSize.xl[1].lineHeight'),
              color: theme('colors.professional.800'),
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
            },
            'h4, h5, h6': {
              fontWeight: '500',
              color: theme('colors.professional.700'),
            },
            strong: {
              color: theme('colors.professional.900'),
              fontWeight: '600',
            },
            a: {
              color: theme('colors.medical.600'),
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                color: theme('colors.medical.700'),
                textDecoration: 'underline',
              },
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.25rem',
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.25rem',
            },
            li: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            blockquote: {
              borderLeftWidth: '4px',
              borderLeftColor: theme('colors.medical.300'),
              backgroundColor: theme('colors.professional.50'),
              paddingLeft: '1rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              marginLeft: '0',
              marginRight: '0',
              fontStyle: 'normal',
              color: theme('colors.professional.700'),
            },
            code: {
              backgroundColor: theme('colors.professional.100'),
              color: theme('colors.professional.800'),
              fontSize: '0.9em',
              paddingTop: '0.25rem',
              paddingBottom: '0.25rem',
              paddingLeft: '0.375rem',
              paddingRight: '0.375rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
            },
            pre: {
              backgroundColor: theme('colors.professional.900'),
              color: theme('colors.professional.100'),
              borderRadius: '0.5rem',
              padding: '1rem',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
              padding: '0',
            },
          },
        },
        medical: {
          css: {
            '--tw-prose-links': theme('colors.medical.600'),
            '--tw-prose-invert-links': theme('colors.medical.400'),
            '--tw-prose-headings': theme('colors.professional.900'),
            '--tw-prose-invert-headings': theme('colors.professional.100'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config