import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { WorkspacesService } from './workspaces.service'
import { CreateWorkspaceDto } from './dto/create-workspace.dto'
import { UpdateWorkspaceDto } from './dto/update-workspace.dto'
import { JoinWorkspaceDto } from './dto/join-workspace.dto'
import { UpdateMemberRoleDto } from './dto/update-member-role.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkspaceRolesGuard } from './guards/workspace-roles.guard'
import { RequireWorkspaceRole } from './decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { WorkspaceRole } from '@flowboard/shared-types'

@Controller('workspaces')
@UseGuards(JwtAuthGuard, WorkspaceRolesGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWorkspaceDto
  ) {
    const data = await this.workspacesService.create(userId, dto)
    return {
      success: true,
      data,
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser('id') userId: string) {
    const data = await this.workspacesService.findAllForUser(userId)
    return {
      success: true,
      data,
    }
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  async join(
    @CurrentUser('id') userId: string,
    @Body() dto: JoinWorkspaceDto
  ) {
    const data = await this.workspacesService.joinByInviteCode(
      userId,
      dto.inviteCode
    )
    return {
      success: true,
      data,
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') workspaceId: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.workspacesService.findById(workspaceId, userId)
    return {
      success: true,
      data,
    }
  }

  @Patch(':id')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto
  ) {
    const data = await this.workspacesService.update(workspaceId, dto)
    return {
      success: true,
      data,
    }
  }

  @Delete(':id')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') workspaceId: string,
    @CurrentUser('id') userId: string
  ) {
    const result = await this.workspacesService.delete(workspaceId, userId)
    return {
      success: true,
      data: result,
    }
  }

  @Patch(':id/members/:userId')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateMemberRole(
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto
  ) {
    const data = await this.workspacesService.updateMemberRole(
      workspaceId,
      targetUserId,
      dto.role
    )
    return {
      success: true,
      data,
    }
  }

  @Delete(':id/members/:userId')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string
  ) {
    const result = await this.workspacesService.removeMember(
      workspaceId,
      targetUserId
    )
    return {
      success: true,
      data: result,
    }
  }
}
