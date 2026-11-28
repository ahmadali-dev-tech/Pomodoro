export function Section({ id, title, description, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <h2 id={`${id}-title`} className="text-[15px] font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      <div className="panel divide-line mt-3">{children}</div>
    </section>
  )
}

/** Label and help on the left, control on the right. */
export function SettingRow({ label, description, htmlFor, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-text">{label}</label>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
