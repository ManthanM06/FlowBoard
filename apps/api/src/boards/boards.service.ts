import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Optional,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'
import { CreateBoardDto } from './dto/create-board.dto'
import { UpdateBoardDto } from './dto/update-board.dto'
import { CreateColumnDto, UpdateColumnDto } from './dto/column.dto'
import {
  BoardDetail,
  BoardSummary,
  ColumnSummary,
  WorkspaceRole,
  TaskPriority,
} from '@flowboard/shared-types'

const DEFAULT_COLUMNS = [
  { name: 'To Do', order: 1000 },
  { name: 'In Progress', order: 2000 },
  { name: 'Done', order: 3000 },
]

@Injectable()
export class BoardsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeGateway
  ) {}

  private async getMembership(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    })
    return membership
  }

  private async requireWorkspaceAccess(
    workspaceId: string,
    userId: string,
    requiredRole?: WorkspaceRole
  ) {
    const membership = await this.getMembership(workspaceId, userId)
    if (!membership) {
      throw new ForbiddenException('You do not have access to this workspace')
    }
    if (requiredRole && membership.role !== requiredRole) {
      throw new ForbiddenException(
        `${requiredRole} role required for this action`
      )
    }
    return membership
  }

  async createBoard(
    workspaceId: string,
    userId: string,
    dto: CreateBoardDto
  ): Promise<BoardDetail> {
    await this.requireWorkspaceAccess(workspaceId, userId, WorkspaceRole.ADMIN)

    return this.prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          name: dto.name.trim(),
          workspaceId,
        },
      })

      const columnCreates = DEFAULT_COLUMNS.map((col) =>
        tx.column.create({
          data: {
            boardId: board.id,
            name: col.name,
            order: col.order,
          },
        })
      )

      const columns = await Promise.all(columnCreates)

      return {
        id: board.id,
        workspaceId: board.workspaceId,
        name: board.name,
        createdAt: board.createdAt.toISOString(),
        updatedAt: board.updatedAt.toISOString(),
        columns: columns.map((c) => ({
          id: c.id,
          boardId: c.boardId,
          name: c.name,
          order: c.order,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          tasks: [],
        })),
      }
    })
  }

  async findAllByWorkspace(
    workspaceId: string,
    userId: string
  ): Promise<BoardSummary[]> {
    await this.requireWorkspaceAccess(workspaceId, userId)

    const boards = await this.prisma.board.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    })

    return boards.map((b) => ({
      id: b.id,
      workspaceId: b.workspaceId,
      name: b.name,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }))
  }

  async findById(boardId: string, userId: string): Promise<BoardDetail> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
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
            },
          },
        },
      },
    })

    if (!board) {
      throw new NotFoundException('Board not found')
    }

    await this.requireWorkspaceAccess(board.workspaceId, userId)

    return {
      id: board.id,
      workspaceId: board.workspaceId,
      name: board.name,
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
      columns: board.columns.map((c) => ({
        id: c.id,
        boardId: c.boardId,
        name: c.name,
        order: c.order,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        tasks: (c.tasks || []).map((t) => ({
          id: t.id,
          columnId: t.columnId,
          title: t.title,
          description: t.description,
          priority: t.priority as TaskPriority,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          order: t.order,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          assignees: (t.assignees || []).map((a) => ({
            id: a.user.id,
            email: a.user.email,
            name: a.user.name,
            avatarUrl: a.user.avatarUrl,
          })),
        })),
      })),
    }
  }

  async updateBoard(
    boardId: string,
    userId: string,
    dto: UpdateBoardDto
  ): Promise<BoardDetail> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      throw new NotFoundException('Board not found')
    }

    await this.requireWorkspaceAccess(
      board.workspaceId,
      userId,
      WorkspaceRole.ADMIN
    )

    const updated = await this.prisma.board.update({
      where: { id: boardId },
      data: {
        name: dto.name.trim(),
      },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
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
            },
          },
        },
      },
    })

    return {
      id: updated.id,
      workspaceId: updated.workspaceId,
      name: updated.name,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      columns: updated.columns.map((c) => ({
        id: c.id,
        boardId: c.boardId,
        name: c.name,
        order: c.order,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        tasks: (c.tasks || []).map((t) => ({
          id: t.id,
          columnId: t.columnId,
          title: t.title,
          description: t.description,
          priority: t.priority as TaskPriority,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          order: t.order,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          assignees: (t.assignees || []).map((a) => ({
            id: a.user.id,
            email: a.user.email,
            name: a.user.name,
            avatarUrl: a.user.avatarUrl,
          })),
        })),
      })),
    }
  }

  async deleteBoard(
    boardId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      throw new NotFoundException('Board not found')
    }

    await this.requireWorkspaceAccess(
      board.workspaceId,
      userId,
      WorkspaceRole.ADMIN
    )

    await this.prisma.board.delete({
      where: { id: boardId },
    })

    return { success: true }
  }

  async createColumn(
    boardId: string,
    userId: string,
    dto: CreateColumnDto
  ): Promise<ColumnSummary> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      throw new NotFoundException('Board not found')
    }

    await this.requireWorkspaceAccess(
      board.workspaceId,
      userId,
      WorkspaceRole.ADMIN
    )

    let order = dto.order
    if (order === undefined) {
      const highestColumn = await this.prisma.column.findFirst({
        where: { boardId },
        orderBy: { order: 'desc' },
      })
      order = (highestColumn?.order ?? 0) + 1000
    }

    const column = await this.prisma.column.create({
      data: {
        boardId,
        name: dto.name.trim(),
        order,
      },
    })

    const result: ColumnSummary = {
      id: column.id,
      boardId: column.boardId,
      name: column.name,
      order: column.order,
      createdAt: column.createdAt.toISOString(),
      updatedAt: column.updatedAt.toISOString(),
    }

    this.realtime?.emitColumnCreated(boardId, result)
    return result
  }

  async updateColumn(
    columnId: string,
    userId: string,
    dto: UpdateColumnDto
  ): Promise<ColumnSummary> {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    })

    if (!column) {
      throw new NotFoundException('Column not found')
    }

    await this.requireWorkspaceAccess(
      column.board.workspaceId,
      userId,
      WorkspaceRole.ADMIN
    )

    const updated = await this.prisma.column.update({
      where: { id: columnId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    })

    const result: ColumnSummary = {
      id: updated.id,
      boardId: updated.boardId,
      name: updated.name,
      order: updated.order,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }

    this.realtime?.emitColumnUpdated(column.boardId, result)
    return result
  }

  async deleteColumn(
    columnId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    })

    if (!column) {
      throw new NotFoundException('Column not found')
    }

    await this.requireWorkspaceAccess(
      column.board.workspaceId,
      userId,
      WorkspaceRole.ADMIN
    )

    await this.prisma.column.delete({
      where: { id: columnId },
    })

    this.realtime?.emitColumnDeleted(column.boardId, columnId)
    return { success: true }
  }

  async reorderColumns(
    boardId: string,
    userId: string,
    columnIds: string[]
  ): Promise<ColumnSummary[]> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { columns: true },
    })

    if (!board) {
      throw new NotFoundException('Board not found')
    }

    await this.requireWorkspaceAccess(
      board.workspaceId,
      userId,
      WorkspaceRole.ADMIN
    )

    await this.prisma.$transaction(
      columnIds.map((id, index) =>
        this.prisma.column.update({
          where: { id },
          data: { order: (index + 1) * 1000 },
        })
      )
    )

    const updatedColumns = await this.prisma.column.findMany({
      where: { boardId },
      orderBy: { order: 'asc' },
    })

    return updatedColumns.map((c) => ({
      id: c.id,
      boardId: c.boardId,
      name: c.name,
      order: c.order,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))
  }
}
