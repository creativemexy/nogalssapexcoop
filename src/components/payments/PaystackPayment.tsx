'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PaystackPaymentProps {
  amount: number;
  email: string;
  type: 'CONTRIBUTION' | 'LOAN' | 'WITHDRAWAL' | 'FEE' | 'INVESTMENT';
  description?: string;
  cooperativeId?: string;
  businessId?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export default function PaystackPayment({
  amount,
  email,
  type,
  description,
  cooperativeId,
  businessId,
  onSuccess,
  onError
}: PaystackPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          email,
          type,
          description,
          cooperativeId,
          businessId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Redirect to Paystack payment page
      window.location.href = data.data.authorization_url;

    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
      
      <div className="space-y-4 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">₦{amount.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Type:</span>
          <span className="font-semibold">{type}</span>
        </div>
        
        {description && (
          <div className="flex justify-between">
            <span className="text-gray-600">Description:</span>
            <span className="font-semibold">{description}</span>
          </div>
        )}
      </div>

      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Pay with Paystack'}
      </Button>
    </div>
  );
} 