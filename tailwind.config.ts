import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	safelist: [
		{
			pattern: /^(text|ring|bg)-(ink|ink-hi|ink-dim|nav-text|nav-text-strong|nav-ring-idle|nav-ring-hover|nav-ring|nav-ring-open|nav-accent-fill|bg-pill|bg-pill-strong|bg-pill-open)$/,
			variants: ['group-hover', 'group-active', 'group-focus-visible', 'hover', 'active', 'focus-visible'],
		},
	],
	prefix: "",
        theme: {
                container: {
                        center: false,
                        padding: '0rem',
                        screens: {
                                '2xl': '100%'
                        }
                },
               extend: {
                        fontFamily: {
                                sans: ['"Red Hat Text"', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
                                display: ['"Red Hat Display"', '"Red Hat Text"', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
                                mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
                        },
                        transitionDuration: {
                                120: '120ms',
                                base: 'var(--dur-base)',
                                fast: 'var(--dur-fast)',
                        },
                        transitionTimingFunction: {
                                snap: 'var(--ease-snap)',
                        },
                       colors: {
                               border: 'hsl(var(--border))',
                               input: 'hsl(var(--input))',
                               ring: 'hsl(var(--ring))',
                               background: 'hsl(var(--background))',
                               foreground: 'hsl(var(--foreground))',
                               sidebar: 'hsl(var(--sidebar))',
                               'sidebar-foreground': 'hsl(var(--sidebar-foreground))',
                               'sidebar-muted-foreground': 'hsl(var(--sidebar-muted-foreground))',
                               'sidebar-border': 'hsl(var(--sidebar-border))',
                               'sidebar-accent': 'hsl(var(--sidebar-accent))',
                               'sidebar-accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                               'sidebar-ring': 'hsl(var(--sidebar-ring))',
                               'brand-from': 'var(--brand-from)',
                               'brand-via': 'var(--brand-via)',
                               'brand-to': 'var(--brand-to)',
                               'brand-accent': 'var(--brand-accent)',
                               'text-on-dark': 'var(--text-on-dark)',
                               'text-subtle': 'var(--text-subtle)',
                               'button-primary': 'var(--button-primary)',
                               'button-primary-hover': 'var(--button-primary-hover)',
                                // Navigation-specific colors
                                'nav-text': 'var(--nav-text-color)',
                                'nav-text-strong': 'var(--nav-text-strong-color)',
                                'nav-text-caret': 'var(--nav-text-caret-color)',
                                'nav-accent-fill': 'var(--nav-accent-fill)',
                                'nav-accent-ink': 'var(--nav-accent-ink)',
                                'nav-ring-idle': 'var(--nav-ring-idle)',
                                'nav-ring-hover': 'var(--nav-ring-hover)',
                                'nav-ring': 'var(--nav-ring)',
                                'nav-ring-open': 'var(--nav-ring-open)',
                                'ink': 'var(--ink)',
                                'ink-hi': 'var(--ink-hi)',
                                'ink-dim': 'var(--ink-dim)',
                                'bg-pill': 'var(--bg-pill)',
                                'bg-pill-strong': 'var(--bg-pill-strong)',
                                'bg-pill-open': 'var(--bg-pill-open)',
                                'topbar-ring': 'var(--topbar-ring)',
                                'topbar-ring-open': 'var(--topbar-ring-open)',
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
                                sm: 'calc(var(--radius) - 4px)',
                                1: 'var(--radius-1)',
                                2: 'var(--radius-2)',
                                3: 'var(--radius-3)',
                                4: 'var(--radius-4)',
                                pill: 'var(--radius-pill)'
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
				'scale-lift': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.92) translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1) translateY(0)'
					}
				},
				'slide-left': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-40px) scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0) scale(1)'
					}
				},
				'slide-right': {
					'0%': {
						opacity: '0',
						transform: 'translateX(40px) scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0) scale(1)'
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
                                },
				'chip-bounce': {
					'0%': {
						transform: 'scale(0.95)'
					},
					'50%': {
						transform: 'scale(1.05)'
					},
					'100%': {
						transform: 'scale(1)'
					}
				},
				'card-reveal': {
					'0%': {
						opacity: '0',
						transform: 'translateY(16px) scale(0.985)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0) scale(1.0)'
					}
				}
                        },
                        animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-up': 'slide-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
                                'scale-in': 'scale-in 0.12s ease-out',
                                'scale-lift': 'scale-lift 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                'slide-left': 'slide-left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                'slide-right': 'slide-right 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
				'flyout': 'flyout 0.15s ease-out',
				'search-result-enter': 'search-result-enter 0.12s ease-out',
				'chip-bounce': 'chip-bounce 0.25s ease-out',
				'card-reveal': 'card-reveal 0.35s ease-out',
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
        plugins: [
		animatePlugin,
		function({ addBase }: any) {
			addBase({
				'@media (prefers-reduced-motion: reduce)': {
					'*, *::before, *::after': {
						'animation-duration': '0.01ms !important',
						'animation-iteration-count': '1 !important',
						'transition-duration': '0.01ms !important',
						'scroll-behavior': 'auto !important'
					}
				}
			})
		}
	],
} satisfies Config;
