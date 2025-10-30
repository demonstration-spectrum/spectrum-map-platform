import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FileUploadService } from './file-upload.service';
import { GeoserverService } from './geoserver.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { ShareDatasetDto } from './dto/share-dataset.dto';
import { UserRole, DatasetVisibility, ProcessingStatus } from '@prisma/client';
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
    files?: Express.Multer.File[],
  ) {
    //console.log('Creating dataset with file:', file, 'and additional files:', files?.length || 0);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { corporation: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Determine target corporation
    let targetCorporationId: string | undefined = undefined;
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF) {
      if (!createDatasetDto.corporationId) {
        throw new ForbiddenException('corporationId is required for staff or super admin when uploading a dataset');
      }
      const corp = await this.prisma.corporation.findUnique({ where: { id: createDatasetDto.corporationId } });
      if (!corp) throw new NotFoundException('Target corporation not found');
      targetCorporationId = createDatasetDto.corporationId;
    } else {
      if (!user.corporationId) {
        throw new ForbiddenException('User must belong to a corporation');
      }
      // Only corp admins and editors can upload datasets
      const allowedRoles: UserRole[] = [UserRole.CORP_ADMIN, UserRole.EDITOR];
      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenException('Insufficient permissions to upload datasets');
      }
      targetCorporationId = user.corporationId;
    }

    // Choose stored metadata from primary file but keep record of all uploaded files in an adjacent folder if needed
    const { corporationId: _omitCorpId, ...restDto } = createDatasetDto as any;
    let dataset = await this.prisma.dataset.create({
      data: {
        name: restDto.name,
        description: restDto.description,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        visibility: restDto.visibility || DatasetVisibility.PRIVATE,
        corporationId: targetCorporationId!,
        uploadedById: userId,
        defaultStyle: restDto.defaultStyle,
      },
    });

    // If files were uploaded, move them to a dedicated folder for the dataset
    if (files && files.length > 0) {
      try {
        const uploadDir = this.fileUploadService.getFilePath('');
        const datasetDir = path.join(uploadDir, dataset.id);
        //console.log('Organizing uploaded files into directory:', datasetDir);
        if (!fs.existsSync(datasetDir)) fs.mkdirSync(datasetDir, { recursive: true });

        // Move all files into the new directory
        for (const f of files) {
          const src = f.path;
          const dest = path.join(datasetDir, f.originalname);
          try {
            fs.renameSync(src, dest);
          } catch (err) {
            // If rename fails (e.g., cross-device), fall back to copy and unlink
            fs.copyFileSync(src, dest);
            fs.unlinkSync(src);
          }
        }

        // The primary file's path needs to be updated to its new location
        const newFilePath = path.join(datasetDir, file.originalname);
        //console.log('Updated representative file path to:', newFilePath);
        dataset = await this.prisma.dataset.update({
          where: { id: dataset.id },
          data: { filePath: newFilePath },
        });
        //console.log('Updated dataset record:', dataset);
      } catch (err) {
        console.error('Failed to organize uploaded files for dataset:', err);
        // Optional: Decide if you should clean up the created dataset record if file organization fails
      }
    }

    // Process the file and create GeoServer layer in the background
    this.processDataset(dataset.id);

    return dataset;
  }

  async findAll(userId: string, filters?: { visibility?: DatasetVisibility; search?: string; corporationId?: string }) {
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

    if (filters?.corporationId) {
      where.AND = [{ corporationId: filters.corporationId }];
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

  async getDataLibrary(
    userId: string,
    filters?: { search?: string; ownership?: 'own' | 'shared' | 'public'; corporationId?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { corporation: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // For super admins and staff, allow data library access without requiring a corporation context.
    const isPrivileged = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF;
    const nonPrivCorpIds = isPrivileged ? [] : await this.prisma.getUserCorporationIds(userId);

    // Build OR conditions based on role and optional corporationId
    const orConditions: any[] = [];
    const corpId = filters?.corporationId;

    if (isPrivileged) {
      if (corpId) {
        // In a corp context, default to that corp's datasets + shared to it + public
        if (!filters?.ownership || filters.ownership === undefined) {
          orConditions.push(
            { corporationId: corpId },
            { visibility: DatasetVisibility.PUBLIC },
            { sharedWith: { some: { sharedWithId: corpId } } },
          );
        } else {
          switch (filters.ownership) {
            case 'own':
              orConditions.push({ corporationId: corpId });
              break;
            case 'shared':
              orConditions.push({ sharedWith: { some: { sharedWithId: corpId } } });
              break;
            case 'public':
              orConditions.push({ visibility: DatasetVisibility.PUBLIC });
              break;
          }
        }
      } else {
        // No corp context for privileged users: default to public to avoid tenant leakage
        orConditions.push({ visibility: DatasetVisibility.PUBLIC });
        if (filters?.ownership === 'own' || filters?.ownership === 'shared') {
          // Without corp context, 'own' and 'shared' aren't meaningful; keep public only
        }
      }
    } else {
      // Non-privileged users: use their corporation memberships
      if (!user.corporationId) {
        throw new ForbiddenException('User must belong to a corporation');
      }
      if (!filters?.ownership) {
        orConditions.push(
          { corporationId: { in: nonPrivCorpIds } },
          { visibility: DatasetVisibility.PUBLIC },
          { sharedWith: { some: { sharedWithId: { in: nonPrivCorpIds } } } },
        );
      } else {
        switch (filters.ownership) {
          case 'own':
            orConditions.push({ corporationId: { in: nonPrivCorpIds } });
            break;
          case 'shared':
            orConditions.push({ sharedWith: { some: { sharedWithId: { in: nonPrivCorpIds } } } });
            break;
          case 'public':
            orConditions.push({ visibility: DatasetVisibility.PUBLIC });
            break;
        }
      }
    }

    // Compose where with OR and optional search as AND
    const where: any = {};
    if (orConditions.length) where.OR = orConditions;
    if (filters?.search) {
      where.AND = [...(where.AND || []), { name: { contains: filters.search, mode: 'insensitive' } }];
    }

    return this.prisma.dataset.findMany({
      where: Object.keys(where).length ? where : undefined,
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

  // Super admin and staff have access to all datasets
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF) return true;

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

  async getProcessingStatus(id: string, userId: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      select: {
        id: true,
        processingStatus: true,
        processingError: true,
        // Add fields required for hasDatasetAccess
        corporationId: true,
        visibility: true,
        sharedWith: true,
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

    return {
      id: dataset.id,
      status: dataset.processingStatus,
      error: dataset.processingError,
    };
  }

  private async hasDatasetUpdatePermission(userId: string, dataset: any): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

  // Super admin and staff can update all datasets
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF) return true;

    // Only corp admins and editors from the same corporation can update
    const allowedRoles: UserRole[] = [UserRole.CORP_ADMIN, UserRole.EDITOR];
    if (user.corporationId === dataset.corporationId && 
        allowedRoles.includes(user.role)) {
      return true;
    }

    return false;
  }

  private async processDataset(datasetId: string): Promise<void> {
    // Update status to PROCESSING
    let dataset = await this.prisma.dataset.update({
      where: { id: datasetId },
      data: { processingStatus: ProcessingStatus.PROCESSING },
    });

    const tableName = `dataset_${dataset.id}`;

    try {
      // 1. Parse the uploaded file (GeoJSON, Shapefile, etc.)
      // 2. Import it into PostGIS
      // 3. Create a GeoServer workspace and layer
      // 4. Update the dataset record with GeoServer information
      console.log('Processing dataset:', dataset.id, 'from:', dataset);
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

      // 2. Import into PostGIS using shared pool
      // Use a singleton pg Pool to avoid connection churn which can cause ECONNRESET
      const { getClient } = require('../common/db/pg.service');
      const client = await getClient();
      console.log('Connected to Postgres for importing dataset (shared pool)');

      try {
        // Drop table if exists (for reprocessing)
        await client.query(`DROP TABLE IF EXISTS "${tableName}"`);

        // Create table with geometry column (SRID 4326 for WGS84)
        // We'll infer columns from the OGR layer fields
        // GDAL's layer.fields is a collection-like object; convert to a real array for JS convenience
        const fieldsArray: any[] = []
        try {
          if (ogrLayer.fields && typeof ogrLayer.fields.forEach === 'function') {
            ogrLayer.fields.forEach((f: any) => fieldsArray.push(f))
          } else if (Array.isArray(ogrLayer.fields)) {
            ogrLayer.fields.forEach((f: any) => fieldsArray.push(f))
          }
        } catch (e) {
          // fallback: attempt to iterate by index/count if available
          try {
            const count = (ogrLayer.fields && ogrLayer.fields.count) || 0
            for (let idx = 0; idx < count; idx++) {
              const f = ogrLayer.fields.get(idx)
              if (f) fieldsArray.push(f)
            }
          } catch (err) {
            // if we cannot enumerate fields, continue with empty array
            console.warn('Unable to enumerate OGR layer fields, proceeding with no attribute columns', err)
          }
        }

        const hasGidField = fieldsArray.some((def: any) => String(def.name).toLowerCase() === 'gid')
        const hasPublicIdField = fieldsArray.some((def: any) => String(def.name).toLowerCase() === 'public_id')

        const fieldDefs: string[] = [];
        // Ensure pgcrypto extension for gen_random_uuid() is available (no-op if already present)
        try {
          await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
        } catch (e) {
          // non-fatal: extension creation may require superuser; log and continue
          console.warn('Could not create pgcrypto extension; ensure gen_random_uuid() is available:', e.message || e)
        }

        // If the source doesn't include a gid, add an auto-incrementing primary key
        if (!hasGidField) {
          fieldDefs.push('"gid" bigserial primary key')
        }

        // Add a public-safe UUID identifier for external APIs unless the source already provides one
        if (!hasPublicIdField) {
          fieldDefs.push('"public_id" uuid DEFAULT gen_random_uuid() NOT NULL')
        }

        fieldsArray.forEach((def: any) => {
          // Map OGR field types to Postgres types
          let type = 'text';
          switch (def.type) {
            case 'Integer': type = 'integer'; break;
            case 'Real': type = 'float'; break;
            case 'Date': type = 'date'; break;
          }
          // quote field names to be safe
          fieldDefs.push(`"${def.name}" ${type}`);
        });

        // use explicit geometry type with srid
        fieldDefs.push('geom geometry(Geometry,4326)');
        console.log('Creating PostGIS table with fields:', fieldDefs);
        await client.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (${fieldDefs.join(', ')})`);

        // Ensure there's an index on public_id for fast lookups
        try {
          await client.query(`CREATE INDEX IF NOT EXISTS "${tableName}_public_id_idx" ON "${tableName}" (public_id)`);
        } catch (e) {
          console.warn('Failed to create index on public_id for table', tableName, e.message || e)
        }

        // Insert features in batches to reduce memory/connection pressure
        const batchSize = 500
        const features = []
        ogrLayer.features.forEach((feature: any) => {
          const values = fieldsArray.map((def: any) => feature.fields.get(def.name));
          const geom = feature.getGeometry();
          if (!geom) return; // skip features with no geometry
          const geomWkt = geom.toWKT();
          features.push({ values, geomWkt })
        })

        // Build non-geom column list (these are the OGR fields only)
        const nonGeomCols = fieldsArray.map((def: any) => `"${def.name}"`)

        for (let i = 0; i < features.length; i += batchSize) {
          const batch = features.slice(i, i + batchSize)
          const queries = batch.map((f) => {
            // If there are no attribute columns, only insert geometry
            if (!f.values || f.values.length === 0) {
              const sql = `INSERT INTO "${tableName}" (geom) VALUES (ST_GeomFromText($1, 4326))`
              return client.query(sql, [f.geomWkt])
            }

            const placeholders = f.values.map((_: any, idx: number) => `$${idx + 1}`).join(', ')
            const cols = `${nonGeomCols.join(', ')}, geom`
            const sql = `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders}, ST_GeomFromText($${f.values.length + 1}, 4326))`
            return client.query(sql, [...f.values, f.geomWkt])
          })
          await Promise.all(queries)
        }
        console.log(`Imported ${features.length} features into PostGIS table ${tableName}`)
      } catch (err) {
        throw new BadRequestException('Failed to import data into PostGIS: ' + err.message);
      } finally {
        try { client.release() } catch (e) { console.warn('Failed to release pg client', e) }
      }

      // 3. Register the new table as a layer in GeoServer
      await this.geoserverService.createWorkspace(workspaceName);
      await this.geoserverService.publishPostgisLayer({
        workspace: workspaceName,
        layer: layerName,
        table: tableName,
        srid: 4326,
      });

      // 4. Update the dataset record to COMPLETED
      await this.prisma.dataset.update({
        where: { id: dataset.id },
        data: {
          workspaceName,
          layerName,
          isProcessed: true,
          processingStatus: ProcessingStatus.COMPLETED,
        },
      });
    } catch (error) {
      console.error(`Failed to process dataset ${datasetId}:`, error);
      
      // Cleanup postgres table if it was created
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const client = await pool.connect();
      try {
        await client.query(`DROP TABLE IF EXISTS "${tableName}"`);
      } catch (cleanupError) {
        console.error(`Failed to cleanup table ${tableName} for failed dataset processing:`, cleanupError);
      } finally {
        await client.release();
      }

      // Update status to FAILED
      await this.prisma.dataset.update({
        where: { id: datasetId },
        data: {
          processingStatus: ProcessingStatus.FAILED,
          processingError: error.message,
        },
      });
    }
  }
}
