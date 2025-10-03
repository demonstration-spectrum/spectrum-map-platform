import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCorporationDto } from './dto/create-corporation.dto';
import { UpdateCorporationDto } from './dto/update-corporation.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CorporationsService {
  constructor(private prisma: PrismaService) {}

  async create(createCorporationDto: CreateCorporationDto, userId: string) {
    // Only super admins can create corporations
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can create corporations');
    }

    return this.prisma.corporation.create({
      data: createCorporationDto,
    });
  }

  async findAll(userId: string) {
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

    // Super admin can see all corporations
    if (user.role === UserRole.SUPER_ADMIN) {
      return this.prisma.corporation.findMany({
        where: { status: 'ACTIVE' },
        include: {
          _count: {
            select: {
              users: true,
              datasets: true,
              maps: true,
            },
          },
        },
      });
    }

    // Regular users can only see their own corporation
    if (user.corporationId) {
      const corporation = await this.prisma.corporation.findUnique({
        where: { id: user.corporationId },
        include: {
          _count: {
            select: {
              users: true,
              datasets: true,
              maps: true,
            },
          },
        },
      });

      return corporation ? [corporation] : [];
    }

    // Advisers can see corporations they have access to
    if (user.role === UserRole.ADVISER) {
      const corporationIds = user.adviserAccess.map(access => access.corporationId);
      
      if (corporationIds.length === 0) {
        return [];
      }

      return this.prisma.corporation.findMany({
        where: {
          id: { in: corporationIds },
          status: 'ACTIVE',
        },
        include: {
          _count: {
            select: {
              users: true,
              datasets: true,
              maps: true,
            },
          },
        },
      });
    }

    return [];
  }

  async findOne(id: string, userId: string) {
    // Check if user has access to this corporation
    const hasAccess = await this.prisma.hasCorporationAccess(userId, id);
    
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this corporation');
    }

    const corporation = await this.prisma.corporation.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            users: true,
            datasets: true,
            maps: true,
          },
        },
      },
    });

    if (!corporation) {
      throw new NotFoundException('Corporation not found');
    }

    return corporation;
  }

  async update(id: string, updateCorporationDto: UpdateCorporationDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only super admins can update corporations
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can update corporations');
    }

    const corporation = await this.prisma.corporation.findUnique({
      where: { id },
    });

    if (!corporation) {
      throw new NotFoundException('Corporation not found');
    }

    return this.prisma.corporation.update({
      where: { id },
      data: updateCorporationDto,
    });
  }

  async remove(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only super admins can delete corporations
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can delete corporations');
    }

    const corporation = await this.prisma.corporation.findUnique({
      where: { id },
    });

    if (!corporation) {
      throw new NotFoundException('Corporation not found');
    }

    // Soft delete by setting status to DELETED
    return this.prisma.corporation.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  async grantAdviserAccess(corporationId: string, adviserId: string, grantedBy: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: grantedBy },
    });

    if (!user || user.role !== UserRole.CORP_ADMIN) {
      throw new ForbiddenException('Only corp admins can grant adviser access');
    }

    // Check if the adviser exists and has the correct role
    const adviser = await this.prisma.user.findUnique({
      where: { id: adviserId },
    });

    if (!adviser || adviser.role !== UserRole.ADVISER) {
      throw new NotFoundException('Adviser not found');
    }

    // Check if access already exists
    const existingAccess = await this.prisma.corporationAdviser.findUnique({
      where: {
        corporationId_adviserId: {
          corporationId,
          adviserId,
        },
      },
    });

    if (existingAccess) {
      // Reactivate if it was deactivated
      return this.prisma.corporationAdviser.update({
        where: {
          corporationId_adviserId: {
            corporationId,
            adviserId,
          },
        },
        data: {
          isActive: true,
          grantedBy,
        },
      });
    }

    // Create new access
    return this.prisma.corporationAdviser.create({
      data: {
        corporationId,
        adviserId,
        grantedBy,
      },
    });
  }

  async revokeAdviserAccess(corporationId: string, adviserId: string, revokedBy: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: revokedBy },
    });

    if (!user || user.role !== UserRole.CORP_ADMIN) {
      throw new ForbiddenException('Only corp admins can revoke adviser access');
    }

    const access = await this.prisma.corporationAdviser.findUnique({
      where: {
        corporationId_adviserId: {
          corporationId,
          adviserId,
        },
      },
    });

    if (!access) {
      throw new NotFoundException('Adviser access not found');
    }

    // Deactivate access instead of deleting
    return this.prisma.corporationAdviser.update({
      where: {
        corporationId_adviserId: {
          corporationId,
          adviserId,
        },
      },
      data: {
        isActive: false,
      },
    });
  }
}
