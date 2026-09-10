import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { WorkspaceRole } from '@flowboard/shared-types'
import { WORKSPACE_ROLE_KEY } from '../decorators/roles.decorator'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class WorkspaceRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<WorkspaceRole>(
      WORKSPACE_ROLE_KEY,
      [context.getHandler(), context.getClass()]
    )

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user || !user.id) {
      throw new ForbiddenException('User authentication required')
    }

    const workspaceId =
      request.params?.workspaceId ||
      request.params?.id ||
      request.body?.workspaceId

    if (!workspaceId) {
      return true
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    })

    if (!workspace) {
      throw new NotFoundException('Workspace not found')
    }

    const membership = workspace.members[0]
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace')
    }

    request.workspaceMember = membership

    if (requiredRole === WorkspaceRole.ADMIN && membership.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Admin role required for this action')
    }

    return true
  }
}
