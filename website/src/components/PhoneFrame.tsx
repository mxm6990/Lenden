import type { ReactNode } from 'react'

export function PhoneFrame({
  children,
  label,
  className = '',
}: {
  children: ReactNode
  label?: string
  className?: string
}) {
  return (
    <figure className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative">
        <div
          className="pointer-events-none absolute -inset-8 rounded-[3rem] opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(74, 222, 128, 0.15) 0%, transparent 70%)' }}
          aria-hidden
        />
        <div className="relative w-[260px] rounded-[2.5rem] border border-white/10 bg-[#050706] p-2 shadow-2xl shadow-black/60 sm:w-[280px]">
          <div className="overflow-hidden rounded-[2rem] bg-lenden-black">
            <div className="relative flex h-7 items-center justify-center bg-lenden-black">
              <div className="h-[22px] w-[88px] rounded-full bg-black" aria-hidden />
              <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-white/20" />
                <span className="h-2 w-2 rounded-full bg-white/20" />
                <span className="h-2 w-2 rounded-full bg-white/20" />
              </div>
            </div>
            <div className="mockup-screen relative h-[520px] overflow-hidden">{children}</div>
            <div className="flex h-5 items-center justify-center bg-lenden-black pb-1" aria-hidden>
              <div className="h-1 w-28 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>
      {label && (
        <figcaption className="text-sm font-medium text-lenden-muted">{label}</figcaption>
      )}
    </figure>
  )
}
