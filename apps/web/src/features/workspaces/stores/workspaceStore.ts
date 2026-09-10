import { create } from 'zustand'
import { WorkspaceDetail, WorkspaceSummary } from '@flowboard/shared-types'

interface WorkspaceState {
  workspaces: WorkspaceSummary[]
  activeWorkspace: WorkspaceDetail | null
  isLoading: boolean
  setWorkspaces: (workspaces: WorkspaceSummary[]) => void
  setActiveWorkspace: (workspace: WorkspaceDetail | null) => void
  setIsLoading: (isLoading: boolean) => void
  clearWorkspaces: () => void
}

const STORAGE_ACTIVE_WS = 'flowboard_active_workspace_id'

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  isLoading: false,

  setWorkspaces: (workspaces) => {
    set({ workspaces })
  },

  setActiveWorkspace: (workspace) => {
    if (workspace) {
      localStorage.setItem(STORAGE_ACTIVE_WS, workspace.id)
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_WS)
    }
    set({ activeWorkspace: workspace })
  },

  setIsLoading: (isLoading) => set({ isLoading }),

  clearWorkspaces: () => {
    localStorage.removeItem(STORAGE_ACTIVE_WS)
    set({ workspaces: [], activeWorkspace: null })
  },
}))

export const getStoredActiveWorkspaceId = (): string | null => {
  return localStorage.getItem(STORAGE_ACTIVE_WS)
}
