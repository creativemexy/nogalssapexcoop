const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestNotifications() {
  try {
    console.log('🧪 Creating test notification logs...\n');

    // Create test notification logs
    const testNotifications = [
      {
        type: 'EMAIL',
        recipient: 'test1@example.com',
        subject: 'Welcome to Nogalss',
        message: 'Welcome to our platform!',
        status: 'SENT',
        provider: 'brevo',
        providerId: 'test-email-1',
        cost: 0,
        sentAt: new Date(),
      },
      {
        type: 'EMAIL',
        recipient: 'test2@example.com',
        subject: 'Password Reset',
        message: 'Your password has been reset.',
        status: 'FAILED',
        provider: 'brevo',
        errorMessage: 'Invalid email address',
        cost: 0,
      },
      {
        type: 'SMS',
        recipient: '+2348012345678',
        message: 'Your OTP is 123456',
        status: 'SENT',
        provider: 'termii',
        providerId: 'test-sms-1',
        cost: 2.5,
        sentAt: new Date(),
      },
      {
        type: 'SMS',
        recipient: '+2348098765432',
        message: 'Welcome to Nogalss!',
        status: 'FAILED',
        provider: 'termii',
        errorMessage: 'Invalid phone number',
        cost: 0,
      },
      {
        type: 'EMAIL',
        recipient: 'test3@example.com',
        subject: 'Account Verification',
        message: 'Please verify your account.',
        status: 'PENDING',
        provider: 'brevo',
        cost: 0,
      },
      {
        type: 'SMS',
        recipient: '+2348055566677',
        message: 'Your account has been created.',
        status: 'PENDING',
        provider: 'termii',
        cost: 0,
      },
    ];

    // Clear existing test data
    await prisma.notificationLog.deleteMany({
      where: {
        recipient: {
          in: ['test1@example.com', 'test2@example.com', '+2348012345678', '+2348098765432', 'test3@example.com', '+2348055566677']
        }
      }
    });

    // Create new test notifications
    for (const notification of testNotifications) {
      await prisma.notificationLog.create({
        data: notification
      });
      console.log(`✅ Created ${notification.type} notification for ${notification.recipient} (${notification.status})`);
    }

    console.log('\n🎉 Test notification logs created successfully!');
    console.log('\n📊 Summary:');
    console.log('- 3 EMAIL notifications (1 sent, 1 failed, 1 pending)');
    console.log('- 3 SMS notifications (1 sent, 1 failed, 1 pending)');
    console.log('\n🔗 You can now view them at: http://localhost:3000/dashboard/super-admin/notification-logs');

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestNotifications();

