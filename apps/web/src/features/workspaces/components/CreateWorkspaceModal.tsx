import React, { useState, useEffect } from 'react'
import { X, Briefcase, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { createWorkspace } from '../api/workspaceApi'
import { useWorkspaceStore } from '../stores/workspaceStore'

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { setActiveWorkspace, workspaces, setWorkspaces } = useWorkspaceStore()

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
      const newWs = await createWorkspace({ name })
      setWorkspaces([newWs, ...workspaces])
      setActiveWorkspace(newWs)
      setName('')
      onCreated?.()
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create workspace')
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
              Workspace Setup
            </span>
            <h2 className="text-xl font-bold text-text-primary mt-0.5">Create a new workspace</h2>
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
            <div className="p-3 rounded-button bg-red-50 border border-red-200 text-status-error text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">Workspace Name</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-text-disabled absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Design Studio, Marketing Hub"
                className="w-full pl-9 pr-3 py-2 text-sm bg-canvas border border-border-subtle rounded-button text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
            <p className="text-[11px] text-text-secondary leading-normal">
              You will be automatically designated as the Workspace Owner & Admin.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-button bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating workspace...</span>
              </>
            ) : (
              <>
                <span>Create Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
