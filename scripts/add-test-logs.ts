import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTestLogs() {
  try {
    // Add some test logs
    const testLogs = [
      {
        userId: 'test-user-1',
        userEmail: 'test1@example.com',
        action: 'User registered as member',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        userId: 'test-user-2',
        userEmail: 'test2@example.com',
        action: 'Cooperative registered: Test Cooperative',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        userId: 'test-user-3',
        userEmail: 'test3@example.com',
        action: 'Password changed',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        userId: 'test-user-4',
        userEmail: 'test4@example.com',
        action: 'Payment processed: NGN 50,000',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        userId: 'test-user-5',
        userEmail: 'test5@example.com',
        action: 'Loan application submitted',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      }
    ];

    for (const log of testLogs) {
      await prisma.log.create({
        data: log
      });
    }

    console.log('Test logs added successfully!');
  } catch (error) {
    console.error('Error adding test logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestLogs(); 