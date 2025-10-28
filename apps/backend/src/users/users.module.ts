import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CognitoService } from '../auth/cognito.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, CognitoService],
  exports: [UsersService],
})
export class UsersModule {}
