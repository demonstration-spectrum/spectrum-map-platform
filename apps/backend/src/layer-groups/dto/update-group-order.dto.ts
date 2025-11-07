import { IsArray, IsString } from 'class-validator';

export class UpdateGroupOrderDto {
  @IsArray()
  @IsString({ each: true })
  layerOrder!: string[]; // Array of Layer IDs
}
