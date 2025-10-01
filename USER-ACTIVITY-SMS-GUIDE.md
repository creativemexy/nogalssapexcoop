# User Activity Monitoring & SMS Integration Guide

This guide covers the implementation of real-time user activity monitoring and SMS integration using the provided SMS API.

## Features Implemented

### 1. Real-time User Activity Monitoring
- **Backend Event Emission**: User activity events are emitted via Socket.IO for login, logout, and key actions
- **Audit Logging**: All user activities are logged to the database for persistent tracking
- **Real-time Dashboard**: Super admin dashboard shows live user activity and active sessions
- **Event Types**: Login, logout, user creation, user updates, user deletion, and other key actions

### 2. SMS Integration
- **SMS Provider API**: Integrated with `https://customer.smsprovider.com.ng/api/`
- **Credentials**: 
  - Username: `mercyzrt@gmail.com`
  - Password: `peculiar1`
  - Sender: `Nogalss`
- **Phone Number Formatting**: Automatic formatting for Nigerian numbers (234 prefix)
- **Error Handling**: Comprehensive error handling for SMS API responses

## Implementation Details

### User Activity Events

#### Event Emission
```typescript
// Emit user activity event
emitUserActivity(
  { id: user.id, email: user.email, role: user.role },
  'USER_LOGIN',
  { timestamp: new Date().toISOString() }
);
```

#### Event Types
- `USER_LOGIN`: User successfully logs in
- `USER_LOGOUT`: User logs out
- `USER_CREATED`: New user created by admin
- `USER_UPDATED`: User profile updated by admin
- `USER_DELETED`: User deleted by admin
- `USER_ACTION`: Other key user actions

### SMS Integration

#### SMS Service Configuration
```typescript
// SMS Provider API endpoint
const smsEndpoint = 'https://customer.smsprovider.com.ng/api/';

// Parameters
const params = {
  username: 'mercyzrt@gmail.com',
  password: 'peculiar1',
  message: 'Your message here',
  sender: 'Nogalss',
  mobiles: '2348030000000' // Nigerian phone number
};
```

#### Phone Number Formatting
```typescript
// Format phone number for Nigerian numbers
let formattedNumber = to.replace(/^\+/, '');
if (!formattedNumber.startsWith('234')) {
  formattedNumber = '234' + formattedNumber.replace(/^0/, '');
}
```

## API Endpoints

### User Activity Monitoring

#### GET /api/admin/sessions
Returns active user sessions with user information.

**Response:**
```json
{
  "sessions": [
    {
      "id": "session_id",
      "userId": "user_id",
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "MEMBER"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-01T00:00:00Z",
      "expiresAt": "2024-01-01T00:30:00Z"
    }
  ]
}
```

#### POST /api/auth/logout
Handles user logout with activity emission.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### SMS Integration

#### SMS Service Methods
```typescript
// Send SMS notification
await NotificationService.sendSMS({
  to: '+2348030000000',
  message: 'Your payment has been confirmed'
});

// Send payment confirmation SMS
await NotificationService.sendPaymentConfirmationSMS(
  '+2348030000000',
  50000,
  'PAY123456'
);

// Send registration confirmation SMS
await NotificationService.sendRegistrationConfirmationSMS(
  '+2348030000000',
  'MEMBER'
);
```

## Real-time Dashboard

### User Activity Dashboard
- **Location**: `/dashboard/super-admin/activity`
- **Features**:
  - Live active users list
  - Recent user actions feed
  - Real-time updates via WebSocket
  - Dark mode support

### Database Management Dashboard
- **Location**: `/dashboard/super-admin/database`
- **Features**:
  - List all database tables
  - View table data with pagination
  - Safe query execution
  - Real-time updates

## Socket.IO Events

### Client-side Events
```typescript
// Listen for user activity events
socket.on('user:activity', (activity) => {
  console.log('User activity:', activity);
});

// Listen for active users updates
socket.on('active:users', (users) => {
  console.log('Active users:', users);
});

// Listen for dashboard updates
socket.on('dashboard:update', () => {
  // Refresh dashboard data
});
```

### Server-side Event Emission
```typescript
// Emit user activity
emitUserActivity(user, 'USER_LOGIN', metadata);

// Emit dashboard update
emitDashboardUpdate();
```

## Security Features

### Audit Logging
All user activities are logged with:
- User ID and email
- Action performed
- Timestamp
- IP address
- User agent
- Additional metadata

### Role-based Access
- Only SUPER_ADMIN can access user activity monitoring
- Session validation for all API endpoints
- Secure user activity emission

## Error Handling

### SMS API Errors
```typescript
try {
  const result = await NotificationService.sendSMS({ to, message });
  return result;
} catch (error) {
  if (error.message.includes('SMS API Error')) {
    // Handle SMS API specific errors
  }
  console.error('SMS notification error:', error);
  throw error;
}
```

### User Activity Monitoring Errors
- Graceful fallback when Socket.IO is unavailable
- Error logging for failed activity emissions
- Retry mechanisms for critical events

## Configuration

### Environment Variables
```env
# SMS Provider (configured in code)
SMS_USERNAME=mercyzrt@gmail.com
SMS_PASSWORD=peculiar1
SMS_SENDER=Nogalss

# Socket.IO (if using custom server)
SOCKET_IO_PORT=3001
```

### Database Schema
```sql
-- User sessions table
CREATE TABLE "UserSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

-- Audit logs table
CREATE TABLE "Log" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userEmail" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
```

## Usage Examples

### Sending SMS Notifications
```typescript
// Payment confirmation
await NotificationService.sendPaymentConfirmationSMS(
  '+2348030000000',
  50000,
  'PAY123456'
);

// Registration confirmation
await NotificationService.sendRegistrationConfirmationSMS(
  '+2348030000000',
  'MEMBER'
);
```

### Monitoring User Activity
```typescript
// In a React component
const socket = useSocket();

useEffect(() => {
  if (socket) {
    socket.on('user:activity', (activity) => {
      setRecentActivities(prev => [activity, ...prev]);
    });
    
    return () => {
      socket.off('user:activity');
    };
  }
}, [socket]);
```

## Troubleshooting

### Common Issues

1. **SMS Not Sending**
   - Check phone number format (must start with 234 for Nigeria)
   - Verify API credentials
   - Check network connectivity

2. **User Activity Not Showing**
   - Ensure Socket.IO server is running
   - Check WebSocket connection
   - Verify user permissions

3. **Database Connection Issues**
   - Check Prisma connection
   - Verify database credentials
   - Check network connectivity

### Debug Mode
```typescript
// Enable debug logging
console.log('User activity event:', { user, action, metadata });
console.log('SMS API response:', result);
```

## Performance Considerations

### Optimization Tips
- Limit user activity history to last 50 events
- Use pagination for large datasets
- Implement rate limiting for SMS sending
- Cache frequently accessed data

### Monitoring
- Monitor Socket.IO connection count
- Track SMS API response times
- Monitor database query performance
- Set up alerts for critical events

## Future Enhancements

### Planned Features
- User activity analytics and reporting
- Advanced SMS templates and scheduling
- Real-time notifications for admins
- Activity-based user insights
- Integration with external monitoring tools

### API Improvements
- Webhook support for external integrations
- Advanced filtering for user activity
- Bulk SMS operations
- SMS delivery status tracking

This implementation provides a comprehensive user activity monitoring system with real-time updates and SMS integration, ensuring administrators can track user behavior and communicate effectively with users.
