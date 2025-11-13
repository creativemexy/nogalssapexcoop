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
  // Increase connection pool size to handle more concurrent requests
  // Note: This should match or be less than your database's max_connections setting
}

// Configure connection pool via DATABASE_URL query parameters if not already set
// Format: postgresql://user:password@host:port/database?connection_limit=50&pool_timeout=20
// Or set via environment variable
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('connection_limit')) {
  // If connection_limit is not in URL, we'll rely on Prisma defaults
  // Prisma default: connection_limit=10, pool_timeout=10
  // For production, consider increasing via DATABASE_URL: ?connection_limit=50&pool_timeout=20
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
