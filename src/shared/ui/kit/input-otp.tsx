import * as React from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'
import { cn } from '@/shared/lib/utils'

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-1', className)}
    data-slot="input-otp-group"
    {...props}
  />
))
InputOTPGroup.displayName = 'InputOTPGroup'

const InputOTPSlot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const slot = inputOTPContext.slots[index]

  if (!slot) {return null}

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center border border-input rounded-md text-sm shadow-sm transition-all pointer-events-none',
        'first:rounded-l-md last:rounded-r-md',
        slot.isActive &&
          'z-10 ring-2 ring-ring ring-offset-background',
        className
      )}
      data-slot="input-otp-slot"
      data-active={slot.isActive}
      {...props}
    >
      {slot.char}
      {slot.hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = 'InputOTPSlot'

const InputOTP = React.forwardRef<
  React.ComponentRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      'group flex items-center has-[:disabled]:opacity-50',
      containerClassName
    )}
    data-slot="input-otp"
    {...props}
  />
))
InputOTP.displayName = 'InputOTP'

export { InputOTP, InputOTPGroup, InputOTPSlot }
