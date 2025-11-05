import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLayerGroupDto {
  @ApiProperty({ example: 'Infrastructure' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
