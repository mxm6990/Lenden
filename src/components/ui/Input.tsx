import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-lenden-muted">{label}</span>
      <input
        className={`w-full rounded-2xl border border-white/10 bg-lenden-surface px-4 py-3.5 text-sm text-white placeholder:text-lenden-muted/60 outline-none transition focus:border-lenden-mint/40 focus:ring-2 focus:ring-lenden-mint/15 ${className}`}
        {...props}
      />
    </label>
  )
}
