export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  corporationId?: string
  corporation?: Corporation
  adviserAccess?: CorporationAdviser[]
  lastLoginAt?: string
  createdAt: string
}

export interface Corporation {
  id: string
  name: string
  description?: string
  status: CorporationStatus
  createdAt: string
  updatedAt: string
  _count?: {
    users: number
    datasets: number
    maps: number
  }
}

export interface CorporationAdviser {
  id: string
  corporationId: string
  adviserId: string
  grantedAt: string
  grantedBy: string
  isActive: boolean
  corporation: Corporation
}

export interface Dataset {
  id: string
  name: string
  description?: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  visibility: DatasetVisibility
  corporationId: string
  uploadedById: string
  createdAt: string
  updatedAt: string
  workspaceName?: string
  layerName?: string
  isProcessed: boolean
  defaultStyle?: any
  corporation: Corporation
  uploadedBy: User
  _count?: {
    layers: number
  }
}

export interface Map {
  id: string
  name: string
  description?: string
  visibility: MapVisibility
  password?: string
  corporationId: string
  createdById: string
  createdAt: string
  updatedAt: string
  centerLat?: number
  centerLng?: number
  zoom?: number
  bearing?: number
  pitch?: number
  corporation: Corporation
  createdBy: User
  layers?: Layer[]
  _count?: {
    layers: number
  }
}

export interface Layer {
  id: string
  mapId: string
  datasetId: string
  name: string
  order: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
  style?: any
  dataset: Dataset
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
  corporationId?: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

export interface CreateMapRequest {
  name: string
  description?: string
  visibility: MapVisibility
  password?: string
  centerLat?: number
  centerLng?: number
  zoom?: number
  bearing?: number
  pitch?: number
}

export interface CreateDatasetRequest {
  name: string
  description?: string
  visibility: DatasetVisibility
  defaultStyle?: any
}

export interface CreateLayerRequest {
  datasetId: string
  name: string
  order?: number
  isVisible?: boolean
  style?: any
}

export interface ShareDatasetRequest {
  corporationIds: string[]
}

export interface ReorderLayersRequest {
  layerIds: string[]
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CORP_ADMIN = 'CORP_ADMIN',
  EDITOR = 'EDITOR',
  ADVISER = 'ADVISER'
}

export enum CorporationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}

export enum DatasetVisibility {
  PRIVATE = 'PRIVATE',
  SHARED = 'SHARED',
  PUBLIC = 'PUBLIC'
}

export enum MapVisibility {
  PRIVATE = 'PRIVATE',
  PASSWORD_PROTECTED = 'PASSWORD_PROTECTED',
  PUBLIC = 'PUBLIC'
}

export interface MapboxStyle {
  version: number
  name: string
  metadata: any
  sources: any
  layers: any[]
  glyphs?: string
  sprite?: string
}

export interface LayerStyle {
  id: string
  type: 'fill' | 'line' | 'symbol' | 'circle' | 'heatmap' | 'fill-extrusion' | 'raster' | 'hillshade' | 'background'
  paint?: any
  layout?: any
  filter?: any
  source?: string
  'source-layer'?: string
}
