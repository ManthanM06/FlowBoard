export enum WorkspaceRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface UserSummary {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
}

export interface WorkspaceSummary {
  id: string
  name: string
  ownerId: string
  createdAt: string
  role?: WorkspaceRole
}

export interface BoardSummary {
  id: string
  workspaceId: string
  name: string
  createdAt: string
}

export interface ColumnSummary {
  id: string
  boardId: string
  name: string
  order: number
}

export interface TaskSummary {
  id: string
  columnId: string
  title: string
  description?: string | null
  priority: TaskPriority
  dueDate?: string | null
  order: number
  assignees?: UserSummary[]
}

export interface CommentSummary {
  id: string
  taskId: string
  userId: string
  user?: UserSummary
  body: string
  createdAt: string
}

export interface NotificationSummary {
  id: string
  userId: string
  type: string
  payload: Record<string, unknown>
  readAt?: string | null
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export enum SocketEvent {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_MOVED = 'task.moved',
  TASK_DELETED = 'task.deleted',
  COMMENT_ADDED = 'comment.added',
  BOARD_JOIN = 'board.join',
  BOARD_LEAVE = 'board.leave',
}
