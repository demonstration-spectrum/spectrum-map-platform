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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LayersService } from './layers.service';
import { CreateLayerDto } from './dto/create-layer.dto';
import { UpdateLayerDto } from './dto/update-layer.dto';
import { ReorderLayersDto } from './dto/reorder-layers.dto';
import { SetLayerGroupingDto } from './dto/set-layer-grouping.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('layers')
@Controller('maps/:mapId/layers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LayersController {
  constructor(private readonly layersService: LayersService) {}

  @Post()
  @ApiOperation({ summary: 'Add a dataset as a layer to a map' })
  @ApiResponse({ status: 201, description: 'Layer created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Map or dataset not found' })
  @ApiResponse({ status: 400, description: 'Dataset already added to map' })
  async create(
    @Param('mapId') mapId: string,
    @Body() createLayerDto: CreateLayerDto,
    @Request() req,
  ) {
    return this.layersService.create(createLayerDto, mapId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all layers in a map' })
  @ApiResponse({ status: 200, description: 'Layers retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Map not found' })
  async findAll(@Param('mapId') mapId: string, @Request() req) {
    return this.layersService.findAll(mapId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get layer by ID' })
  @ApiResponse({ status: 200, description: 'Layer retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Layer not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.layersService.findOne(id, req.user.id);
  }
  
  @Patch('grouping')
  @ApiOperation({ summary: 'Set grouping and order for layers in a map' })
  @ApiResponse({ status: 200, description: 'Layer grouping updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Invalid grouping data' })
  async setGrouping(
    @Param('mapId') mapId: string,
    @Body() setLayerGroupingDto: SetLayerGroupingDto,
    @Request() req,
  ) {
    return this.layersService.setGrouping(mapId, setLayerGroupingDto, req.user.id);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update layer' })
  @ApiResponse({ status: 200, description: 'Layer updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Layer not found' })
  async update(
    @Param('id') id: string,
    @Body() updateLayerDto: UpdateLayerDto,
    @Request() req,
  ) {
    console.log('layer id to update:', id);
    return this.layersService.update(id, updateLayerDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove layer from map' })
  @ApiResponse({ status: 200, description: 'Layer deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Layer not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.layersService.remove(id, req.user.id);
  }

  @Patch(':id/toggle-visibility')
  @ApiOperation({ summary: 'Toggle layer visibility' })
  @ApiResponse({ status: 200, description: 'Layer visibility toggled successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Layer not found' })
  async toggleVisibility(@Param('id') id: string, @Request() req) {
    return this.layersService.toggleVisibility(id, req.user.id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder layers in a map' })
  @ApiResponse({ status: 200, description: 'Layers reordered successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Invalid layer order' })
  async reorderLayers(
    @Param('mapId') mapId: string,
    @Body() reorderLayersDto: ReorderLayersDto,
    @Request() req,
  ) {
    return this.layersService.reorderLayers(mapId, reorderLayersDto, req.user.id);
  }


}
