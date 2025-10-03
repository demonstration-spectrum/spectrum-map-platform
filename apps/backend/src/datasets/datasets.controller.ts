import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DatasetsService } from './datasets.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { ShareDatasetDto } from './dto/share-dataset.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FileUploadService } from './file-upload.service';

@ApiTags('datasets')
@Controller('datasets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DatasetsController {
  constructor(
    private readonly datasetsService: DatasetsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', this.fileUploadService.getMulterConfig()))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new dataset' })
  @ApiBody({
    description: 'Dataset file and metadata',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Geospatial file (GeoJSON, Shapefile, MapInfo Tab)',
        },
        name: {
          type: 'string',
          description: 'Dataset name',
        },
        description: {
          type: 'string',
          description: 'Dataset description',
        },
        visibility: {
          type: 'string',
          enum: ['PRIVATE', 'SHARED', 'PUBLIC'],
          description: 'Dataset visibility',
        },
        defaultStyle: {
          type: 'object',
          description: 'Default styling configuration (Mapbox Style Specification JSON)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Dataset uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createDatasetDto: CreateDatasetDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new Error('File is required');
    }

    return this.datasetsService.create(createDatasetDto, file, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accessible datasets' })
  @ApiResponse({ status: 200, description: 'Datasets retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('visibility') visibility?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (visibility) filters.visibility = visibility;
    if (search) filters.search = search;

    return this.datasetsService.findAll(req.user.id, filters);
  }

  @Get('data-library')
  @ApiOperation({ summary: 'Get data library for map creation' })
  @ApiResponse({ status: 200, description: 'Data library retrieved successfully' })
  async getDataLibrary(
    @Request() req,
    @Query('search') search?: string,
    @Query('ownership') ownership?: 'own' | 'shared' | 'public',
  ) {
    const filters: any = {};
    if (search) filters.search = search;
    if (ownership) filters.ownership = ownership;

    return this.datasetsService.getDataLibrary(req.user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dataset by ID' })
  @ApiResponse({ status: 200, description: 'Dataset retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Dataset not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.datasetsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update dataset' })
  @ApiResponse({ status: 200, description: 'Dataset updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Dataset not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDatasetDto: UpdateDatasetDto,
    @Request() req,
  ) {
    return this.datasetsService.update(id, updateDatasetDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete dataset' })
  @ApiResponse({ status: 200, description: 'Dataset deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Dataset not found' })
  @ApiResponse({ status: 400, description: 'Dataset is being used in maps' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.datasetsService.remove(id, req.user.id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share dataset with other corporations' })
  @ApiResponse({ status: 200, description: 'Dataset shared successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Dataset not found' })
  async shareDataset(
    @Param('id') id: string,
    @Body() shareDatasetDto: ShareDatasetDto,
    @Request() req,
  ) {
    return this.datasetsService.shareDataset(id, shareDatasetDto, req.user.id);
  }
}
