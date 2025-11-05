import { Module } from '@nestjs/common';
import { LayerGroupsService } from './layer-groups.service';
import { LayerGroupsController } from './layer-groups.controller';
import { PrismaService } from '../common/prisma/prisma.service';

@Module({
  controllers: [LayerGroupsController],
  providers: [LayerGroupsService, PrismaService],
  exports: [LayerGroupsService]
})
export class LayerGroupsModule {}
