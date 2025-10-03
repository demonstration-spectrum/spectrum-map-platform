import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCorporationDto {
  @ApiProperty({
    description: 'Corporation name',
    example: 'Acme Corporation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Corporation description',
    example: 'A leading technology company',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
