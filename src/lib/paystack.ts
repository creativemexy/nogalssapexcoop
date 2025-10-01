// Paystack utility functions

// Function to create virtual account via Paystack
export async function createVirtualAccount({ userId, accountType, accountName, email, phoneNumber }) {
  try {
    // Create customer in Paystack
    const customerResponse = await fetch('https://api.paystack.co/customer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        first_name: accountName.split(' ')[0] || accountName,
        last_name: accountName.split(' ').slice(1).join(' ') || '',
        phone: phoneNumber
      })
    });

    if (!customerResponse.ok) {
      throw new Error('Failed to create customer with Paystack');
    }

    const customerData = await customerResponse.json();

    // Create dedicated account for the customer
    const dedicatedAccountResponse = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: customerData.data.customer_code,
        preferred_bank: 'wema-bank', // Default bank
        split_code: process.env.PAYSTACK_SPLIT_CODE // If you have a split code
      })
    });

    if (!dedicatedAccountResponse.ok) {
      throw new Error('Failed to create dedicated account');
    }

    const dedicatedAccountData = await dedicatedAccountResponse.json();

    return {
      accountName,
      accountNumber: dedicatedAccountData.data.account_number,
      bankName: dedicatedAccountData.data.bank.name,
      customerCode: customerData.data.customer_code
    };
  } catch (error) {
    console.error('Error creating virtual account:', error);
    throw error;
  }
}
