import { create } from 'zustand'
import { BoardDetail, BoardSummary, ColumnSummary } from '@flowboard/shared-types'

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
}

export const useBoardStore = create<BoardState>((set) => ({
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
      const columns = [...state.activeBoard.columns, col].sort(
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
        .map((c) => (c.id === col.id ? col : c))
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
}))
