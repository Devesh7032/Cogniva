export type ErrorCategory =
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'STORAGE'
  | 'DATABASE'
  | 'AI_SERVICE'
  | 'RATE_LIMIT'
  | 'SERVER'
  | 'UNKNOWN';

export interface AppError {
  category: ErrorCategory;
  userMessage: string;
  code?: string;
  isRetryable: boolean;
}

const DEFAULT_USER_MESSAGES: Record<ErrorCategory, string> = {
  AUTHENTICATION: 'Your session has expired or authentication failed. Please sign in again.',
  AUTHORIZATION: "You don't have permission to perform this action.",
  VALIDATION: 'Please check the entered information and try again.',
  NOT_FOUND: "We couldn't find the requested information.",
  CONFLICT: 'This record already exists.',
  NETWORK: "We couldn't connect to Cogniva. Please check your internet connection and try again.",
  TIMEOUT: 'The request timed out. Please try again.',
  STORAGE: 'Unable to process file upload right now. Please check the file and try again.',
  DATABASE: 'Unable to load or save information right now. Please try again.',
  AI_SERVICE: 'AI assistance is temporarily unavailable. Please try again.',
  RATE_LIMIT: 'Too many requests in a short period. Please wait a moment and try again.',
  SERVER: 'Something went wrong while processing your request. Please try again.',
  UNKNOWN: 'Something went wrong. Please try again.'
};

/**
 * Sanitizes technical objects to prevent sensitive keys or stack traces from reaching logs if stringified
 */
function sanitizeForLogs(obj: any): any {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    return obj
      .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, '[REDACTED_JWT]')
      .replace(/AIzaSy[a-zA-Z0-9_-]{33}/g, '[REDACTED_GEMINI_KEY]');
  }
  return obj;
}

/**
 * Central Error Normalizer
 * Inspects any incoming error, logs safe developer diagnostic details,
 * and returns a clean, non-technical, human-friendly AppError object.
 */
export function normalizeError(rawError: unknown, fallbackCategory: ErrorCategory = 'UNKNOWN'): AppError {
  let category: ErrorCategory = fallbackCategory;
  let code: string | undefined = undefined;
  let rawMessage = '';
  let isRetryable = true;

  if (rawError && typeof rawError === 'object') {
    const errObj = rawError as any;
    rawMessage = errObj.message || errObj.error_description || errObj.details || errObj.error || String(rawError);
    code = errObj.code || errObj.statusCode || (errObj.status ? String(errObj.status) : undefined);
  } else if (typeof rawError === 'string') {
    rawMessage = rawError;
  } else {
    rawMessage = String(rawError);
  }

  // Developer Logging (Sanitized, Internal Only)
  console.error('[COGNIVA DIAGNOSTIC LOG]:', {
    timestamp: new Date().toISOString(),
    categoryHint: fallbackCategory,
    code,
    rawMessage: sanitizeForLogs(rawMessage)
  });

  const msgLower = rawMessage.toLowerCase();

  // Pattern Matching & Classification
  if (
    msgLower.includes('row-level security') ||
    msgLower.includes('rls') ||
    msgLower.includes('permission denied') ||
    msgLower.includes('403') ||
    msgLower.includes('accessdenied') ||
    msgLower.includes('unauthorized')
  ) {
    category = 'AUTHORIZATION';
    isRetryable = false;
  } else if (
    msgLower.includes('invalid login credentials') ||
    msgLower.includes('jwt') ||
    msgLower.includes('token') ||
    msgLower.includes('session expired') ||
    msgLower.includes('401')
  ) {
    category = 'AUTHENTICATION';
    isRetryable = true;
  } else if (
    msgLower.includes('storage') ||
    msgLower.includes('upload') ||
    msgLower.includes('file size') ||
    msgLower.includes('notice image upload')
  ) {
    category = 'STORAGE';
    isRetryable = true;
  } else if (
    msgLower.includes('failed to fetch') ||
    msgLower.includes('network error') ||
    msgLower.includes('econnrefused') ||
    msgLower.includes('offline')
  ) {
    category = 'NETWORK';
    isRetryable = true;
  } else if (
    msgLower.includes('gemini') ||
    msgLower.includes('ai') ||
    msgLower.includes('api_key') ||
    msgLower.includes('quota') ||
    msgLower.includes('resource_exhausted')
  ) {
    category = 'AI_SERVICE';
    isRetryable = true;
  } else if (
    msgLower.includes('duplicate key') ||
    msgLower.includes('already exists') ||
    msgLower.includes('409') ||
    msgLower.includes('unique constraint')
  ) {
    category = 'CONFLICT';
    isRetryable = false;
  } else if (
    msgLower.includes('not found') ||
    msgLower.includes('404') ||
    msgLower.includes('pgrst116')
  ) {
    category = 'NOT_FOUND';
    isRetryable = false;
  } else if (msgLower.includes('too many requests') || msgLower.includes('429')) {
    category = 'RATE_LIMIT';
    isRetryable = true;
  } else if (
    msgLower.includes('500') ||
    msgLower.includes('502') ||
    msgLower.includes('503') ||
    msgLower.includes('server error')
  ) {
    category = 'SERVER';
    isRetryable = true;
  } else if (
    msgLower.includes('required') ||
    msgLower.includes('invalid format') ||
    msgLower.includes('validation')
  ) {
    category = 'VALIDATION';
    isRetryable = false;
  } else if (
    msgLower.includes('pgrst') ||
    msgLower.includes('schema cache') ||
    msgLower.includes('database') ||
    msgLower.includes('postgres')
  ) {
    category = 'DATABASE';
    isRetryable = true;
  }

  // Generate safe user message
  let userMessage = DEFAULT_USER_MESSAGES[category];

  // Specific contextual overrides for maximum clarity
  if (category === 'STORAGE' && (msgLower.includes('notice image') || msgLower.includes('image upload'))) {
    userMessage = 'Unable to upload the notice image right now. Please check the image and try again.';
  } else if (category === 'STORAGE' && (msgLower.includes('study material') || msgLower.includes('.pdf'))) {
    userMessage = 'Unable to upload the study material right now. Please check the file and try again.';
  } else if (category === 'AI_SERVICE') {
    userMessage = 'AI assistance is temporarily unavailable. Please try again.';
  } else if (category === 'AUTHENTICATION' && msgLower.includes('invalid login')) {
    userMessage = 'Invalid email or password. Please try again.';
  }

  return {
    category,
    userMessage,
    code,
    isRetryable
  };
}

/**
 * Returns a human-friendly string for display in UI toasts, alerts, or error banners.
 */
export function getUserFriendlyError(rawError: unknown, fallbackCategory: ErrorCategory = 'UNKNOWN', customDefault?: string): string {
  if (customDefault && typeof rawError === 'string' && !rawError.includes('Violates') && !rawError.includes('PGRST') && !rawError.includes('403') && !rawError.includes('500') && !rawError.includes('endpoint')) {
    // If it's already a clean business validation message passed explicitly
    return rawError;
  }
  const normalized = normalizeError(rawError, fallbackCategory);
  return customDefault || normalized.userMessage;
}

export function handleApiError(rawError: unknown): AppError {
  return normalizeError(rawError, 'SERVER');
}

export function handleSupabaseError(rawError: unknown): AppError {
  return normalizeError(rawError, 'DATABASE');
}

export function handleStorageError(rawError: unknown): AppError {
  return normalizeError(rawError, 'STORAGE');
}

export function handleAIError(rawError: unknown): AppError {
  return normalizeError(rawError, 'AI_SERVICE');
}
