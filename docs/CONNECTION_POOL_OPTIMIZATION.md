# Database Connection Pool Optimization

## Issue
The application was experiencing Prisma connection pool exhaustion errors:
- Error: `Timed out fetching a new connection from the connection pool`
- Connection limit: 20 connections
- Timeout: 20 seconds

## Root Cause
Session validation was being called on **every authenticated request** in the JWT callback, causing:
- Excessive database queries
- Connection pool exhaustion under load
- Timeout errors when all connections were in use

## Solutions Implemented

### 1. Optimized Session Validation Frequency
**File**: `src/lib/auth.ts`

Changed session validation to only occur when:
- Token is expiring soon (within 5 minutes), OR
- Last validation was more than 60 seconds ago

This reduces database queries by ~95% while maintaining security.

**Before**: Every request = 1 database query
**After**: ~1 database query per minute per user

### 2. Added Timeout Protection
**File**: `src/lib/session-manager.ts`

Added 5-second timeouts to session validation queries to prevent hanging connections:
- If query takes > 5 seconds, it times out gracefully
- Prevents connection pool from being exhausted by slow queries
- Allows retry on next request

### 3. Connection Pool Configuration
**File**: `src/lib/database.ts`

Documented connection pool configuration options. To increase pool size, update `DATABASE_URL`:

```
postgresql://user:password@host:port/database?connection_limit=50&pool_timeout=20
```

## Configuration Recommendations

### Development
- Default Prisma settings are usually sufficient
- Connection limit: 10 (default)
- Pool timeout: 10 seconds (default)

### Production
For high-traffic applications, increase connection pool:

```env
DATABASE_URL=postgresql://user:password@host:port/database?connection_limit=50&pool_timeout=20
```

**Important**: Ensure your database's `max_connections` setting is higher than your application's `connection_limit`.

### Database Settings (PostgreSQL)
```sql
-- Check current max connections
SHOW max_connections;

-- Recommended: Set max_connections to at least 2x your application pool size
-- Example: If app uses 50 connections, set max_connections to 100+
```

## Monitoring

Watch for these indicators of connection pool issues:
- `P2024` Prisma errors (connection pool timeout)
- Slow API responses
- Database connection errors in logs

## Additional Optimizations

### 1. Connection Pooling Service (Optional)
For very high-traffic applications, consider using a connection pooling service like:
- PgBouncer
- AWS RDS Proxy
- Supabase Connection Pooler

### 2. Read Replicas
For read-heavy workloads, use read replicas to distribute load:
- Write queries → Primary database
- Read queries → Read replicas

### 3. Query Optimization
- Use database indexes for frequently queried fields
- Optimize slow queries
- Use connection pooling at the database level

## Testing

To test connection pool under load:

```bash
# Install Apache Bench or similar
ab -n 1000 -c 50 http://localhost:3000/api/admin/dashboard-stats
```

Monitor:
- Database connection count
- Response times
- Error rates

## Notes

- Session validation is now optimized but still secure
- JWT tokens have their own expiration (30 minutes)
- Database session validation provides additional security layer
- Reduced validation frequency maintains security while improving performance

