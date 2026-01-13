import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method to execute raw SQL queries for geospatial operations
  async executeRawQuery(query: string, params: any[] = []) {
    return this.$queryRawUnsafe(query, ...params);
  }

  // Helper method to check if user has access to corporation data
  async hasCorporationAccess(userId: string, corporationId: string): Promise<boolean> {
    const user = await this.user.findUnique({
      where: { id: userId },
      include: {
        corporation: true,
        adviserAccess: {
          where: {
            corporationId,
            isActive: true,
          },
        },
      },
    });

    if (!user) return false;

  // Super admin and staff have access to all corporations
  if (user.role === 'SUPER_ADMIN' || user.role === 'STAFF') return true;

    // User belongs to the corporation
    if (user.corporationId === corporationId) return true;

    // User is an adviser with access to this corporation
    if (user.role === 'ADVISER' && user.adviserAccess.length > 0) return true;

    return false;
  }

  // Helper method to get user's accessible corporation IDs
  async getUserCorporationIds(userId: string): Promise<string[]> {
    const user = await this.user.findUnique({
      where: { id: userId },
      include: {
        corporation: true,
        adviserAccess: {
          where: { isActive: true },
          include: { corporation: true },
        },
      },
    });

    if (!user) return [];

    const corporationIds: string[] = [];

    // Super admin and staff have access to all corporations
    if (user.role === 'SUPER_ADMIN' || user.role === 'STAFF') {
      const allCorporations = await this.corporation.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      return allCorporations.map(c => c.id);
    }

    // User's own corporation
    if (user.corporationId) {
      corporationIds.push(user.corporationId);
    }

    // Adviser access to other corporations
    if (user.role === 'ADVISER') {
      const adviserCorporationIds = user.adviserAccess.map(access => access.corporationId);
      corporationIds.push(...adviserCorporationIds);
    }

    return corporationIds;
  }

  // Helper method to check if a user has write/update access to a map
  async hasMapWriteAccess(userId: string, mapId: string): Promise<boolean> {
    const user = await this.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    // Super admin and staff can update all maps
    if (user.role === 'SUPER_ADMIN' || user.role === 'STAFF') return true;

    const map = await this.map.findUnique({ where: { id: mapId }, select: { corporationId: true } });
    if (!map) return false;

    // Only corp admins and editors from the same corporation can update
    const allowedRoles: string[] = ['CORP_ADMIN', 'EDITOR'];
    if (user.corporationId === map.corporationId && allowedRoles.includes(user.role)) {
      return true;
    }

    return false;
  }

  // Helper method to check if a user has read access to a map
  async hasMapReadAccess(userId: string, mapId: string): Promise<boolean> {
    const user = await this.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const map = await this.map.findUnique({
      where: { id: mapId },
      select: { corporationId: true, visibility: true, password: true },
    });
    if (!map) return false;

    // Super admin and staff have access to all maps
    if (user.role === 'SUPER_ADMIN' || user.role === 'STAFF') return true;

    // Subscribed maps: any authenticated user can access
    if (map.visibility === 'SUBSCRIBED') return true;

    // User belongs to the map's corporation
    if (user.corporationId && user.corporationId === map.corporationId) return true;

    // Map is public
    if (map.visibility === 'PUBLIC') return true;

    // Adviser access to the corporation
    if (user.role === 'ADVISER') {
      const corporationIds = await this.getUserCorporationIds(userId);
      return corporationIds.includes(map.corporationId);
    }

    return false;
  }

  // Helper method to check if a user has read access to a dataset
  async hasDatasetReadAccess(userId: string, datasetId: string): Promise<boolean> {
    const user = await this.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const dataset = await this.dataset.findUnique({
      where: { id: datasetId },
      select: {
        corporationId: true,
        visibility: true,
        sharedWith: { select: { sharedWithId: true } },
      },
    });
    if (!dataset) return false;

    // Super admin and staff have access to all datasets
    if (user.role === 'SUPER_ADMIN' || user.role === 'STAFF') return true;

    // User belongs to the dataset's corporation
    if (user.corporationId && user.corporationId === dataset.corporationId) return true;

    // Dataset is public
    if (dataset.visibility === 'PUBLIC') return true;

    // Dataset is shared with user's accessible corporations
    const corporationIds = await this.getUserCorporationIds(userId);
    return dataset.sharedWith.some((share: any) => corporationIds.includes(share.sharedWithId));
  }
}
