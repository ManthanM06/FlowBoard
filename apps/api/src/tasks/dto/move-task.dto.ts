import { IsUUID, IsOptional, IsNumber } from 'class-validator'
import { MoveTaskRequest } from '@flowboard/shared-types'

export class MoveTaskDto implements MoveTaskRequest {
  @IsUUID('4')
  targetColumnId: string

  @IsOptional()
  @IsNumber()
  targetOrder?: number

  @IsOptional()
  @IsUUID('4')
  previousTaskId?: string

  @IsOptional()
  @IsUUID('4')
  nextTaskId?: string
}
