# Session Cleanup Cron Job Setup

This document explains how to set up automatic session cleanup using cron jobs.

## Overview

The session cleanup cron job automatically:
- Removes expired sessions (30+ minutes of inactivity)
- Enforces the 3-session limit per user
- Invalidates oldest sessions when users exceed the limit

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

If you're deploying on Vercel, the `vercel.json` file is already configured.

1. **Set the cron secret** in your Vercel environment variables:
   ```
   CRON_SECRET_KEY=your-secret-key-here
   ```

2. **Deploy to Vercel** - The cron job will automatically run every 15 minutes.

3. **Verify it's working** by checking:
   - Vercel Dashboard → Your Project → Cron Jobs
   - The endpoint: `https://your-domain.com/api/cron/sessions-cleanup`

### Option 2: External Cron Service

Use services like [cron-job.org](https://cron-job.org), [EasyCron](https://www.easycron.com), or [Cronitor](https://cronitor.io).

1. **Create a new cron job** with these settings:
   - **URL**: `https://your-domain.com/api/cron/sessions-cleanup`
   - **Schedule**: Every 15 minutes (`*/15 * * * *`)
   - **Method**: GET
   - **Headers**: 
     ```
     x-cron-secret: your-secret-key-here
     ```

2. **Set the secret** in your environment variables:
   ```
   CRON_SECRET_KEY=your-secret-key-here
   ```

### Option 3: GitHub Actions

Create `.github/workflows/session-cleanup.yml`:

```yaml
name: Session Cleanup

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Session Cleanup
        run: |
          curl -X GET \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET_KEY }}" \
            https://your-domain.com/api/cron/sessions-cleanup
```

### Option 4: Server Cron (Linux/Unix)

If you have server access, add to crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs every 15 minutes)
*/15 * * * * curl -X GET -H "x-cron-secret: YOUR_SECRET_KEY" https://your-domain.com/api/cron/sessions-cleanup
```

## Security

**Important**: Always set `CRON_SECRET_KEY` in your environment variables and pass it as the `x-cron-secret` header. This prevents unauthorized access to the cleanup endpoint.

## Monitoring

You can monitor the cron job by:

1. **Checking the response** - The endpoint returns JSON with cleanup statistics
2. **Viewing logs** - Check your deployment logs for cron execution
3. **Super Admin Dashboard** - Visit `/dashboard/super-admin/sessions` to see real-time stats

## Manual Cleanup

You can also trigger cleanup manually:

1. **Via Super Admin Dashboard**: Click "Run Cleanup Now" on `/dashboard/super-admin/sessions`
2. **Via API**: 
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.com/api/admin/sessions/cleanup
   ```

## Troubleshooting

### Cron job not running
- Check that `CRON_SECRET_KEY` is set in environment variables
- Verify the cron schedule is correct
- Check deployment logs for errors

### Sessions not being cleaned
- Verify the cron endpoint is accessible
- Check database connection
- Review error logs

### Too many active sessions
- The cleanup runs every 15 minutes
- Sessions expire after 30 minutes of inactivity
- Maximum 3 sessions per user are enforced

