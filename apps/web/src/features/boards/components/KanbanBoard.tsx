import React, { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import {
  KanbanSquare,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react'
import { WorkspaceDetail, WorkspaceRole, TaskSummary, ColumnDetail } from '@flowboard/shared-types'
import {
  fetchBoards,
  fetchBoardDetail,
  createColumn,
} from '../api/boardApi'
import { moveTask } from '../../tasks/api/taskApi'
import {
  useBoardStore,
  getStoredActiveBoardId,
} from '../stores/boardStore'
import { BoardHeader } from './BoardHeader'
import { KanbanColumn } from './KanbanColumn'
import { BoardFilterBar } from './BoardFilterBar'
import { TeamDashboard } from './TeamDashboard'
import { TaskCard } from '../../tasks/components/TaskCard'
import { CreateBoardModal } from './CreateBoardModal'
import { useBoardSocket } from '../../../shared/lib/socket'
import { useFilterStore } from '../stores/filterStore'

interface KanbanBoardProps {
  workspace: WorkspaceDetail
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ workspace }) => {
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [isCreatingColumn, setIsCreatingColumn] = useState(false)
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<TaskSummary | null>(null)

  const {
    boards,
    activeBoard,
    isLoading,
    setBoards,
    setActiveBoard,
    setLoading,
    addColumn,
    moveTaskLocally,
  } = useBoardStore()

  const viewMode = useFilterStore((s) => s.viewMode)

  // Real-time synchronization
  useBoardSocket(activeBoard?.id ?? null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as TaskSummary | undefined
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || !activeBoard) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId === overId) return

    // Find source column and task
    let sourceColumn: ColumnDetail | null = null
    let sourceTask: TaskSummary | null = null
    for (const col of activeBoard.columns) {
      const found = (col.tasks || []).find((t) => t.id === activeId)
      if (found) {
        sourceColumn = col
        sourceTask = found
        break
      }
    }

    if (!sourceColumn || !sourceTask) return

    // Determine target column and target index
    let targetColumnId: string = ''
    let targetIndex = 0

    const overData = over.data.current
    if (overData?.type === 'Column') {
      targetColumnId = String(over.id)
      const targetCol = activeBoard.columns.find((c) => c.id === targetColumnId)
      targetIndex = targetCol ? targetCol.tasks.length : 0
    } else if (overData?.type === 'Task') {
      const overTask = overData.task as TaskSummary
      targetColumnId = overTask.columnId
      const targetCol = activeBoard.columns.find((c) => c.id === targetColumnId)
      if (targetCol) {
        const overIdx = (targetCol.tasks || []).findIndex((t) => t.id === overId)
        targetIndex = overIdx >= 0 ? overIdx : (targetCol.tasks || []).length
      }
    } else {
      // Fallback
      const colMatch = activeBoard.columns.find((c) => c.id === overId)
      if (colMatch) {
        targetColumnId = colMatch.id
        targetIndex = colMatch.tasks.length
      } else {
        for (const c of activeBoard.columns) {
          const idx = (c.tasks || []).findIndex((t) => t.id === overId)
          if (idx >= 0) {
            targetColumnId = c.id
            targetIndex = idx
            break
          }
        }
      }
    }

    if (!targetColumnId) return

    // Calculate previousTaskId and nextTaskId for fractional order
    const targetCol = activeBoard.columns.find((c) => c.id === targetColumnId)
    const tasksInTarget = (targetCol?.tasks || []).filter((t) => t.id !== activeId)
    const prevTask = targetIndex > 0 ? tasksInTarget[targetIndex - 1] : undefined
    const nextTask = targetIndex < tasksInTarget.length ? tasksInTarget[targetIndex] : undefined

    // Optimistically update board locally
    const previousBoard = moveTaskLocally(activeId, targetColumnId, targetIndex)

    try {
      await moveTask(activeId, {
        targetColumnId,
        previousTaskId: prevTask?.id,
        nextTaskId: nextTask?.id,
      })
    } catch (err) {
      console.error('Failed to move task on server, reverting...', err)
      if (previousBoard) {
        setActiveBoard(previousBoard)
      }
    }
  }

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

      {/* Filter and Search Toolbar */}
      {activeBoard && (
        <BoardFilterBar workspaceMembers={workspace.members} />
      )}

      {/* View Switch: Team Dashboard vs Kanban Columns */}
      {viewMode === 'DASHBOARD' && activeBoard ? (
        <TeamDashboard
          board={activeBoard}
          workspaceMembers={workspace.members}
        />
      ) : (
        /* Kanban Columns Row with DndContext */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
                  allColumns={activeBoard.columns}
                  workspaceMembers={workspace.members}
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

        {/* Drag Overlay for smooth card movement */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="w-72">
              <TaskCard
                task={activeTask}
                onClick={() => {}}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      )}
    </div>
  )
}
