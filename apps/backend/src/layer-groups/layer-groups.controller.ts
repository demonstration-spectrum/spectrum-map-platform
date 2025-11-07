import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LayerGroupsService } from './layer-groups.service';
import { CreateLayerGroupDto } from './dto/create-layer-group.dto';
import { UpdateLayerGroupDto } from './dto/update-layer-group.dto';

@ApiTags('layer-groups')
@Controller('maps/:mapId/layer-groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LayerGroupsController {
  constructor(private readonly service: LayerGroupsService) {}

  @Get()
  @ApiOperation({ summary: 'List layer groups for a map' })
  async list(@Param('mapId') mapId: string, @Request() req) {
    return this.service.list(mapId, req.user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a layer group' })
  @ApiResponse({ status: 201 })
  async create(@Param('mapId') mapId: string, @Body() dto: CreateLayerGroupDto, @Request() req) {
    return this.service.create(mapId, dto, req.user.id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a layer group (rename, collapsed, visible)' })
  async update(@Param('mapId') mapId: string, @Param('id') id: string, @Body() dto: UpdateLayerGroupDto, @Request() req) {
    return this.service.update(mapId, id, dto, req.user.id)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a layer group (layers remain ungrouped)' })
  async remove(@Param('mapId') mapId: string, @Param('id') id: string, @Request() req) {
    return this.service.remove(mapId, id, req.user.id)
  }
}
