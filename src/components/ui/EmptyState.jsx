export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-14 text-center">
      {Icon && <Icon size={22} className="mb-3 text-faint" aria-hidden="true" />}
      <h3 className="text-[15px] font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
