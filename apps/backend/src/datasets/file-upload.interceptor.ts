import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import { FileUploadService } from './file-upload.service';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  constructor(private readonly fileUploadService: FileUploadService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const multerConfig = this.fileUploadService.getMulterConfig();
    const InterceptorClass = FileInterceptor('file', multerConfig);
    const interceptorInstance: NestInterceptor = new InterceptorClass(this.fileUploadService as any);
    return interceptorInstance.intercept(context, next);
  }
}
