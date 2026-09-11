import React, { useState, useEffect } from 'react'
import { X, KanbanSquare, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { createBoard } from '../api/boardApi'
import { useBoardStore } from '../stores/boardStore'

interface CreateBoardModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  onCreated?: () => void
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onCreated,
}) => {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { boards, setBoards, setActiveBoard } = useBoardStore()

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setError(null)
    setIsLoading(true)

    try {
      const newBoard = await createBoard(workspaceId, { name: name.trim() })
      setBoards([...boards, newBoard])
      setActiveBoard(newBoard)
      setName('')
      onCreated?.()
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create board')
      }
    } finally {
      setIsLoading(false)
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
        className="w-full max-w-md bg-surface border border-border-subtle rounded-card shadow-modal overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-subtle">
          <div>
            <span className="text-xs font-mono uppercase text-accent font-semibold tracking-wider">
              New Board
            </span>
            <h2 className="text-xl font-bold text-text-primary mt-0.5">Create a Kanban Board</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-button bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Board Name
            </label>
            <div className="relative">
              <KanbanSquare className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sprint 24, Product Roadmap, Bug Tracking"
                className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border-subtle rounded-button text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5">
              Boards automatically start with three default columns: To Do, In Progress, and Done.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-button text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-button bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
