import { create } from 'zustand'
import { TaskPriority } from '@flowboard/shared-types'

export type DueDateFilterOption = 'ALL' | 'OVERDUE' | 'TODAY' | 'THIS_WEEK'

interface FilterState {
  searchQuery: string
  priorityFilter: 'ALL' | TaskPriority
  assigneeFilter: string
  dueDateFilter: DueDateFilterOption
  viewMode: 'BOARD' | 'DASHBOARD'

  setSearchQuery: (query: string) => void
  setPriorityFilter: (priority: 'ALL' | TaskPriority) => void
  setAssigneeFilter: (assigneeId: string) => void
  setDueDateFilter: (option: DueDateFilterOption) => void
  setViewMode: (mode: 'BOARD' | 'DASHBOARD') => void
  resetFilters: () => void
  hasActiveFilters: () => boolean
}

export const useFilterStore = create<FilterState>((set, get) => ({
  searchQuery: '',
  priorityFilter: 'ALL',
  assigneeFilter: 'ALL',
  dueDateFilter: 'ALL',
  viewMode: 'BOARD',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
  setAssigneeFilter: (assigneeFilter) => set({ assigneeFilter }),
  setDueDateFilter: (dueDateFilter) => set({ dueDateFilter }),
  setViewMode: (viewMode) => set({ viewMode }),

  resetFilters: () =>
    set({
      searchQuery: '',
      priorityFilter: 'ALL',
      assigneeFilter: 'ALL',
      dueDateFilter: 'ALL',
    }),

  hasActiveFilters: () => {
    const s = get()
    return (
      s.searchQuery.trim() !== '' ||
      s.priorityFilter !== 'ALL' ||
      s.assigneeFilter !== 'ALL' ||
      s.dueDateFilter !== 'ALL'
    )
  },
}))
