export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  cooperativeId?: string | null;
  businessId?: string | null;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  error?: string;
}

export interface LeaderStats {
  totalMembers: number;
  totalContributions: number;
  pendingLoans: number;
}

export interface MemberStats {
  totalAmount: number;
}

export interface Contribution {
  id: string;
  amount: number;
  createdAt: string;
  cooperative: {
    name: string;
    registrationNumber: string;
  };
  description?: string;
}

export interface LoanEligibility {
  isEligible: boolean;
  maxLoanAmount: number;
  reason?: string;
}

export interface VirtualAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

