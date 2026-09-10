import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import {
  SocketEvent,
  TaskSummary,
  ColumnSummary,
} from '@flowboard/shared-types'
import { Logger } from '@nestjs/common'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(RealtimeGateway.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        client.handshake.query?.token

      if (!token || typeof token !== 'string') {
        this.logger.warn(`Unauthorized socket connection attempt: ${client.id}`)
        client.disconnect()
        return
      }

      const secret =
        this.configService.get<string>('JWT_ACCESS_SECRET') || 'flowboard-access-secret'
      const payload = await this.jwtService.verifyAsync(token, { secret })

      client.data.user = payload
      this.logger.log(`Socket connected: ${client.id} (User: ${payload.sub})`)
    } catch (err) {
      this.logger.warn(`Socket authentication failed: ${err.message}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket disconnected: ${client.id}`)
  }

  @SubscribeMessage(SocketEvent.BOARD_JOIN)
  async handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string }
  ) {
    const userId = client.data.user?.sub
    if (!userId || !data.boardId) return

    // Verify user has membership in the board's workspace
    const board = await this.prisma.board.findUnique({
      where: { id: data.boardId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!board || board.workspace.members.length === 0) {
      return { success: false, error: 'Forbidden' }
    }

    const roomName = `board:${data.boardId}`
    await client.join(roomName)
    this.logger.log(`User ${userId} joined room ${roomName}`)
    return { success: true, room: roomName }
  }

  @SubscribeMessage(SocketEvent.BOARD_LEAVE)
  async handleLeaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string }
  ) {
    if (!data.boardId) return
    const roomName = `board:${data.boardId}`
    await client.leave(roomName)
    this.logger.log(`Socket ${client.id} left room ${roomName}`)
    return { success: true }
  }

  // --- Broadcast helpers ---

  emitTaskCreated(boardId: string, task: TaskSummary) {
    if (!this.server) return
    this.server.to(`board:${boardId}`).emit(SocketEvent.TASK_CREATED, task)
  }

  emitTaskUpdated(boardId: string, task: TaskSummary) {
    if (!this.server) return
    this.server.to(`board:${boardId}`).emit(SocketEvent.TASK_UPDATED, task)
  }

  emitTaskMoved(boardId: string, task: TaskSummary) {
    if (!this.server) return
    this.server.to(`board:${boardId}`).emit(SocketEvent.TASK_MOVED, task)
  }

  emitTaskDeleted(boardId: string, payload: { taskId: string; columnId: string }) {
    if (!this.server) return
    this.server.to(`board:${boardId}`).emit(SocketEvent.TASK_DELETED, payload)
  }

  emitColumnCreated(boardId: string, column: ColumnSummary) {
    if (!this.server) return
    this.server.to(`board:${boardId}`).emit(SocketEvent.COLUMN_CREATED, column)
  }

  emitColumnUpdated(boardId: string, column: ColumnSummary) {
    if (!this.server) return
    this.server.to(`board:${boardId}`).emit(SocketEvent.COLUMN_UPDATED, column)
  }

  emitColumnDeleted(boardId: string, columnId: string) {
    if (!this.server) return
    this.server.to(`board:${boardId}`).emit(SocketEvent.COLUMN_DELETED, { columnId })
  }
}
