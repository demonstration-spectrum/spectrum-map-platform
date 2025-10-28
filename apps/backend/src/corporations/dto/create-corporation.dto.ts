import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { CorporationStatus } from '@prisma/client';

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

  @ApiProperty({ description: 'Corporation status', enum: CorporationStatus, required: false })
  @IsOptional()
  @IsEnum(CorporationStatus)
  status?: CorporationStatus;
}
