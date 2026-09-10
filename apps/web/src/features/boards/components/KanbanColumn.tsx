import React, { useState, useRef, useEffect } from 'react'
import {
  MoreHorizontal,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import { ColumnSummary } from '@flowboard/shared-types'
import { updateColumn, deleteColumn } from '../api/boardApi'
import { useBoardStore } from '../stores/boardStore'

interface KanbanColumnProps {
  column: ColumnSummary
  isAdmin: boolean
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, isAdmin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(column.name)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { updateColumn: updateInStore, removeColumn: removeFromStore } = useBoardStore()

  // Close menu on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === column.name) {
      setIsEditing(false)
      setNewName(column.name)
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateColumn(column.id, { name: newName.trim() })
      updateInStore(updated)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update column', err)
      setNewName(column.name)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete column "${column.name}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteColumn(column.id)
      removeFromStore(column.id)
    } catch (err) {
      console.error('Failed to delete column', err)
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-80 shrink-0 bg-surface-muted/50 border border-border-subtle rounded-card flex flex-col max-h-[calc(100vh-13.5rem)] shadow-sm transition-all duration-200">
      {/* Column Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border-subtle bg-surface/80 rounded-t-card">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          {isEditing ? (
            <div className="flex items-center gap-1.5 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') {
                    setIsEditing(false)
                    setNewName(column.name)
                  }
                }}
                disabled={isSaving}
                className="w-full text-xs font-semibold px-2 py-1 bg-surface border border-accent rounded-button text-text-primary focus:outline-none"
              />
              <button
                onClick={handleSaveName}
                disabled={isSaving}
                className="p-1 rounded-button bg-accent text-white hover:bg-accent-hover"
                title="Save"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setNewName(column.name)
                }}
                className="p-1 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h3
              onClick={() => isAdmin && setIsEditing(true)}
              className={`text-xs font-bold text-text-primary uppercase tracking-wider truncate font-mono ${
                isAdmin ? 'cursor-pointer hover:text-accent' : ''
              }`}
              title={isAdmin ? 'Click to rename' : column.name}
            >
              {column.name}
            </h3>
          )}

          {!isEditing && (
            <span className="px-1.5 py-0.5 rounded-chip text-[10px] font-mono font-semibold bg-canvas text-text-secondary border border-border-subtle shrink-0">
              0
            </span>
          )}
        </div>

        {/* Column Actions (Admin Only) */}
        {isAdmin && !isEditing && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
              title="Column options"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MoreHorizontal className="w-4 h-4" />
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-surface border border-border-subtle rounded-card shadow-modal p-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    setIsEditing(true)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-button text-xs text-text-primary hover:bg-canvas text-left transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    handleDelete()
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-button text-xs text-status-danger hover:bg-status-danger/10 text-left transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-status-danger" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tasks Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[140px]">
        {/* Placeholder empty state */}
        <div className="h-full flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-border-subtle/80 rounded-button bg-surface/30">
          <p className="text-xs font-medium text-text-secondary">No tasks yet</p>
          <p className="text-[11px] text-text-secondary/70 mt-1">
            Tasks management arriving in Phase 4
          </p>
        </div>
      </div>

      {/* Column Footer */}
      <div className="p-2.5 border-t border-border-subtle bg-surface/40 rounded-b-card">
        <button
          disabled
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-button border border-dashed border-border-subtle text-text-secondary/60 text-xs font-medium bg-surface/50 cursor-not-allowed"
          title="Task creation will be enabled in Phase 4"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add task (Phase 4)</span>
        </button>
      </div>
    </div>
  )
}
