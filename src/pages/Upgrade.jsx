import { Check, Minus } from 'lucide-react'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'

const FREE = [
  'Focus timer with breaks and long-break cycles',
  'Tasks, projects, calendar and habits',
  'Goals and analytics from your own sessions',
  'All color themes and custom accent colors',
  'Focus sounds',
  'Cloud sync between devices',
  'JSON backup and CSV export',
]
const PLANNED = [
  'More detailed productivity insights',
  'Longer history views',
  'Exportable analytics reports',
  'Priority support',
]

export default function Upgrade() {
  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Plans" description="Everything in the app is free today. A paid plan is planned but isn’t available yet." />

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="free-plan" className="panel flex flex-col p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="free-plan" className="text-base font-semibold">Free</h2>
            <span className="rounded-full border border-accent px-2.5 py-0.5 text-xs font-medium text-accent">Your plan</span>
          </div>
          <p className="font-display mt-3 text-[32px] font-semibold leading-none tracking-tight">$0</p>
          <p className="mt-1 text-[13px] text-muted">Included with your account.</p>
          <ul className="mt-5 flex-1 space-y-2.5">
            {FREE.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-[13.5px]"><Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pro-plan" className="panel flex flex-col border-dashed p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="pro-plan" className="text-base font-semibold">Pro</h2>
            <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs font-medium text-muted">Planned</span>
          </div>
          <p className="mt-3 text-[15px] font-medium text-muted">Pricing not announced</p>
          <p className="mt-1 text-[13px] text-muted">No subscriptions are being sold and nothing in the app is locked.</p>
          <p className="mt-5 text-xs font-medium text-muted">Everything in Free, plus these planned additions:</p>
          <ul className="mt-2.5 flex-1 space-y-2.5">
            {PLANNED.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-muted"><Minus size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />{item}</li>
            ))}
          </ul>
          <Button className="mt-6 w-full" disabled>Not available yet</Button>
        </section>
      </div>

      <p className="mt-5 text-xs text-muted">Planned features may change before release. This page is informational only: no payment, checkout or feature restriction is active.</p>
    </div>
  )
}
