import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { LoginRequest } from '@flowboard/shared-types'

export class LoginDto implements LoginRequest {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string
}
