import React, { useState, useRef, useEffect } from 'react'
import {
  MoreHorizontal,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  Maximize2,
} from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  ColumnDetail,
  ColumnSummary,
  TaskSummary,
  WorkspaceMemberSummary,
} from '@flowboard/shared-types'
import { updateColumn, deleteColumn } from '../api/boardApi'
import { createTask } from '../../tasks/api/taskApi'
import { useBoardStore } from '../stores/boardStore'
import { TaskCard } from '../../tasks/components/TaskCard'
import { CreateTaskModal } from '../../tasks/components/CreateTaskModal'
import { TaskDetailModal } from '../../tasks/components/TaskDetailModal'

interface KanbanColumnProps {
  column: ColumnDetail
  isAdmin: boolean
  allColumns?: ColumnSummary[]
  workspaceMembers?: WorkspaceMemberSummary[]
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  isAdmin,
  allColumns = [],
  workspaceMembers = [],
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState(column.name)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isDeletingColumn, setIsDeletingColumn] = useState(false)

  // Task creation state
  const [isQuickAdding, setIsQuickAdding] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Task details modal state
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const quickInputRef = useRef<HTMLInputElement>(null)

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  })

  const {
    updateColumn: updateInStore,
    removeColumn: removeFromStore,
    addTask: addTaskToStore,
  } = useBoardStore()

  const tasks = column.tasks || []

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

  // Focus rename input
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  // Focus quick add input
  useEffect(() => {
    if (isQuickAdding && quickInputRef.current) {
      quickInputRef.current.focus()
    }
  }, [isQuickAdding])

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === column.name) {
      setIsEditingName(false)
      setNewName(column.name)
      return
    }

    setIsSavingName(true)
    try {
      const updated = await updateColumn(column.id, { name: newName.trim() })
      updateInStore(updated)
      setIsEditingName(false)
    } catch (err) {
      console.error('Failed to update column', err)
      setNewName(column.name)
    } finally {
      setIsSavingName(false)
    }
  }

  const handleDeleteColumn = async () => {
    if (!confirm(`Are you sure you want to delete column "${column.name}" and all its tasks?`)) {
      return
    }

    setIsDeletingColumn(true)
    try {
      await deleteColumn(column.id)
      removeFromStore(column.id)
    } catch (err) {
      console.error('Failed to delete column', err)
      setIsDeletingColumn(false)
    }
  }

  const handleQuickCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!quickTitle.trim() || isSubmittingQuick) return

    setIsSubmittingQuick(true)
    try {
      const newTask = await createTask(column.id, {
        title: quickTitle.trim(),
      })
      addTaskToStore(newTask)
      setQuickTitle('')
      setIsQuickAdding(false)
    } catch (err) {
      console.error('Failed to quick-create task', err)
    } finally {
      setIsSubmittingQuick(false)
    }
  }

  return (
    <>
      <div className="w-80 shrink-0 bg-surface-muted/50 border border-border-subtle rounded-card flex flex-col max-h-[calc(100vh-13.5rem)] shadow-sm transition-all duration-200">
        {/* Column Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-border-subtle bg-surface/80 rounded-t-card">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') {
                      setIsEditingName(false)
                      setNewName(column.name)
                    }
                  }}
                  disabled={isSavingName}
                  className="w-full text-xs font-semibold px-2 py-1 bg-surface border border-accent rounded-button text-text-primary focus:outline-none"
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="p-1 rounded-button bg-accent text-white hover:bg-accent-hover"
                  title="Save"
                >
                  {isSavingName ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false)
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
                onClick={() => isAdmin && setIsEditingName(true)}
                className={`text-xs font-bold text-text-primary uppercase tracking-wider truncate font-mono ${
                  isAdmin ? 'cursor-pointer hover:text-accent' : ''
                }`}
                title={isAdmin ? 'Click to rename' : column.name}
              >
                {column.name}
              </h3>
            )}

            {!isEditingName && (
              <span className="px-1.5 py-0.5 rounded-chip text-[10px] font-mono font-semibold bg-canvas text-text-secondary border border-border-subtle shrink-0">
                {tasks.length}
              </span>
            )}
          </div>

          {/* Column Actions (Admin Only) */}
          {isAdmin && !isEditingName && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
                title="Column options"
                disabled={isDeletingColumn}
              >
                {isDeletingColumn ? (
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
                      setIsEditingName(true)
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-button text-xs text-text-primary hover:bg-canvas text-left transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-text-secondary" />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleDeleteColumn()
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
        <div
          ref={setDroppableRef}
          className={`flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[140px] transition-colors rounded-b-none ${
            isOver ? 'bg-accent/5 ring-1 ring-inset ring-accent/30' : ''
          }`}
        >
          {/* Quick Add Composer when active */}
          {isQuickAdding && (
            <div className="bg-surface rounded-card p-3 border border-accent shadow-md space-y-2 animate-in fade-in zoom-in-95 duration-100">
              <input
                ref={quickInputRef}
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickCreate()
                  if (e.key === 'Escape') {
                    setIsQuickAdding(false)
                    setQuickTitle('')
                  }
                }}
                placeholder="What needs to be done?"
                className="w-full text-xs font-semibold px-2 py-1.5 bg-canvas/40 border border-border-subtle rounded-button text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
              />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickCreate()}
                    disabled={isSubmittingQuick || !quickTitle.trim()}
                    className="px-3 py-1 rounded-button bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSubmittingQuick ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span>Add</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickAdding(false)
                      setQuickTitle('')
                    }}
                    className="p-1 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAdding(false)
                    setIsCreateModalOpen(true)
                  }}
                  className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Full details...</span>
                </button>
              </div>
            </div>
          )}

          {/* Render Task Cards in SortableContext */}
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </SortableContext>

          {/* Empty State when no tasks and not adding */}
          {tasks.length === 0 && !isQuickAdding && (
            <div
              onClick={() => setIsQuickAdding(true)}
              className="h-full flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-border-subtle/80 hover:border-accent/40 rounded-button bg-surface/30 hover:bg-surface/60 transition-colors cursor-pointer group"
            >
              <p className="text-xs font-medium text-text-secondary group-hover:text-text-primary">
                No tasks yet
              </p>
              <p className="text-[11px] text-text-secondary/70 mt-1">
                Click to add a task to {column.name}
              </p>
            </div>
          )}
        </div>

        {/* Column Footer */}
        <div className="p-2.5 border-t border-border-subtle bg-surface/40 rounded-b-card">
          <button
            onClick={() => setIsQuickAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-button border border-dashed border-border-subtle hover:border-accent/60 text-text-secondary hover:text-text-primary text-xs font-medium bg-surface/50 hover:bg-surface transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span>Add a task</span>
          </button>
        </div>
      </div>

      {/* Full Task Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        columnId={column.id}
        columnName={column.name}
        workspaceMembers={workspaceMembers}
      />

      {/* Task Detail & Edit Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          columns={allColumns}
          workspaceMembers={workspaceMembers}
        />
      )}
    </>
  )
}
