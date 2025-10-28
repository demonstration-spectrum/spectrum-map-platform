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

    // Staff can list all users as well (for support purposes)
    if (requester.role === UserRole.STAFF) {
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
  if (requester.role === UserRole.STAFF) return user;
    if (requester.role === UserRole.CORP_ADMIN && requester.corporationId === user.corporationId) return user;

    // user can view self
    if (requester.id === user.id) return user;

    throw new ForbiddenException('Access denied');
  }

  async create(createUserDto: CreateUserDto, requestingUserId: string) {
    const requester = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
    if (!requester) throw new NotFoundException('Requesting user not found');

    if (requester.role !== UserRole.SUPER_ADMIN && requester.role !== UserRole.STAFF) {
      throw new ForbiddenException('Only super admins or staff can create users');
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
    // Enforce role/corporation constraints for Staff
    let targetRole = createUserDto.role || UserRole.EDITOR;
    let targetCorporationId = createUserDto.corporationId;
    const allowedCorpRoles: UserRole[] = [UserRole.CORP_ADMIN, UserRole.EDITOR, UserRole.VIEWER, UserRole.ADVISER];
    if (requester.role === UserRole.STAFF) {
      if (!targetCorporationId) {
        throw new BadRequestException('corporationId is required when staff creates a user');
      }
      if (!targetRole || !allowedCorpRoles.includes(targetRole)) {
        throw new BadRequestException('Staff can only create users with roles: CORP_ADMIN, EDITOR, VIEWER, ADVISER');
      }
      // Prevent creating SUPER_ADMIN or STAFF
    }

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        cognitoSub: cognitoResp.sub,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: targetRole,
        corporationId: targetCorporationId,
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

    // Only super admin or staff can modify other users
    if (requester.role !== UserRole.SUPER_ADMIN && requester.role !== UserRole.STAFF) {
      // allow users to update own profile (first/last name)
      if (requester.id !== id) throw new ForbiddenException('Only super admins or staff can modify other users');
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

    // SUPER_ADMIN can change any role/corporation; STAFF limited to corp-level roles
    if (dto.role !== undefined) {
      if (requester.role === UserRole.SUPER_ADMIN) {
        data.role = dto.role;
      } else if (requester.role === UserRole.STAFF) {
        const allowedCorpRoles: UserRole[] = [UserRole.CORP_ADMIN, UserRole.EDITOR, UserRole.VIEWER, UserRole.ADVISER];
        if (!allowedCorpRoles.includes(dto.role)) {
          throw new ForbiddenException('Staff can only assign roles: CORP_ADMIN, EDITOR, VIEWER, ADVISER');
        }
        // Prevent changing role of privileged users
        if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF) {
          throw new ForbiddenException('Cannot modify privileged user roles');
        }
        data.role = dto.role;
      }
    }

    if (dto.corporationId !== undefined) {
      if (requester.role === UserRole.SUPER_ADMIN) {
        data.corporationId = dto.corporationId;
      } else if (requester.role === UserRole.STAFF) {
        // Staff can reassign corporation for non-privileged users
        if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF) {
          throw new ForbiddenException('Cannot modify privileged users');
        }
        data.corporationId = dto.corporationId;
      }
    }

    // Handle isActive toggling and mirror in Cognito
    if (dto.isActive !== undefined) {
      if (requester.role === UserRole.SUPER_ADMIN || requester.role === UserRole.STAFF) {
        // Staff cannot deactivate privileged users
        if (requester.role === UserRole.STAFF && (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF)) {
          throw new ForbiddenException('Cannot modify privileged users');
        }
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
    }

    return this.prisma.user.update({ where: { id }, data, include: { corporation: true } });
  }

  async remove(id: string, requestingUserId: string) {
    const requester = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
    if (!requester) throw new NotFoundException('Requesting user not found');

    if (requester.role !== UserRole.SUPER_ADMIN && requester.role !== UserRole.STAFF) {
      throw new ForbiddenException('Only super admins or staff can deactivate users');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Staff cannot deactivate privileged users
    if (requester.role === UserRole.STAFF && (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF)) {
      throw new ForbiddenException('Cannot deactivate privileged users');
    }

    // Soft delete / deactivate
    return this.prisma.user.update({ where: { id }, data: { isActive: false }, include: { corporation: true } });
  }
}
