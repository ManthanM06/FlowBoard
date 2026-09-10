import { IsNotEmpty, IsString, Length } from 'class-validator'
import { UpdateBoardRequest } from '@flowboard/shared-types'

export class UpdateBoardDto implements UpdateBoardRequest {
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  name: string
}
