import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Save,
  MessageSquare,
  Send,
} from 'lucide-react'
import {
  TaskSummary,
  TaskPriority,
  WorkspaceMemberSummary,
  ColumnSummary,
  CommentSummary,
  SocketEvent,
} from '@flowboard/shared-types'
import { updateTask, deleteTask } from '../api/taskApi'
import { fetchComments, addComment, deleteComment } from '../../comments/api/commentsApi'
import { useBoardStore } from '../../boards/stores/boardStore'
import { useAuthStore } from '../../auth/stores/authStore'
import { getSocket } from '../../../shared/lib/socket'

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

  // Comments state
  const [comments, setComments] = useState<CommentSummary[]>([])
  const [isCommentsLoading, setIsCommentsLoading] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const currentUser = useAuthStore((s) => s.user)
  const { updateTask: updateInStore, removeTask: removeFromStore } =
    useBoardStore()

  // Fetch comments
  const loadComments = useCallback(async () => {
    setIsCommentsLoading(true)
    try {
      const data = await fetchComments(task.id)
      setComments(data)
    } catch (err) {
      console.error('Failed to load comments', err)
    } finally {
      setIsCommentsLoading(false)
    }
  }, [task.id])

  useEffect(() => {
    if (isOpen) {
      loadComments()
    }
  }, [isOpen, loadComments])

  // Real-time comment listener
  useEffect(() => {
    if (!isOpen) return
    const socket = getSocket()

    const handleCommentAdded = (newComment: CommentSummary) => {
      if (newComment.taskId === task.id) {
        setComments((prev) => {
          if (prev.some((c) => c.id === newComment.id)) return prev
          return [...prev, newComment]
        })
      }
    }

    socket.on(SocketEvent.COMMENT_ADDED, handleCommentAdded)
    return () => {
      socket.off(SocketEvent.COMMENT_ADDED, handleCommentAdded)
    }
  }, [isOpen, task.id])

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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentBody.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const created = await addComment(task.id, { body: commentBody.trim() })
      setComments((prev) => {
        if (prev.some((c) => c.id === created.id)) return prev
        return [...prev, created]
      })
      setCommentBody('')
    } catch (err) {
      console.error('Failed to post comment', err)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (err) {
      console.error('Failed to delete comment', err)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1A16]/40 dark:bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150"
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
                  { key: TaskPriority.LOW, label: 'Low', color: 'text-priority-low border-emerald-300 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/40' },
                  { key: TaskPriority.MEDIUM, label: 'Medium', color: 'text-priority-medium border-amber-300 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/40' },
                  { key: TaskPriority.HIGH, label: 'High', color: 'text-priority-high border-red-300 dark:border-red-800/40 bg-red-50 dark:bg-red-950/40' },
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

          {/* Comments Section */}
          <div className="pt-3 border-t border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                  Comments ({comments.length})
                </h4>
              </div>
              {isCommentsLoading && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-text-secondary" />
              )}
            </div>

            {/* Comments List */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {comments.length === 0 && !isCommentsLoading ? (
                <p className="text-xs text-text-secondary/70 italic py-2">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                comments.map((comment) => {
                  const isAuthor = currentUser?.id === comment.userId
                  return (
                    <div
                      key={comment.id}
                      className="p-2.5 rounded-card bg-surface border border-border-subtle text-xs space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center font-mono text-[9px] font-bold">
                            {(comment.user?.name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-text-primary text-[11px]">
                            {comment.user?.name || 'User'}
                          </span>
                          <span className="text-[10px] font-mono text-text-secondary/60">
                            {new Date(comment.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {isAuthor && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-text-secondary/40 hover:text-status-danger opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-text-primary pl-7 leading-relaxed whitespace-pre-wrap">
                        {comment.body}
                      </p>
                    </div>
                  )
                })
              )}
            </div>

            {/* Comment Composer */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAddComment(e)
                  }
                }}
                placeholder="Write a comment... (Enter to send)"
                className="flex-1 text-xs px-3 py-2 bg-surface border border-border-subtle rounded-button text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={(e) => handleAddComment(e)}
                disabled={isSubmittingComment || !commentBody.trim()}
                className="p-2 rounded-button bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
                title="Send comment"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

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
