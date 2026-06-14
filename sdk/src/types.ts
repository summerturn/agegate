export type VerificationMethod = 'email' | 'credit_card' | 'id_upload' | 'phone' | 'social';

export type VerificationStatus = 'pending' | 'verified' | 'denied' | 'expired' | 'requires_parental_consent';

export interface CopplyConfig {
  supabaseUrl: string;
  apiKey: string;
  minimumAge?: number;
  requireParentalConsent?: boolean;
  allowedMethods?: VerificationMethod[];
  sessionDuration?: number;
  strictMode?: boolean;
  redirectUrl?: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  };
  userId?: string;
  onVerified?: (result: VerificationResult) => void;
  onDenied?: (result: VerificationResult) => void;
  onError?: (error: Error) => void;
}

export interface VerificationResult {
  success: boolean;
  age?: number;
  status: VerificationStatus;
  sessionId?: string;
  method: VerificationMethod;
  timestamp: string;
  message?: string;
  requiresParentalConsent?: boolean;
  consentId?: string;
}

export interface CopplyEvent {
  type: 'verified' | 'denied' | 'error' | 'parentalConsentRequested' | 'dataDeleted' | 'ready';
  data: any;
  timestamp: string;
}

export interface ParentalConsentRequest {
  childEmail: string;
  parentEmail: string;
  childAge: number;
  verificationId: string;
  method: VerificationMethod;
}

export interface ParentalConsentResult {
  consentId: string;
  consentToken: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  expiresAt: string;
}

export interface IDDocument {
  type: 'passport' | 'drivers_license' | 'national_id' | 'other';
  country: string;
  documentNumber?: string;
  expiryDate?: string;
  imageUrl: string;
}

export interface CreditCardInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export interface EmailVerificationData {
  email: string;
  dateOfBirth: string;
  firstName?: string;
  lastName?: string;
}

export interface AnalyticsData {
  totalVerifications: number;
  successRate: number;
  averageAge: number;
  dailyStats: Array<{
    date: string;
    verifications: number;
    successes: number;
    failures: number;
  }>;
  methodBreakdown: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  ageDistribution: Array<{
    ageRange: string;
    count: number;
  }>;
}

export interface SDKOptions {
  debug?: boolean;
  timeout?: number;
  retries?: number;
  environment?: 'production' | 'staging' | 'development';
}
