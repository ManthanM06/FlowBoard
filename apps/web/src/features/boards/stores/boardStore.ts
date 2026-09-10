import { create } from 'zustand'
import {
  BoardDetail,
  BoardSummary,
  ColumnDetail,
  ColumnSummary,
  TaskSummary,
} from '@flowboard/shared-types'

const getBoardStorageKey = (workspaceId: string) =>
  `flowboard_active_board_${workspaceId}`

export const getStoredActiveBoardId = (workspaceId: string): string | null => {
  try {
    return localStorage.getItem(getBoardStorageKey(workspaceId))
  } catch {
    return null
  }
}

export const setStoredActiveBoardId = (
  workspaceId: string,
  boardId: string | null
) => {
  try {
    if (boardId) {
      localStorage.setItem(getBoardStorageKey(workspaceId), boardId)
    } else {
      localStorage.removeItem(getBoardStorageKey(workspaceId))
    }
  } catch {
    // Ignore storage quota or disabled errors
  }
}

interface BoardState {
  boards: BoardSummary[]
  activeBoard: BoardDetail | null
  isLoading: boolean
  error: string | null
  setBoards: (boards: BoardSummary[]) => void
  setActiveBoard: (board: BoardDetail | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addColumn: (col: ColumnSummary) => void
  updateColumn: (col: ColumnSummary) => void
  removeColumn: (columnId: string) => void
  addTask: (task: TaskSummary) => void
  updateTask: (task: TaskSummary) => void
  removeTask: (taskId: string, columnId?: string) => void
  moveTaskLocally: (
    taskId: string,
    targetColumnId: string,
    targetIndex: number
  ) => BoardDetail | null
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  activeBoard: null,
  isLoading: false,
  error: null,

  setBoards: (boards) => set({ boards }),

  setActiveBoard: (board) => {
    if (board) {
      setStoredActiveBoardId(board.workspaceId, board.id)
    }
    set({ activeBoard: board })
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  addColumn: (col) =>
    set((state) => {
      if (!state.activeBoard) return state
      const columnWithTasks: ColumnDetail = {
        ...col,
        tasks: [],
      }
      const columns = [...state.activeBoard.columns, columnWithTasks].sort(
        (a, b) => a.order - b.order
      )
      return {
        activeBoard: {
          ...state.activeBoard,
          columns,
        },
      }
    }),

  updateColumn: (col) =>
    set((state) => {
      if (!state.activeBoard) return state
      const columns = state.activeBoard.columns
        .map((c) =>
          c.id === col.id ? { ...col, tasks: c.tasks || [] } : c
        )
        .sort((a, b) => a.order - b.order)
      return {
        activeBoard: {
          ...state.activeBoard,
          columns,
        },
      }
    }),

  removeColumn: (columnId) =>
    set((state) => {
      if (!state.activeBoard) return state
      return {
        activeBoard: {
          ...state.activeBoard,
          columns: state.activeBoard.columns.filter((c) => c.id !== columnId),
        },
      }
    }),

  addTask: (task) =>
    set((state) => {
      if (!state.activeBoard) return state
      const columns = state.activeBoard.columns.map((col) => {
        if (col.id === task.columnId) {
          const tasks = [...(col.tasks || []), task].sort(
            (a, b) => a.order - b.order
          )
          return { ...col, tasks }
        }
        return col
      })
      return {
        activeBoard: {
          ...state.activeBoard,
          columns,
        },
      }
    }),

  updateTask: (task) =>
    set((state) => {
      if (!state.activeBoard) return state
      const columns = state.activeBoard.columns.map((col) => {
        // If this is the target column
        if (col.id === task.columnId) {
          const existingIndex = (col.tasks || []).findIndex(
            (t) => t.id === task.id
          )
          let tasks: TaskSummary[]
          if (existingIndex >= 0) {
            tasks = col.tasks.map((t) => (t.id === task.id ? task : t))
          } else {
            tasks = [...(col.tasks || []), task]
          }
          tasks.sort((a, b) => a.order - b.order)
          return { ...col, tasks }
        }
        // If task was in a different column previously, remove it
        return {
          ...col,
          tasks: (col.tasks || []).filter((t) => t.id !== task.id),
        }
      })
      return {
        activeBoard: {
          ...state.activeBoard,
          columns,
        },
      }
    }),

  removeTask: (taskId) =>
    set((state) => {
      if (!state.activeBoard) return state
      const columns = state.activeBoard.columns.map((col) => ({
        ...col,
        tasks: (col.tasks || []).filter((t) => t.id !== taskId),
      }))
      return {
        activeBoard: {
          ...state.activeBoard,
          columns,
        },
      }
    }),

  moveTaskLocally: (taskId, targetColumnId, targetIndex) => {
    const currentBoard = get().activeBoard
    if (!currentBoard) return null

    let movedTask: TaskSummary | null = null

    // First pass: extract task from its current column
    const columnsWithoutTask = currentBoard.columns.map((col) => {
      const found = (col.tasks || []).find((t) => t.id === taskId)
      if (found) {
        movedTask = { ...found, columnId: targetColumnId }
        return {
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
        }
      }
      return col
    })

    if (!movedTask) return null

    // Second pass: insert into target column at targetIndex
    const newColumns = columnsWithoutTask.map((col) => {
      if (col.id === targetColumnId) {
        const tasks = [...(col.tasks || [])]
        const clampedIndex = Math.max(0, Math.min(targetIndex, tasks.length))
        tasks.splice(clampedIndex, 0, movedTask!)
        return { ...col, tasks }
      }
      return col
    })

    set({
      activeBoard: {
        ...currentBoard,
        columns: newColumns,
      },
    })

    return currentBoard
  },
}))
