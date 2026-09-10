import { IsString, Length } from 'class-validator'
import { CreateCommentRequest } from '@flowboard/shared-types'

export class CreateCommentDto implements CreateCommentRequest {
  @IsString()
  @Length(1, 1000)
  body: string
}
