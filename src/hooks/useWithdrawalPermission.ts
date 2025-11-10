import { useState, useEffect } from 'react';

export function useWithdrawalPermission(role: string) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        // For non-super-admin users, we need a public endpoint or check via their role
        // For now, we'll create a simple endpoint that doesn't require auth
        const response = await fetch(`/api/withdrawal-permission?role=${role}`);
        if (response.ok) {
          const data = await response.json();
          setEnabled(data.enabled === true);
        } else {
          // Default to disabled if check fails
          setEnabled(false);
        }
      } catch (error) {
        console.error('Error checking withdrawal permission:', error);
        // Default to disabled on error
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [role]);

  return { enabled, loading };
}

