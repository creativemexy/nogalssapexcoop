import React from 'react';

interface PasswordHintsProps {
  password: string;
  minLength?: number;
  showHints?: boolean;
  className?: string;
}

export default function PasswordHints({ 
  password, 
  minLength = 8, 
  showHints = true,
  className = ""
}: PasswordHintsProps) {
  if (!showHints) return null;

  const hints = [
    {
      text: `At least ${minLength} characters`,
      isValid: password.length >= minLength,
      icon: password.length >= minLength ? '✓' : '○'
    },
    {
      text: 'Contains uppercase letter (A-Z)',
      isValid: /[A-Z]/.test(password),
      icon: /[A-Z]/.test(password) ? '✓' : '○'
    },
    {
      text: 'Contains lowercase letter (a-z)',
      isValid: /[a-z]/.test(password),
      icon: /[a-z]/.test(password) ? '✓' : '○'
    },
    {
      text: 'Contains number (0-9)',
      isValid: /\d/.test(password),
      icon: /\d/.test(password) ? '✓' : '○'
    },
    {
      text: 'Contains special character (!@#$%^&*)',
      isValid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      icon: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : '○'
    }
  ];

  const validHints = hints.filter(hint => hint.isValid).length;
  const strength = validHints < 3 ? 'weak' : validHints < 5 ? 'medium' : 'strong';
  
  const strengthColors = {
    weak: 'text-red-600',
    medium: 'text-yellow-600',
    strong: 'text-green-600'
  };

  return (
    <div className={`mt-2 ${className}`}>
      {/* Password Strength Indicator */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Password Strength:</span>
          <span className={`font-medium ${strengthColors[strength]}`}>
            {strength.charAt(0).toUpperCase() + strength.slice(1)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              strength === 'weak' ? 'bg-red-500 w-1/3' :
              strength === 'medium' ? 'bg-yellow-500 w-2/3' :
              'bg-green-500 w-full'
            }`}
          />
        </div>
      </div>

      {/* Password Requirements */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
        {hints.map((hint, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <span className={`${hint.isValid ? 'text-green-600' : 'text-gray-400'}`}>
              {hint.icon}
            </span>
            <span className={hint.isValid ? 'text-green-600' : 'text-gray-500'}>
              {hint.text}
            </span>
          </div>
        ))}
      </div>

      {/* Security Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-blue-800 mb-1">💡 Security Tips:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Avoid using personal information (name, birthdate)</li>
          <li>• Don't reuse passwords from other accounts</li>
          <li>• Consider using a password manager</li>
          <li>• Change your password regularly</li>
        </ul>
      </div>
    </div>
  );
}

