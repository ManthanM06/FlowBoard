import { IsNotEmpty, IsString } from 'class-validator'
import { JoinWorkspaceRequest } from '@flowboard/shared-types'

export class JoinWorkspaceDto implements JoinWorkspaceRequest {
  @IsString()
  @IsNotEmpty({ message: 'Invite code is required' })
  inviteCode!: string
}
