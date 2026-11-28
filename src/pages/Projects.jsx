import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ColorPicker from '@/components/ui/ColorPicker'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import ProgressBar from '@/components/ui/ProgressBar'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { dueKey, dueToStored, formatDue, formatMinutes } from '@/lib/utils'

const BLANK = { name: '', description: '', color: '#3D8BD6', icon: '📁', targetDate: '' }

export default function Projects() {
  const navigate = useNavigate()
  const projects = useProjectStore(s => s.projects)
  const sharedProjects = useProjectStore(s => s.sharedProjects) || []
  const { addProject, updateProject, deleteProject, setSharedProjects } = useProjectStore.getState()
  const tasks = useTaskStore(s => s.tasks)
  const sessions = useTaskStore(s => s.sessions)
  const user = useAuthStore(s => s.user)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!user) return
    const loadSharedProjects = async () => {
      const { data: memberships, error: memberError } = await supabase
        .from('project_members')
        .select('project_id, role, status')
        .eq('member_id', user.id)
        .eq('status', 'accepted')
      if (memberError || !memberships?.length) {
        setSharedProjects([])
        return
      }
      const ownedStates = await Promise.all(
        memberships.map(async membership => {
          const { data } = await supabase.from('app_state').select('user_id,state')
          if (!data) return null
          for (const row of data) {
            const shared = row.state?.projects?.projects?.find(project => project.id === membership.project_id)
            if (shared) return { ...shared, sharedRole: membership.role }
          }
          return null
        })
      )
      setSharedProjects(ownedStates.filter(Boolean))
    }
    loadSharedProjects()
  }, [user?.id, setSharedProjects])

  const openNew = () => { setEditing(null); setForm(BLANK); setError(''); setFormOpen(true) }
  const openEdit = (project) => {
    setEditing(project)
    setForm({
      name: project.name || '',
      description: project.description || '',
      color: project.color || BLANK.color,
      icon: project.icon || '📁',
      targetDate: dueKey(project.targetDate) || '',
    })
    setError('')
    setFormOpen(true)
  }
  const close = () => { setFormOpen(false); setEditing(null) }

  const submit = (event) => {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) { setError('Give the project a name.'); return }
    const data = { name, description: form.description.trim(), color: form.color, icon: form.icon.trim() || '📁', targetDate: dueToStored(form.targetDate) }
    if (editing) { updateProject(editing.id, data); toast.success('Project updated') }
    else { addProject(data); toast.success('Project created') }
    close()
  }

  const confirmDelete = () => {
    const keptTasks = tasks.filter(t => t.projectId === deleting.id).length
    useTaskStore.getState().unassignProject(deleting.id)
    deleteProject(deleting.id)
    toast.success(keptTasks ? `Project deleted. ${keptTasks} ${keptTasks === 1 ? 'task was' : 'tasks were'} kept.` : 'Project deleted')
    setDeleting(null)
  }

  const renderRow = (project, shared) => {
    const own = tasks.filter(t => t.projectId === project.id)
    const done = own.filter(t => t.status === 'completed').length
    const focus = Math.round(sessions.filter(s => s.projectId === project.id && s.sessionType === 'focus').reduce((a, s) => a + s.actualDurationSeconds / 60, 0))
    return (
      <li key={project.id} className="group flex items-center gap-3 px-4 py-3.5 hover:bg-raised/60">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg" style={{ background: `color-mix(in srgb, ${project.color || '#7C8794'} 18%, var(--surface))` }} aria-hidden="true">{project.icon}</span>
        <button type="button" onClick={() => navigate(`/projects/${project.id}`)} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-medium text-text group-hover:text-accent">{project.name}</span>
          <span className="block truncate text-xs text-muted">
            {shared
              ? `Shared with you · ${project.sharedRole}`
              : [project.description, project.targetDate && `Target ${formatDue(project.targetDate)}`].filter(Boolean).join(' · ') || 'No description'}
          </span>
        </button>
        {!shared && (
          <div className="hidden w-48 shrink-0 sm:block">
            <div className="tnum mb-1 flex justify-between text-xs text-muted">
              <span>{done} of {own.length} tasks</span>
              <span>{formatMinutes(focus)}</span>
            </div>
            <ProgressBar value={done} max={own.length || 1} color={project.color} label={`${project.name} progress`} height={5} />
          </div>
        )}
        {!shared && (
          <div className="flex shrink-0 items-center md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            <button type="button" onClick={() => openEdit(project)} aria-label={`Edit ${project.name}`} className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-text"><Pencil size={15} /></button>
            <button type="button" onClick={() => setDeleting(project)} aria-label={`Delete ${project.name}`} className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>
          </div>
        )}
      </li>
    )
  }

  const total = projects.length + sharedProjects.length

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Projects"
        description={total ? `${total} ${total === 1 ? 'project' : 'projects'}` : 'Group related tasks and see progress in one place'}
        actions={<Button variant="primary" onClick={openNew}><Plus size={16} aria-hidden="true" />New project</Button>}
      />

      {total === 0 ? (
        <div className="panel">
          <EmptyState icon={FolderKanban} title="No projects yet" description="Projects group tasks and show how much focus time each one gets." action={<Button variant="primary" onClick={openNew}>Create a project</Button>} />
        </div>
      ) : (
        <div className="space-y-6">
          {projects.length > 0 && <ul className="panel divide-line overflow-hidden">{projects.map(p => renderRow(p, false))}</ul>}
          {sharedProjects.length > 0 && (
            <section aria-labelledby="shared-heading">
              <h2 id="shared-heading" className="mb-2 text-[13px] font-medium text-muted">Shared with you</h2>
              <ul className="panel divide-line overflow-hidden">{sharedProjects.map(p => renderRow(p, true))}</ul>
            </section>
          )}
        </div>
      )}

      <Modal open={formOpen} onClose={close} title={editing ? 'Edit project' : 'New project'}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Name" error={error}>
            <Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError('') }} maxLength={80} autoComplete="off" />
          </Field>
          <Field label="Description" optional>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <Field label="Target date" optional><Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></Field>
            <Field label="Icon"><Input value={form.icon} maxLength={4} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="text-center" /></Field>
          </div>
          <Field label="Color" group><ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} /></Field>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button variant="primary" type="submit">{editing ? 'Save changes' : 'Create project'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this project?"
        description={deleting ? `“${deleting.name}” will be removed. Its tasks are kept and become unassigned.` : ''}
        confirmLabel="Delete project"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
