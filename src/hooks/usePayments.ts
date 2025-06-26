import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Payment {
  id: string;
  amount: number;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED';
  currency: string;
  paymentMethod: string;
  paystackReference?: string;
  createdAt: string;
  transaction: {
    type: string;
    description?: string;
  };
}

export function usePayments() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/history');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payments');
      }

      setPayments(data.payments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const initializePayment = async (paymentData: {
    amount: number;
    email: string;
    type: string;
    description?: string;
    cooperativeId?: string;
    businessId?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [session]);

  return {
    payments,
    loading,
    error,
    fetchPayments,
    initializePayment,
  };
} 