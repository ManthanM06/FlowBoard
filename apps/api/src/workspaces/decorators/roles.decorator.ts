import { SetMetadata } from '@nestjs/common'
import { WorkspaceRole } from '@flowboard/shared-types'

export const WORKSPACE_ROLE_KEY = 'workspaceRole'
export const RequireWorkspaceRole = (role: WorkspaceRole) =>
  SetMetadata(WORKSPACE_ROLE_KEY, role)
