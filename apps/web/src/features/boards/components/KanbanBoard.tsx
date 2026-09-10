import React, { useState, useEffect, useCallback } from 'react'
import {
  KanbanSquare,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react'
import { WorkspaceDetail, WorkspaceRole } from '@flowboard/shared-types'
import {
  fetchBoards,
  fetchBoardDetail,
  createColumn,
} from '../api/boardApi'
import {
  useBoardStore,
  getStoredActiveBoardId,
} from '../stores/boardStore'
import { BoardHeader } from './BoardHeader'
import { KanbanColumn } from './KanbanColumn'
import { CreateBoardModal } from './CreateBoardModal'

interface KanbanBoardProps {
  workspace: WorkspaceDetail
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ workspace }) => {
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [isCreatingColumn, setIsCreatingColumn] = useState(false)
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const {
    boards,
    activeBoard,
    isLoading,
    setBoards,
    setActiveBoard,
    setLoading,
    addColumn,
  } = useBoardStore()

  const isAdmin = workspace.role === WorkspaceRole.ADMIN

  // Load boards when workspace changes
  const loadWorkspaceBoards = useCallback(async () => {
    setLoading(true)
    setInitialLoading(true)
    try {
      const boardList = await fetchBoards(workspace.id)
      setBoards(boardList)

      if (boardList.length > 0) {
        const storedId = getStoredActiveBoardId(workspace.id)
        const target = boardList.find((b) => b.id === storedId) || boardList[0]
        const detail = await fetchBoardDetail(target.id)
        setActiveBoard(detail)
      } else {
        setActiveBoard(null)
      }
    } catch (err) {
      console.error('Failed to load boards for workspace', err)
      setActiveBoard(null)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [workspace.id, setBoards, setActiveBoard, setLoading])

  useEffect(() => {
    loadWorkspaceBoards()
  }, [loadWorkspaceBoards])

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeBoard || !newColumnName.trim()) return

    setIsCreatingColumn(true)
    try {
      const created = await createColumn(activeBoard.id, {
        name: newColumnName.trim(),
      })
      addColumn(created)
      setNewColumnName('')
      setIsAddingColumn(false)
    } catch (err) {
      console.error('Failed to create column', err)
    } finally {
      setIsCreatingColumn(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-canvas">
        <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
        <p className="text-sm font-medium text-text-secondary">Loading boards...</p>
      </div>
    )
  }

  // Empty state: Workspace has 0 boards
  if (boards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-canvas">
        <div className="w-16 h-16 rounded-card bg-surface border border-border-subtle flex items-center justify-center shadow-card mb-4 text-accent">
          <KanbanSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          No boards yet in {workspace.name}
        </h2>
        <p className="text-sm text-text-secondary max-w-md mb-6">
          Kanban boards allow your team to visualize tasks across columns like To Do, In Progress, and Done.
        </p>

        {isAdmin ? (
          <button
            onClick={() => setIsCreateBoardOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Board</span>
          </button>
        ) : (
          <div className="p-3 rounded-button bg-surface border border-border-subtle text-xs text-text-secondary flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-text-secondary" />
            <span>Ask a workspace admin to create a board.</span>
          </div>
        )}

        <CreateBoardModal
          isOpen={isCreateBoardOpen}
          onClose={() => setIsCreateBoardOpen(false)}
          workspaceId={workspace.id}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-canvas">
      {/* Top Board Bar */}
      <BoardHeader workspace={workspace} />

      {/* Kanban Columns Row */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {isLoading && !activeBoard ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : activeBoard ? (
          <div className="flex items-start gap-5 h-full min-w-max pb-4">
            {/* Sorted Columns */}
            {activeBoard.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                isAdmin={isAdmin}
              />
            ))}

            {/* Add Column (Admin Only) */}
            {isAdmin && (
              <div className="w-80 shrink-0">
                {isAddingColumn ? (
                  <div className="bg-surface border border-border-subtle rounded-card p-3.5 shadow-card animate-in fade-in zoom-in-95 duration-150">
                    <form onSubmit={handleAddColumn} className="space-y-3">
                      <input
                        type="text"
                        required
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="Column name (e.g. Review, Testing)"
                        className="w-full text-xs font-semibold px-3 py-2 bg-surface border border-border-subtle rounded-button text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isCreatingColumn || !newColumnName.trim()}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-button bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                        >
                          {isCreatingColumn ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Column</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingColumn(false)
                            setNewColumnName('')
                          }}
                          className="p-1.5 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingColumn(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-card border-2 border-dashed border-border-subtle hover:border-accent/40 bg-surface/40 hover:bg-surface text-text-secondary hover:text-text-primary transition-all text-xs font-semibold group shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                    <span>Add Column</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Layers className="w-8 h-8 text-text-secondary/40 mb-2" />
            <p className="text-sm text-text-secondary">Select a board to view columns</p>
          </div>
        )}
      </div>
    </div>
  )
}
