import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					hover: 'hsl(var(--accent-hover))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				// Iceland B2B specific colors
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
				},
				error: {
					DEFAULT: 'hsl(var(--error))',
					foreground: 'hsl(var(--error-foreground))',
				},
				// Brand colors from specification
				brand: {
					50: '#ECF5F8',
					100: '#D6ECF2',
					200: '#B3DCE6',
					300: '#8FCBDD',
					400: '#5DB3CF',
					500: '#2D9BC0', // primary
					600: '#1D84A9',
					700: '#186C8B',
					800: '#12556E',
					900: '#0D3E51',
				},
				'accent-highlight': '#F2B04E',
				// VAT specific
				'vat-inclusive': 'hsl(var(--vat-inclusive))',
				'vat-exclusive': 'hsl(var(--vat-exclusive))',
				// Price comparison
				'price-best': 'hsl(var(--price-best))',
				'price-good': 'hsl(var(--price-good))',
				'price-average': 'hsl(var(--price-average))',
				'price-expensive': 'hsl(var(--price-expensive))',
				// Data table
				'table-header': 'hsl(var(--table-header))',
				'table-row-hover': 'hsl(var(--table-row-hover))',
				'table-border': 'hsl(var(--table-border))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'slide-up': {
					from: {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-in': {
					from: {
						opacity: '0'
					},
					to: {
						opacity: '1'
					}
				},
				'scale-in': {
					from: {
						opacity: '0',
						transform: 'scale(0.98)'
					},
					to: {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'flyout': {
					'0%': {
						opacity: '1',
						transform: 'scale(1) translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'scale(0.8) translateY(-20px)'
					}
				},
				'search-result-enter': {
					from: {
						opacity: '0',
						transform: 'scale(0.98) translateY(-4px)'
					},
					to: {
						opacity: '1',
						transform: 'scale(1) translateY(0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-up': 'slide-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.12s ease-out',
				'flyout': 'flyout 0.15s ease-out',
				'search-result-enter': 'search-result-enter 0.12s ease-out',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
			},
			fontFeatureSettings: {
				'tnum': '"tnum" 1',
			},
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'focus': '0 1px 0 #0000000A, 0 2px 8px #00000014',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
