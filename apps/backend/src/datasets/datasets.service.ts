import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FileUploadService } from './file-upload.service';
import { GeoserverService } from './geoserver.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { ShareDatasetDto } from './dto/share-dataset.dto';
import { UserRole, DatasetVisibility } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatasetsService {
  constructor(
    private prisma: PrismaService,
    private fileUploadService: FileUploadService,
    private geoserverService: GeoserverService,
  ) {}

  async create(
    createDatasetDto: CreateDatasetDto,
    file: Express.Multer.File,
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { corporation: true },
    });

    if (!user || !user.corporationId) {
      throw new ForbiddenException('User must belong to a corporation');
    }

    // Only corp admins and editors can upload datasets
    const allowedRoles: UserRole[] = [UserRole.CORP_ADMIN, UserRole.EDITOR];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions to upload datasets');
    }

    const dataset = await this.prisma.dataset.create({
      data: {
        name: createDatasetDto.name,
        description: createDatasetDto.description,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        visibility: createDatasetDto.visibility || DatasetVisibility.PRIVATE,
        corporationId: user.corporationId,
        uploadedById: userId,
        defaultStyle: createDatasetDto.defaultStyle,
      },
    });

    // Process the file and create GeoServer layer
    try {
      await this.processDataset(dataset);
    } catch (error) {
      // If processing fails, clean up the database record
      await this.prisma.dataset.delete({ where: { id: dataset.id } });
      await this.fileUploadService.deleteFile(file.path);
      throw new BadRequestException('Failed to process dataset file');
    }

    return dataset;
  }

  async findAll(userId: string, filters?: { visibility?: DatasetVisibility; search?: string }) {
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

    const corporationIds = await this.prisma.getUserCorporationIds(userId);

    const where: any = {
      OR: [
        // User's own corporation datasets
        { corporationId: { in: corporationIds } },
        // Public datasets
        { visibility: DatasetVisibility.PUBLIC },
        // Shared datasets
        {
          sharedWith: {
            some: {
              sharedWithId: { in: corporationIds },
            },
          },
        },
      ],
    };

    if (filters?.visibility) {
      where.visibility = filters.visibility;
    }

    if (filters?.search) {
      where.OR = where.OR.map((condition: any) => ({
        ...condition,
        name: { contains: filters.search, mode: 'insensitive' },
      }));
    }

    return this.prisma.dataset.findMany({
      where,
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            layers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        sharedWith: {
          include: {
            sharedWith: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            layers: true,
          },
        },
      },
    });

    if (!dataset) {
      throw new NotFoundException('Dataset not found');
    }

    // Check if user has access to this dataset
    const hasAccess = await this.hasDatasetAccess(userId, dataset);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this dataset');
    }

    return dataset;
  }

  async update(id: string, updateDatasetDto: UpdateDatasetDto, userId: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
    });

    if (!dataset) {
      throw new NotFoundException('Dataset not found');
    }

    // Check if user has permission to update this dataset
    const hasPermission = await this.hasDatasetUpdatePermission(userId, dataset);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to update this dataset');
    }

    return this.prisma.dataset.update({
      where: { id },
      data: updateDatasetDto,
    });
  }

  async remove(id: string, userId: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      include: { layers: true },
    });

    if (!dataset) {
      throw new NotFoundException('Dataset not found');
    }

    // Check if user has permission to delete this dataset
    const hasPermission = await this.hasDatasetUpdatePermission(userId, dataset);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to delete this dataset');
    }

    // Check if dataset is being used in any maps
    if (dataset.layers.length > 0) {
      throw new BadRequestException('Cannot delete dataset that is being used in maps');
    }

    // Delete from GeoServer
    if (dataset.workspaceName && dataset.layerName) {
      await this.geoserverService.deleteLayer(dataset.workspaceName, dataset.layerName);
    }

    // Delete file
    await this.fileUploadService.deleteFile(dataset.filePath);

    // Delete from database
    return this.prisma.dataset.delete({
      where: { id },
    });
  }

  async shareDataset(id: string, shareDatasetDto: ShareDatasetDto, userId: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
    });

    if (!dataset) {
      throw new NotFoundException('Dataset not found');
    }

    // Check if user has permission to share this dataset
    const hasPermission = await this.hasDatasetUpdatePermission(userId, dataset);
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to share this dataset');
    }

    // Remove existing shares
    await this.prisma.datasetShare.deleteMany({
      where: { datasetId: id },
    });

    // Create new shares
    const shares = shareDatasetDto.corporationIds.map(corporationId => ({
      datasetId: id,
      sharedWithId: corporationId,
      sharedBy: userId,
    }));

    await this.prisma.datasetShare.createMany({
      data: shares,
    });

    return { message: 'Dataset shared successfully' };
  }

  async getDataLibrary(userId: string, filters?: { search?: string; ownership?: 'own' | 'shared' | 'public' }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { corporation: true },
    });

    if (!user || !user.corporationId) {
      throw new ForbiddenException('User must belong to a corporation');
    }

    const corporationIds = await this.prisma.getUserCorporationIds(userId);

    const where: any = {
      OR: [
        // User's own corporation datasets
        { corporationId: { in: corporationIds } },
        // Public datasets
        { visibility: DatasetVisibility.PUBLIC },
        // Shared datasets
        {
          sharedWith: {
            some: {
              sharedWithId: { in: corporationIds },
            },
          },
        },
      ],
    };

    if (filters?.search) {
      where.OR = where.OR.map((condition: any) => ({
        ...condition,
        name: { contains: filters.search, mode: 'insensitive' },
      }));
    }

    if (filters?.ownership) {
      switch (filters.ownership) {
        case 'own':
          where.OR = [{ corporationId: { in: corporationIds } }];
          break;
        case 'shared':
          where.OR = [{
            sharedWith: {
              some: {
                sharedWithId: { in: corporationIds },
              },
            },
          }];
          break;
        case 'public':
          where.OR = [{ visibility: DatasetVisibility.PUBLIC }];
          break;
      }
    }

    return this.prisma.dataset.findMany({
      where,
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async hasDatasetAccess(userId: string, dataset: any): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    // Super admin has access to all datasets
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // User belongs to the dataset's corporation
    if (user.corporationId === dataset.corporationId) return true;

    // Dataset is public
    if (dataset.visibility === DatasetVisibility.PUBLIC) return true;

    // Dataset is shared with user's corporation
    const corporationIds = await this.prisma.getUserCorporationIds(userId);
    const isShared = dataset.sharedWith.some((share: any) => 
      corporationIds.includes(share.sharedWithId)
    );

    return isShared;
  }

  private async hasDatasetUpdatePermission(userId: string, dataset: any): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    // Super admin can update all datasets
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Only corp admins and editors from the same corporation can update
    const allowedRoles: UserRole[] = [UserRole.CORP_ADMIN, UserRole.EDITOR];
    if (user.corporationId === dataset.corporationId && 
        allowedRoles.includes(user.role)) {
      return true;
    }

    return false;
  }

  private async processDataset(dataset: any): Promise<void> {



    // 1. Parse the uploaded file (GeoJSON, Shapefile, etc.)
    // 2. Import it into PostGIS
    // 3. Create a GeoServer workspace and layer
    // 4. Update the dataset record with GeoServer information

    const workspaceName = `corp_${dataset.corporationId}`;
    const layerName = `dataset_${dataset.id}`;
    const filePath = dataset.filePath;
    const fileExt = path.extname(filePath).toLowerCase();

    // 1. Parse and convert file to PostGIS-compatible format (GeoJSON or Shapefile)
    // We'll use gdal-async for robust geospatial file handling
    const gdal = require('gdal-async');
    let ogrLayer;
    try {
      const ds = gdal.open(filePath);
      ogrLayer = ds.layers.get(0);
      if (!ogrLayer) throw new Error('No layer found in geospatial file');
    } catch (err) {
      throw new BadRequestException('Failed to parse geospatial file: ' + err.message);
    }

    // 2. Import into PostGIS
    // We'll use pg for direct SQL, as Prisma does not support geometry columns well
    const { Pool } = require('pg');
    
    // You may want to move this connection string to config/env
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const client = await pool.connect();
    console.log('Connected to Postgres for importing dataset');

    const tableName = `dataset_${dataset.id}`;
    try {
      // Drop table if exists (for reprocessing)
      await client.query(`DROP TABLE IF EXISTS "${tableName}"`);

      // Create table with geometry column (SRID 4326 for WGS84)
      // We'll infer columns from the OGR layer fields
      let fieldDefs = [];
      ogrLayer.fields.forEach((def: any) => {
        // Map OGR field types to Postgres types
        let type = 'text';
        switch (def.type) {
          case 'Integer': type = 'integer'; break;
          case 'Real': type = 'float'; break;
          case 'Date': type = 'date'; break;
        }
        fieldDefs.push(`"${def.name}" ${type}`);
      });
      fieldDefs.push('geom geometry');
      await client.query(`CREATE TABLE "${tableName}" (${fieldDefs.join(', ')})`);
      // Insert features
      const insertPromises = [];
      ogrLayer.features.forEach((feature: any) => {
        const values = ogrLayer.fields.map((def: any) => feature.fields.get(def.name));
        // Geometry as WKT
        const geom = feature.getGeometry();
        if (!geom) return; // skip features with no geometry
        const geomWkt = feature.getGeometry().toWKT();
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        //console.log('Inserting feature with values:', values.length, 'and placeholders:', placeholders.length);
        const sql = `INSERT INTO "${tableName}" VALUES (${placeholders}, ST_GeomFromText($${values.length + 1}, 4326))`;
        //insertPromises.push(client.query(sql, [...values, geomWkt]));
        insertPromises.push(
          client.query(sql, [...values, geomWkt]).catch(err => {
            //console.error('Insert error:', err, { sql, values, geomWkt });
            throw err; // rethrow to propagate error to Promise.all
          })
        );
      });
      await Promise.all(insertPromises);
      console.log(`Imported ${insertPromises.length} features into PostGIS table ${tableName}`);
    } catch (err) {
      await client.release();
      throw new BadRequestException('Failed to import data into PostGIS: ' + err.message);
    }
    await client.release();

    // 3. Register the new table as a layer in GeoServer
    await this.geoserverService.createWorkspace(workspaceName);
    await this.geoserverService.publishPostgisLayer({
      workspace: workspaceName,
      layer: layerName,
      table: tableName,
      srid: 4326,
    });

    // 4. Update the dataset record
    await this.prisma.dataset.update({
      where: { id: dataset.id },
      data: {
        workspaceName,
        layerName,
        isProcessed: true,
      },
    });
  }
}
