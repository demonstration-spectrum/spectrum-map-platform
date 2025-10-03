import { Module } from '@nestjs/common';
import { LayersController } from './layers.controller';
import { LayersService } from './layers.service';

@Module({
  controllers: [LayersController],
  providers: [LayersService],
  exports: [LayersService],
})
export class LayersModule {}
