import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  Res,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadGatewayException,
} from '@nestjs/common';
import type { Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../common/prisma/prisma.service';
import { ProxyService } from './proxy.service';

@Controller('proxy')
@UseGuards(JwtAuthGuard)
export class ProxyController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('layers/:layerId/tiles/:z/:x/:y.pbf')
  async proxyVectorTiles(
    @Param('layerId') layerId: string,
    @Param('z') z: string,
    @Param('x') x: string,
    @Param('y') y: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const userId = req?.user?.id;

    const layer = await this.prisma.layer.findUnique({
      where: { id: layerId },
      select: {
        id: true,
        mapId: true,
        dataset: {
          select: {
            workspaceName: true,
            layerName: true,
          },
        },
      },
    });

    if (!layer || !layer.dataset?.workspaceName || !layer.dataset?.layerName) {
      throw new NotFoundException('Layer not found');
    }

    const hasAccess = await this.prisma.hasMapReadAccess(userId, layer.mapId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this map');
    }

    const geoserverBaseUrl = this.proxyService.getGeoserverBaseUrl();

    const params = new URLSearchParams({
      REQUEST: 'GetTile',
      SERVICE: 'WMTS',
      VERSION: '1.0.0',
      LAYER: `${layer.dataset.workspaceName}:${layer.dataset.layerName}`,
      STYLE: '',
      TILEMATRIXSET: 'WebMercatorQuad',
      TILEMATRIX: z,
      TILEROW: y,
      TILECOL: x,
      FORMAT: 'application/vnd.mapbox-vector-tile',
    });

    const targetUrl = `${geoserverBaseUrl}/gwc/service/wmts?${params.toString()}`;

    try {
      const upstream = await firstValueFrom(this.proxyService.proxyRequest(targetUrl, req.headers));

      res.status(upstream.status);

      // Preserve caching headers where possible
      if (upstream.headers?.etag) res.setHeader('etag', upstream.headers.etag);
      if (upstream.headers?.['cache-control']) res.setHeader('cache-control', upstream.headers['cache-control']);
      if (upstream.headers?.['last-modified']) res.setHeader('last-modified', upstream.headers['last-modified']);

      res.setHeader('Content-Type', 'application/vnd.mapbox-vector-tile');

      (upstream.data as any).pipe(res);
    } catch (err: any) {
      throw new BadGatewayException(err?.message || 'Failed to proxy tile request');
    }
  }

  @Get('datasets/:datasetId/features')
  async proxyDatasetFeatures(
    @Param('datasetId') datasetId: string,
    @Query('CQL_FILTER') cqlFilter: string | undefined,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const userId = req?.user?.id;

    const dataset = await this.prisma.dataset.findUnique({
      where: { id: datasetId },
      select: {
        id: true,
        workspaceName: true,
        layerName: true,
      },
    });

    if (!dataset || !dataset.workspaceName || !dataset.layerName) {
      throw new NotFoundException('Dataset not found');
    }

    const hasAccess = await this.prisma.hasDatasetReadAccess(userId, datasetId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this dataset');
    }

    const geoserverBaseUrl = this.proxyService.getGeoserverBaseUrl();

    const params = new URLSearchParams({
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typeName: `${dataset.workspaceName}:${dataset.layerName}`,
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
    });

    // Forward caller-provided CQL filter (e.g., public_id='...')
    if (cqlFilter) {
      params.set('CQL_FILTER', cqlFilter);
    }

    const targetUrl = `${geoserverBaseUrl}/wfs?${params.toString()}`;

    try {
      const upstream = await firstValueFrom(this.proxyService.proxyRequest(targetUrl, req.headers));

      res.status(upstream.status);

      if (upstream.headers?.etag) res.setHeader('etag', upstream.headers.etag);
      if (upstream.headers?.['cache-control']) res.setHeader('cache-control', upstream.headers['cache-control']);

      res.setHeader('Content-Type', 'application/json');

      (upstream.data as any).pipe(res);
    } catch (err: any) {
      throw new BadGatewayException(err?.message || 'Failed to proxy WFS request');
    }
  }
}
