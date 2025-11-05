import { PartialType } from '@nestjs/swagger';
import { CreateLayerGroupDto } from './create-layer-group.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateLayerGroupDto extends PartialType(CreateLayerGroupDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCollapsed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}
