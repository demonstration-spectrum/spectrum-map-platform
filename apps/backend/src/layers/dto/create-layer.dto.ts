import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateLayerDto {
  @ApiProperty({
    description: 'Dataset ID to add as a layer',
    example: 'clh1234567890',
  })
  @IsString()
  @IsNotEmpty()
  datasetId: string;

  @ApiProperty({
    description: 'Layer name (can be different from dataset name)',
    example: 'City Boundaries Layer',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Layer order in the map (higher numbers appear on top)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  // order removed - map and group ordering is stored on Map.rootOrder and LayerGroup.layerOrder

  @ApiProperty({
    description: 'Whether the layer is visible',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({
    description: 'Layer styling configuration (Mapbox Style Specification JSON)',
    required: false,
  })
  @IsOptional()
  style?: any;
}
