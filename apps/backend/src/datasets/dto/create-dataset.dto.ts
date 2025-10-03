import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { DatasetVisibility } from '@prisma/client';

export class CreateDatasetDto {
  @ApiProperty({
    description: 'Dataset name',
    example: 'City Boundaries',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Dataset description',
    example: 'Administrative boundaries for the city',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Dataset visibility',
    enum: DatasetVisibility,
    default: DatasetVisibility.PRIVATE,
  })
  @IsOptional()
  @IsEnum(DatasetVisibility)
  visibility?: DatasetVisibility;

  @ApiProperty({
    description: 'Default styling configuration (Mapbox Style Specification JSON)',
    required: false,
  })
  @IsOptional()
  defaultStyle?: any;
}
