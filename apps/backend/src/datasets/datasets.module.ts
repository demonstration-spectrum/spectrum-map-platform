import { Module } from '@nestjs/common';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';
import { FileUploadService } from './file-upload.service';
import { GeoserverService } from './geoserver.service';

@Module({
  controllers: [DatasetsController],
  providers: [DatasetsService, FileUploadService, GeoserverService],
  exports: [DatasetsService],
})
export class DatasetsModule {}
