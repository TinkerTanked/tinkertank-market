export interface AppError {
  message: string
  code: string
  statusCode?: number
  details?: any
}

export class APIError extends Error implements AppError {
  code: string
  statusCode: number
  details?: any

  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message)
    this.name = 'APIError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export class ValidationError extends Error implements AppError {
  code: string
  statusCode: number
  details?: any

  constructor(message: string, details?: any) {
    super(message)
    this.name = 'ValidationError'
    this.code = 'VALIDATION_ERROR'
    this.statusCode = 400
    this.details = details
  }
}

export class PaymentError extends Error implements AppError {
  code: string
  statusCode: number
  details?: any

  constructor(message: string, code: string = 'PAYMENT_ERROR', details?: any) {
    super(message)
    this.name = 'PaymentError'
    this.code = code
    this.statusCode = 402
    this.details = details
  }
}

export function handleAPIError(error: unknown): AppError {
  console.error('API Error:', error)

  if (error instanceof APIError || error instanceof ValidationError || error instanceof PaymentError) {
    return error
  }

  if (error instanceof Error) {
    return new APIError(error.message, 'UNKNOWN_ERROR', 500)
  }

  return new APIError('An unexpected error occurred', 'UNKNOWN_ERROR', 500)
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError || error instanceof ValidationError || error instanceof PaymentError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

export function logError(error: Error, context?: any) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error Log:', errorLog)
  } else {
    // Send to logging service in production
    // This could be integrated with services like Sentry, LogRocket, etc.
    console.error('Production Error:', errorLog)
  }
}
