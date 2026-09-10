import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWorkspaceDto } from './dto/create-workspace.dto'
import { UpdateWorkspaceDto } from './dto/update-workspace.dto'
import {
  WorkspaceDetail,
  WorkspaceSummary,
  WorkspaceMemberSummary,
  WorkspaceRole,
} from '@flowboard/shared-types'

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto): Promise<WorkspaceDetail> {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.name.trim(),
          ownerId: userId,
        },
      })

      const member = await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: workspace.id,
          role: WorkspaceRole.ADMIN,
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

      return {
        id: workspace.id,
        name: workspace.name,
        ownerId: workspace.ownerId,
        inviteCode: workspace.inviteCode,
        createdAt: workspace.createdAt.toISOString(),
        role: WorkspaceRole.ADMIN,
        members: [
          {
            id: member.id,
            userId: member.userId,
            workspaceId: member.workspaceId,
            role: member.role as WorkspaceRole,
            joinedAt: member.joinedAt.toISOString(),
            user: member.user,
          },
        ],
      }
    })
  }

  async findAllForUser(userId: string): Promise<WorkspaceSummary[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    })

    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      ownerId: m.workspace.ownerId,
      inviteCode: m.workspace.inviteCode,
      createdAt: m.workspace.createdAt.toISOString(),
      role: m.role as WorkspaceRole,
    }))
  }

  async findById(workspaceId: string, userId: string): Promise<WorkspaceDetail> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
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
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    })

    if (!workspace) {
      throw new NotFoundException('Workspace not found')
    }

    const currentMember = workspace.members.find((m) => m.userId === userId)
    if (!currentMember) {
      throw new ForbiddenException('You are not a member of this workspace')
    }

    return {
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.ownerId,
      inviteCode: workspace.inviteCode,
      createdAt: workspace.createdAt.toISOString(),
      role: currentMember.role as WorkspaceRole,
      members: workspace.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        workspaceId: m.workspaceId,
        role: m.role as WorkspaceRole,
        joinedAt: m.joinedAt.toISOString(),
        user: m.user,
      })),
    }
  }

  async joinByInviteCode(userId: string, inviteCode: string): Promise<WorkspaceDetail> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { inviteCode: inviteCode.trim() },
    })

    if (!workspace) {
      throw new NotFoundException('Invalid workspace invite code')
    }

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: workspace.id,
        },
      },
    })

    if (!existingMember) {
      await this.prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId: workspace.id,
          role: WorkspaceRole.MEMBER,
        },
      })
    }

    return this.findById(workspace.id, userId)
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto): Promise<WorkspaceSummary> {
    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: dto.name.trim() },
    })

    return {
      id: updated.id,
      name: updated.name,
      ownerId: updated.ownerId,
      inviteCode: updated.inviteCode,
      createdAt: updated.createdAt.toISOString(),
    }
  }

  async delete(workspaceId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (!workspace) {
      throw new NotFoundException('Workspace not found')
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can delete this workspace')
    }

    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    })

    return {
      success: true,
      message: 'Workspace deleted successfully',
    }
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    newRole: WorkspaceRole
  ): Promise<WorkspaceMemberSummary> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (!workspace) {
      throw new NotFoundException('Workspace not found')
    }

    if (workspace.ownerId === targetUserId && newRole !== WorkspaceRole.ADMIN) {
      throw new BadRequestException('Cannot demote the workspace owner from Admin')
    }

    const updated = await this.prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
      data: {
        role: newRole,
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

    return {
      id: updated.id,
      userId: updated.userId,
      workspaceId: updated.workspaceId,
      role: updated.role as WorkspaceRole,
      joinedAt: updated.joinedAt.toISOString(),
      user: updated.user,
    }
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string
  ): Promise<{ success: boolean; message: string }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (!workspace) {
      throw new NotFoundException('Workspace not found')
    }

    if (workspace.ownerId === targetUserId) {
      throw new BadRequestException('Cannot remove the workspace owner')
    }

    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
    })

    return {
      success: true,
      message: 'Member removed from workspace',
    }
  }
}
