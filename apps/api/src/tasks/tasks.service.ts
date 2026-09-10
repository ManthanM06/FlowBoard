import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import {
  TaskSummary,
  TaskPriority,
  UserSummary,
} from '@flowboard/shared-types'

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

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
      throw new ForbiddenException(
        'You do not have permission to access tasks in this workspace'
      )
    }

    return membership
  }

  async createTask(
    columnId: string,
    userId: string,
    dto: CreateTaskDto
  ): Promise<TaskSummary> {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    })

    if (!column) {
      throw new NotFoundException('Column not found')
    }

    await this.requireWorkspaceMembership(column.board.workspaceId, userId)

    let order = dto.order
    if (order === undefined) {
      const highestTask = await this.prisma.task.findFirst({
        where: { columnId },
        orderBy: { order: 'desc' },
      })
      order = (highestTask?.order ?? 0) + 1000
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          columnId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          priority: dto.priority ?? TaskPriority.MEDIUM,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          order,
        },
      })

      if (dto.assigneeIds && dto.assigneeIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: dto.assigneeIds.map((assigneeId) => ({
            taskId: created.id,
            userId: assigneeId,
          })),
        })
      }

      return tx.task.findUnique({
        where: { id: created.id },
        include: {
          assignees: {
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
          },
        },
      })
    })

    if (!task) {
      throw new BadRequestException('Failed to create task')
    }

    return this.mapTaskToSummary(task)
  }

  async findById(taskId: string, userId: string): Promise<TaskSummary> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: { board: true },
        },
        assignees: {
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
        },
      },
    })

    if (!task) {
      throw new NotFoundException('Task not found')
    }

    await this.requireWorkspaceMembership(task.column.board.workspaceId, userId)

    return this.mapTaskToSummary(task)
  }

  async updateTask(
    taskId: string,
    userId: string,
    dto: UpdateTaskDto
  ): Promise<TaskSummary> {
    const existing = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: { board: true },
        },
      },
    })

    if (!existing) {
      throw new NotFoundException('Task not found')
    }

    await this.requireWorkspaceMembership(
      existing.column.board.workspaceId,
      userId
    )

    if (dto.columnId && dto.columnId !== existing.columnId) {
      const targetColumn = await this.prisma.column.findUnique({
        where: { id: dto.columnId },
        include: { board: true },
      })
      if (!targetColumn) {
        throw new NotFoundException('Target column not found')
      }
      if (
        targetColumn.board.workspaceId !== existing.column.board.workspaceId
      ) {
        throw new ForbiddenException(
          'Target column is in a different workspace'
        )
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: {
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description ? dto.description.trim() : null,
          }),
          ...(dto.priority !== undefined && { priority: dto.priority }),
          ...(dto.dueDate !== undefined && {
            dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          }),
          ...(dto.columnId !== undefined && { columnId: dto.columnId }),
          ...(dto.order !== undefined && { order: dto.order }),
        },
      })

      if (dto.assigneeIds !== undefined) {
        await tx.taskAssignee.deleteMany({
          where: { taskId },
        })

        if (dto.assigneeIds.length > 0) {
          await tx.taskAssignee.createMany({
            data: dto.assigneeIds.map((assigneeId) => ({
              taskId,
              userId: assigneeId,
            })),
          })
        }
      }

      return tx.task.findUnique({
        where: { id: taskId },
        include: {
          assignees: {
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
          },
        },
      })
    })

    if (!updated) {
      throw new BadRequestException('Failed to update task')
    }

    return this.mapTaskToSummary(updated)
  }

  async deleteTask(
    taskId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    const existing = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: { board: true },
        },
      },
    })

    if (!existing) {
      throw new NotFoundException('Task not found')
    }

    await this.requireWorkspaceMembership(
      existing.column.board.workspaceId,
      userId
    )

    await this.prisma.task.delete({
      where: { id: taskId },
    })

    return { success: true }
  }

  private mapTaskToSummary(task: {
    id: string
    columnId: string
    title: string
    description: string | null
    priority: unknown
    dueDate: Date | null
    order: number
    createdAt: Date
    updatedAt: Date
    assignees?: Array<{
      user: {
        id: string
        email: string
        name: string
        avatarUrl: string | null
      }
    }>
  }): TaskSummary {
    const assignees: UserSummary[] =
      task.assignees?.map((a) => ({
        id: a.user.id,
        email: a.user.email,
        name: a.user.name,
        avatarUrl: a.user.avatarUrl,
      })) ?? []

    return {
      id: task.id,
      columnId: task.columnId,
      title: task.title,
      description: task.description,
      priority: task.priority as TaskPriority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      order: task.order,
      assignees,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }
  }
}
