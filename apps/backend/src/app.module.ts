import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CorporationsModule } from './corporations/corporations.module';
import { DatasetsModule } from './datasets/datasets.module';
import { MapsModule } from './maps/maps.module';
import { LayersModule } from './layers/layers.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    CorporationsModule,
    DatasetsModule,
    MapsModule,
    LayersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
