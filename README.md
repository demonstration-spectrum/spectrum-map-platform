# Spectrum Map Platform

A secure, multi-tenant web application for managing and visualizing geospatial data. Built with TypeScript, Vue.js, NestJS, and PostGIS.

## Features

- **Multi-Tenant Architecture**: Secure, isolated workspaces for each organization
- **Role-Based Access Control**: Super Admin, Corp Admin, Editor, and Adviser roles
- **Geospatial Data Management**: Upload and manage GeoJSON, Shapefiles, and MapInfo Tab files
- **Interactive Maps**: Create beautiful, interactive maps with custom styling
- **Vector Tile Serving**: High-performance vector tiles using GeoServer and PostGIS
- **Secure Sharing**: Share maps publicly, with password protection, or keep them private
- **Team Collaboration**: Work with advisers and consultants across organizations

## Technology Stack

### Frontend
- **Framework**: Vue.js 3 with Composition API
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: Tailwind CSS
- **Mapping**: Mapbox GL JS
- **Build Tool**: Vite

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: Prisma
- **Authentication**: JWT with AWS Cognito
- **File Processing**: Sharp, Turf.js

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Geospatial Server**: GeoServer
- **Cloud**: AWS (Cognito, RDS, Fargate)
- **Infrastructure as Code**: Terraform

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spectrum-map-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development environment**
   ```bash
   npm run docker:up
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs
- GeoServer: http://localhost:8080/geoserver

## Development

### Project Structure

```
/
├── apps/
│   ├── backend/        # NestJS API
│   └── frontend/       # Vue.js application
├── docker/             # Docker configuration
├── infrastructure/     # Terraform configuration
├── .env.example        # Environment variables template
├── docker-compose.yml  # Local development setup
└── package.json        # Root package.json
```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run test` - Run tests for both frontend and backend
- `npm run lint` - Lint both frontend and backend
- `npm run docker:up` - Start all services with Docker Compose
- `npm run docker:down` - Stop all services
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

### Environment Variables

Copy `env.example` to `.env` and configure the following:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/spectrum_map?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"

# AWS Cognito
AWS_REGION="us-east-1"
AWS_COGNITO_USER_POOL_ID="your-cognito-user-pool-id"
AWS_COGNITO_CLIENT_ID="your-cognito-client-id"
AWS_COGNITO_CLIENT_SECRET="your-cognito-client-secret"

# Mapbox
MAPBOX_ACCESS_TOKEN="your-mapbox-access-token"

# GeoServer
GEOSERVER_URL="http://localhost:8080/geoserver"
GEOSERVER_USER="admin"
GEOSERVER_PASSWORD="geoserver"
```

## User Roles

### Super Admin
- System-level access
- Create and manage corporations
- Create and manage adviser accounts
- Read-only access to all data

### Corp Admin
- Manage users within their corporation
- Manage datasets and maps
- Grant access to advisers
- Set map visibility and sharing

### Editor
- Create and edit maps
- Upload and manage datasets
- Apply custom styling to layers

### Adviser/Consultant
- Access multiple corporations
- Switch between organizations
- Assist with map creation and data analysis

## API Documentation

The API documentation is available at `/api/docs` when running the backend server. It includes:

- Authentication endpoints
- Corporation management
- Dataset upload and management
- Map creation and editing
- Layer management
- User management

## Security Features

- **Input Validation**: Comprehensive validation on all API endpoints
- **Access Control**: Strict multi-tenant data isolation
- **Authentication**: JWT with AWS Cognito integration
- **Rate Limiting**: Protection against abuse
- **Security Headers**: HSTS, CSP, and other security headers
- **Audit Logging**: Comprehensive logging for security monitoring

## Deployment

### AWS Infrastructure

The platform is designed to run on AWS with the following services:

- **AWS Cognito**: User authentication and management
- **AWS RDS**: PostgreSQL database with PostGIS
- **AWS Fargate**: Containerized application hosting
- **AWS VPC**: Network isolation and security
- **AWS ECR**: Container image registry

### Terraform Configuration

Infrastructure is managed with Terraform in the `infrastructure/terraform/` directory.

### CI/CD Pipeline

GitHub Actions workflows handle:
- Automated testing
- Security scanning
- Infrastructure provisioning
- Application deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
