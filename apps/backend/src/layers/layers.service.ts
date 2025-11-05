import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateLayerDto } from './dto/create-layer.dto';
import { UpdateLayerDto } from './dto/update-layer.dto';
import { ReorderLayersDto } from './dto/reorder-layers.dto';
import { UserRole } from '@prisma/client';
import { SetLayerGroupingDto } from './dto/set-layer-grouping.dto';

@Injectable()
export class LayersService {
  constructor(private prisma: PrismaService) {}

  async create(createLayerDto: CreateLayerDto, mapId: string, userId: string) {
    // Check if user has access to the map
    const map = await this.prisma.map.findUnique({
      where: { id: mapId },
    });

    if (!map) {
      throw new NotFoundException('Map not found');
    }

    const hasMapAccess = await this.hasMapUpdatePermission(userId, map);
    if (!hasMapAccess) {
      throw new ForbiddenException('Insufficient permissions to modify this map');
    }

    // Check if user has access to the dataset
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: createLayerDto.datasetId },
    });

    if (!dataset) {
      throw new NotFoundException('Dataset not found');
    }

    const hasDatasetAccess = await this.hasDatasetAccess(userId, dataset);
    if (!hasDatasetAccess) {
      throw new ForbiddenException('Access denied to this dataset');
    }

    // Check if dataset is already added to this map
    const existingLayer = await this.prisma.layer.findUnique({
      where: {
        mapId_datasetId: {
          mapId,
          datasetId: createLayerDto.datasetId,
        },
      },
    });

    if (existingLayer) {
      throw new BadRequestException('Dataset is already added to this map');
    }

    // Get the next order number
    const maxOrder = await this.prisma.layer.aggregate({
      where: { mapId },
      _max: { order: true },
    });

    const order = (maxOrder._max.order || 0) + 1;

    // Create the layer
    const layer = await this.prisma.layer.create({
      data: {
        mapId,
        datasetId: createLayerDto.datasetId,
        name: createLayerDto.name,
        order: createLayerDto.order || order,
        isVisible: createLayerDto.isVisible ?? true,
        style: createLayerDto.style || dataset.defaultStyle,
      },
      include: {
        dataset: {
          select: {
            id: true,
            name: true,
            workspaceName: true,
            layerName: true,
            defaultStyle: true,
          },
        },
      },
    });

    return layer;
  }

  async findAll(mapId: string, userId: string) {
    // Check if user has access to the map
    const map = await this.prisma.map.findUnique({
      where: { id: mapId },
    });

    if (!map) {
      throw new NotFoundException('Map not found');
    }

    const hasMapAccess = await this.hasMapAccess(userId, map);
    if (!hasMapAccess) {
      throw new ForbiddenException('Access denied to this map');
    }

    return this.prisma.layer.findMany({
      where: { mapId },
      include: {
        dataset: {
          select: {
            id: true,
            name: true,
            workspaceName: true,
            layerName: true,
            defaultStyle: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const layer = await this.prisma.layer.findUnique({
      where: { id },
      include: {
        map: true,
        dataset: {
          select: {
            id: true,
            name: true,
            workspaceName: true,
            layerName: true,
            defaultStyle: true,
          },
        },
      },
    });

    if (!layer) {
      throw new NotFoundException('Layer not found');
    }

    const hasMapAccess = await this.hasMapAccess(userId, layer.map);
    if (!hasMapAccess) {
      throw new ForbiddenException('Access denied to this layer');
    }

    return layer;
  }

  async update(id: string, updateLayerDto: UpdateLayerDto, userId: string) {
    const layer = await this.prisma.layer.findUnique({
      where: { id },
      include: { map: true },
    });

    if (!layer) {
      throw new NotFoundException('Layer not found');
    }

    const hasMapAccess = await this.hasMapUpdatePermission(userId, layer.map);
    if (!hasMapAccess) {
      throw new ForbiddenException('Insufficient permissions to modify this layer');
    }

    return this.prisma.layer.update({
      where: { id },
      data: updateLayerDto,
      include: {
        dataset: {
          select: {
            id: true,
            name: true,
            workspaceName: true,
            layerName: true,
            defaultStyle: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const layer = await this.prisma.layer.findUnique({
      where: { id },
      include: { map: true },
    });

    if (!layer) {
      throw new NotFoundException('Layer not found');
    }

    const hasMapAccess = await this.hasMapUpdatePermission(userId, layer.map);
    if (!hasMapAccess) {
      throw new ForbiddenException('Insufficient permissions to delete this layer');
    }

    return this.prisma.layer.delete({
      where: { id },
    });
  }

  async reorderLayers(mapId: string, reorderLayersDto: ReorderLayersDto, userId: string) {
    // Check if user has access to the map
    const map = await this.prisma.map.findUnique({
      where: { id: mapId },
    });

    if (!map) {
      throw new NotFoundException('Map not found');
    }

    const hasMapAccess = await this.hasMapUpdatePermission(userId, map);
    if (!hasMapAccess) {
      throw new ForbiddenException('Insufficient permissions to modify this map');
    }

    // Verify all layers belong to this map
    const layers = await this.prisma.layer.findMany({
      where: {
        id: { in: reorderLayersDto.layerIds },
        mapId,
      },
    });

    if (layers.length !== reorderLayersDto.layerIds.length) {
      throw new BadRequestException('Some layers do not belong to this map');
    }

    // Update layer orders
    const updatePromises = reorderLayersDto.layerIds.map((layerId, index) =>
      this.prisma.layer.update({
        where: { id: layerId },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updatePromises);

    return { message: 'Layers reordered successfully' };
  }

  async setGrouping(mapId: string, dto: SetLayerGroupingDto, userId: string) {
    console.log('dto', dto);
    // permission & map check
    const map = await this.prisma.map.findUnique({ where: { id: mapId } });
    if (!map) throw new NotFoundException('Map not found');
    const has = await this.hasMapUpdatePermission(userId, map);
    if (!has) throw new ForbiddenException('Insufficient permissions to modify this map');

    const layerIds = dto.items.map(i => i.layerId);
    const layers = await this.prisma.layer.findMany({ where: { id: { in: layerIds }, mapId } });
    if (layers.length !== layerIds.length) throw new BadRequestException('Some layers do not belong to this map');

    // Validate groups
    const groupIds = Array.from(new Set(dto.items.map(i => i.groupId).filter((g): g is string => !!g)));
    if (groupIds.length) {
      const groups = await this.prisma.layerGroup.findMany({ where: { id: { in: groupIds }, mapId } });
      if (groups.length !== groupIds.length) throw new BadRequestException('Invalid group references');
    }

    // Apply updates in a transaction
    await this.prisma.$transaction(
      dto.items.map(i => this.prisma.layer.update({ where: { id: i.layerId }, data: { groupId: i.groupId ?? null, order: i.order } }))
    );

    return { message: 'Layer grouping updated' };
  }

  async toggleVisibility(id: string, userId: string) {
    const layer = await this.prisma.layer.findUnique({
      where: { id },
      include: { map: true },
    });

    if (!layer) {
      throw new NotFoundException('Layer not found');
    }

    const hasMapAccess = await this.hasMapUpdatePermission(userId, layer.map);
    if (!hasMapAccess) {
      throw new ForbiddenException('Insufficient permissions to modify this layer');
    }

    return this.prisma.layer.update({
      where: { id },
      data: { isVisible: !layer.isVisible },
      include: {
        dataset: {
          select: {
            id: true,
            name: true,
            workspaceName: true,
            layerName: true,
            defaultStyle: true,
          },
        },
      },
    });
  }

  private async hasMapAccess(userId: string, map: any): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    // Super admin and staff have access to all maps
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF) return true;

    // User belongs to the map's corporation
    if (user.corporationId === map.corporationId) return true;

    // Map is public
    if (map.visibility === 'PUBLIC') return true;

    // Check if user is an adviser with access to the corporation
    if (user.role === UserRole.ADVISER) {
      const corporationIds = await this.prisma.getUserCorporationIds(userId);
      return corporationIds.includes(map.corporationId);
    }

    return false;
  }

  private async hasMapUpdatePermission(userId: string, map: any): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    // Super admin and staff can update all maps
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF) return true;

    // Only corp admins and editors from the same corporation can update
    const allowedRoles: UserRole[] = [UserRole.CORP_ADMIN, UserRole.EDITOR];

    if (user.corporationId === map.corporationId && 
        allowedRoles.includes(user.role)) {
      return true;
    }

    return false;
  }

  private async hasDatasetAccess(userId: string, dataset: any): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    // Super admin and staff have access to all datasets
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF) return true;

    // User belongs to the dataset's corporation
    if (user.corporationId === dataset.corporationId) return true;

    // Dataset is public
    if (dataset.visibility === 'PUBLIC') return true;

    // Dataset is shared with user's corporation
    const corporationIds = await this.prisma.getUserCorporationIds(userId);
    const isShared = await this.prisma.datasetShare.findFirst({
      where: {
        datasetId: dataset.id,
        sharedWithId: { in: corporationIds },
      },
    });

    return !!isShared;
  }
}
