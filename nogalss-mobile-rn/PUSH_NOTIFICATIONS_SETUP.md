# Push Notifications Setup Guide

## ✅ Implementation Complete

Push notifications have been successfully implemented for the mobile app!

## Features Implemented

### 1. **Notification Service** (`src/services/notifications.ts`)
- Request notification permissions
- Register for Expo push tokens
- Send tokens to backend
- Handle notification listeners
- Schedule local notifications
- Badge management

### 2. **Backend Integration**
- Device model in Prisma schema
- Push token registration API (`/api/mobile/push-token`)
- Push notification service (`src/lib/push-notifications.ts`)
- Integration with loan approvals
- Integration with contribution confirmations
- Integration with withdrawal approvals/rejections

### 3. **Notification Types**
- ✅ Loan Approval
- ✅ Loan Rejection
- ✅ Contribution Confirmation
- ✅ Payment Alerts
- ✅ Withdrawal Approval
- ✅ Withdrawal Rejection

## Setup Steps

### 1. Run Database Migration

```bash
cd /home/mexy/Desktop/newNogalss
npx prisma migrate dev --name add_device_model
```

Or apply the migration manually:
```bash
npx prisma db push
```

### 2. Install Backend Dependencies

```bash
npm install expo-server-sdk
```

### 3. Configure Expo Project ID

The project ID is already set in `app.json`:
```json
"extra": {
  "eas": {
    "projectId": "nogalss-mobile"
  }
}
```

### 4. Test Notifications

1. **Login to the mobile app** - Push token will be automatically registered
2. **Make a contribution** - You'll receive a confirmation notification
3. **Apply for a loan** - You'll receive approval/rejection notifications
4. **Request withdrawal** - You'll receive approval/rejection notifications

## How It Works

### Registration Flow
1. User logs in → App requests notification permissions
2. If granted → App gets Expo push token
3. Token is sent to backend → Stored in Device model
4. Backend can now send notifications to this device

### Notification Flow
1. Event occurs (loan approved, contribution confirmed, etc.)
2. Backend calls notification function
3. Function looks up user's active devices
4. Sends push notification via Expo Push Notification Service
5. Device receives notification
6. App handles notification (foreground/background/killed)

## Notification Handling

### Foreground Notifications
- Shown automatically with custom handler
- User can tap to navigate to relevant screen

### Background Notifications
- Shown in system notification tray
- User can tap to open app

### Killed State Notifications
- Shown in system notification tray
- App opens when notification is tapped
- Navigation handled based on notification data

## Testing

### Test Local Notification
```typescript
import { NotificationService } from './src/services/notifications';

// Schedule a test notification
await NotificationService.scheduleLocalNotification(
  'Test Notification',
  'This is a test notification',
  { type: 'TEST' },
  5 // Show in 5 seconds
);
```

### Test Push Notification
Use Expo's push notification tool:
https://expo.dev/notifications

Or use the backend API to send a test notification.

## Troubleshooting

### Notifications Not Working?

1. **Check Permissions**
   - Ensure notification permissions are granted
   - Check in device settings

2. **Check Token Registration**
   - Verify token is sent to backend
   - Check Device table in database

3. **Check Backend Logs**
   - Look for notification sending errors
   - Verify Expo SDK is properly configured

4. **Check Expo Project ID**
   - Must match in app.json and Expo account
   - Required for push notifications to work

## Next Steps

1. **Run the migration** to create Device table
2. **Test with a real device** (push notifications don't work in Expo Go web)
3. **Add notification settings** to allow users to enable/disable
4. **Add notification history** screen
5. **Add notification badges** to show unread count

## Notes

- Push notifications require a physical device or Expo development build
- Expo Go supports push notifications but may have limitations
- For production, you'll need to build the app with EAS Build
- Notifications work in foreground, background, and killed states

