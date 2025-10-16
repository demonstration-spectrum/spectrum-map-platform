import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({
    description: 'User email address to receive OTP',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}
