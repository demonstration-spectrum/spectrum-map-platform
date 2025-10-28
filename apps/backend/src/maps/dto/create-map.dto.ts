import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { MapVisibility } from '@prisma/client';

export class CreateMapDto {
  @ApiProperty({
    description: 'Map name',
    example: 'City Infrastructure Map',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Map description',
    example: 'A comprehensive map showing city infrastructure',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Map visibility',
    enum: MapVisibility,
    default: MapVisibility.PRIVATE,
  })
  @IsOptional()
  @IsEnum(MapVisibility)
  visibility?: MapVisibility;

  @ApiProperty({
    description: 'Password for password-protected maps',
    example: 'secret123',
    required: false,
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'Map center latitude',
    example: 40.7128,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  centerLat?: number;

  @ApiProperty({
    description: 'Map center longitude',
    example: -74.0060,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  centerLng?: number;

  @ApiProperty({
    description: 'Map zoom level',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  zoom?: number;

  @ApiProperty({
    description: 'Map bearing (rotation)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  bearing?: number;

  @ApiProperty({
    description: 'Map pitch (tilt)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  pitch?: number;

  @ApiProperty({
    description: 'Target corporation ID (Staff/Super Admin only)',
    required: false,
  })
  @IsOptional()
  @IsString()
  corporationId?: string;
}
