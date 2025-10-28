import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateMapDto } from './dto/create-map.dto';
import { UpdateMapDto } from './dto/update-map.dto';
import { UserRole, MapVisibility } from '@prisma/client';

@Injectable()
export class MapsService {
  constructor(private prisma: PrismaService) {}

  async create(createMapDto: CreateMapDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { corporation: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Determine target corporation
    let targetCorporationId: string | undefined = undefined;
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF) {
      // Staff/Super Admin can create for any specified corporation
      if (!createMapDto.corporationId) {
        throw new ForbiddenException('corporationId is required for staff or super admin when creating a map');
      }
      // Verify corporation exists
      const corp = await this.prisma.corporation.findUnique({ where: { id: createMapDto.corporationId } });
      if (!corp) throw new NotFoundException('Target corporation not found');
      targetCorporationId = createMapDto.corporationId;
    } else {
      // Regular corp users must belong to a corporation
      if (!user.corporationId) {
        throw new ForbiddenException('User must belong to a corporation');
      }
      // Only corp admins and editors can create maps
      const allowedRoles: UserRole[] = [UserRole.CORP_ADMIN, UserRole.EDITOR];
      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenException('Insufficient permissions to create maps');
      }
      targetCorporationId = user.corporationId;
    }

    const { corporationId: _omitCorpId, ...rest } = createMapDto as any;
    return this.prisma.map.create({
      data: {
        ...(rest as any),
        corporationId: targetCorporationId!,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            layers: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, filters?: { visibility?: MapVisibility; search?: string; corporationId?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        corporation: true,
        adviserAccess: {
          where: { isActive: true },
          include: { corporation: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const corporationIds = await this.prisma.getUserCorporationIds(userId);

    const where: any = {
      OR: [
        // User's own corporation maps
        { corporationId: { in: corporationIds } },
        // Public maps
        { visibility: MapVisibility.PUBLIC },
        // Password-protected maps (accessible to anyone with the password)
        { visibility: MapVisibility.PASSWORD_PROTECTED },
      ],
    };

    if (filters?.visibility) {
      where.visibility = filters.visibility;
    }

    if (filters?.corporationId) {
      // Narrow results to a specific corporation if provided
      where.AND = [{ corporationId: filters.corporationId }];
    }

    if (filters?.search) {
      where.OR = where.OR.map((condition: any) => ({
        ...condition,
        name: { contains: filters.search, mode: 'insensitive' },
      }));
    }

    return this.prisma.map.findMany({
      where,
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            layers: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, password?: string) {
    const map = await this.prisma.map.findUnique({
      where: { id },
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        layers: {
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
        },
      },
    });

    if (!map) {
      throw new NotFoundException('Map not found');
    }

    // Fast-path: super admin and staff can access all maps
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (currentUser && (currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.STAFF)) {
      return map;
    }

    // Check access permissions
    const hasAccess = await this.hasMapAccess(userId, map, password);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this map');
    }

    return map;
  }

  async update(id: string, updateMapDto: UpdateMapDto, userId: string) {
    const map = await this.prisma.map.findUnique({
      where: { id },
    });

    if (!map) {
      throw new NotFoundException('Map not found');
    }

    // Check if user has permission to update this map
    const hasPermission = await this.hasMapUpdatePermission(userId, map);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to update this map');
    }

    return this.prisma.map.update({
      where: { id },
      data: updateMapDto,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            layers: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const map = await this.prisma.map.findUnique({
      where: { id },
      include: { layers: true },
    });

    if (!map) {
      throw new NotFoundException('Map not found');
    }

    // Check if user has permission to delete this map
    const hasPermission = await this.hasMapUpdatePermission(userId, map);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to delete this map');
    }

    // Delete all layers first
    await this.prisma.layer.deleteMany({
      where: { mapId: id },
    });

    // Delete the map
    return this.prisma.map.delete({
      where: { id },
    });
  }

  async getPublicMaps(filters?: { search?: string }) {
    const where: any = {
      visibility: MapVisibility.PUBLIC,
    };

    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.map.findMany({
      where,
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            layers: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPasswordProtectedMap(id: string, password: string) {
    const map = await this.prisma.map.findUnique({
      where: { id },
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        layers: {
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
        },
      },
    });

    if (!map) {
      throw new NotFoundException('Map not found');
    }

    if (map.visibility !== MapVisibility.PASSWORD_PROTECTED) {
      throw new BadRequestException('Map is not password protected');
    }

    if (map.password !== password) {
      throw new ForbiddenException('Invalid password');
    }

    return map;
  }

  private async hasMapAccess(userId: string, map: any, password?: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

  // Super admin and staff have access to all maps
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF) return true;

    // User belongs to the map's corporation
    if (user.corporationId === map.corporationId) return true;

    // Map is public
    if (map.visibility === MapVisibility.PUBLIC) return true;

    // Map is password protected and correct password provided
    if (map.visibility === MapVisibility.PASSWORD_PROTECTED && map.password === password) {
      return true;
    }

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
}
