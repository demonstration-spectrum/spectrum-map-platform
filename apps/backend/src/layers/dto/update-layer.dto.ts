import { PartialType } from '@nestjs/swagger';
import { CreateLayerDto } from './create-layer.dto';

export class UpdateLayerDto extends PartialType(CreateLayerDto) {}
