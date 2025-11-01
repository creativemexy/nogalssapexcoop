import { PrismaClient, Prisma } from '@prisma/client'

// Connection pool configuration
const prismaConfig: Prisma.PrismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings to prevent timeout issues
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
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
    // In development, return false but don't crash the app
    if (process.env.NODE_ENV === 'development') {
      console.warn('Database connection failed in development mode. Some features may not work.')
      return false
    }
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect()
}
