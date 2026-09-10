import React, { useState, useEffect } from 'react'
import {
  X,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Save,
} from 'lucide-react'
import {
  TaskSummary,
  TaskPriority,
  WorkspaceMemberSummary,
  ColumnSummary,
} from '@flowboard/shared-types'
import { updateTask, deleteTask } from '../api/taskApi'
import { useBoardStore } from '../../boards/stores/boardStore'

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task: TaskSummary
  columns: ColumnSummary[]
  workspaceMembers?: WorkspaceMemberSummary[]
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  columns,
  workspaceMembers = [],
}) => {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [columnId, setColumnId] = useState(task.columnId)
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.split('T')[0] : ''
  )
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(
    task.assignees?.map((a) => a.id) || []
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { updateTask: updateInStore, removeTask: removeFromStore } =
    useBoardStore()

  // Reset form state when task changes
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setPriority(task.priority)
    setColumnId(task.columnId)
    setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
    setSelectedAssigneeIds(task.assignees?.map((a) => a.id) || [])
    setError(null)
  }, [task])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const toggleAssignee = (userId: string) => {
    if (selectedAssigneeIds.includes(userId)) {
      setSelectedAssigneeIds(selectedAssigneeIds.filter((id) => id !== userId))
    } else {
      setSelectedAssigneeIds([...selectedAssigneeIds, userId])
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      const updated = await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        columnId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assigneeIds: selectedAssigneeIds,
      })

      updateInStore(updated)
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update task')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await deleteTask(task.id)
      removeFromStore(task.id, task.columnId)
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to delete task')
      }
      setIsDeleting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1A16]/30 animate-in fade-in duration-150"
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-surface border border-border-subtle rounded-card shadow-modal overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-accent font-semibold tracking-wider">
              Task Details
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="p-1.5 rounded-button text-status-danger hover:bg-status-danger/10 transition-colors"
              title="Delete task"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-button bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-semibold bg-surface border border-border-subtle rounded-button text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, acceptance criteria, notes..."
              className="w-full px-3.5 py-2 text-xs bg-surface border border-border-subtle rounded-button text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none leading-relaxed"
            />
          </div>

          {/* Stage / Column & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Column Selector */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Stage / Column
              </label>
              <div className="relative">
                <select
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-surface border border-border-subtle rounded-button text-text-primary focus:outline-none focus:border-accent"
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Priority
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { key: TaskPriority.LOW, label: 'Low', color: 'text-priority-low border-emerald-300 bg-emerald-50' },
                  { key: TaskPriority.MEDIUM, label: 'Medium', color: 'text-priority-medium border-amber-300 bg-amber-50' },
                  { key: TaskPriority.HIGH, label: 'High', color: 'text-priority-high border-red-300 bg-red-50' },
                ].map((p) => {
                  const isSelected = priority === p.key
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPriority(p.key)}
                      className={`flex-1 py-1.5 px-2 rounded-button text-xs font-medium border transition-all ${
                        isSelected
                          ? `${p.color} font-semibold ring-1 ring-accent/30 shadow-xs`
                          : 'border-border-subtle text-text-secondary hover:bg-canvas'
                      }`}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Due Date
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-surface border border-border-subtle rounded-button text-text-primary focus:outline-none focus:border-accent"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-[11px] text-text-secondary hover:text-text-primary hover:underline"
                >
                  Clear date
                </button>
              )}
            </div>
          </div>

          {/* Assignees Selection */}
          {workspaceMembers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Assignees ({selectedAssigneeIds.length} assigned)
              </label>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 border border-border-subtle rounded-button bg-canvas/30">
                {workspaceMembers.map((m) => {
                  const isSelected = selectedAssigneeIds.includes(m.userId)
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => toggleAssignee(m.userId)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs transition-colors ${
                        isSelected
                          ? 'bg-accent text-white font-medium shadow-xs'
                          : 'bg-surface border border-border-subtle text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{m.user.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Timestamps */}
          {task.createdAt && (
            <div className="pt-2 flex items-center gap-4 text-[11px] font-mono text-text-secondary border-t border-border-subtle">
              <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
              {task.updatedAt && (
                <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
          )}

          {/* Sticky Footer */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-button text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-button bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
