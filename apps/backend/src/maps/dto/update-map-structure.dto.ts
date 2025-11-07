import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsObject, ValidateNested, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

// Describes the new order of layers within a specific group
export class GroupLayerOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @ApiProperty({ description: 'Array of Layer IDs in top-to-bottom UI order' })
  @IsArray()
  @IsString({ each: true })
  layerIds: string[];
}

// This is the new main payload
export class UpdateMapStructureDto {
  @ApiProperty({
    description: 'Array of Layer IDs and LayerGroup IDs in the desired root order (top-to-bottom)',
    example: ['layer-id-1', 'group-id-A', 'layer-id-2'],
  })
  @IsArray()
  @IsString({ each: true })
  rootOrder: string[];

  @ApiProperty({
    description: 'Array of layer order objects for each group being updated',
    type: [GroupLayerOrderDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupLayerOrderDto)
  groupOrders: GroupLayerOrderDto[];

  @ApiProperty({
    description: 'A map of ALL layer IDs in the map to their new group ID (or null if at root)',
    example: { 'layer-id-1': null, 'layer-id-2': null, 'layer-id-3': 'group-id-A' }
  })
  @IsObject()
  layerGroupIdMap: Record<string, string | null>;
}
