import React, { useState, useEffect } from 'react'
import {
  X,
  Plus,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react'
import {
  TaskPriority,
  WorkspaceMemberSummary,
} from '@flowboard/shared-types'
import { createTask } from '../api/taskApi'
import { useBoardStore } from '../../boards/stores/boardStore'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  columnId: string
  columnName: string
  workspaceMembers?: WorkspaceMemberSummary[]
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  columnId,
  columnName,
  workspaceMembers = [],
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM)
  const [dueDate, setDueDate] = useState('')
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { addTask } = useBoardStore()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const task = await createTask(columnId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assigneeIds: selectedAssigneeIds,
      })

      addTask(task)
      setTitle('')
      setDescription('')
      setPriority(TaskPriority.MEDIUM)
      setDueDate('')
      setSelectedAssigneeIds([])
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create task')
      }
    } finally {
      setIsLoading(false)
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
        className="w-full max-w-lg bg-surface border border-border-subtle rounded-card shadow-modal overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-accent font-semibold tracking-wider">
                New Task
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-chip bg-accent-subtle text-accent font-semibold">
                in {columnName}
              </span>
            </div>
            <h2 className="text-xl font-bold text-text-primary mt-0.5">Create Task Card</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-button bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Title <span className="text-status-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement refresh token rotation"
              className="w-full px-3.5 py-2 text-sm bg-surface border border-border-subtle rounded-button text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, acceptance criteria, or context..."
              className="w-full px-3.5 py-2 text-xs bg-surface border border-border-subtle rounded-button text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Priority
              </label>
              <div className="flex items-center gap-2">
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

            {/* Due Date */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-border-subtle rounded-button text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Assignees Selection */}
          {workspaceMembers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Assignees ({selectedAssigneeIds.length} selected)
              </label>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1.5 border border-border-subtle rounded-button bg-canvas/30">
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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-button text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-button bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
