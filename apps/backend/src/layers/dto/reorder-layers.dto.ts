import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber } from 'class-validator';

export class ReorderLayersDto {
  @ApiProperty({
    description: 'Array of layer IDs in the desired order',
    example: ['clh1234567890', 'clh0987654321', 'clh1122334455'],
  })
  @IsArray()
  @IsString({ each: true })
  layerIds: string[];
}
