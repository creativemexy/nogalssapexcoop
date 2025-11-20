# Session Activity Monitoring

## Overview

Session activity monitoring tracks user actions during their active sessions, providing security insights and audit trails. The system logs activities with risk levels and provides administrators with detailed activity reports.

## Features

- **Automatic Activity Tracking**: Tracks page views, API calls, and user actions
- **Risk Level Classification**: Automatically categorizes activities as LOW, MEDIUM, HIGH, or CRITICAL
- **Last Activity Timestamp**: Updates session's last activity on every request
- **Activity Logging**: Stores detailed activity logs with metadata
- **Admin Dashboard**: View activity statistics and session-specific activities
- **Real-time Monitoring**: Activity stats refresh every 30 seconds

## Database Schema

### UserSession Model

Added fields:
- `lastActivityAt`: DateTime - Last time the session was active
- `updatedAt`: DateTime - Last update timestamp
- `activities`: Relation to SessionActivity[]

### SessionActivity Model

New model for tracking activities:
- `id`: String (Primary Key)
- `sessionId`: String (Foreign Key to UserSession)
- `userId`: String
- `action`: String - Type of activity (LOGIN, LOGOUT, PAGE_VIEW, API_CALL, etc.)
- `resource`: String? - Resource accessed (URL path, API endpoint)
- `method`: String? - HTTP method (GET, POST, PUT, DELETE)
- `ipAddress`: String? - IP address of the request
- `userAgent`: String? - User agent string
- `metadata`: Json? - Additional context (request body, response status, duration)
- `riskLevel`: String - Risk classification (LOW, MEDIUM, HIGH, CRITICAL)
- `createdAt`: DateTime - When the activity occurred

## Activity Types

### Standard Actions

- `LOGIN`: User login attempt
- `LOGOUT`: User logout
- `PAGE_VIEW`: Page navigation
- `API_CALL`: API endpoint access
- `PASSWORD_CHANGE`: Password modification
- `PROFILE_UPDATE`: Profile information changes
- `WITHDRAWAL_REQUEST`: Withdrawal request submission
- `PAYMENT_INITIATED`: Payment transaction start
- `SENSITIVE_ACTION`: Admin or sensitive operations
- `SUSPICIOUS_ACTIVITY`: Flagged suspicious behavior

## Risk Level Classification

### CRITICAL
- Password changes
- Withdrawal requests
- Suspicious activities
- Sensitive admin actions

### HIGH
- Payment initiations
- Profile updates
- Access to sensitive resources (`/api/admin`, `/dashboard/super-admin`)

### MEDIUM
- Failed API calls (4xx errors)
- Long-duration requests (>30 seconds)

### LOW
- Normal page views
- Successful API calls
- Standard user interactions

## API Endpoints

### Get Session Activities

**GET** `/api/admin/sessions/activity`

Query Parameters:
- `sessionId`: Filter by session ID
- `userId`: Filter by user ID
- `limit`: Number of results (default: 100)
- `riskLevel`: Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)
- `startDate`: ISO date string
- `endDate`: ISO date string

Response:
```json
{
  "success": true,
  "activities": [
    {
      "id": "...",
      "sessionId": "...",
      "userId": "...",
      "action": "PAGE_VIEW",
      "resource": "/dashboard/member",
      "method": "GET",
      "riskLevel": "LOW",
      "createdAt": "2024-01-01T00:00:00Z",
      "metadata": {}
    }
  ],
  "count": 1
}
```

### Get Activity Statistics

**GET** `/api/admin/sessions/activity/stats`

Query Parameters:
- `userId`: Filter by user ID
- `startDate`: ISO date string
- `endDate`: ISO date string

Response:
```json
{
  "success": true,
  "stats": {
    "total": 1000,
    "byRiskLevel": {
      "CRITICAL": 5,
      "HIGH": 20,
      "MEDIUM": 50,
      "LOW": 925
    },
    "byAction": {
      "PAGE_VIEW": 800,
      "API_CALL": 150,
      "LOGIN": 20,
      "WITHDRAWAL_REQUEST": 5
    },
    "recentCritical": [...]
  }
}
```

### Track Activity (Frontend)

**POST** `/api/auth/track-activity`

Request Body:
```json
{
  "action": "CUSTOM_ACTION",
  "resource": "/custom/path",
  "method": "POST",
  "metadata": {
    "customField": "value"
  },
  "riskLevel": "MEDIUM"
}
```

## Usage

### Automatic Tracking

The system automatically tracks activities through:
1. Session validation updates `lastActivityAt`
2. Middleware can be extended to log activities (see `src/middleware/activity-tracker.ts`)
3. API routes can manually log activities using `logSessionActivity()`

### Manual Tracking

To manually log an activity in your API route:

```typescript
import { logSessionActivity } from '@/lib/session-activity';

await logSessionActivity({
  sessionId: userSessionId,
  userId: userId,
  action: 'WITHDRAWAL_REQUEST',
  resource: '/api/member/withdraw',
  method: 'POST',
  ipAddress: request.ip,
  userAgent: request.headers.get('user-agent'),
  metadata: {
    amount: withdrawalAmount,
    responseStatus: 200,
  },
});
```

## Admin Dashboard

### Viewing Session Activities

1. Navigate to `/dashboard/super-admin/sessions`
2. Click "View Activity" on any active session
3. See detailed activity log for that session

### Activity Statistics

The dashboard displays:
- Total activities count
- Activities by risk level
- Recent critical activities
- Activity breakdown by action type

## Security Considerations

1. **Privacy**: Activity logs contain sensitive information. Access is restricted to SUPER_ADMIN only.
2. **Performance**: Activity logging is non-blocking and won't affect request performance.
3. **Storage**: Consider implementing log rotation for old activities.
4. **Data Retention**: Configure retention policies based on compliance requirements.

## Future Enhancements

- [ ] Real-time activity alerts for critical actions
- [ ] Activity pattern detection (anomaly detection)
- [ ] Export activity logs for compliance
- [ ] Activity filtering and search
- [ ] Integration with SIEM systems
- [ ] Automated response to suspicious activities

