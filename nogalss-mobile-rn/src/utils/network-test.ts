import { API_BASE_URL } from '../config/api';

/**
 * Test if the API server is reachable
 */
export async function testApiConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/mobile/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test', password: 'test' }),
    });

    // Even if login fails, if we get a response, the server is reachable
    if (response.status === 400 || response.status === 401) {
      return { success: true }; // Server is reachable (got a response)
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Cannot connect to server',
    };
  }
}

/**
 * Get network troubleshooting tips
 */
export function getNetworkTroubleshootingTips(): string {
  return `
Troubleshooting Steps:

1. Check Server Status:
   • Ensure Next.js server is running: npm run dev
   • Server should be accessible at: ${API_BASE_URL}

2. Check Network Connection:
   • Phone and computer must be on the SAME WiFi network
   • Check your computer's IP: ${API_BASE_URL.replace('http://', '').replace(':3000', '')}

3. Check Firewall:
   • Allow port 3000 in firewall
   • Command: sudo ufw allow 3000/tcp

4. Test Connection:
   • Open phone browser and visit: ${API_BASE_URL}
   • If it loads, network is OK

5. Alternative: Use Tunnel Mode
   • Run: npm run start:tunnel
   • This works even on different networks
`;
}

