// Paystack utility functions

// Function to initialize payment via Paystack
export async function initializePayment(paymentData: {
  email: string;
  amount: number;
  reference: string;
  callback_url: string;
  metadata?: any;
}) {
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Paystack API error: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      status: data.status,
      message: data.message,
      data: data.data
    };
  } catch (error) {
    console.error('Error initializing payment:', error);
    throw error;
  }
}

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
    const dedicatedAccountPayload = {
      customer: customerData.data.customer_code,
      preferred_bank: 'wema-bank' // Default bank
    };

    // Only add split_code if it exists
    if (process.env.PAYSTACK_SPLIT_CODE) {
      dedicatedAccountPayload.split_code = process.env.PAYSTACK_SPLIT_CODE;
    }

    console.log('Creating dedicated account with payload:', JSON.stringify(dedicatedAccountPayload, null, 2));

    const dedicatedAccountResponse = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dedicatedAccountPayload)
    });

    if (!dedicatedAccountResponse.ok) {
      const errorData = await dedicatedAccountResponse.json();
      console.error('Paystack dedicated account error:', errorData);
      throw new Error(`Failed to create dedicated account: ${errorData.message || 'Unknown error'}`);
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
