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
    // reuse prisma helper from layers.service implicitly by checking roles
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('Access denied');
    if (
      user.role === 'SUPER_ADMIN' ||
      user.role === 'STAFF' ||
      (user.corporationId === map.corporationId && (user.role === 'CORP_ADMIN' || user.role === 'EDITOR'))
    ) {
      return map;
    }
    throw new ForbiddenException('Insufficient permissions');
  }

  async list(mapId: string, userId: string) {
    await this.ensureMapUpdateAccess(mapId, userId);
    return this.prisma.layerGroup.findMany({ where: { mapId }, orderBy: { order: 'asc' } });
  }

  async create(mapId: string, dto: CreateLayerGroupDto, userId: string) {
    await this.ensureMapUpdateAccess(mapId, userId);
    const maxOrder = await this.prisma.layerGroup.aggregate({ where: { mapId }, _max: { order: true } });
    const order = (maxOrder._max.order || 0) + 1;
    return this.prisma.layerGroup.create({ data: { mapId, name: dto.name, order } });
  }

  async update(mapId: string, id: string, dto: UpdateLayerGroupDto, userId: string) {
    await this.ensureMapUpdateAccess(mapId, userId);
    const group = await this.prisma.layerGroup.findUnique({ where: { id } });
    if (!group || group.mapId !== mapId) throw new NotFoundException('Layer group not found');

    return this.prisma.layerGroup.update({ where: { id }, data: { ...dto } });
  }

  async remove(mapId: string, id: string, userId: string) {
    await this.ensureMapUpdateAccess(mapId, userId);
    const group = await this.prisma.layerGroup.findUnique({ where: { id } });
    if (!group || group.mapId !== mapId) throw new NotFoundException('Layer group not found');

    // Set layers groupId to null before deleting
    await this.prisma.layer.updateMany({ where: { groupId: id }, data: { groupId: null } });
    return this.prisma.layerGroup.delete({ where: { id } });
  }
}
