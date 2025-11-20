'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import Image from 'next/image';
import PasswordInput from '@/components/ui/PasswordInput';

// Declare reCAPTCHA types
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => number;
      reset: (widgetId: number) => void;
    };
  }
}

function SignInForm() {
  const [emailOrPhoneOrNin, setEmailOrPhoneOrNin] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaWidgetId, setCaptchaWidgetId] = useState<number | null>(null);
  const captchaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load reCAPTCHA script
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.warn('reCAPTCHA site key not configured');
      return;
    }

    // Check if script is already loaded
    if (window.grecaptcha) {
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src*="recaptcha"]`);
    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
    script.async = true;
    script.defer = true;
    
    // Set up onload callback
    (window as any).onRecaptchaLoad = () => {
      // Script loaded, ready to render
    };
    
    document.body.appendChild(script);

          return () => {
            // Cleanup
            const scriptToRemove = document.querySelector(`script[src*="recaptcha"]`);
            if (scriptToRemove && scriptToRemove.parentNode) {
              try {
                scriptToRemove.parentNode.removeChild(scriptToRemove);
              } catch (error) {
                // Script might have already been removed, ignore error
                console.debug('Script cleanup: script already removed or not a child');
              }
            }
            delete (window as any).onRecaptchaLoad;
          };
  }, []);

  // Check if CAPTCHA is required when email changes
  useEffect(() => {
    if (emailOrPhoneOrNin && emailOrPhoneOrNin.length > 0) {
      checkCaptchaRequirement();
    } else {
      setCaptchaRequired(false);
      setCaptchaToken(null);
    }
  }, [emailOrPhoneOrNin]);

  const checkCaptchaRequirement = async () => {
    try {
      const isEmail = emailOrPhoneOrNin.includes('@');
      const isPhone = /^(\+?234|0)?[789][01]\d{8}$/.test(emailOrPhoneOrNin);
      const isNIN = /^\d{11}$/.test(emailOrPhoneOrNin);

      const response = await fetch('/api/auth/check-captcha-required', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: isEmail ? emailOrPhoneOrNin : undefined,
          phone: isPhone ? emailOrPhoneOrNin : undefined,
          nin: isNIN ? emailOrPhoneOrNin : undefined,
        }),
      });

      const data = await response.json();
      setCaptchaRequired(data.captchaRequired || false);

      // If CAPTCHA is required, render it
      if (data.captchaRequired) {
        // Wait for reCAPTCHA to be ready
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            if (captchaRef.current) {
              renderCaptcha();
            }
          });
        } else {
          // Wait a bit for script to load
          setTimeout(() => {
            if (window.grecaptcha && captchaRef.current) {
              renderCaptcha();
            }
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Error checking CAPTCHA requirement:', err);
    }
  };

  const renderCaptcha = () => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || !captchaRef.current || !window.grecaptcha) {
      return;
    }

    // Clear existing CAPTCHA
    if (captchaWidgetId !== null) {
      try {
        window.grecaptcha.reset(captchaWidgetId);
      } catch (e) {
        // Ignore reset errors
      }
    }

    // Render new CAPTCHA
    try {
      const widgetId = window.grecaptcha.render(captchaRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setCaptchaToken(token);
        },
        'expired-callback': () => {
          setCaptchaToken(null);
        },
        'error-callback': () => {
          setCaptchaToken(null);
        },
      } as any);
      setCaptchaWidgetId(widgetId);
    } catch (err) {
      console.error('Error rendering CAPTCHA:', err);
    }
  };

  // Clear URL parameters on component mount for security
  useEffect(() => {
    if (searchParams.toString()) {
      // Check for 2FA error in URL
      const error = searchParams.get('error');
      if (error === '2FA_REQUIRED') {
        setError('2FA code is required. Please enter your 6-digit authentication code.');
      } else if (error === '2FA_INVALID') {
        setError('Invalid 2FA code. Please check your authenticator app and try again.');
      } else if (error === '2FA_NOT_SETUP') {
        setError('2FA is not properly set up. Please contact your administrator.');
      } else if (error === '2FA_REQUIRED_GLOBAL') {
        setError('2FA is required for all users. Please set up 2FA in your account settings.');
      }
      
      console.warn('Security Warning: Sensitive data detected in URL parameters. Clearing...');
      // Remove any sensitive parameters from URL
      router.replace('/auth/signin', { scroll: false });
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // If CAPTCHA is required, verify we have a token
    if (captchaRequired && !captchaToken) {
      setError('Please complete the CAPTCHA verification.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email: emailOrPhoneOrNin,
        password,
        totp: totp || undefined,
        captchaToken: captchaToken || undefined,
        redirect: false,
      });

      if (result?.error) {
        // Handle specific errors
        const errorMessage = result.error;
        
        // Check for CAPTCHA requirement
        if (errorMessage === 'CAPTCHA_REQUIRED' || errorMessage.includes('CAPTCHA')) {
          setCaptchaRequired(true);
          setError('CAPTCHA verification is required. Please complete the CAPTCHA below.');
          if (captchaRef.current && window.grecaptcha) {
            renderCaptcha();
          }
        } else if (errorMessage.includes('Invalid CAPTCHA')) {
          setError('Invalid CAPTCHA. Please try again.');
          // Reset CAPTCHA
          if (captchaWidgetId !== null && window.grecaptcha) {
            try {
              window.grecaptcha.reset(captchaWidgetId);
              setCaptchaToken(null);
            } catch (e) {
              // Ignore reset errors
            }
          }
        } else if (errorMessage.includes('PASSWORD_EXPIRED') || errorMessage.includes('password has expired')) {
          setError('Your password has expired. Please reset your password to continue.');
          // Optionally redirect to password reset
          setTimeout(() => {
            router.push('/auth/forgot-password');
          }, 3000);
        } else if (errorMessage.includes('Account locked') || errorMessage.includes('too many failed login attempts')) {
          setError(errorMessage);
        } else {
          // Handle specific 2FA errors
          switch (result.error) {
            case 'CredentialsSignin':
              setError('Invalid email or password');
              // Check if we need to show CAPTCHA after failed attempt
              checkCaptchaRequirement();
              break;
            case 'CallbackRouteError':
              setError('2FA code is required. Please enter your 6-digit authentication code.');
              break;
            default:
              // Check if it's a lockout message
              if (errorMessage.includes('locked') || errorMessage.includes('failed login attempts')) {
                setError(errorMessage);
              } else if (errorMessage.includes('PASSWORD_EXPIRED') || errorMessage.includes('password has expired')) {
                setError('Your password has expired. Please reset your password to continue.');
              } else {
                setError('Invalid email or password');
                // Check if we need to show CAPTCHA after failed attempt
                checkCaptchaRequirement();
              }
          }
        }
      } else if (result?.ok) {
        // Successful login - reset CAPTCHA and register session
        setCaptchaToken(null);
        setCaptchaRequired(false);
        if (captchaWidgetId !== null && window.grecaptcha) {
          try {
            window.grecaptcha.reset(captchaWidgetId);
          } catch (e) {
            // Ignore reset errors
          }
        }
        
        // Register session with IP and user agent
        try {
          await fetch('/api/auth/register-session', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (sessionError) {
          console.error('Failed to register session:', sessionError);
          // Continue with login even if session registration fails
        }
        router.push('/dashboard');
      } else {
        setError('Login failed. Please try again.');
        // Check if we need to show CAPTCHA after failed attempt
        checkCaptchaRequirement();
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center mb-2">
          <Image src="/logo.png" alt="Nogalss Logo" width={96} height={96} priority />
        </div>
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Welcome back to Nogalss National Apex Cooperative Society Ltd
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit} method="POST">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="emailOrPhoneOrNin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email, Phone Number, or NIN
              </label>
              <input
                id="emailOrPhoneOrNin"
                name="emailOrPhoneOrNin"
                type="text"
                autoComplete="username"
                required
                value={emailOrPhoneOrNin}
                onChange={(e) => setEmailOrPhoneOrNin(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter your email, phone number, or NIN"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                You can sign in with your email address, phone number, or 11-digit NIN
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <PasswordInput
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="totp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                2FA Code (if enabled)
              </label>
              <input
                id="totp"
                name="totp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/[^0-9]/g, ''))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter 6-digit code"
              />
            </div>

            {captchaRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Security Verification
                </label>
                <div ref={captchaRef} className="flex justify-center"></div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Please complete the CAPTCHA to continue. This helps protect your account from automated attacks.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                 <Link href="/auth/forgot-password" className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">New to NOGALSS APEX COOPERATIVE SOCIETY?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/auth/register">
                <button className="w-full flex justify-center py-3 px-4 border border-yellow-500 text-yellow-600 dark:text-yellow-400 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium hover:bg-yellow-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                  Create a new account
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center mb-2">
            <Image src="/logo.png" alt="Nogalss Logo" width={96} height={96} priority />
          </div>
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
