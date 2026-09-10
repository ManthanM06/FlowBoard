import { IsEnum } from 'class-validator'
import { UpdateMemberRoleRequest, WorkspaceRole } from '@flowboard/shared-types'

export class UpdateMemberRoleDto implements UpdateMemberRoleRequest {
  @IsEnum(WorkspaceRole, { message: 'Role must be either ADMIN or MEMBER' })
  role!: WorkspaceRole
}
