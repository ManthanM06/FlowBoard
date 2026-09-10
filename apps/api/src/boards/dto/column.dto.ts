import {
  IsNotEmpty,
  IsString,
  Length,
  IsOptional,
  IsNumber,
  IsArray,
  IsUUID,
} from 'class-validator'
import {
  CreateColumnRequest,
  UpdateColumnRequest,
  ReorderColumnsRequest,
} from '@flowboard/shared-types'

export class CreateColumnDto implements CreateColumnRequest {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string

  @IsOptional()
  @IsNumber()
  order?: number
}

export class UpdateColumnDto implements UpdateColumnRequest {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string

  @IsOptional()
  @IsNumber()
  order?: number
}

export class ReorderColumnsDto implements ReorderColumnsRequest {
  @IsArray()
  @IsUUID('4', { each: true })
  columnIds: string[]
}
