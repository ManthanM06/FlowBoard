import { Module } from '@nestjs/common'
import { WorkspacesService } from './workspaces.service'
import { WorkspacesController } from './workspaces.controller'
import { WorkspaceRolesGuard } from './guards/workspace-roles.guard'

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceRolesGuard],
  exports: [WorkspacesService, WorkspaceRolesGuard],
})
export class WorkspacesModule {}
