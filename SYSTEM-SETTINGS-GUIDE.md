# System Settings Management Guide

## Overview

The Nogalss Cooperative application now includes a comprehensive **System Settings Management** system that allows super admins to configure all aspects of the platform dynamically.

## Features

### 🔧 **Dynamic Settings Management**
- **Real-time updates** via WebSocket integration
- **Persistent storage** in PostgreSQL database
- **Category-based organization** (general, branding, payment, notification, security, privacy)
- **Audit logging** for all settings changes
- **Role-based access control** (SUPER_ADMIN only)

### 📊 **Settings Categories**

#### 1. **General Settings**
- Platform name configuration
- Support email settings
- Basic platform information

#### 2. **Branding Settings**
- Logo upload and management
- Primary and secondary color customization
- Brand identity configuration

#### 3. **Payment Settings**
- Paystack integration keys
- Registration fee configuration
- Transaction fee percentages
- Payment gateway settings

#### 4. **Notification Settings**
- Email provider selection (Resend, SendGrid, Mailgun)
- SMS provider configuration (Twilio, Termii)
- Notification template customization
- Communication preferences

#### 5. **Security Settings**
- Password policy configuration
- Session timeout settings
- Two-Factor Authentication (2FA) management
- Security policy enforcement

#### 6. **User & Role Management**
- Default role assignment for new users
- Role permission matrix
- User invitation settings
- Access control configuration

#### 7. **Data & Privacy**
- Data export functionality
- Privacy policy management
- Account deletion controls
- GDPR compliance tools

## API Endpoints

### Get System Settings
```http
GET /api/admin/settings
Authorization: Required (SUPER_ADMIN)
```

**Query Parameters:**
- `category` - Filter by specific category (optional)

**Response:**
```json
{
  "settings": {
    "general": {
      "platformName": {
        "value": "Nogalss Platform",
        "description": "Platform display name",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "updatedBy": "user_id"
      }
    },
    "branding": {
      "primaryColor": {
        "value": "#0D5E42",
        "description": "Primary brand color",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "updatedBy": "user_id"
      }
    }
  }
}
```

### Update System Settings
```http
POST /api/admin/settings
Authorization: Required (SUPER_ADMIN)
Content-Type: application/json
```

**Request Body:**
```json
{
  "settings": [
    {
      "category": "general",
      "key": "platformName",
      "value": "New Platform Name",
      "description": "Updated platform name"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "updatedCount": 1
}
```

### Delete System Setting
```http
DELETE /api/admin/settings?category=general&key=platformName
Authorization: Required (SUPER_ADMIN)
```

**Response:**
```json
{
  "success": true,
  "message": "Setting deleted successfully"
}
```

## Database Schema

### SystemSettings Model
```prisma
model SystemSettings {
  id                String   @id @default(cuid())
  category          String   // 'general', 'branding', 'payment', 'notification', 'security', 'privacy'
  key               String   // Setting key
  value             String   // Setting value (JSON string for complex data)
  description       String?  // Human-readable description
  isActive          Boolean  @default(true)
  updatedAt         DateTime @updatedAt
  updatedBy         String   // userId of the admin who updated
  
  @@unique([category, key])
  @@map("system_settings")
}
```

## Dashboard Features

### 🎨 **Modern UI Design**
- **Dark mode support** with automatic theme switching
- **Responsive design** for all screen sizes
- **Real-time form validation** with error handling
- **Loading states** and success/error feedback
- **Intuitive navigation** between setting categories

### 🔄 **Real-Time Updates**
- **WebSocket integration** for live updates
- **Automatic refresh** when settings change
- **Collaborative editing** support
- **Change notifications** for other admins

### 📝 **Form Management**
- **Category-based sections** for organized settings
- **Input validation** with real-time feedback
- **Save states** with loading indicators
- **Error handling** with user-friendly messages
- **Success notifications** for completed actions

## Security Features

### 🔐 **Access Control**
- **SUPER_ADMIN role required** for all settings access
- **Session validation** for all API requests
- **Rate limiting** on settings endpoints
- **Input sanitization** for all form data

### 📊 **Audit Logging**
- **All changes logged** with user attribution
- **Timestamp tracking** for audit trails
- **Change history** with detailed information
- **Security event logging** for compliance

### 🛡️ **Data Protection**
- **Encrypted storage** for sensitive settings
- **Input validation** with Zod schemas
- **SQL injection protection** via Prisma ORM
- **XSS prevention** with proper sanitization

## Usage Examples

### Setting Platform Name
```typescript
// Update platform name
const response = await fetch('/api/admin/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    settings: [{
      category: 'general',
      key: 'platformName',
      value: 'Nogalss Cooperative Platform',
      description: 'Main platform display name'
    }]
  })
});
```

### Configuring Payment Settings
```typescript
// Update payment configuration
const paymentSettings = [
  {
    category: 'payment',
    key: 'registrationFee',
    value: '1500',
    description: 'Registration fee in Naira'
  },
  {
    category: 'payment',
    key: 'transactionFee',
    value: '2.5',
    description: 'Transaction fee percentage'
  }
];

const response = await fetch('/api/admin/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ settings: paymentSettings })
});
```

### Managing Security Settings
```typescript
// Update security configuration
const securitySettings = [
  {
    category: 'security',
    key: 'passwordPolicy',
    value: 'Minimum 12 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character',
    description: 'Password complexity requirements'
  },
  {
    category: 'security',
    key: 'sessionTimeout',
    value: '60',
    description: 'Session timeout in minutes'
  }
];
```

## Integration Points

### 🔗 **Existing System Integration**
- **2FA Management** - Integrated with existing 2FA system
- **Security Dashboard** - Settings changes logged in security audit
- **Email System** - Notification settings affect email delivery
- **Payment Gateway** - Payment settings control transaction processing
- **User Management** - Role settings affect user permissions

### 📡 **Real-Time Features**
- **WebSocket Updates** - Settings changes broadcast to all connected admins
- **Live Validation** - Form validation happens in real-time
- **Collaborative Editing** - Multiple admins can view changes simultaneously
- **Change Notifications** - Alerts when critical settings are modified

## Best Practices

### ⚙️ **Settings Management**
1. **Test changes** in development before production
2. **Document changes** with meaningful descriptions
3. **Backup settings** before major modifications
4. **Review audit logs** regularly for security

### 🔒 **Security Considerations**
1. **Limit access** to super admin users only
2. **Monitor changes** through audit logs
3. **Validate inputs** before saving
4. **Encrypt sensitive** configuration data

### 📈 **Performance Optimization**
1. **Cache settings** for faster access
2. **Batch updates** when possible
3. **Minimize API calls** with efficient queries
4. **Use WebSocket** for real-time updates

## Troubleshooting

### Common Issues

#### "Settings not saving"
- Check user permissions (SUPER_ADMIN required)
- Verify API endpoint accessibility
- Review browser console for errors
- Check network connectivity

#### "Real-time updates not working"
- Verify WebSocket connection
- Check Socket.IO server status
- Review browser compatibility
- Test with different browsers

#### "Validation errors"
- Review input format requirements
- Check for required fields
- Verify data types (string, number, boolean)
- Review Zod schema validation

### Debug Mode
Enable detailed logging:
```bash
DEBUG=settings-api
```

## Future Enhancements

### Planned Features
- **Settings templates** for quick configuration
- **Environment-specific** settings (dev, staging, prod)
- **Settings import/export** functionality
- **Advanced validation** rules
- **Settings versioning** and rollback
- **Bulk operations** for multiple settings
- **Settings search** and filtering
- **Custom setting types** for complex data

### Integration Roadmap
- **External configuration** management tools
- **CI/CD integration** for automated deployments
- **Monitoring integration** for settings changes
- **Backup and restore** functionality
- **Multi-tenant** settings support

## Support

For issues with system settings:
1. Check the settings dashboard for current configuration
2. Review audit logs for recent changes
3. Verify user permissions and access
4. Contact system administrators for critical issues
5. Refer to API documentation for integration help
