import { api } from '../../../shared/lib/api'
import {
  ApiResponse,
  BoardDetail,
  BoardSummary,
  ColumnSummary,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateColumnRequest,
  UpdateColumnRequest,
  ReorderColumnsRequest,
} from '@flowboard/shared-types'

export const fetchBoards = async (
  workspaceId: string
): Promise<BoardSummary[]> => {
  const res = await api.get<ApiResponse<BoardSummary[]>>(
    `/workspaces/${workspaceId}/boards`
  )
  return res.data.data ?? []
}

export const fetchBoardDetail = async (
  boardId: string
): Promise<BoardDetail> => {
  const res = await api.get<ApiResponse<BoardDetail>>(`/boards/${boardId}`)
  if (!res.data.data) throw new Error('Board not found')
  return res.data.data
}

export const createBoard = async (
  workspaceId: string,
  req: CreateBoardRequest
): Promise<BoardDetail> => {
  const res = await api.post<ApiResponse<BoardDetail>>(
    `/workspaces/${workspaceId}/boards`,
    req
  )
  if (!res.data.data) throw new Error('Failed to create board')
  return res.data.data
}

export const updateBoard = async (
  boardId: string,
  req: UpdateBoardRequest
): Promise<BoardDetail> => {
  const res = await api.patch<ApiResponse<BoardDetail>>(
    `/boards/${boardId}`,
    req
  )
  if (!res.data.data) throw new Error('Failed to update board')
  return res.data.data
}

export const deleteBoard = async (
  boardId: string
): Promise<{ success: boolean }> => {
  const res = await api.delete<ApiResponse<{ success: boolean }>>(
    `/boards/${boardId}`
  )
  return res.data.data ?? { success: true }
}

export const createColumn = async (
  boardId: string,
  req: CreateColumnRequest
): Promise<ColumnSummary> => {
  const res = await api.post<ApiResponse<ColumnSummary>>(
    `/boards/${boardId}/columns`,
    req
  )
  if (!res.data.data) throw new Error('Failed to create column')
  return res.data.data
}

export const updateColumn = async (
  columnId: string,
  req: UpdateColumnRequest
): Promise<ColumnSummary> => {
  const res = await api.patch<ApiResponse<ColumnSummary>>(
    `/columns/${columnId}`,
    req
  )
  if (!res.data.data) throw new Error('Failed to update column')
  return res.data.data
}

export const deleteColumn = async (
  columnId: string
): Promise<{ success: boolean }> => {
  const res = await api.delete<ApiResponse<{ success: boolean }>>(
    `/columns/${columnId}`
  )
  return res.data.data ?? { success: true }
}

export const reorderColumns = async (
  boardId: string,
  req: ReorderColumnsRequest
): Promise<ColumnSummary[]> => {
  const res = await api.patch<ApiResponse<ColumnSummary[]>>(
    `/boards/${boardId}/columns/reorder`,
    req
  )
  return res.data.data ?? []
}
