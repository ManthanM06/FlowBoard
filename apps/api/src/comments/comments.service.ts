import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Optional,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'
import { CreateCommentDto } from './dto/create-comment.dto'
import {
  CommentSummary,
  SocketEvent,
  WorkspaceRole,
} from '@flowboard/shared-types'

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeGateway
  ) {}

  private async requireWorkspaceMembership(
    workspaceId: string,
    userId: string
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    })

    if (!membership) {
      throw new ForbiddenException('Access denied to workspace')
    }

    return membership
  }

  async createComment(
    taskId: string,
    userId: string,
    dto: CreateCommentDto
  ): Promise<CommentSummary> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: { board: true },
        },
        assignees: true,
      },
    })

    if (!task) {
      throw new NotFoundException('Task not found')
    }

    const currentWorkspaceId = task.column.board.workspaceId
    await this.requireWorkspaceMembership(currentWorkspaceId, userId)

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        userId,
        body: dto.body.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    const summary: CommentSummary = {
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.userId,
      user: comment.user,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    }

    // Broadcast to board
    if (this.realtime?.server) {
      this.realtime.server
        .to(`board:${task.column.boardId}`)
        .emit(SocketEvent.COMMENT_ADDED, summary)
    }

    // Create in-app notifications for task assignees (excluding author)
    const otherAssignees = task.assignees.filter((a) => a.userId !== userId)
    if (otherAssignees.length > 0) {
      const commenter = comment.user
      const notifs = otherAssignees.map((a) => ({
        userId: a.userId,
        type: 'COMMENT_ADDED',
        payload: {
          taskId: task.id,
          taskTitle: task.title,
          commenterName: commenter?.name || 'Someone',
          commentId: comment.id,
        },
      }))

      await this.prisma.notification.createMany({
        data: notifs,
      })
    }

    return summary
  }

  async getCommentsByTask(
    taskId: string,
    userId: string
  ): Promise<CommentSummary[]> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: { board: true },
        },
      },
    })

    if (!task) {
      throw new NotFoundException('Task not found')
    }

    await this.requireWorkspaceMembership(task.column.board.workspaceId, userId)

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    return comments.map((c) => ({
      id: c.id,
      taskId: c.taskId,
      userId: c.userId,
      user: c.user,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    }))
  }

  async deleteComment(
    commentId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            column: {
              include: { board: true },
            },
          },
        },
      },
    })

    if (!comment) {
      throw new NotFoundException('Comment not found')
    }

    const membership = await this.requireWorkspaceMembership(
      comment.task.column.board.workspaceId,
      userId
    )

    // Only author or workspace ADMIN can delete
    if (comment.userId !== userId && membership.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this comment')
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    })

    return { success: true }
  }
}
