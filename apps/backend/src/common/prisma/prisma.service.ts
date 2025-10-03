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

    // Super admin has access to all corporations
    if (user.role === 'SUPER_ADMIN') return true;

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

    // Super admin has access to all corporations
    if (user.role === 'SUPER_ADMIN') {
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
}
