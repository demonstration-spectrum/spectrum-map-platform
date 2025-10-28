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
import { CorporationsService } from './corporations.service';
import { CreateCorporationDto } from './dto/create-corporation.dto';
import { UpdateCorporationDto } from './dto/update-corporation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('corporations')
@Controller('corporations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CorporationsController {
  constructor(private readonly corporationsService: CorporationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new corporation (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Corporation created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  create(@Body() createCorporationDto: CreateCorporationDto, @Request() req) {
    return this.corporationsService.create(createCorporationDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accessible corporations' })
  @ApiResponse({ status: 200, description: 'Corporations retrieved successfully' })
  findAll(@Request() req, @Query('includeDeleted') includeDeleted?: string) {
    const include = includeDeleted === 'true'
    return this.corporationsService.findAll(req.user.id, include);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get corporation by ID' })
  @ApiResponse({ status: 200, description: 'Corporation retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Corporation not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.corporationsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update corporation (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Corporation updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  @ApiResponse({ status: 404, description: 'Corporation not found' })
  update(@Param('id') id: string, @Body() updateCorporationDto: UpdateCorporationDto, @Request() req) {
    return this.corporationsService.update(id, updateCorporationDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete corporation (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Corporation deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  @ApiResponse({ status: 404, description: 'Corporation not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.corporationsService.remove(id, req.user.id);
  }

  @Post(':id/recover')
  @ApiOperation({ summary: 'Recover a soft-deleted corporation (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Corporation recovered successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  @ApiResponse({ status: 404, description: 'Corporation not found' })
  recover(@Param('id') id: string, @Request() req) {
    return this.corporationsService.recover(id, req.user.id);
  }

  @Post(':id/advisers/:adviserId')
  @ApiOperation({ summary: 'Grant adviser access to corporation (Corp Admin only)' })
  @ApiResponse({ status: 201, description: 'Adviser access granted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Corp Admin access required' })
  grantAdviserAccess(
    @Param('id') corporationId: string,
    @Param('adviserId') adviserId: string,
    @Request() req,
  ) {
    return this.corporationsService.grantAdviserAccess(corporationId, adviserId, req.user.id);
  }

  @Delete(':id/advisers/:adviserId')
  @ApiOperation({ summary: 'Revoke adviser access from corporation (Corp Admin only)' })
  @ApiResponse({ status: 200, description: 'Adviser access revoked successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Corp Admin access required' })
  revokeAdviserAccess(
    @Param('id') corporationId: string,
    @Param('adviserId') adviserId: string,
    @Request() req,
  ) {
    return this.corporationsService.revokeAdviserAccess(corporationId, adviserId, req.user.id);
  }
}
