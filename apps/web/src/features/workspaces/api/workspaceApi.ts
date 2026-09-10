import { api } from '../../../shared/lib/api'
import {
  ApiResponse,
  WorkspaceDetail,
  WorkspaceSummary,
  WorkspaceMemberSummary,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  JoinWorkspaceRequest,
  UpdateMemberRoleRequest,
} from '@flowboard/shared-types'

export const fetchWorkspaces = async (): Promise<WorkspaceSummary[]> => {
  const response = await api.get<ApiResponse<WorkspaceSummary[]>>('/workspaces')
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch workspaces')
  }
  return response.data.data
}

export const fetchWorkspaceDetail = async (id: string): Promise<WorkspaceDetail> => {
  const response = await api.get<ApiResponse<WorkspaceDetail>>(`/workspaces/${id}`)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch workspace')
  }
  return response.data.data
}

export const createWorkspace = async (data: CreateWorkspaceRequest): Promise<WorkspaceDetail> => {
  const response = await api.post<ApiResponse<WorkspaceDetail>>('/workspaces', data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create workspace')
  }
  return response.data.data
}

export const updateWorkspace = async (
  id: string,
  data: UpdateWorkspaceRequest
): Promise<WorkspaceSummary> => {
  const response = await api.patch<ApiResponse<WorkspaceSummary>>(`/workspaces/${id}`, data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update workspace')
  }
  return response.data.data
}

export const joinWorkspace = async (data: JoinWorkspaceRequest): Promise<WorkspaceDetail> => {
  const response = await api.post<ApiResponse<WorkspaceDetail>>('/workspaces/join', data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to join workspace')
  }
  return response.data.data
}

export const deleteWorkspace = async (id: string): Promise<void> => {
  const response = await api.delete<ApiResponse<{ success: boolean }>>(`/workspaces/${id}`)
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete workspace')
  }
}

export const updateMemberRole = async (
  workspaceId: string,
  userId: string,
  data: UpdateMemberRoleRequest
): Promise<WorkspaceMemberSummary> => {
  const response = await api.patch<ApiResponse<WorkspaceMemberSummary>>(
    `/workspaces/${workspaceId}/members/${userId}`,
    data
  )
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update member role')
  }
  return response.data.data
}

export const removeMember = async (
  workspaceId: string,
  userId: string
): Promise<void> => {
  const response = await api.delete<ApiResponse<{ success: boolean }>>(
    `/workspaces/${workspaceId}/members/${userId}`
  )
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to remove member')
  }
}
