import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    // Included per requirements (permission queries live in Prisma)
    private readonly prisma: PrismaService,
  ) {}

  getGeoserverBaseUrl(): string {
    const raw = this.configService.get<string>('GEOSERVER_URL') || '';
    return raw.replace(/\/$/, '');
  }

  proxyRequest(url: string, headers: any): Observable<AxiosResponse> {
    const username = this.configService.get<string>('GEOSERVER_USER') || '';
    const password = this.configService.get<string>('GEOSERVER_PASSWORD') || '';

    const forwardHeaders: Record<string, any> = {};

    // Forward safe caching / content negotiation headers (but never client auth)
    const accept = headers?.accept;
    const ifNoneMatch = headers?.['if-none-match'];
    const ifModifiedSince = headers?.['if-modified-since'];
    const range = headers?.range;

    if (accept) forwardHeaders['accept'] = accept;
    if (ifNoneMatch) forwardHeaders['if-none-match'] = ifNoneMatch;
    if (ifModifiedSince) forwardHeaders['if-modified-since'] = ifModifiedSince;
    if (range) forwardHeaders['range'] = range;

    return this.httpService.get(url, {
      responseType: 'stream',
      auth: { username, password },
      headers: forwardHeaders,
      // We want to stream and propagate GeoServer status codes to the client
      validateStatus: () => true,
    });
  }
}
