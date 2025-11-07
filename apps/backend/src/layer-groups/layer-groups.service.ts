import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateLayerGroupDto } from './dto/create-layer-group.dto';
import { UpdateLayerGroupDto } from './dto/update-layer-group.dto';

@Injectable()
export class LayerGroupsService {
  constructor(private prisma: PrismaService) {}

  private async ensureMapUpdateAccess(mapId: string, userId: string) {
    const map = await this.prisma.map.findUnique({ where: { id: mapId } });
    if (!map) throw new NotFoundException('Map not found');

    const hasAccess = await this.prisma.hasMapWriteAccess(userId, mapId);
    if (!hasAccess) throw new ForbiddenException('Insufficient permissions');
    return map;
  }

  async list(mapId: string, userId: string) {
    await this.ensureMapUpdateAccess(mapId, userId);
    return this.prisma.layerGroup.findMany({ where: { mapId } });
  }

  async create(mapId: string, dto: CreateLayerGroupDto, userId: string) {
    const map = await this.ensureMapUpdateAccess(mapId, userId);
    const group = await this.prisma.layerGroup.create({ data: { mapId, name: dto.name } });

    // Add the new group to the map's rootOrder
    await this.prisma.map.update({
      where: { id: mapId },
      data: { rootOrder: { push: group.id } },
    });

    return group;
  }

  async update(mapId: string, id: string, dto: UpdateLayerGroupDto, userId: string) {
    console.log('Updating layer group:', { mapId, id, dto, userId });
    await this.ensureMapUpdateAccess(mapId, userId);
    const group = await this.prisma.layerGroup.findUnique({ where: { id } });
    if (!group || group.mapId !== mapId) throw new NotFoundException('Layer group not found');

    return this.prisma.layerGroup.update({ where: { id }, data: { ...dto } });
  }

  async remove(mapId: string, id: string, userId: string) {
    const map = await this.ensureMapUpdateAccess(mapId, userId);
    const group = await this.prisma.layerGroup.findUnique({ where: { id } });
    if (!group || group.mapId !== mapId) throw new NotFoundException('Layer group not found');

    // Remove the group from the map's rootOrder
    const newRootOrder = map.rootOrder.filter((itemId) => itemId !== id);
    await this.prisma.map.update({
      where: { id: mapId },
      data: { rootOrder: newRootOrder },
    });

    // Set layers groupId to null before deleting
    await this.prisma.layer.updateMany({ where: { groupId: id }, data: { groupId: null } });
    return this.prisma.layerGroup.delete({ where: { id } });
  }
}
