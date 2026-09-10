import React from 'react'
import {
  Search,
  X,
  Kanban,
  BarChart3,
} from 'lucide-react'
import { TaskPriority, WorkspaceMemberSummary } from '@flowboard/shared-types'
import { useFilterStore, DueDateFilterOption } from '../stores/filterStore'

interface BoardFilterBarProps {
  workspaceMembers?: WorkspaceMemberSummary[]
}

export const BoardFilterBar: React.FC<BoardFilterBarProps> = ({
  workspaceMembers = [],
}) => {
  const {
    searchQuery,
    priorityFilter,
    assigneeFilter,
    dueDateFilter,
    viewMode,
    setSearchQuery,
    setPriorityFilter,
    setAssigneeFilter,
    setDueDateFilter,
    setViewMode,
    resetFilters,
    hasActiveFilters,
  } = useFilterStore()

  const active = hasActiveFilters()

  return (
    <div className="border-b border-border-subtle bg-surface/60 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
      {/* Search & Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search input */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-8 pr-7 py-1.5 bg-surface border border-border-subtle rounded-button text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as 'ALL' | TaskPriority)
            }
            className={`px-2.5 py-1.5 rounded-button text-xs border focus:outline-none focus:border-accent font-medium bg-surface cursor-pointer ${
              priorityFilter !== 'ALL'
                ? 'border-accent text-accent bg-accent-subtle/30 font-semibold'
                : 'border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            <option value="ALL">All Priorities</option>
            <option value={TaskPriority.HIGH}>High Priority</option>
            <option value={TaskPriority.MEDIUM}>Medium Priority</option>
            <option value={TaskPriority.LOW}>Low Priority</option>
          </select>
        </div>

        {/* Assignee Filter */}
        {workspaceMembers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-button text-xs border focus:outline-none focus:border-accent font-medium bg-surface cursor-pointer ${
                assigneeFilter !== 'ALL'
                  ? 'border-accent text-accent bg-accent-subtle/30 font-semibold'
                  : 'border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              <option value="ALL">All Assignees</option>
              {workspaceMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Due Date Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={dueDateFilter}
            onChange={(e) =>
              setDueDateFilter(e.target.value as DueDateFilterOption)
            }
            className={`px-2.5 py-1.5 rounded-button text-xs border focus:outline-none focus:border-accent font-medium bg-surface cursor-pointer ${
              dueDateFilter !== 'ALL'
                ? 'border-accent text-accent bg-accent-subtle/30 font-semibold'
                : 'border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            <option value="ALL">All Dates</option>
            <option value="OVERDUE">Overdue Only</option>
            <option value="TODAY">Due Today</option>
            <option value="THIS_WEEK">Due This Week</option>
          </select>
        </div>

        {/* Reset All Filters Pill */}
        {active && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2.5 py-1 rounded-chip bg-red-50 text-priority-high border border-red-200 text-[11px] font-mono hover:bg-red-100 transition-colors font-semibold"
          >
            <X className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* View Mode Toggle: Board vs Dashboard */}
      <div className="flex items-center bg-canvas p-0.5 rounded-button border border-border-subtle shrink-0">
        <button
          onClick={() => setViewMode('BOARD')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-button text-xs font-medium transition-all ${
            viewMode === 'BOARD'
              ? 'bg-surface text-text-primary shadow-xs font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Kanban className="w-3.5 h-3.5 text-accent" />
          <span>Board</span>
        </button>

        <button
          onClick={() => setViewMode('DASHBOARD')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-button text-xs font-medium transition-all ${
            viewMode === 'DASHBOARD'
              ? 'bg-surface text-text-primary shadow-xs font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-accent" />
          <span>Dashboard</span>
        </button>
      </div>
    </div>
  )
}
