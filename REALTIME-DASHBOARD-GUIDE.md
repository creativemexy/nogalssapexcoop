# Real-Time Dashboard Updates Guide

## Overview

This application now supports **real-time dashboard updates** using Socket.IO. When data changes on the backend, all connected dashboard clients are automatically notified and refresh their data.

## How It Works

### 1. Client-Side (Dashboard Pages)

All dashboard pages now use the `useSocket` hook to connect to the Socket.IO server:

```tsx
import { useSocket } from '@/hooks/useSocket';

export default function DashboardPage() {
  const socket = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      // Refresh dashboard data
      fetchDashboardStats();
    };
    socket.on('dashboard:update', handleUpdate);
    return () => {
      socket.off('dashboard:update', handleUpdate);
    };
  }, [socket]);
  
  // ... rest of component
}
```

### 2. Server-Side (Backend Events)

To trigger real-time updates from your backend logic, use the `emitDashboardUpdate()` function:

```ts
import { emitDashboardUpdate } from '@/lib/notifications';

// After any data change that affects dashboards:
emitDashboardUpdate();
```

## Where to Add Real-Time Updates

### API Routes Already Updated

- **`/api/admin/transactions`** - Emits updates after creating, updating, or deleting transactions
- **`/api/admin/users`** - Emits updates after creating, updating, or deleting users  
- **`/api/admin/emergency-alert`** - Emits updates after creating or deactivating alerts

### Other Places to Add Updates

Add `emitDashboardUpdate()` calls in these API routes after successful data changes:

- **`/api/admin/create-apex`** - After creating new Apex users
- **`/api/admin/create-finance`** - After creating new Finance users
- **`/api/admin/create-apex-funds`** - After creating new Apex Funds users
- **`/api/admin/create-nogalss-funds`** - After creating new Nogalss Funds users
- **`/api/admin/cooperatives`** - After creating, updating, or deleting cooperatives
- **`/api/admin/partners`** - After managing partners
- **`/api/payments/initialize`** - After processing payments
- **`/api/payments/verify`** - After payment verification
- **`/api/leader/dashboard-stats`** - After leader data changes
- **`/api/finance/dashboard-stats`** - After finance data changes
- **`/api/apex-funds/dashboard-stats`** - After Apex Funds data changes
- **`/api/nogalss-funds/dashboard-stats`** - After Nogalss Funds data changes

## Example Implementation

```ts
// In any API route
import { emitDashboardUpdate } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    // Your data creation/update logic here
    const result = await prisma.someModel.create({...});
    
    // Emit real-time update to all dashboards
    emitDashboardUpdate();
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
```

## Dashboard Pages with Real-Time Support

All these dashboard pages now support real-time updates:

- **Super Admin Dashboard** (`/dashboard/super-admin`)
- **Finance Dashboard** (`/dashboard/finance`)
- **Apex Funds Dashboard** (`/dashboard/apex-funds`)
- **Nogalss Funds Dashboard** (`/dashboard/nogalss-funds`)
- **Leader Dashboard** (`/dashboard/leader`)
- **Apex Dashboard** (`/dashboard/apex`)
- **Member Dashboard** (`/dashboard/member`)

## Technical Details

### Socket.IO Server
- Endpoint: `/api/socket`
- Uses WebSocket transport
- CORS enabled for all origins

### Client Hook
- File: `src/hooks/useSocket.ts`
- Automatically connects to server
- Handles reconnection
- Returns Socket.IO client instance

### Event System
- **Event Name**: `dashboard:update`
- **Triggered by**: `emitDashboardUpdate()` function
- **Received by**: All connected dashboard clients
- **Action**: Refreshes dashboard data

## Testing Real-Time Updates

1. Open multiple dashboard pages in different browser tabs
2. Make a change that triggers `emitDashboardUpdate()` (e.g., create a user, transaction, or alert)
3. Watch all dashboard pages automatically refresh their data

## Troubleshooting

### Connection Issues
- Check browser console for Socket.IO connection errors
- Ensure the Socket.IO server is running at `/api/socket`
- Verify CORS settings if running on different domains

### Updates Not Working
- Confirm `emitDashboardUpdate()` is called after data changes
- Check that the Socket.IO server is properly initialized
- Verify event listeners are properly set up in dashboard components

## Performance Considerations

- Real-time updates are lightweight - only a signal is sent, not the actual data
- Each dashboard page fetches its own data when updated
- Consider debouncing rapid updates if needed
- Monitor WebSocket connection count in production

## Future Enhancements

- **Selective Updates**: Send specific data with events instead of just signals
- **User-Specific Updates**: Only update dashboards for relevant users
- **Event Types**: Different event types for different data changes
- **Offline Support**: Queue updates when connection is lost
