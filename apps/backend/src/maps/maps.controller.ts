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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MapsService } from './maps.service';
import { CreateMapDto } from './dto/create-map.dto';
import { UpdateMapDto } from './dto/update-map.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('maps')
@Controller('maps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new map' })
  @ApiResponse({ status: 201, description: 'Map created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() createMapDto: CreateMapDto, @Request() req) {
    return this.mapsService.create(createMapDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accessible maps' })
  @ApiResponse({ status: 200, description: 'Maps retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('visibility') visibility?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (visibility) filters.visibility = visibility;
    if (search) filters.search = search;

    return this.mapsService.findAll(req.user.id, filters);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get all public maps (no authentication required)' })
  @ApiResponse({ status: 200, description: 'Public maps retrieved successfully' })
  async getPublicMaps(@Query('search') search?: string) {
    const filters: any = {};
    if (search) filters.search = search;

    return this.mapsService.getPublicMaps(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get map by ID' })
  @ApiResponse({ status: 200, description: 'Map retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Map not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req,
    @Query('password') password?: string,
  ) {
    return this.mapsService.findOne(id, req.user.id, password);
  }

  @Get(':id/password-protected')
  @ApiOperation({ summary: 'Access password-protected map' })
  @ApiResponse({ status: 200, description: 'Map accessed successfully' })
  @ApiResponse({ status: 403, description: 'Invalid password' })
  @ApiResponse({ status: 404, description: 'Map not found' })
  async getPasswordProtectedMap(
    @Param('id') id: string,
    @Query('password') password: string,
  ) {
    return this.mapsService.getPasswordProtectedMap(id, password);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update map' })
  @ApiResponse({ status: 200, description: 'Map updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Map not found' })
  async update(
    @Param('id') id: string,
    @Body() updateMapDto: UpdateMapDto,
    @Request() req,
  ) {
    return this.mapsService.update(id, updateMapDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete map' })
  @ApiResponse({ status: 200, description: 'Map deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Map not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.mapsService.remove(id, req.user.id);
  }
}
