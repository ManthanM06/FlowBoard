import { IsNotEmpty, IsString } from 'class-validator'
import { RefreshTokenRequest } from '@flowboard/shared-types'

export class RefreshTokenDto implements RefreshTokenRequest {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string
}
