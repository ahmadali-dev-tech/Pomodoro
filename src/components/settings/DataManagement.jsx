import { useRef, useState } from 'react'
import { FileJson, FileSpreadsheet, Upload } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import { Select } from '@/components/ui/Field'
import { Section, SettingRow } from './SettingRow'
import { useTaskStore } from '@/stores/taskStore'
import { useProjectStore } from '@/stores/projectStore'
import { useHabitStore } from '@/stores/habitStore'
import { useGoalStore } from '@/stores/goalStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUIStore, normalizePreset } from '@/stores/uiStore'
import { useTimerStore } from '@/stores/timerStore'
import { uid, cn } from '@/lib/utils'

const BACKUP_VERSION = 1
const SETTING_KEYS = ['focusDuration', 'shortBreakDuration', 'longBreakDuration', 'longBreakInterval', 'autoStartBreaks', 'autoStartFocus', 'soundEnabled', 'ringtone', 'notificationEnabled', 'accent', 'glassIntensity', 'reducedMotion']
const THEMES = ['dark', 'light', 'system']

function downloadFile(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function getBackupData() {
  const tasks = useTaskStore.getState()
  const projects = useProjectStore.getState()
  const habits = useHabitStore.getState()
  const goals = useGoalStore.getState()
  const settings = useSettingsStore.getState()
  const ui = useUIStore.getState()
  return {
    app: 'Pomodoro',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      tasks: { tasks: tasks.tasks, sessions: tasks.sessions },
      projects: { projects: projects.projects, sharedProjects: projects.sharedProjects },
      habits: { habits: habits.habits },
      goals: { goals: goals.goals },
      settings: Object.fromEntries(SETTING_KEYS.map(key => [key, settings[key]])),
      ui: { theme: ui.theme, themePreset: ui.themePreset, customAccent: ui.customAccent },
    },
  }
}

function validateBackup(backup) {
  if (!backup || typeof backup !== 'object') throw new Error('This file isn’t a valid backup.')
  if (backup.app !== 'Pomodoro') throw new Error('This file isn’t a Pomodoro backup.')
  if (backup.version !== BACKUP_VERSION) throw new Error('This backup was made by a different version of the app and can’t be imported.')
  const data = backup.data
  if (!data || typeof data !== 'object') throw new Error('The backup has no data section.')
  if (
    !data.tasks || !Array.isArray(data.tasks.tasks) || !Array.isArray(data.tasks.sessions) ||
    !data.projects || !Array.isArray(data.projects.projects) || !Array.isArray(data.projects.sharedProjects) ||
    !data.habits || !Array.isArray(data.habits.habits) ||
    !data.goals || typeof data.goals.goals !== 'object' ||
    !data.settings || typeof data.settings !== 'object' ||
    !data.ui || !THEMES.includes(data.ui.theme)
  ) throw new Error('The backup is incomplete or damaged.')
  const bad = (list, keys) => list.some(item => !item || keys.some(([k, type]) => typeof item[k] !== type))
  if (bad(data.tasks.tasks, [['id', 'string'], ['title', 'string']]) || bad(data.projects.projects, [['id', 'string']]) || bad(data.habits.habits, [['id', 'string']])) {
    throw new Error('The backup contains records that can’t be read.')
  }
  return data
}

/** Keep only known settings with sane values. */
function cleanSettings(raw) {
  const out = {}
  const int = (k, min, max) => { if (Number.isInteger(raw[k]) && raw[k] >= min && raw[k] <= max) out[k] = raw[k] }
  int('focusDuration', 1, 180); int('shortBreakDuration', 1, 60); int('longBreakDuration', 1, 120); int('longBreakInterval', 2, 12)
  ;['autoStartBreaks', 'autoStartFocus', 'soundEnabled', 'notificationEnabled', 'reducedMotion'].forEach(k => { if (typeof raw[k] === 'boolean') out[k] = raw[k] })
  if (['chime', 'bell', 'digital'].includes(raw.ringtone)) out.ringtone = raw.ringtone
  if (typeof raw.accent === 'string') out.accent = raw.accent
  if (typeof raw.glassIntensity === 'string') out.glassIntensity = raw.glassIntensity
  return out
}

function mergeRecords(existing = [], incoming = []) {
  const records = new Map()
  existing.forEach(item => { if (item?.id != null) records.set(String(item.id), item) })
  incoming.forEach(item => { if (item?.id != null) records.set(String(item.id), { ...records.get(String(item.id)), ...item }) })
  return Array.from(records.values())
}

function exportCSV() {
  const tasks = useTaskStore.getState().tasks
  const columns = ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'projectId', 'estimatedPomodoros', 'actualPomodoros', 'createdAt', 'completedAt']
  const esc = (value) => `"${(value == null ? '' : String(value)).replace(/"/g, '""')}"`
  const rows = [columns.join(','), ...tasks.map(task => columns.map(c => esc(task[c])).join(','))]
  downloadFile('\uFEFF' + rows.join('\r\n'), `pomodoro-tasks-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;')
}

function resolveImportedTasks(existingTasks, importedTasks, choices) {
  const result = new Map(existingTasks.map(task => [String(task.id), task]))
  const taskIdMap = new Map()
  importedTasks.forEach(task => {
    const oldId = String(task.id)
    if (!result.has(oldId)) { result.set(oldId, task); return }
    const choice = choices[oldId]
    if (choice === 'replace') result.set(oldId, task)
    else if (choice === 'new') {
      const newId = uid()
      taskIdMap.set(oldId, newId)
      result.set(newId, { ...task, id: newId })
    }
  })
  return { tasks: Array.from(result.values()), taskIdMap }
}

function resolveImportedSessions(existingSessions, importedSessions, taskIdMap) {
  const result = new Map(existingSessions.filter(s => s?.id != null).map(s => [String(s.id), s]))
  importedSessions.forEach(session => {
    if (!session) return
    const oldTaskId = session.taskId == null ? null : String(session.taskId)
    const remapped = oldTaskId != null && taskIdMap.has(oldTaskId)
    const imported = { ...session, taskId: remapped ? taskIdMap.get(oldTaskId) : session.taskId, id: remapped ? uid() : session.id }
    const key = String(imported.id ?? uid())
    result.set(key, { ...result.get(key), ...imported, id: key })
  })
  return Array.from(result.values())
}

export default function DataManagement() {
  const fileInput = useRef(null)
  const [mode, setMode] = useState('merge')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [pending, setPending] = useState(null) // { data, mode, conflicts, confirmReplace }
  const [choices, setChoices] = useState({})
  const counts = {
    tasks: useTaskStore(s => s.tasks.length),
    projects: useProjectStore(s => s.projects.length),
    habits: useHabitStore(s => s.habits.length),
  }

  const exportJSON = () => {
    try {
      downloadFile(JSON.stringify(getBackupData(), null, 2), `pomodoro-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
      setMessage({ type: 'success', text: 'Backup downloaded.' })
    } catch (error) {
      setMessage({ type: 'error', text: `Couldn’t create the backup: ${error.message}` })
    }
  }

  const applyImport = (data, importChoices, importMode) => {
    try {
      const current = {
        tasks: useTaskStore.getState(),
        projects: useProjectStore.getState(),
        habits: useHabitStore.getState(),
      }
      const replace = importMode === 'replace'
      const taskResolution = replace ? { tasks: data.tasks.tasks, taskIdMap: new Map() } : resolveImportedTasks(current.tasks.tasks, data.tasks.tasks, importChoices)
      useTaskStore.setState({
        tasks: taskResolution.tasks,
        sessions: replace ? data.tasks.sessions : resolveImportedSessions(current.tasks.sessions, data.tasks.sessions, taskResolution.taskIdMap),
      })
      useProjectStore.setState({
        projects: replace ? data.projects.projects : mergeRecords(current.projects.projects, data.projects.projects),
        sharedProjects: replace ? data.projects.sharedProjects : mergeRecords(current.projects.sharedProjects, data.projects.sharedProjects),
      })
      useHabitStore.setState({ habits: replace ? data.habits.habits : mergeRecords(current.habits.habits, data.habits.habits) })
      if (replace) {
        useGoalStore.setState({ goals: data.goals.goals })
        useSettingsStore.setState(cleanSettings(data.settings))
        useUIStore.setState({
          theme: data.ui.theme,
          themePreset: normalizePreset(data.ui.themePreset),
          customAccent: /^#[0-9a-f]{6}$/i.test(data.ui.customAccent || '') ? data.ui.customAccent : '',
        })
        if (useTimerStore.getState().status === 'idle') useTimerStore.getState().reset()
      }
      setPending(null)
      setChoices({})
      const text = `Imported ${data.tasks.tasks.length} tasks, ${data.projects.projects.length} projects and ${data.habits.habits.length} habits.`
      setMessage({ type: 'success', text })
      toast.success('Backup imported')
    } catch (error) {
      console.error('Backup import failed', error)
      setMessage({ type: 'error', text: `The import failed and no changes were kept: ${error.message}` })
    }
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setMessage(null)
    try {
      if (!file.name.toLowerCase().endsWith('.json')) throw new Error('Choose a .json backup file.')
      if (file.size > 10 * 1024 * 1024) throw new Error('The backup file must be smaller than 10 MB.')
      let parsed
      try { parsed = JSON.parse(await file.text()) } catch { throw new Error('This file isn’t valid JSON.') }
      const data = validateBackup(parsed)
      if (mode === 'replace') { setPending({ data, mode, conflicts: [], confirmReplace: true }); return }
      const existing = new Set(useTaskStore.getState().tasks.map(t => String(t.id)))
      const conflicts = data.tasks.tasks.filter(t => existing.has(String(t.id)))
      if (conflicts.length) { setChoices({}); setPending({ data, mode, conflicts }); return }
      applyImport(data, {}, 'merge')
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'The import failed.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section id="data-section" title="Data and backup" description="Your data is also synced to your account. Backups are made in your browser and never uploaded.">
      <div className="grid grid-cols-3 divide-x divide-line">
        {[['Tasks', counts.tasks], ['Projects', counts.projects], ['Habits', counts.habits]].map(([label, n]) => (
          <div key={label} className="px-4 py-3"><div className="font-display tnum text-xl font-semibold">{n}</div><div className="text-xs text-muted">{label}</div></div>
        ))}
      </div>
      <SettingRow label="Full backup" description="Tasks, sessions, projects, habits, goals and settings (JSON)"><Button onClick={exportJSON}><FileJson size={15} aria-hidden="true" />Download JSON</Button></SettingRow>
      <SettingRow label="Tasks spreadsheet" description="All tasks as CSV for Excel or Google Sheets"><Button onClick={exportCSV}><FileSpreadsheet size={15} aria-hidden="true" />Export CSV</Button></SettingRow>
      <div className="space-y-3 px-4 py-3.5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <label htmlFor="import-mode" className="block text-sm font-medium">Restore from backup</label>
            <p className="mt-0.5 text-xs text-muted">{mode === 'merge' ? 'Adds the backup’s data and keeps what you have.' : 'Replaces everything with the backup’s contents.'}</p>
          </div>
          <Select id="import-mode" value={mode} onChange={(e) => setMode(e.target.value)} className="field-sm w-32">
            <option value="merge">Merge</option>
            <option value="replace">Replace</option>
          </Select>
        </div>
        <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} aria-label="Choose a backup file" />
        <Button onClick={() => fileInput.current?.click()} loading={busy}><Upload size={15} aria-hidden="true" />{busy ? 'Reading backup…' : 'Choose backup file'}</Button>
        {message && <p role={message.type === 'error' ? 'alert' : 'status'} className={cn('text-[13px]', message.type === 'error' ? 'text-danger' : 'text-success')}>{message.text}</p>}
      </div>

      <ConfirmDialog
        open={Boolean(pending?.confirmReplace)}
        title="Replace all current data?"
        description="Your tasks, sessions, projects, habits, goals and settings will be overwritten by the backup. This can’t be undone, so download a backup first if you might need your current data."
        confirmLabel="Replace everything"
        destructive
        onCancel={() => setPending(null)}
        onConfirm={() => applyImport(pending.data, {}, 'replace')}
      >
        {pending?.data && (
          <p className="tnum text-[13px] text-muted">
            Now: {counts.tasks} tasks, {counts.projects} projects, {counts.habits} habits.<br />
            Backup: {pending.data.tasks.tasks.length} tasks, {pending.data.projects.projects.length} projects, {pending.data.habits.habits.length} habits.
          </p>
        )}
      </ConfirmDialog>

      <Modal
        open={Boolean(pending && pending.conflicts.length > 0)}
        onClose={() => setPending(null)}
        title="Some tasks already exist"
        description={`${pending?.conflicts.length || 0} imported ${pending?.conflicts.length === 1 ? 'task has' : 'tasks have'} the same ID as a task you already have. Choose what to do with each.`}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
            <Button variant="primary" disabled={pending?.conflicts.some(t => !choices[String(t.id)])} onClick={() => applyImport(pending.data, choices, 'merge')}>Import</Button>
          </>
        )}
      >
        <ul className="space-y-2.5">
          {pending?.conflicts.map(task => (
            <li key={task.id} className="rounded-md border border-line p-3">
              <p className="truncate text-sm font-medium">{task.title}</p>
              <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label={`Resolve “${task.title}”`}>
                {[['replace', 'Replace existing'], ['new', 'Keep both']].map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={choices[String(task.id)] === value} onClick={() => setChoices(c => ({ ...c, [String(task.id)]: value }))}
                    className={cn('h-8 rounded-md border text-[13px] font-medium', choices[String(task.id)] === value ? 'border-accent bg-accent-soft text-text' : 'border-line-strong text-muted hover:text-text')}>{label}</button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </Section>
  )
}
