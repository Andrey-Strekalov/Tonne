import type * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--gk-radius-sm)] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-ink text-cream border border-ink hover:bg-graphite hover:border-graphite',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-[var(--gk-border-strong)] bg-cream text-ink hover:bg-paper hover:border-ink',
        secondary:
          'bg-cream text-ink border border-[var(--gk-border)] hover:bg-paper',
        ghost:
          'bg-transparent text-ink border border-[var(--gk-border)] hover:bg-[rgba(14,26,20,0.04)] hover:border-[var(--gk-border-strong)]',
        link: 'text-ink underline-offset-4 hover:underline',
        accent:
          'bg-green text-cream border border-green hover:bg-green-deep hover:border-green-deep',
      },
      size: {
        default: 'h-9 px-4 py-2 text-[13px]',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-8 text-[14px]',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
