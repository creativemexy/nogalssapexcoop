import { PrismaClient } from '@prisma/client'

// Connection pool configuration
const prismaConfig = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pool settings
  __internal: {
    engine: {
      connection_limit: 20,
      pool_timeout: 20,
    },
  },
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Connection health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect()
}
