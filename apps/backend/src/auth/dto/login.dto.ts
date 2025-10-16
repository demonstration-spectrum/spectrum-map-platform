import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'One-time password (OTP) sent to the user email',
    example: '123456',
    minLength: 4,
  })
  @IsString()
  otp: string;

  @ApiProperty({
    description: 'Cognito session token returned by initiate auth (required for verifying OTP in some flows)',
    example: 'session-token',
    required: false,
  })
  @IsString()
  session?: string;
}
