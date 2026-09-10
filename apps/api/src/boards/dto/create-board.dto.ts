import { IsNotEmpty, IsString, Length } from 'class-validator'
import { CreateBoardRequest } from '@flowboard/shared-types'

export class CreateBoardDto implements CreateBoardRequest {
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  name: string
}
