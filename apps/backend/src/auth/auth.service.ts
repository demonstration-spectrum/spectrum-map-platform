import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { CognitoService } from './cognito.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private cognitoService: CognitoService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      // Authenticate with AWS Cognito
      const cognitoUser = await this.cognitoService.authenticateUser(email, password);
      
      if (!cognitoUser) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Find or create user in our database
      let user = await this.prisma.user.findUnique({
        where: { cognitoSub: cognitoUser.sub },
        include: {
          corporation: true,
          adviserAccess: {
            where: { isActive: true },
            include: { corporation: true },
          },
        },
      });

      if (!user) {
        // Create user if they don't exist (first login)
        user = await this.createUserFromCognito(cognitoUser);
      } else {
        // Update last login
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      corporationId: user.corporationId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        corporation: user.corporation,
        adviserAccess: user.adviserAccess,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      // Register user in AWS Cognito
      const cognitoUser = await this.cognitoService.registerUser(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
      );

      // Create user in our database
      const user = await this.createUserFromCognito(cognitoUser, {
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role || UserRole.EDITOR,
        corporationId: registerDto.corporationId,
      });

      return {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      throw new BadRequestException('Registration failed');
    }
  }

  async getProfile(userId: string) {
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
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      corporation: user.corporation,
      adviserAccess: user.adviserAccess,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  private async createUserFromCognito(cognitoUser: any, additionalData: any = {}) {
    return this.prisma.user.create({
      data: {
        email: cognitoUser.email,
        cognitoSub: cognitoUser.sub,
        firstName: additionalData.firstName || cognitoUser.given_name || '',
        lastName: additionalData.lastName || cognitoUser.family_name || '',
        role: additionalData.role || UserRole.EDITOR,
        corporationId: additionalData.corporationId,
      },
      include: {
        corporation: true,
        adviserAccess: {
          where: { isActive: true },
          include: { corporation: true },
        },
      },
    });
  }
}
