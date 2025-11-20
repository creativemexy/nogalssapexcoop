'use client';

import { useState, useEffect } from 'react';

interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
  createdAt: string;
}

export default function EmergencyAlertBanner() {
  const [alert, setAlert] = useState<EmergencyAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchActiveAlert();
  }, []);

  const fetchActiveAlert = async () => {
    try {
      const response = await fetch('/api/admin/emergency-alert', {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Handle 401 Unauthorized - user doesn't have access to admin endpoints
      if (response.status === 401) {
        console.log('User does not have access to emergency alerts');
        setLoading(false);
        return;
      }
      
      // Handle 403 Forbidden - user doesn't have the right role
      if (response.status === 403) {
        console.log('User does not have permission to view emergency alerts');
        setLoading(false);
        return;
      }
      
      // Handle other errors
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      if (data.alerts && data.alerts.length > 0) {
        setAlert(data.alerts[0]); // Show the most recent alert
      }
    } catch (error) {
      console.error('Error fetching emergency alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in localStorage to persist across page reloads
    if (alert) {
      localStorage.setItem(`alert_dismissed_${alert.id}`, 'true');
    }
  };

  // Check if this alert was already dismissed
  useEffect(() => {
    if (alert) {
      const isDismissed = localStorage.getItem(`alert_dismissed_${alert.id}`) === 'true';
      setDismissed(isDismissed);
    }
  }, [alert]);

  if (loading || !alert || dismissed) {
    return null;
  }

  const getSeverityStyles = (severity: string) => {
    if (severity === 'CRITICAL') {
      return {
        bgColor: 'bg-red-100 dark:bg-red-900',
        borderColor: 'border-red-700',
        textColor: 'text-red-800 dark:text-red-200',
        icon: '🚨',
      };
    } else {
      return {
        bgColor: 'bg-yellow-500',
        borderColor: 'border-yellow-600',
        textColor: 'text-white',
        icon: '⚠️',
      };
    }
  };

  const styles = getSeverityStyles(alert.severity);

  return (
    <div className={`${styles.bgColor} ${styles.borderColor} border-b-2 shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{styles.icon}</span>
            <div>
              <h3 className={`${styles.textColor} font-bold text-lg`}>
                {alert.title}
              </h3>
              <p className={`${styles.textColor} text-sm opacity-90`}>
                {alert.message}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`${styles.textColor} text-xs opacity-75`}>
              {new Date(alert.createdAt).toLocaleString()}
            </span>
            <button
              onClick={handleDismiss}
              className={`${styles.textColor} hover:opacity-75 transition-opacity`}
              title="Dismiss alert"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
