import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class ShareDatasetDto {
  @ApiProperty({
    description: 'Array of corporation IDs to share the dataset with',
    example: ['clh1234567890', 'clh0987654321'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  corporationIds: string[];
}
