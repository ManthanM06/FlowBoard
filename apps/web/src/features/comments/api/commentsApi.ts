import { api } from '../../../shared/lib/api'
import { ApiResponse, CommentSummary, CreateCommentRequest } from '@flowboard/shared-types'

export const fetchComments = async (taskId: string): Promise<CommentSummary[]> => {
  const res = await api.get<ApiResponse<CommentSummary[]>>(`/tasks/${taskId}/comments`)
  return res.data.data ?? []
}

export const addComment = async (
  taskId: string,
  req: CreateCommentRequest
): Promise<CommentSummary> => {
  const res = await api.post<ApiResponse<CommentSummary>>(`/tasks/${taskId}/comments`, req)
  if (!res.data.data) throw new Error('Failed to post comment')
  return res.data.data
}

export const deleteComment = async (commentId: string): Promise<void> => {
  await api.delete<ApiResponse<{ success: boolean }>>(`/comments/${commentId}`)
}
