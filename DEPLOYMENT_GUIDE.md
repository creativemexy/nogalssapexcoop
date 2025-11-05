# VPS Deployment Guide - Updating Code from GitHub

This guide will walk you through updating your Nogalss application on your VPS server with the latest changes from GitHub.

## Prerequisites

- SSH access to your VPS server
- Git installed on the server
- Node.js and npm/pnpm installed
- PM2 or your process manager installed (for restarting the application)
- Database access configured

---

## Step-by-Step Update Process

### 1. SSH into Your VPS Server

```bash
ssh username@your-vps-ip
# or
ssh username@your-domain.com
```

### 2. Navigate to Your Project Directory

```bash
cd /path/to/your/nogalss/project
# Example: cd /var/www/nogalss or cd /home/user/nogalss
```

### 3. Check Current Status

Before updating, check what branch you're on and if there are any local changes:

```bash
git status
git branch
```

If you have uncommitted local changes, either:
- **Stash them** (temporary save): `git stash`
- **Commit them**: `git add . && git commit -m "Local changes"`
- **Discard them** (⚠️ **WARNING**: This will lose local changes): `git reset --hard`

### 4. Pull Latest Changes from GitHub

Pull the latest code from the `main` branch:

```bash
git fetch origin
git pull origin main
```

Or if you're already on the main branch:

```bash
git pull
```

### 5. Install/Update Dependencies

If `package.json` or `package-lock.json` changed, update dependencies:

**Using npm:**
```bash
npm install
```

**Using pnpm:**
```bash
pnpm install
```

### 6. Update Database Schema (if needed)

If the Prisma schema was modified, run migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Or if you're using `prisma migrate dev` for development:
```bash
npx prisma migrate dev
```

**⚠️ Important**: Always backup your database before running migrations in production!

### 7. Build the Application

Build the Next.js application:

```bash
npm run build
```

Or:

```bash
pnpm build
```

### 8. Restart Your Application

Restart your application using your process manager:

**Using PM2:**
```bash
pm2 restart nogalss
# or
pm2 restart all
```

**Using systemd:**
```bash
sudo systemctl restart nogalss
# or whatever your service name is
```

**Using Docker:**
```bash
docker-compose restart
# or
docker restart nogalss-container
```

---

## Complete Update Script

You can create a script to automate this process. Save this as `update.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment update...${NC}"

# Navigate to project directory
cd /path/to/your/nogalss/project || exit 1

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes from GitHub...${NC}"
git fetch origin
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to pull changes${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing/updating dependencies...${NC}"
npm install
# or: pnpm install

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npx prisma generate
npx prisma migrate deploy

# Build application
echo -e "${YELLOW}Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

# Restart application
echo -e "${YELLOW}Restarting application...${NC}"
pm2 restart nogalss
# or: sudo systemctl restart nogalss

echo -e "${GREEN}Deployment complete!${NC}"
```

Make it executable:
```bash
chmod +x update.sh
```

Run it:
```bash
./update.sh
```

---

## Quick Update Command (One-Liner)

For quick updates, you can use this one-liner:

```bash
cd /path/to/your/nogalss/project && git pull origin main && npm install && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 restart nogalss
```

**⚠️ Note**: Replace `/path/to/your/nogalss/project` and `nogalss` with your actual paths and service names.

---

## Verification Steps

After updating, verify everything is working:

1. **Check Application Status:**
   ```bash
   pm2 status
   # or
   sudo systemctl status nogalss
   ```

2. **Check Application Logs:**
   ```bash
   pm2 logs nogalss
   # or
   sudo journalctl -u nogalss -f
   ```

3. **Test the Application:**
   - Visit your website in a browser
   - Check that it loads correctly
   - Test key features (login, registration, etc.)

4. **Check Database:**
   ```bash
   npx prisma studio
   # or connect directly to verify schema
   ```

---

## Rollback Procedure

If something goes wrong, you can rollback to the previous version:

1. **Find the previous commit hash:**
   ```bash
   git log --oneline -5
   ```

2. **Checkout the previous version:**
   ```bash
   git checkout <previous-commit-hash>
   ```

3. **Rebuild and restart:**
   ```bash
   npm install
   npm run build
   pm2 restart nogalss
   ```

Or use git reset:
```bash
git reset --hard HEAD~1  # Go back one commit
npm install && npm run build && pm2 restart nogalss
```

---

## Best Practices

1. **Always Backup Before Updates:**
   - Backup your database
   - Backup your current code (create a git tag)
   - Backup environment variables

2. **Test in Staging First:**
   - If possible, test updates on a staging server first

3. **Monitor After Update:**
   - Watch logs for errors
   - Monitor application performance
   - Check error tracking (if using Sentry, etc.)

4. **Use Git Tags:**
   - Tag stable releases: `git tag v1.0.0`
   - Deploy specific versions: `git checkout v1.0.0`

5. **Maintain Environment Variables:**
   - Keep `.env` files separate from git
   - Document required environment variables

---

## Troubleshooting

### Build Fails

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Migration Errors

```bash
# Check migration status
npx prisma migrate status

# If needed, reset migrations (⚠️ DANGEROUS in production)
npx prisma migrate reset
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Permission Errors

```bash
# Fix file permissions if needed
sudo chown -R $USER:$USER /path/to/project
```

---

## Environment-Specific Notes

### Production Server
- Always run migrations with `prisma migrate deploy` (not `dev`)
- Use `npm ci` instead of `npm install` for faster, more reliable installs
- Ensure `NODE_ENV=production` is set

### Development Server
- You can use `prisma migrate dev` for migrations
- Hot reloading is available in development mode

---

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Migration Guide](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

## Quick Reference Commands

```bash
# Navigate to project
cd /path/to/project

# Pull updates
git pull origin main

# Install dependencies
npm install

# Database migrations
npx prisma generate
npx prisma migrate deploy

# Build
npm run build

# Restart
pm2 restart nogalss

# Check status
pm2 status
pm2 logs nogalss
```

---

**Last Updated**: $(date)
**Maintained by**: Nogalss Development Team


