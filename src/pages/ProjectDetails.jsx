import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, LayoutList, Columns3, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import { Field, Input, Select } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/Tabs'
import TaskRow from '@/components/tasks/TaskRow'
import TaskModal from '@/components/tasks/TaskModal'
import QuickAdd from '@/components/tasks/QuickAdd'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore'
import { useAuthStore } from '@/stores/authStore'
import { useTimerStore } from '@/stores/timerStore'
import { supabase } from '@/lib/supabase'
import { cn, formatDue, formatMinutes, isOverdue } from '@/lib/utils'

const COLUMNS = [
  { status: 'todo', label: 'To do' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'completed', label: 'Done' },
]
const VIEW_OPTIONS = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
]

function BoardCard({ task, onOpen, onMove }) {
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move' }}
      className="cursor-grab rounded-md border border-line bg-surface p-3 active:cursor-grabbing"
    >
      <button type="button" onClick={() => onOpen(task)} className={cn('block w-full text-left text-[13px] font-medium', task.status === 'completed' ? 'text-muted line-through' : 'text-text hover:text-accent')}>
        {task.title}
      </button>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
        <span className={cn(isOverdue(task) && 'font-medium text-danger')}>{task.dueDate ? formatDue(task.dueDate) : ''}</span>
        <PriorityBadge priority={task.priority} />
      </div>
      <Select value={task.status === 'archived' ? 'todo' : task.status} onChange={(e) => onMove(task, e.target.value)} aria-label={`Move “${task.title}” to`} className="field-sm mt-2.5">
        {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
      </Select>
    </div>
  )
}

export default function ProjectDetails() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const projects = useProjectStore(s => s.projects)
  const sharedProjects = useProjectStore(s => s.sharedProjects) || []
  const tasks = useTaskStore(s => s.tasks)
  const sessions = useTaskStore(s => s.sessions)
  const { addTask, updateTask, deleteTask, completeTask, reopenTask, setTaskStatus } = useTaskStore.getState()
  const user = useAuthStore(s => s.user)

  const [view, setView] = useState('list')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviting, setInviting] = useState(false)
  const [members, setMembers] = useState([])
  const [memberError, setMemberError] = useState('')
  const [sharedRole, setSharedRole] = useState(null)

  const loadMembers = async () => {
    if (!user) return
    const { data, error } = await supabase.from('project_members').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    if (error) setMemberError(error.message)
    else { setMembers(data || []); setMemberError('') }
  }

  useEffect(() => { loadMembers() }, [projectId, user?.id])

  useEffect(() => {
    if (!user) return
    supabase.from('project_members').select('role,status').eq('project_id', projectId).eq('member_id', user.id).eq('status', 'accepted').maybeSingle()
      .then(({ data }) => setSharedRole(data?.role || null))
  }, [projectId, user?.id])

  const ownProject = projects.find(p => p.id === projectId)
  const sharedProject = !ownProject ? sharedProjects.find(p => p.id === projectId) : null
  const project = ownProject || sharedProject

  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === projectId), [tasks, projectId])
  if (!project) return <Navigate to="/projects" replace />

  const done = projectTasks.filter(t => t.status === 'completed').length
  const focusMinutes = sessions.filter(s => s.projectId === project.id && s.sessionType === 'focus').reduce((sum, s) => sum + s.actualDurationSeconds / 60, 0)
  const readOnly = Boolean(sharedProject) || sharedRole === 'viewer'
  const toggle = (task) => (task.status === 'completed' ? reopenTask(task.id) : completeTask(task.id))
  const startFocus = (task) => { useTimerStore.getState().setTask(task.id); toast.success(`Timer set to “${task.title}”`); navigate('/focus') }
  const move = (task, status) => setTaskStatus(task.id, status)
  const open = projectTasks.filter(t => t.status !== 'completed')
  const finished = projectTasks.filter(t => t.status === 'completed')

  const inviteMember = async (event) => {
    event.preventDefault()
    setMemberError('')
    if (!inviteEmail.trim() || !user) return
    setInviting(true)
    const { data, error } = await supabase.functions.invoke('invite-project-member', {
      body: { project_id: project.id, email: inviteEmail.trim(), role: inviteRole, redirect_to: `${window.location.origin}/login` },
    })
    setInviting(false)
    if (error) {
      let detail = ''
      if (error.context?.json) { try { detail = (await error.context.json())?.error || '' } catch { /* body not JSON */ } }
      setMemberError(detail || data?.error || error.message || 'Unable to send the invitation.')
    } else if (data?.error) {
      setMemberError(data.error)
    } else {
      toast.success(`Invitation sent to ${inviteEmail.trim()}`)
      setInviteEmail(''); setInviteRole('viewer'); setInviteOpen(false); loadMembers()
    }
  }
  const updateMemberRole = async (memberId, role) => {
    const { error } = await supabase.from('project_members').update({ role }).eq('id', memberId)
    if (error) setMemberError(error.message); else loadMembers()
  }
  const removeMember = async (member) => {
    const { error } = await supabase.from('project_members').delete().eq('id', member.id)
    if (error) setMemberError(error.message); else { toast.success('Member removed'); loadMembers() }
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-6 md:px-8 md:py-8">
      <Link to="/projects" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-text"><ArrowLeft size={14} aria-hidden="true" />Projects</Link>

      <header className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-xl" style={{ background: `color-mix(in srgb, ${project.color || '#7C8794'} 18%, var(--surface))` }} aria-hidden="true">{project.icon}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight">{project.name}</h1>
          {project.description && <p className="mt-1 text-[13px] text-muted">{project.description}</p>}
          {!sharedProject && (
            <div className="mt-3 max-w-md">
              <div className="tnum mb-1.5 flex justify-between text-xs text-muted">
                <span>{done} of {projectTasks.length} tasks done</span>
                <span>{formatMinutes(focusMinutes)} focused</span>
              </div>
              <ProgressBar value={done} max={projectTasks.length || 1} color={project.color} label="Project progress" />
            </div>
          )}
        </div>
      </header>

      {sharedProject ? (
        <p className="panel mb-6 p-4 text-[13px] text-muted">
          This project is shared with you as {sharedProject.sharedRole}. Its tasks live in the owner’s workspace, so they aren’t shown here yet.
        </p>
      ) : (
        <section aria-labelledby="tasks-heading" className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="tasks-heading" className="text-[15px] font-semibold">Tasks</h2>
            <Segmented label="Task layout" value={view} onChange={setView} options={VIEW_OPTIONS.map(o => ({ ...o, label: <span className="inline-flex items-center gap-1.5">{o.value === 'list' ? <LayoutList size={14} aria-hidden="true" /> : <Columns3 size={14} aria-hidden="true" />}{o.label}</span> }))} />
          </div>
          {!readOnly && <div className="mb-3"><QuickAdd onAdd={(title) => addTask({ title, projectId: project.id })} placeholder="Add a task to this project" label="New task in this project" /></div>}

          {projectTasks.length === 0 ? (
            <p className="panel px-4 py-10 text-center text-[13px] text-muted">No tasks in this project yet.</p>
          ) : view === 'list' ? (
            <div className="panel divide-line overflow-hidden">
              {[...open, ...finished].map(task => (
                <TaskRow key={task.id} task={task} project={project} showProject={false} readOnly={readOnly} onToggle={toggle} onEdit={setEditing} onDelete={setDeleting} onFocus={startFocus} />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {COLUMNS.map(col => {
                const list = projectTasks.filter(t => (col.status === 'todo' ? (t.status === 'todo' || t.status === 'archived' || !t.status) : t.status === col.status))
                return (
                  <div
                    key={col.status}
                    onDragOver={(e) => { if (readOnly) return; e.preventDefault(); setDragOver(col.status) }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(null); const task = tasks.find(t => t.id === e.dataTransfer.getData('text/plain')); if (task && !readOnly) move(task, col.status) }}
                    className={cn('min-h-[8rem] rounded-lg border bg-raised/50 p-2.5', dragOver === col.status ? 'border-accent' : 'border-line')}
                  >
                    <h3 className="mb-2.5 flex items-center justify-between px-1 text-[13px] font-medium"><span>{col.label}</span><span className="tnum text-xs text-muted">{list.length}</span></h3>
                    <div className="space-y-2">
                      {list.map(task => <BoardCard key={task.id} task={task} onOpen={readOnly ? () => {} : setEditing} onMove={move} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="team-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="team-heading" className="text-[15px] font-semibold">Team <span className="tnum ml-1 text-[13px] font-normal text-muted">{members.length}</span></h2>
          {user && !sharedProject && <Button size="sm" onClick={() => { setMemberError(''); setInviteOpen(true) }}><UserPlus size={14} aria-hidden="true" />Invite</Button>}
        </div>
        {memberError && !inviteOpen && <p role="alert" className="mb-3 text-[13px] text-danger">{memberError}</p>}
        {members.length === 0 ? (
          <p className="text-[13px] text-muted">No one else has been invited to this project.</p>
        ) : (
          <ul className="panel divide-line overflow-hidden">
            {members.map(member => (
              <li key={member.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={member.invited_email} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-text">{member.invited_email}</div>
                  <div className="text-xs capitalize text-muted">{member.status}</div>
                </div>
                {member.owner_id === user?.id ? (
                  <>
                    <Select value={member.role} onChange={(e) => updateMemberRole(member.id, e.target.value)} aria-label={`Role for ${member.invited_email}`} className="field-sm w-28">
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="owner">Owner</option>
                    </Select>
                    <button type="button" onClick={() => removeMember(member)} aria-label={`Remove ${member.invited_email}`} className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>
                  </>
                ) : <span className="text-xs capitalize text-muted">{member.role}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <TaskModal open={Boolean(editing)} task={editing} projects={projects} onClose={() => setEditing(null)} onSave={(data) => { updateTask(editing.id, data); setEditing(null); toast.success('Task updated') }} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this task?"
        description={deleting ? `“${deleting.title}” will be removed permanently.` : ''}
        confirmLabel="Delete task"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => { deleteTask(deleting.id); setDeleting(null); toast.success('Task deleted') }}
      />
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a team member" description="They’ll get an email with a link to join this project.">
        <form onSubmit={inviteMember} className="space-y-4">
          <Field label="Email address"><Input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@example.com" /></Field>
          <Field label="Role">
            <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              <option value="viewer">Viewer: can view the project</option>
              <option value="editor">Editor: can update tasks</option>
              <option value="owner">Owner: full project access</option>
            </Select>
          </Field>
          {memberError && <p role="alert" className="text-[13px] text-danger">{memberError}</p>}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={inviting}>Send invitation</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
