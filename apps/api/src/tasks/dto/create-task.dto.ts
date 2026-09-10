import {
  IsNotEmpty,
  IsString,
  Length,
  IsOptional,
  IsEnum,
  IsISO8601,
  IsArray,
  IsUUID,
  IsNumber,
} from 'class-validator'
import { CreateTaskRequest, TaskPriority } from '@flowboard/shared-types'

export class CreateTaskDto implements CreateTaskRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  title: string

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
  @IsNumber()
  order?: number
}
