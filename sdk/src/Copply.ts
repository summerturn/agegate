import { EventEmitter } from 'events';
import { CopplyConfig, VerificationResult, VerificationMethod, CopplyEvent } from './types';
import { CopplyError, ValidationError, NetworkError, VerificationError } from './utils/errors';

export class Copply extends EventEmitter {
  private config: CopplyConfig;
  private supabaseUrl: string;
  private apiKey: string;
  private sessionId: string | null = null;
  private verified: boolean = false;
  private age: number | null = null;

  constructor(config: CopplyConfig) {
    super();
    this.config = {
      minimumAge: 18,
      requireParentalConsent: true,
      allowedMethods: ['email', 'credit_card', 'id_upload'],
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      strictMode: false,
      ...config,
    };
    this.supabaseUrl = config.supabaseUrl;
    this.apiKey = config.apiKey;
  }

  async initialize(): Promise<void> {
    try {
      // Check for existing session
      const storedSession = this.getStoredSession();
      if (storedSession) {
        const valid = await this.validateSession(storedSession);
        if (valid) {
          this.sessionId = storedSession;
          this.verified = true;
          this.emit('ready', { verified: true });
          return;
        }
      }
      this.emit('ready', { verified: false });
    } catch (error) {
      this.emit('error', new CopplyError('Failed to initialize Copply', error));
    }
  }

  async verify(method: VerificationMethod, data: Record<string, any>): Promise<VerificationResult> {
    try {
      this.validateMethod(method);
      this.validateData(method, data);

      const response = await fetch(`${this.supabaseUrl}/functions/v1/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          method,
          data,
          config: this.config,
        }),
      });

      if (!response.ok) {
        throw new NetworkError(`Verification failed: ${response.statusText}`);
      }

      const result: VerificationResult = await response.json();

      if (result.success) {
        this.verified = true;
        this.age = result.age || null;
        this.sessionId = result.sessionId || null;
        this.storeSession(result.sessionId);
        this.emit('verified', result);
      } else {
        this.emit('denied', result);
      }

      return result;
    } catch (error) {
      const verificationError = error instanceof CopplyError ? error : new VerificationError('Verification failed', error);
      this.emit('error', verificationError);
      throw verificationError;
    }
  }

  async requestParentalConsent(childEmail: string, parentEmail: string, childAge: number): Promise<{ consentId: string; consentToken: string }> {
    try {
      if (childAge >= 18) {
        throw new ValidationError('Child must be under 18 for parental consent');
      }

      const response = await fetch(`${this.supabaseUrl}/functions/v1/parental-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          childEmail,
          parentEmail,
          childAge,
          verificationId: this.sessionId || crypto.randomUUID(),
          method: 'email',
        }),
      });

      if (!response.ok) {
        throw new NetworkError('Failed to request parental consent');
      }

      const result = await response.json();
      this.emit('parentalConsentRequested', result);
      return result;
    } catch (error) {
      const consentError = error instanceof CopplyError ? error : new CopplyError('Parental consent request failed', error);
      this.emit('error', consentError);
      throw consentError;
    }
  }

  async deleteVerificationData(reason?: string): Promise<void> {
    try {
      if (!this.sessionId) {
        throw new ValidationError('No active verification session');
      }

      const response = await fetch(`${this.supabaseUrl}/functions/v1/delete-verification-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          verificationId: this.sessionId,
          userId: this.config.userId,
          reason,
        }),
      });

      if (!response.ok) {
        throw new NetworkError('Failed to delete verification data');
      }

      this.clearSession();
      this.verified = false;
      this.age = null;
      this.emit('dataDeleted', { sessionId: this.sessionId });
    } catch (error) {
      const deleteError = error instanceof CopplyError ? error : new CopplyError('Failed to delete verification data', error);
      this.emit('error', deleteError);
      throw deleteError;
    }
  }

  isVerified(): boolean {
    return this.verified;
  }

  getAge(): number | null {
    return this.age;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  private validateMethod(method: VerificationMethod): void {
    if (!this.config.allowedMethods?.includes(method)) {
      throw new ValidationError(`Method '${method}' is not allowed. Allowed methods: ${this.config.allowedMethods?.join(', ')}`);
    }
  }

  private validateData(method: VerificationMethod, data: Record<string, any>): void {
    switch (method) {
      case 'email':
        if (!data.email || !data.dateOfBirth) {
          throw new ValidationError('Email and date of birth are required for email verification');
        }
        break;
      case 'credit_card':
        if (!data.cardNumber || !data.expiryDate || !data.cvv) {
          throw new ValidationError('Card number, expiry date, and CVV are required for credit card verification');
        }
        break;
      case 'id_upload':
        if (!data.documentImage) {
          throw new ValidationError('Document image is required for ID upload verification');
        }
        break;
      default:
        throw new ValidationError(`Unknown verification method: ${method}`);
    }
  }

  private async validateSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/validate-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) return false;
      const result = await response.json();
      return result.valid;
    } catch {
      return false;
    }
  }

  private getStoredSession(): string | null {
    try {
      return localStorage.getItem('copply_session');
    } catch {
      return null;
    }
  }

  private storeSession(sessionId: string | null | undefined): void {
    if (sessionId) {
      try {
        localStorage.setItem('copply_session', sessionId);
      } catch {
        // Ignore storage errors
      }
    }
  }

  private clearSession(): void {
    try {
      localStorage.removeItem('copply_session');
    } catch {
      // Ignore storage errors
    }
  }

  destroy(): void {
    this.clearSession();
    this.removeAllListeners();
    this.verified = false;
    this.age = null;
    this.sessionId = null;
  }
}
