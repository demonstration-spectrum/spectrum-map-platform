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

      const allowedExtensions = ['.geojson', '.json', '.shp', '.shx', '.dbf', '.prj', '.zip', '.tab', '.map', '.id', '.dat'];

      const fileExtension = path.extname(file.originalname).toLowerCase();
      const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
      const isValidExtension = allowedExtensions.includes(fileExtension);

      if (isValidMimeType || isValidExtension) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type. Only GeoJSON, Shapefile (shp/shx/dbf/prj), MapInfo Tab sets, and zip are allowed.'));
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

  /**
   * Validate required files for a given upload type.
   * Supported types: geojson, shapefile, mapinfo
   */
  validateFileSet(files: Express.Multer.File[]): { type: 'geojson' | 'shapefile' | 'mapinfo'; baseName?: string } {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // If single GeoJSON file
    if (files.length === 1) {
      const ext = path.extname(files[0].originalname).toLowerCase();
      if (ext === '.geojson' || ext === '.json') {
        return { type: 'geojson', baseName: path.basename(files[0].originalname, ext) };
      }
    }

    // Group by base filename (before first dot) to support shapefile groups and mapinfo groups
    const groups: Record<string, Express.Multer.File[]> = {};
    for (const f of files) {
      const name = path.basename(f.originalname);
      const base = name.split('.').slice(0, -1).join('.');
      if (!groups[base]) groups[base] = [];
      groups[base].push(f);
    }

    // Check for shapefile required parts: .shp, .shx, .dbf (prj optional)
    for (const [base, group] of Object.entries(groups)) {
      const exts = group.map(g => path.extname(g.originalname).toLowerCase());
      const hasShp = exts.includes('.shp');
      const hasShx = exts.includes('.shx');
      const hasDbf = exts.includes('.dbf');
      if (hasShp && hasShx && hasDbf) {
        return { type: 'shapefile', baseName: base };
      }
    }

    // Check for MapInfo required parts: .tab, .dat, .id, .map (some datasets may not have .map but require .tab/.dat/.id)
    for (const [base, group] of Object.entries(groups)) {
      const exts = group.map(g => path.extname(g.originalname).toLowerCase());
      const hasTab = exts.includes('.tab');
      const hasDat = exts.includes('.dat');
      const hasId = exts.includes('.id');
      if (hasTab && hasDat && hasId) {
        return { type: 'mapinfo', baseName: base };
      }
    }

    throw new BadRequestException('Uploaded files do not match a supported dataset set. For shapefiles provide .shp,.shx,.dbf; for MapInfo provide .tab,.dat,.id; or upload a single GeoJSON.');
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
