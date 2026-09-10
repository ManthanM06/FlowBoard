import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'
import { UpdateWorkspaceRequest } from '@flowboard/shared-types'

export class UpdateWorkspaceDto implements UpdateWorkspaceRequest {
  @IsString()
  @IsNotEmpty({ message: 'Workspace name is required' })
  @MinLength(2, { message: 'Workspace name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Workspace name cannot exceed 50 characters' })
  name!: string
}
