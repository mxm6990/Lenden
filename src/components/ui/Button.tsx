import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: ReactNode
}

const variants = {
  primary: 'bg-lenden-mint text-lenden-black hover:bg-white active:scale-[0.98]',
  secondary: 'border border-white/10 bg-lenden-surface text-white hover:bg-lenden-card',
  ghost: 'text-lenden-muted hover:text-white hover:bg-white/5',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/20',
}

const sizes = {
  sm: 'px-3 py-2 text-xs rounded-xl',
  md: 'px-5 py-3 text-sm rounded-2xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl font-bold',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex max-w-full items-center justify-center gap-2 font-semibold transition ${variants[variant]} ${sizes[size]} ${fullWidth ? 'box-border w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
