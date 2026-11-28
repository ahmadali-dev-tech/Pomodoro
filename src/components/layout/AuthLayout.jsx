import Logo from './Logo'

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex items-center gap-2.5">
          <Logo size={28} />
          <span className="text-[17px] font-semibold tracking-tight">Pomodoro</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[13.5px] text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <p className="mt-6 text-[13px] text-muted">{footer}</p>}
      </div>
    </main>
  )
}
