import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import Switch from '@/components/ui/Switch'
import { Input, Select } from '@/components/ui/Field'
import DataManagement from '@/components/settings/DataManagement'
import { Section, SettingRow } from '@/components/settings/SettingRow'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTimerStore } from '@/stores/timerStore'
import { useUIStore, THEME_PRESETS } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import { playRingtone } from '@/lib/audio'
import { contrastRatio } from '@/lib/color'
import { notificationPermission, requestNotificationPermission } from '@/lib/notify'
import { cn } from '@/lib/utils'

const NAV = [['appearance', 'Appearance'], ['timer', 'Timer'], ['notifications', 'Notifications'], ['data', 'Data and backup'], ['account', 'Account']]
const MODES = [{ id: 'dark', label: 'Dark', Icon: Moon }, { id: 'light', label: 'Light', Icon: Sun }, { id: 'system', label: 'System', Icon: Monitor }]

/** Number input that only saves a valid value; shows why when it can't. */
function NumberSetting({ id, value, min, max, onSave, unit }) {
  const [text, setText] = useState(String(value))
  const [error, setError] = useState('')
  const commit = () => {
    const n = Number(text)
    if (text.trim() === '' || !Number.isInteger(n) || n < min || n > max) {
      setError(`${min}–${max}`)
      return
    }
    setError('')
    if (n !== value) onSave(n)
  }
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2">
        <Input
          id={id} type="number" inputMode="numeric" min={min} max={max} value={text}
          onChange={(e) => { setText(e.target.value); setError('') }}
          onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-invalid={error ? 'true' : undefined}
          className="field-sm tnum w-20 text-right"
        />
        {unit && <span className="w-8 text-xs text-muted">{unit}</span>}
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-danger">Enter a whole number, {error}</p>}
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const theme = useUIStore(s => s.theme)
  const setTheme = useUIStore(s => s.setTheme)
  const themePreset = useUIStore(s => s.themePreset)
  const setThemePreset = useUIStore(s => s.setThemePreset)
  const customAccent = useUIStore(s => s.customAccent)
  const setCustomAccent = useUIStore(s => s.setCustomAccent)
  const resolved = useResolvedTheme()
  const settings = useSettingsStore()
  const user = useAuthStore(s => s.user)
  const signOut = useAuthStore(s => s.signOut)
  const [signingOut, setSigningOut] = useState(false)
  const [hex, setHex] = useState(customAccent)

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest'
  const surface = THEME_PRESETS[themePreset]?.[resolved]?.surface || '#1A2027'
  const lowContrast = customAccent && (contrastRatio(customAccent, surface) ?? 21) < 3

  const saveDuration = (key) => (n) => {
    settings.update({ [key]: n })
    if (useTimerStore.getState().status === 'idle') useTimerStore.getState().reset()
    toast.success('Timer setting saved')
  }

  const toggleNotifications = async (on) => {
    settings.update({ notificationEnabled: on })
    if (!on) return
    const result = notificationPermission() === 'default' ? await requestNotificationPermission() : notificationPermission()
    if (result === 'denied') toast.info('Browser notifications are blocked', { description: 'You’ll still see session updates in your Inbox. Allow notifications for this site in your browser to get alerts.' })
    else if (result === 'unsupported') toast.info('This browser can’t show system notifications', { description: 'Session updates will appear in your Inbox.' })
  }

  const applyHex = (value) => {
    setHex(value)
    const v = value.trim()
    if (/^#[0-9a-f]{6}$/i.test(v)) setCustomAccent(v.toUpperCase())
    else if (!v) setCustomAccent('')
  }

  const doSignOut = async () => {
    setSigningOut(true)
    try { await signOut(); navigate('/login') } catch { setSigningOut(false); toast.error('Couldn’t sign out. Check your connection and try again.') }
  }

  return (
    <div className="mx-auto w-full max-w-[920px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Settings" />
      <div className="grid gap-8 md:grid-cols-[160px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="scroll-quiet -mx-4 flex gap-1 overflow-x-auto px-4 md:sticky md:top-20 md:mx-0 md:flex-col md:self-start md:px-0">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-md px-2.5 py-1.5 text-[13.5px] text-muted hover:bg-raised hover:text-text">{label}</a>
          ))}
        </nav>

        <div className="min-w-0 space-y-9">
          <Section id="appearance" title="Appearance" description="Themes restyle the whole app: surfaces, borders, text and accent.">
            <div className="p-4">
              <div className="mb-2 text-sm font-medium">Mode</div>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Color mode">
                {MODES.map(({ id, label, Icon }) => (
                  <button key={id} type="button" aria-pressed={theme === id} onClick={() => setTheme(id)}
                    className={cn('flex h-10 items-center justify-center gap-2 rounded-md border text-[13px] font-medium', theme === id ? 'border-accent bg-accent-soft text-text' : 'border-line-strong text-muted hover:text-text')}>
                    <Icon size={15} aria-hidden="true" />{label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2 text-sm font-medium">Theme</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Color theme">
                {Object.entries(THEME_PRESETS).map(([id, preset]) => {
                  const p = preset[resolved]
                  const on = themePreset === id && !customAccent
                  return (
                    <button key={id} type="button" aria-pressed={on} onClick={() => { setThemePreset(id); setHex('') }}
                      className={cn('overflow-hidden rounded-md border text-left', on ? 'border-accent ring-1 ring-accent' : 'border-line-strong hover:border-muted')}>
                      <span className="block h-12 p-2" style={{ background: p.bg }} aria-hidden="true">
                        <span className="flex h-full items-end gap-1.5 rounded-[4px] p-1.5" style={{ background: p.surface }}>
                          <span className="h-1.5 w-8 rounded-full" style={{ background: p.accent }} />
                          <span className="h-1.5 w-5 rounded-full opacity-40" style={{ background: p.accent }} />
                        </span>
                      </span>
                      <span className="flex items-center justify-between px-2.5 py-2 text-[13px]">
                        {preset.label}{on && <Check size={14} className="text-accent" aria-hidden="true" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="p-4">
              <div className="text-sm font-medium">Custom accent color</div>
              <p className="mb-3 mt-0.5 text-xs text-muted">Replaces the theme’s accent on buttons, highlights and the timer.</p>
              <div className="flex flex-wrap items-center gap-2">
                <input type="color" aria-label="Pick accent color" value={/^#[0-9a-f]{6}$/i.test(customAccent) ? customAccent : THEME_PRESETS[themePreset]?.[resolved]?.accent || '#F2704F'}
                  onChange={(e) => applyHex(e.target.value.toUpperCase())} className="h-9 w-12 cursor-pointer rounded-md border border-line-strong bg-transparent p-0.5" />
                <Input aria-label="Accent hex value" value={hex} onChange={(e) => applyHex(e.target.value)} placeholder="#F2704F" maxLength={7} className="field-sm w-28 uppercase" />
                {customAccent && <Button size="sm" variant="ghost" onClick={() => { setCustomAccent(''); setHex('') }}>Reset to theme</Button>}
              </div>
              {lowContrast && <p role="alert" className="mt-2 text-xs text-warning">This color is hard to see against the current background. Text and icons in the accent color may be difficult to read.</p>}
            </div>
          </Section>

          <Section id="timer" title="Timer" description="Changes apply to the next session. Idle timers update right away.">
            <SettingRow label="Focus length" htmlFor="focus-min"><NumberSetting id="focus-min" value={settings.focusDuration} min={1} max={180} unit="min" onSave={saveDuration('focusDuration')} /></SettingRow>
            <SettingRow label="Short break" htmlFor="short-min"><NumberSetting id="short-min" value={settings.shortBreakDuration} min={1} max={60} unit="min" onSave={saveDuration('shortBreakDuration')} /></SettingRow>
            <SettingRow label="Long break" htmlFor="long-min"><NumberSetting id="long-min" value={settings.longBreakDuration} min={1} max={120} unit="min" onSave={saveDuration('longBreakDuration')} /></SettingRow>
            <SettingRow label="Long break after" description="Focus sessions between long breaks" htmlFor="interval"><NumberSetting id="interval" value={settings.longBreakInterval} min={2} max={12} onSave={(n) => { settings.update({ longBreakInterval: n }); toast.success('Timer setting saved') }} /></SettingRow>
            <SettingRow label="Start breaks automatically" htmlFor="auto-breaks"><Switch id="auto-breaks" label="Start breaks automatically" checked={settings.autoStartBreaks} onChange={(v) => settings.update({ autoStartBreaks: v })} /></SettingRow>
            <SettingRow label="Start focus automatically" description="After a break ends" htmlFor="auto-focus"><Switch id="auto-focus" label="Start focus automatically" checked={settings.autoStartFocus} onChange={(v) => settings.update({ autoStartFocus: v })} /></SettingRow>
          </Section>

          <Section id="notifications" title="Notifications">
            <SettingRow label="Sound when a session ends" htmlFor="sound-on"><Switch id="sound-on" label="Sound when a session ends" checked={settings.soundEnabled} onChange={(v) => settings.update({ soundEnabled: v })} /></SettingRow>
            {settings.soundEnabled && (
              <SettingRow label="Alert sound" htmlFor="ringtone">
                <div className="flex items-center gap-2">
                  <Select id="ringtone" value={settings.ringtone || 'chime'} onChange={(e) => settings.update({ ringtone: e.target.value })} className="field-sm w-28">
                    <option value="chime">Chime</option><option value="bell">Bell</option><option value="digital">Digital</option>
                  </Select>
                  <Button size="sm" onClick={() => playRingtone(settings.ringtone)}>Test</Button>
                </div>
              </SettingRow>
            )}
            <SettingRow label="Session notifications" description="Add finished sessions to your Inbox and show a browser alert when the tab is in the background" htmlFor="notify-on">
              <Switch id="notify-on" label="Session notifications" checked={settings.notificationEnabled} onChange={toggleNotifications} />
            </SettingRow>
          </Section>

          <div id="data" className="scroll-mt-20"><DataManagement /></div>

          <Section id="account" title="Account">
            <SettingRow label="Name">{<span className="text-sm text-muted">{name}</span>}</SettingRow>
            <SettingRow label="Email"><span className="text-sm text-muted">{user?.email}</span></SettingRow>
            {user && <div className="px-4 py-3.5"><Button variant="danger-quiet" onClick={doSignOut} loading={signingOut}>Sign out</Button></div>}
          </Section>
        </div>
      </div>
    </div>
  )
}
