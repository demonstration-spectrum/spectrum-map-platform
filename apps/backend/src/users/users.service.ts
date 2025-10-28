import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';
import { CognitoService } from '../auth/cognito.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private cognitoService: CognitoService) {}

  // Super Admin: list all users. Corp Admin: list users in their corporation. Others: limited.
  async findAll(requestingUserId: string) {
    const requester = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
    if (!requester) throw new NotFoundException('Requesting user not found');

    if (requester.role === UserRole.SUPER_ADMIN) {
      return this.prisma.user.findMany({
        include: { corporation: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (requester.role === UserRole.CORP_ADMIN && requester.corporationId) {
      return this.prisma.user.findMany({
        where: { corporationId: requester.corporationId },
        include: { corporation: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Default: return only the requesting user's profile
    const me = await this.prisma.user.findUnique({ where: { id: requestingUserId }, include: { corporation: true } });
    return me ? [me] : [];
  }

  async findOne(id: string, requestingUserId: string) {
    const requester = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
    if (!requester) throw new NotFoundException('Requesting user not found');

    const user = await this.prisma.user.findUnique({ where: { id }, include: { corporation: true } });
    if (!user) throw new NotFoundException('User not found');

    // Super admin can view any user; corp admin can view users in their corp
    if (requester.role === UserRole.SUPER_ADMIN) return user;
    if (requester.role === UserRole.CORP_ADMIN && requester.corporationId === user.corporationId) return user;

    // user can view self
    if (requester.id === user.id) return user;

    throw new ForbiddenException('Access denied');
  }

  async create(createUserDto: CreateUserDto, requestingUserId: string) {
    const requester = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
    if (!requester) throw new NotFoundException('Requesting user not found');

    if (requester.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can create users');
    }

    // Ensure email not already exist
    const exists = await this.prisma.user.findUnique({ where: { email: createUserDto.email } });
    if (exists) throw new BadRequestException('Email already in use');

    // Create in Cognito
    const cognitoResp = await this.cognitoService.createUser(
      createUserDto.email,
      createUserDto.firstName,
      createUserDto.lastName,
      createUserDto.temporaryPassword,
    );

    // Create in Prisma
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        cognitoSub: cognitoResp.sub,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role || UserRole.EDITOR,
        corporationId: createUserDto.corporationId,
      },
      include: { corporation: true },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, requestingUserId: string) {
    const requester = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
    if (!requester) throw new NotFoundException('Requesting user not found');

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Only super admin can change role or corporation for arbitrary users
    if (requester.role !== UserRole.SUPER_ADMIN) {
      // allow users to update own profile (first/last name)
      if (requester.id !== id) throw new ForbiddenException('Only super admins can modify other users');
    }

    const data: any = {};

    // Allow changing first/last name for user themselves or by super admin
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;

    // Changing email requires uniqueness check and Cognito attribute update
    if ((dto as any).email !== undefined) {
      const newEmail = (dto as any).email as string;
      if (newEmail !== user.email) {
        const existing = await this.prisma.user.findUnique({ where: { email: newEmail } });
        if (existing) throw new BadRequestException('Email already in use');

        // Update Cognito if available
        if (user.cognitoSub) {
          try {
            await this.cognitoService.updateUserAttributes(user.cognitoSub, [
              { Name: 'email', Value: newEmail },
              { Name: 'email_verified', Value: 'true' },
            ]);
          } catch (err) {
            // log and continue to avoid leaving DB inconsistent
            console.error('Failed to update email in Cognito:', err);
            throw new BadRequestException('Failed to update email in identity provider');
          }
        }

        data.email = newEmail;
      }
    }

    // Only SUPER_ADMIN can change role or corporation
    if (dto.role !== undefined && requester.role === UserRole.SUPER_ADMIN) data.role = dto.role;
    if (dto.corporationId !== undefined && requester.role === UserRole.SUPER_ADMIN) data.corporationId = dto.corporationId;

    // Handle isActive toggling and mirror in Cognito
    if (dto.isActive !== undefined && requester.role === UserRole.SUPER_ADMIN) {
      data.isActive = dto.isActive;
      if (user.cognitoSub) {
        try {
          if (dto.isActive) {
            await this.cognitoService.enableUser(user.cognitoSub);
          } else {
            await this.cognitoService.disableUser(user.cognitoSub);
          }
        } catch (err) {
          console.error('Failed to update user enabled state in Cognito:', err);
          // continue; DB will still be updated
        }
      }
    }

    return this.prisma.user.update({ where: { id }, data, include: { corporation: true } });
  }

  async remove(id: string, requestingUserId: string) {
    const requester = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
    if (!requester) throw new NotFoundException('Requesting user not found');

    if (requester.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can deactivate users');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Soft delete / deactivate
    return this.prisma.user.update({ where: { id }, data: { isActive: false }, include: { corporation: true } });
  }
}
