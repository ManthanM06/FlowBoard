import React, { useState, useRef, useEffect } from 'react'
import {
  KanbanSquare,
  ChevronDown,
  Plus,
  Trash2,
  Edit3,
  Check,
  MoreVertical,
  Layers,
  Loader2,
} from 'lucide-react'
import { useBoardStore } from '../stores/boardStore'
import { fetchBoardDetail, deleteBoard, updateBoard } from '../api/boardApi'
import { WorkspaceDetail, WorkspaceRole } from '@flowboard/shared-types'
import { CreateBoardModal } from './CreateBoardModal'

interface BoardHeaderProps {
  workspace: WorkspaceDetail
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({ workspace }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const {
    boards,
    activeBoard,
    setBoards,
    setActiveBoard,
    setLoading,
  } = useBoardStore()

  const isAdmin = workspace.role === WorkspaceRole.ADMIN

  // Close menus on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
      if (
        optionsRef.current &&
        !optionsRef.current.contains(e.target as Node)
      ) {
        setIsOptionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  const handleSelectBoard = async (boardId: string) => {
    setIsDropdownOpen(false)
    if (activeBoard?.id === boardId) return

    setLoading(true)
    try {
      const detail = await fetchBoardDetail(boardId)
      setActiveBoard(detail)
    } catch (err) {
      console.error('Failed to load board detail', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRename = async () => {
    if (!activeBoard || !renameValue.trim() || renameValue.trim() === activeBoard.name) {
      setIsRenaming(false)
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateBoard(activeBoard.id, {
        name: renameValue.trim(),
      })
      setActiveBoard(updated)
      setBoards(boards.map((b) => (b.id === updated.id ? updated : b)))
      setIsRenaming(false)
    } catch (err) {
      console.error('Failed to rename board', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBoard = async () => {
    if (!activeBoard) return
    if (
      !confirm(
        `Are you sure you want to delete board "${activeBoard.name}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteBoard(activeBoard.id)
      const remaining = boards.filter((b) => b.id !== activeBoard.id)
      setBoards(remaining)
      if (remaining.length > 0) {
        const next = await fetchBoardDetail(remaining[0].id)
        setActiveBoard(next)
      } else {
        setActiveBoard(null)
      }
      setIsOptionsOpen(false)
    } catch (err) {
      console.error('Failed to delete board', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="border-b border-border-subtle bg-surface px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Board Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-button bg-canvas hover:bg-border-subtle/50 border border-border-subtle transition-colors text-sm font-semibold text-text-primary"
            >
              <KanbanSquare className="w-4 h-4 text-accent" />
              <span className="truncate max-w-[200px]">
                {activeBoard ? activeBoard.name : 'No Board Selected'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-150 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-60 bg-surface border border-border-subtle rounded-card shadow-modal p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-text-secondary font-semibold">
                  Workspace Boards ({boards.length})
                </div>

                <div className="max-h-52 overflow-y-auto space-y-0.5 my-1">
                  {boards.map((b) => {
                    const isSelected = activeBoard?.id === b.id
                    return (
                      <button
                        key={b.id}
                        onClick={() => handleSelectBoard(b.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-button text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-accent-subtle text-accent font-semibold'
                            : 'text-text-primary hover:bg-canvas'
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                      </button>
                    )
                  })}

                  {boards.length === 0 && (
                    <div className="px-3 py-3 text-xs text-text-secondary text-center">
                      No boards in this workspace
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <>
                    <div className="my-1 border-t border-border-subtle" />
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setIsCreateOpen(true)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-button text-xs text-accent font-medium hover:bg-accent-subtle transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Board</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Active Board Rename Inline */}
          {isRenaming ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                  if (e.key === 'Escape') setIsRenaming(false)
                }}
                disabled={isSaving}
                className="text-sm font-semibold px-2 py-1 bg-surface border border-accent rounded-button text-text-primary focus:outline-none"
              />
              <button
                onClick={handleRename}
                disabled={isSaving}
                className="p-1.5 rounded-button bg-accent text-white hover:bg-accent-hover"
                title="Save"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsRenaming(false)}
                className="p-1.5 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas"
                title="Cancel"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Columns counter */}
          {activeBoard && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-secondary">
              <Layers className="w-3.5 h-3.5" />
              <span>{activeBoard.columns.length} columns</span>
            </div>
          )}
        </div>

        {/* Right Board Options & Admin Actions */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Board</span>
            </button>
          )}

          {activeBoard && isAdmin && (
            <div className="relative" ref={optionsRef}>
              <button
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                className="p-1.5 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors border border-border-subtle"
                title="Board settings"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MoreVertical className="w-4 h-4" />
                )}
              </button>

              {isOptionsOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-surface border border-border-subtle rounded-card shadow-modal p-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setIsOptionsOpen(false)
                      setRenameValue(activeBoard.name)
                      setIsRenaming(true)
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-button text-xs text-text-primary hover:bg-canvas text-left transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-text-secondary" />
                    <span>Rename Board</span>
                  </button>
                  <button
                    onClick={handleDeleteBoard}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-button text-xs text-status-danger hover:bg-status-danger/10 text-left transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-status-danger" />
                    <span>Delete Board</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateBoardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        workspaceId={workspace.id}
      />
    </>
  )
}
