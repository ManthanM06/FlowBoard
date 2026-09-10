import {
  IsString,
  Length,
  IsOptional,
  IsEnum,
  IsISO8601,
  IsArray,
  IsUUID,
  IsNumber,
} from 'class-validator'
import { UpdateTaskRequest, TaskPriority } from '@flowboard/shared-types'

export class UpdateTaskDto implements UpdateTaskRequest {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string

  @IsOptional()
  @IsString()
  description?: string | null

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority

  @IsOptional()
  @IsISO8601()
  dueDate?: string | null

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeIds?: string[]

  @IsOptional()
  @IsUUID('4')
  columnId?: string

  @IsOptional()
  @IsNumber()
  order?: number
}
