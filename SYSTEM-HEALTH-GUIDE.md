# System Health Monitoring Guide

## Overview

The Nogalss Cooperative application now includes comprehensive **System Health Monitoring** to track performance, resource usage, and application metrics in real-time.

## Features

### 📊 **Real-Time Metrics Collection**
- **CPU Usage** - Current CPU utilization and load averages
- **Memory Usage** - RAM consumption and availability
- **Disk Usage** - Storage space utilization
- **Database Health** - Connection status and response times
- **Application Info** - Uptime, Node.js version, platform details

### 🚨 **Automated Alerting**
- **Threshold-based alerts** for critical metrics
- **Email notifications** for critical system issues
- **Audit logging** of all health events
- **Real-time dashboard updates**

### 🎯 **Health Status Levels**
- **HEALTHY** - All systems operating normally
- **WARNING** - Some metrics exceed warning thresholds
- **CRITICAL** - Critical thresholds exceeded, immediate attention required

## Accessing System Health

### Super Admin Dashboard
1. Navigate to `/dashboard/super-admin`
2. Click on **"System Health"** card
3. View real-time metrics and alerts

### Direct Access
- URL: `/dashboard/super-admin/health`
- Requires SUPER_ADMIN role

## API Endpoints

### Get System Health Metrics
```http
GET /api/admin/health
Authorization: Required (SUPER_ADMIN)
```

**Response:**
```json
{
  "status": "HEALTHY|WARNING|CRITICAL",
  "metrics": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "cpu": {
      "usage": 45,
      "loadAverage": [0.5, 0.8, 1.2],
      "cores": 4
    },
    "memory": {
      "total": 8,
      "used": 4,
      "free": 4,
      "usage": 50
    },
    "disk": {
      "total": 100,
      "used": 30,
      "free": 70,
      "usage": 30
    },
    "database": {
      "connected": true,
      "responseTime": 15,
      "activeConnections": 5
    },
    "application": {
      "uptime": 86400,
      "nodeVersion": "v18.17.0",
      "platform": "linux",
      "arch": "x64"
    },
    "alerts": []
  },
  "alerts": [],
  "summary": {
    "totalAlerts": 0,
    "criticalAlerts": 0,
    "warningAlerts": 0
  }
}
```

### Get Health Alerts
```http
GET /api/admin/health/alerts?type=CRITICAL
Authorization: Required (SUPER_ADMIN)
```

**Query Parameters:**
- `type` - Filter by alert type: `CRITICAL`, `WARNING`, or omit for all

## Alert Thresholds

### Default Thresholds
- **CPU Usage**: 80% (Warning), 95% (Critical)
- **Memory Usage**: 85% (Warning), 95% (Critical)
- **Disk Usage**: 90% (Warning), 95% (Critical)
- **Database Response**: 1000ms (Warning)

### Customizing Thresholds
Edit `src/lib/health-monitor.ts`:

```typescript
private readonly ALERT_THRESHOLDS = {
  CPU_USAGE: 80,        // Adjust CPU threshold
  MEMORY_USAGE: 85,     // Adjust memory threshold
  DISK_USAGE: 90,       // Adjust disk threshold
  DB_RESPONSE_TIME: 1000, // Adjust database response time
};
```

## Dashboard Features

### 📈 **Visual Metrics**
- **Progress bars** for CPU, Memory, and Disk usage
- **Color-coded indicators** (Green/Yellow/Red)
- **Real-time updates** via WebSocket
- **Dark mode support**

### 🚨 **Alert Management**
- **Active alerts** displayed prominently
- **Alert history** with timestamps
- **Critical vs Warning** categorization
- **Detailed alert information**

### 📊 **System Information**
- **Application uptime** in human-readable format
- **Node.js version** and platform details
- **Database connection** status
- **Active database connections**

## Monitoring Integration

### Real-Time Updates
The health dashboard automatically refreshes when:
- New alerts are generated
- System metrics change significantly
- Database connection status changes

### Email Notifications
Critical alerts trigger email notifications to super admins with:
- Alert details and metrics
- Current system status
- Recommended actions

### Audit Logging
All health events are logged to the audit system:
- Alert generation
- Threshold breaches
- System status changes

## Performance Considerations

### Metrics Collection
- **30-second intervals** for metric collection
- **Cached results** to avoid excessive system calls
- **Lightweight monitoring** with minimal overhead

### Database Impact
- **Non-intrusive** database health checks
- **Connection pooling** monitoring
- **Response time** tracking

## Troubleshooting

### Common Issues

#### "Failed to collect health metrics"
- Check system permissions for monitoring libraries
- Verify database connection
- Review server logs for specific errors

#### "Database connection lost"
- Check database server status
- Verify connection string configuration
- Review database logs

#### "High CPU/Memory usage"
- Check for resource-intensive processes
- Review application logs
- Consider scaling resources

### Debug Mode
Enable detailed logging by setting:
```bash
DEBUG=health-monitor
```

## Security Considerations

### Access Control
- **SUPER_ADMIN role required** for all health endpoints
- **Rate limiting** on health API calls
- **Audit logging** of all health data access

### Data Privacy
- **No sensitive data** in health metrics
- **System-level metrics only**
- **No user data** collection

## Future Enhancements

### Planned Features
- **Historical metrics** storage and trending
- **Custom alert rules** configuration
- **Health score** calculation
- **Performance baselines**
- **Automated scaling** recommendations

### Integration Options
- **External monitoring** tools (DataDog, New Relic)
- **Slack/Teams** notifications
- **SMS alerts** for critical issues
- **Health check endpoints** for load balancers

## Best Practices

### Monitoring Strategy
1. **Set appropriate thresholds** based on your system capacity
2. **Monitor trends** rather than single data points
3. **Regular review** of alert patterns
4. **Proactive scaling** before reaching limits

### Alert Management
1. **Acknowledge alerts** promptly
2. **Investigate root causes** of recurring alerts
3. **Adjust thresholds** based on normal operating patterns
4. **Document resolution** procedures

### System Maintenance
1. **Regular health checks** during maintenance windows
2. **Baseline establishment** for new deployments
3. **Capacity planning** based on usage trends
4. **Performance optimization** based on metrics

## Support

For issues with system health monitoring:
1. Check the health dashboard for current status
2. Review audit logs for health events
3. Contact system administrators for critical alerts
4. Refer to application logs for detailed error information
