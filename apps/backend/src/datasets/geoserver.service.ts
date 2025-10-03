import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GeoserverService {
  private readonly logger = new Logger(GeoserverService.name);
  private readonly geoserverUrl: string;
  private readonly username: string;
  private readonly password: string;

  constructor(private configService: ConfigService) {
    this.geoserverUrl = this.configService.get('GEOSERVER_URL', 'http://localhost:8080/geoserver');
    this.username = this.configService.get('GEOSERVER_USER', 'admin');
    this.password = this.configService.get('GEOSERVER_PASSWORD', 'geoserver');
  }

  private getAuthHeader(): string {
    return Buffer.from(`${this.username}:${this.password}`).toString('base64');
  }

  async createWorkspace(workspaceName: string): Promise<boolean> {
    try {
      const workspaceXml = `
        <workspace>
          <name>${workspaceName}</name>
        </workspace>
      `;

      await axios.post(
        `${this.geoserverUrl}/rest/workspaces`,
        workspaceXml,
        {
          headers: {
            'Content-Type': 'application/xml',
            'Authorization': `Basic ${this.getAuthHeader()}`,
          },
        }
      );

      this.logger.log(`Workspace ${workspaceName} created successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to create workspace ${workspaceName}:`, error.response?.data || error.message);
      return false;
    }
  }

  async createDataStore(workspaceName: string, storeName: string, connectionParams: any): Promise<boolean> {
    try {
      const dataStoreXml = `
        <dataStore>
          <name>${storeName}</name>
          <connectionParameters>
            <entry key="host">${connectionParams.host}</entry>
            <entry key="port">${connectionParams.port}</entry>
            <entry key="database">${connectionParams.database}</entry>
            <entry key="user">${connectionParams.user}</entry>
            <entry key="passwd">${connectionParams.password}</entry>
            <entry key="dbtype">postgis</entry>
            <entry key="schema">public</entry>
            <entry key="table">${connectionParams.table}</entry>
          </connectionParameters>
        </dataStore>
      `;

      await axios.post(
        `${this.geoserverUrl}/rest/workspaces/${workspaceName}/datastores`,
        dataStoreXml,
        {
          headers: {
            'Content-Type': 'application/xml',
            'Authorization': `Basic ${this.getAuthHeader()}`,
          },
        }
      );

      this.logger.log(`DataStore ${storeName} created successfully in workspace ${workspaceName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to create datastore ${storeName}:`, error.response?.data || error.message);
      return false;
    }
  }

  async createLayer(workspaceName: string, storeName: string, layerName: string): Promise<boolean> {
    try {
      const layerXml = `
        <featureType>
          <name>${layerName}</name>
          <nativeName>${layerName}</nativeName>
          <title>${layerName}</title>
          <abstract>Layer for ${layerName}</abstract>
          <enabled>true</enabled>
          <advertised>true</advertised>
        </featureType>
      `;

      await axios.post(
        `${this.geoserverUrl}/rest/workspaces/${workspaceName}/datastores/${storeName}/featuretypes`,
        layerXml,
        {
          headers: {
            'Content-Type': 'application/xml',
            'Authorization': `Basic ${this.getAuthHeader()}`,
          },
        }
      );

      this.logger.log(`Layer ${layerName} created successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to create layer ${layerName}:`, error.response?.data || error.message);
      return false;
    }
  }

  async deleteLayer(workspaceName: string, layerName: string): Promise<boolean> {
    try {
      await axios.delete(
        `${this.geoserverUrl}/rest/workspaces/${workspaceName}/layers/${layerName}`,
        {
          headers: {
            'Authorization': `Basic ${this.getAuthHeader()}`,
          },
        }
      );

      this.logger.log(`Layer ${layerName} deleted successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete layer ${layerName}:`, error.response?.data || error.message);
      return false;
    }
  }

  async getLayerInfo(workspaceName: string, layerName: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.geoserverUrl}/rest/workspaces/${workspaceName}/layers/${layerName}`,
        {
          headers: {
            'Authorization': `Basic ${this.getAuthHeader()}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get layer info for ${layerName}:`, error.response?.data || error.message);
      return null;
    }
  }

  getVectorTileUrl(workspaceName: string, layerName: string): string {
    return `${this.geoserverUrl}/${workspaceName}/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=${workspaceName}:${layerName}&STYLE=&TILEMATRIXSET=EPSG:3857&TILEMATRIX=EPSG:3857:{z}&TILEROW={y}&TILECOL={x}&FORMAT=application/vnd.mapbox-vector-tile`;
  }

  getWmsUrl(workspaceName: string, layerName: string): string {
    return `${this.geoserverUrl}/${workspaceName}/wms?service=WMS&version=1.1.0&request=GetMap&layers=${workspaceName}:${layerName}&styles=&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png&transparent=true`;
  }

  async isGeoserverHealthy(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.geoserverUrl}/rest/about/version`, {
        headers: {
          'Authorization': `Basic ${this.getAuthHeader()}`,
        },
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      this.logger.error('GeoServer health check failed:', error.message);
      return false;
    }
  }
}
