import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator'
import { RegisterRequest } from '@flowboard/shared-types'

export class RegisterDto implements RegisterRequest {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password!: string

  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name!: string
}
