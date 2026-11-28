/** Dial mark: a ring, a hand and a stem. Matches the favicon. */
export default function Logo({ size = 24, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="17.5" r="10" stroke="var(--accent)" strokeWidth="2.6" />
      <path d="M16 17.5V12" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M13 5.5h6" stroke="var(--text)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}
