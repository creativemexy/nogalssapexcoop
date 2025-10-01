# Notification Tracking System Guide

This guide covers the implementation of comprehensive email and SMS tracking for the Nogalss Cooperative application.

## 🎯 Overview

The notification tracking system provides:
- **Complete audit trail** of all emails and SMS sent
- **Real-time statistics** on the super admin dashboard
- **Cost tracking** for SMS notifications
- **Success/failure monitoring** with detailed error logging
- **Performance analytics** and reporting

## 📊 Features Implemented

### 1. Database Schema
- **NotificationLog model** to track all notifications
- **Status tracking** (PENDING, SENT, FAILED)
- **Cost tracking** for SMS with provider details
- **Error logging** for failed notifications
- **Metadata storage** for additional context

### 2. Super Admin Dashboard Integration
- **Notification Statistics** section with key metrics
- **Real-time counters** for emails and SMS
- **Success rates** for both email and SMS
- **Cost analysis** with total and average SMS costs
- **Recent notifications** table with detailed information

### 3. Automatic Logging
- **All email notifications** are automatically logged
- **All SMS notifications** are automatically logged
- **Status updates** when notifications are sent or fail
- **Cost tracking** for SMS with provider pricing

## 🗄️ Database Schema

### NotificationLog Model
```prisma
model NotificationLog {
  id            String            @id @default(cuid())
  type          NotificationType  // 'EMAIL' or 'SMS'
  recipient     String            // email address or phone number
  subject       String?           // email subject (null for SMS)
  message       String            // message content
  status        NotificationStatus @default(PENDING) // 'PENDING', 'SENT', 'FAILED'
  provider      String?           // 'resend', 'sms_provider', etc.
  providerId    String?           // external provider message ID
  cost          Float?            // cost in Naira (for SMS)
  errorMessage  String?           // error details if failed
  metadata      Json?             // additional data (user info, etc.)
  sentAt        DateTime?         // when notification was sent
  createdAt     DateTime          @default(now())
  
  @@map("notification_logs")
}

enum NotificationType {
  EMAIL
  SMS
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}
```

## 📈 Dashboard Statistics

### Key Metrics Displayed
1. **Total Emails Sent** - Complete count of email notifications
2. **Total SMS Sent** - Complete count of SMS notifications  
3. **Success Rates** - Percentage of successful deliveries for each type
4. **SMS Costs** - Total and average costs for SMS notifications
5. **Recent Activity** - Last 10 notifications with full details

### Dashboard Components
- **Overview Cards** - Key statistics at a glance
- **Success Rate Indicators** - Visual representation of delivery success
- **Cost Analysis** - Financial tracking for SMS operations
- **Recent Notifications Table** - Detailed activity log

## 🔧 API Endpoints

### GET /api/admin/notifications/stats
Returns comprehensive notification statistics.

**Response:**
```json
{
  "totals": {
    "emails": 150,
    "sms": 75,
    "total": 225
  },
  "sent": {
    "emails": 145,
    "sms": 72,
    "total": 217
  },
  "failed": {
    "emails": 3,
    "sms": 2,
    "total": 5
  },
  "pending": {
    "emails": 2,
    "sms": 1,
    "total": 3
  },
  "successRates": {
    "emails": 96.7,
    "sms": 96.0
  },
  "costs": {
    "totalSMSCost": 487.5,
    "averageSMSCost": 6.77
  },
  "recent": [
    {
      "id": "log_id",
      "type": "SMS",
      "recipient": "+2348030000000",
      "status": "SENT",
      "cost": 6.5,
      "createdAt": "2024-01-01T00:00:00Z",
      "sentAt": "2024-01-01T00:00:05Z"
    }
  ]
}
```

## 📱 SMS Cost Tracking

### Cost Information Captured
- **Individual SMS cost** from provider response
- **Total SMS expenditure** across all time
- **Average cost per SMS** for budgeting
- **Provider pricing** for cost analysis

### SMS Provider Integration
```typescript
// Cost tracking in SMS response
const result = await response.json();
// result.price contains the cost per SMS

await prisma.notificationLog.update({
  where: { id: logEntry.id },
  data: {
    status: 'SENT',
    providerId: result.status,
    cost: result.price || 0,  // Track cost
    sentAt: new Date(),
  },
});
```

## 📧 Email Tracking

### Email Logging Features
- **Subject line tracking** for email categorization
- **Recipient verification** with email addresses
- **Provider integration** with Resend API
- **Error handling** for failed email deliveries

### Email Provider Integration
```typescript
// Email logging with provider details
await prisma.notificationLog.update({
  where: { id: logEntry.id },
  data: {
    status: 'SENT',
    providerId: data?.id,  // Resend message ID
    sentAt: new Date(),
  },
});
```

## 🎨 Dashboard UI Features

### Visual Indicators
- **Color-coded status badges** (Green: SENT, Red: FAILED, Yellow: PENDING)
- **Type indicators** (Blue: EMAIL, Green: SMS)
- **Cost formatting** with Nigerian Naira symbol (₦)
- **Success rate percentages** with decimal precision

### Responsive Design
- **Mobile-friendly** table layouts
- **Dark mode support** for all components
- **Grid layouts** that adapt to screen size
- **Accessible** color contrasts and typography

## 🔍 Monitoring & Analytics

### Real-time Updates
- **Live dashboard** updates via WebSocket
- **Automatic refresh** when new notifications are sent
- **Real-time statistics** without page reload

### Historical Data
- **Complete audit trail** of all notifications
- **Time-based filtering** for specific periods
- **Trend analysis** for notification patterns
- **Performance metrics** over time

## 🚨 Error Handling

### Failed Notification Tracking
- **Error message capture** for debugging
- **Retry mechanisms** for temporary failures
- **Provider-specific error handling**
- **Detailed logging** for troubleshooting

### Error Categories
- **Network errors** - Connection issues
- **Provider errors** - API failures
- **Validation errors** - Invalid recipients
- **Rate limiting** - API quota exceeded

## 📊 Usage Examples

### Viewing Notification Statistics
```typescript
// Fetch notification stats
const response = await fetch('/api/admin/notifications/stats');
const stats = await response.json();

console.log(`Total emails: ${stats.totals.emails}`);
console.log(`Total SMS: ${stats.totals.sms}`);
console.log(`SMS cost: ₦${stats.costs.totalSMSCost}`);
```

### Monitoring Recent Activity
```typescript
// Recent notifications
stats.recent.forEach(notification => {
  console.log(`${notification.type} to ${notification.recipient}: ${notification.status}`);
  if (notification.cost) {
    console.log(`Cost: ₦${notification.cost}`);
  }
});
```

## 🔧 Configuration

### Environment Variables
```env
# Email provider
RESEND_API_KEY=your_resend_api_key

# SMS provider (configured in code)
SMS_USERNAME=mercyzrt@gmail.com
SMS_PASSWORD=peculiar1
SMS_SENDER=Nogalss
```

### Database Migration
```bash
# Run migration to create notification logs table
npx prisma migrate dev --name add_notification_logs

# Generate Prisma client
npx prisma generate
```

## 📈 Performance Considerations

### Optimization Features
- **Efficient queries** with proper indexing
- **Pagination** for large notification logs
- **Caching** for frequently accessed statistics
- **Background processing** for heavy operations

### Monitoring Alerts
- **High failure rates** - Alert when success rate drops
- **Cost thresholds** - Alert when SMS costs exceed limits
- **Volume spikes** - Alert for unusual notification volumes
- **Provider issues** - Alert for provider-specific problems

## 🚀 Future Enhancements

### Planned Features
- **Notification templates** with usage tracking
- **Advanced analytics** with charts and graphs
- **Automated reporting** with scheduled reports
- **Integration monitoring** with provider health checks
- **Cost optimization** recommendations
- **Performance benchmarking** against industry standards

### API Improvements
- **Webhook support** for real-time updates
- **Bulk notification** tracking
- **Advanced filtering** and search capabilities
- **Export functionality** for data analysis

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL configuration
   - Verify network connectivity

2. **Migration Issues**
   - Run `npx prisma migrate reset` if needed
   - Check for schema conflicts
   - Verify Prisma client generation

3. **Provider Integration**
   - Verify API credentials
   - Check rate limits and quotas
   - Monitor provider status

### Debug Mode
```typescript
// Enable detailed logging
console.log('Notification log created:', logEntry);
console.log('Provider response:', result);
console.log('Cost tracking:', cost);
```

## 📋 Maintenance

### Regular Tasks
- **Monitor success rates** for both email and SMS
- **Review cost trends** for budget planning
- **Clean up old logs** to maintain performance
- **Update provider credentials** as needed
- **Analyze failure patterns** for improvements

### Health Checks
- **Database connectivity** verification
- **Provider API status** monitoring
- **Cost threshold** alerts
- **Performance metrics** tracking

This notification tracking system provides comprehensive monitoring and analytics for all email and SMS communications in the Nogalss Cooperative application, ensuring transparency, cost control, and performance optimization.
