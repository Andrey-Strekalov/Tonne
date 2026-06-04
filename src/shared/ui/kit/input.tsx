import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        data-slot="input"
        type={type}
        className={cn(
          'flex h-9 w-full rounded-[var(--gk-radius)] border-[1.5px] border-[var(--gk-border)] bg-paper px-3 py-1 text-sm text-ink transition-colors placeholder:text-[var(--gk-fg-muted)] focus-visible:outline-none focus-visible:border-green focus-visible:ring-4 focus-visible:ring-[rgba(63,143,78,0.15)] disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
