import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LayerGroupingItemDto {
  @ApiProperty()
  @IsString()
  layerId!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  groupId?: string | null;

  @ApiProperty()
  @IsInt()
  order!: number;
}

export class SetLayerGroupingDto {
  @ApiProperty({ type: [LayerGroupingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayerGroupingItemDto)
  items!: LayerGroupingItemDto[];
}
