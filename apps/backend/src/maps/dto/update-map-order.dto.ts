import { IsArray, IsString } from 'class-validator';

export class UpdateMapOrderDto {
  @IsArray()
  @IsString({ each: true })
  rootOrder!: string[]; // Array of Layer IDs and LayerGroup IDs
}
