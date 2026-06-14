export class CopplyError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'CopplyError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CopplyError);
    }
  }
}

export class ValidationError extends CopplyError {
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends CopplyError {
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'NetworkError';
  }
}

export class VerificationError extends CopplyError {
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'VerificationError';
  }
}

export class SessionError extends CopplyError {
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'SessionError';
  }
}

export class ConsentError extends CopplyError {
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'ConsentError';
  }
}

export class ConfigurationError extends CopplyError {
  constructor(message: string, cause?: any) {
    super(message, cause);
    this.name = 'ConfigurationError';
  }
}

export function isCopplyError(error: any): error is CopplyError {
  return error instanceof CopplyError ||
    (error && typeof error === 'object' && error.name && error.name.startsWith('Copply'));
}

export function handleError(error: any): { message: string; code: string; status: number } {
  if (error instanceof ValidationError) {
    return { message: error.message, code: 'VALIDATION_ERROR', status: 400 };
  }
  if (error instanceof NetworkError) {
    return { message: error.message, code: 'NETWORK_ERROR', status: 503 };
  }
  if (error instanceof VerificationError) {
    return { message: error.message, code: 'VERIFICATION_ERROR', status: 422 };
  }
  if (error instanceof SessionError) {
    return { message: error.message, code: 'SESSION_ERROR', status: 401 };
  }
  if (error instanceof ConsentError) {
    return { message: error.message, code: 'CONSENT_ERROR', status: 403 };
  }
  if (error instanceof ConfigurationError) {
    return { message: error.message, code: 'CONFIGURATION_ERROR', status: 500 };
  }
  if (error instanceof CopplyError) {
    return { message: error.message, code: 'AGEGATE_ERROR', status: 500 };
  }
  return { message: 'An unexpected error occurred', code: 'UNKNOWN_ERROR', status: 500 };
}
