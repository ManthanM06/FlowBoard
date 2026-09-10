import { api } from '../../../shared/lib/api'
import {
  ApiResponse,
  TaskSummary,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
} from '@flowboard/shared-types'

export const createTask = async (
  columnId: string,
  req: CreateTaskRequest
): Promise<TaskSummary> => {
  const res = await api.post<ApiResponse<TaskSummary>>(
    `/columns/${columnId}/tasks`,
    req
  )
  if (!res.data.data) throw new Error('Failed to create task')
  return res.data.data
}

export const fetchTaskDetail = async (
  taskId: string
): Promise<TaskSummary> => {
  const res = await api.get<ApiResponse<TaskSummary>>(`/tasks/${taskId}`)
  if (!res.data.data) throw new Error('Task not found')
  return res.data.data
}

export const updateTask = async (
  taskId: string,
  req: UpdateTaskRequest
): Promise<TaskSummary> => {
  const res = await api.patch<ApiResponse<TaskSummary>>(
    `/tasks/${taskId}`,
    req
  )
  if (!res.data.data) throw new Error('Failed to update task')
  return res.data.data
}

export const moveTask = async (
  taskId: string,
  req: MoveTaskRequest
): Promise<TaskSummary> => {
  const res = await api.patch<ApiResponse<TaskSummary>>(
    `/tasks/${taskId}/move`,
    req
  )
  if (!res.data.data) throw new Error('Failed to move task')
  return res.data.data
}

export const deleteTask = async (
  taskId: string
): Promise<{ success: boolean }> => {
  const res = await api.delete<ApiResponse<{ success: boolean }>>(
    `/tasks/${taskId}`
  )
  return res.data.data ?? { success: true }
}
