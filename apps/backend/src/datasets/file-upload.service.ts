import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private uploadPath: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  getMulterConfig(): multer.Options {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedMimeTypes = [
        'application/geo+json',
        'application/json',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream',
      ];

      const allowedExtensions = ['.geojson', '.json', '.shp', '.zip', '.tab'];

      const fileExtension = path.extname(file.originalname).toLowerCase();
      const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
      const isValidExtension = allowedExtensions.includes(fileExtension);

      if (isValidMimeType || isValidExtension) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type. Only GeoJSON, Shapefile, and MapInfo Tab files are allowed.'));
      }
    };

    return {
      storage,
      fileFilter,
      limits: {
        fileSize: this.parseFileSize(this.configService.get('MAX_FILE_SIZE', '50MB')),
      },
    };
  }

  private parseFileSize(size: string): number {
    const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    
    if (!match) {
      return 50 * 1024 * 1024; // Default 50MB
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase() as keyof typeof units;
    
    return value * units[unit];
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadPath, filename);
  }

  async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return fs.statSync(filePath);
    } catch (error) {
      return null;
    }
  }
}
