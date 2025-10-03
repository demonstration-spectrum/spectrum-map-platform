import { PrismaClient, UserRole, CorporationStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a super admin corporation
  const superAdminCorp = await prisma.corporation.upsert({
    where: { id: 'super-admin-corp' },
    update: {},
    create: {
      id: 'super-admin-corp',
      name: 'Spectrum Map Platform',
      description: 'System administration corporation',
      status: CorporationStatus.ACTIVE,
    },
  })

  // Create a super admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@spectrummap.com' },
    update: {},
    create: {
      email: 'admin@spectrummap.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      corporationId: superAdminCorp.id,
      isActive: true,
    },
  })

  // Create a sample corporation
  const sampleCorp = await prisma.corporation.upsert({
    where: { id: 'sample-corp' },
    update: {},
    create: {
      id: 'sample-corp',
      name: 'Acme Corporation',
      description: 'A sample corporation for testing',
      status: CorporationStatus.ACTIVE,
    },
  })

  // Create a sample corp admin
  const corpAdmin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CORP_ADMIN,
      corporationId: sampleCorp.id,
      isActive: true,
    },
  })

  // Create a sample editor
  const editor = await prisma.user.upsert({
    where: { email: 'editor@acme.com' },
    update: {},
    create: {
      email: 'editor@acme.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.EDITOR,
      corporationId: sampleCorp.id,
      isActive: true,
    },
  })

  // Create a sample adviser
  const adviser = await prisma.user.upsert({
    where: { email: 'adviser@consulting.com' },
    update: {},
    create: {
      email: 'adviser@consulting.com',
      firstName: 'Bob',
      lastName: 'Johnson',
      role: UserRole.ADVISER,
      isActive: true,
    },
  })

  // Grant adviser access to sample corporation
  await prisma.corporationAdviser.upsert({
    where: {
      corporationId_adviserId: {
        corporationId: sampleCorp.id,
        adviserId: adviser.id,
      },
    },
    update: {},
    create: {
      corporationId: sampleCorp.id,
      adviserId: adviser.id,
      grantedBy: corpAdmin.id,
      isActive: true,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('👤 Super Admin:', superAdmin.email)
  console.log('🏢 Sample Corporation:', sampleCorp.name)
  console.log('👥 Users created:', 4)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
