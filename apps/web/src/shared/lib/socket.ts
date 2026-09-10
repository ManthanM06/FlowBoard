import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import {
  SocketEvent,
  TaskSummary,
  ColumnSummary,
} from '@flowboard/shared-types'
import { useAuthStore } from '../../features/auth/stores/authStore'
import { useBoardStore } from '../../features/boards/stores/boardStore'

let socketInstance: Socket | null = null

export const getSocket = (token?: string | null): Socket => {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: (cb) => {
        const currentToken = useAuthStore.getState().accessToken
        cb({ token: currentToken })
      },
    })
  }

  if (token && !socketInstance.connected) {
    socketInstance.auth = { token }
    socketInstance.connect()
  }

  return socketInstance
}

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

/**
 * Hook to automatically connect to real-time events for the active board
 */
export const useBoardSocket = (boardId: string | null) => {
  const token = useAuthStore((s) => s.accessToken)
  const {
    addTask,
    updateTask,
    removeTask,
    addColumn,
    updateColumn,
    removeColumn,
  } = useBoardStore()

  const currentBoardIdRef = useRef<string | null>(boardId)
  currentBoardIdRef.current = boardId

  useEffect(() => {
    if (!token || !boardId) return

    const socket = getSocket(token)

    if (!socket.connected) {
      socket.connect()
    }

    // Join the board room
    socket.emit(SocketEvent.BOARD_JOIN, { boardId })

    const handleTaskCreated = (task: TaskSummary) => {
      if (currentBoardIdRef.current === boardId) {
        addTask(task)
      }
    }

    const handleTaskUpdated = (task: TaskSummary) => {
      if (currentBoardIdRef.current === boardId) {
        updateTask(task)
      }
    }

    const handleTaskMoved = (task: TaskSummary) => {
      if (currentBoardIdRef.current === boardId) {
        updateTask(task)
      }
    }

    const handleTaskDeleted = ({ taskId }: { taskId: string; columnId: string }) => {
      if (currentBoardIdRef.current === boardId) {
        removeTask(taskId)
      }
    }

    const handleColumnCreated = (column: ColumnSummary) => {
      if (currentBoardIdRef.current === boardId) {
        addColumn(column)
      }
    }

    const handleColumnUpdated = (column: ColumnSummary) => {
      if (currentBoardIdRef.current === boardId) {
        updateColumn(column)
      }
    }

    const handleColumnDeleted = ({ columnId }: { columnId: string }) => {
      if (currentBoardIdRef.current === boardId) {
        removeColumn(columnId)
      }
    }

    socket.on(SocketEvent.TASK_CREATED, handleTaskCreated)
    socket.on(SocketEvent.TASK_UPDATED, handleTaskUpdated)
    socket.on(SocketEvent.TASK_MOVED, handleTaskMoved)
    socket.on(SocketEvent.TASK_DELETED, handleTaskDeleted)
    socket.on(SocketEvent.COLUMN_CREATED, handleColumnCreated)
    socket.on(SocketEvent.COLUMN_UPDATED, handleColumnUpdated)
    socket.on(SocketEvent.COLUMN_DELETED, handleColumnDeleted)

    return () => {
      socket.emit(SocketEvent.BOARD_LEAVE, { boardId })
      socket.off(SocketEvent.TASK_CREATED, handleTaskCreated)
      socket.off(SocketEvent.TASK_UPDATED, handleTaskUpdated)
      socket.off(SocketEvent.TASK_MOVED, handleTaskMoved)
      socket.off(SocketEvent.TASK_DELETED, handleTaskDeleted)
      socket.off(SocketEvent.COLUMN_CREATED, handleColumnCreated)
      socket.off(SocketEvent.COLUMN_UPDATED, handleColumnUpdated)
      socket.off(SocketEvent.COLUMN_DELETED, handleColumnDeleted)
    }
  }, [
    token,
    boardId,
    addTask,
    updateTask,
    removeTask,
    addColumn,
    updateColumn,
    removeColumn,
  ])
}
