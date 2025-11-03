import { prisma } from '@/lib/prisma';

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ErrorCategory {
  PAYMENT = 'PAYMENT',
  CALENDAR = 'CALENDAR',
  EMAIL = 'EMAIL',
  BOOKING = 'BOOKING',
  SYSTEM = 'SYSTEM'
}

interface ErrorLogEntry {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  orderId?: string;
  paymentIntentId?: string;
  eventId?: string;
  resolved: boolean;
  createdAt: Date;
}

export class ErrorHandler {
  /**
   * Log an error with context
   */
  static async logError(params: {
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    details?: any;
    orderId?: string;
    paymentIntentId?: string;
    eventId?: string;
  }) {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error(`[${params.category}:${params.severity}] ${params.message}`, {
      errorId,
      details: params.details,
      orderId: params.orderId,
      paymentIntentId: params.paymentIntentId,
      eventId: params.eventId
    });

    // In production, save to database error log table
    // await prisma.errorLog.create({ data: { id: errorId, ...params } });

    // Send alerts for critical errors
    if (params.severity === ErrorSeverity.CRITICAL) {
      await this.sendCriticalAlert(errorId, params);
    }

    return errorId;
  }

  /**
   * Handle payment processing errors
   */
  static async handlePaymentError(error: any, paymentIntentId: string, orderId?: string) {
    const errorId = await this.logError({
      category: ErrorCategory.PAYMENT,
      severity: ErrorSeverity.HIGH,
      message: `Payment processing failed: ${error.message}`,
      details: { error: error.toString(), stack: error.stack },
      paymentIntentId,
      orderId
    });

    // Attempt to clean up any partial state
    if (orderId) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' }
        });
      } catch (cleanupError) {
        await this.logError({
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.MEDIUM,
          message: 'Failed to cleanup failed order',
          details: { cleanupError: cleanupError.toString() },
          orderId
        });
      }
    }

    return errorId;
  }

  /**
   * Handle calendar creation errors
   */
  static async handleCalendarError(error: any, orderId: string, productType?: string) {
    const errorId = await this.logError({
      category: ErrorCategory.CALENDAR,
      severity: ErrorSeverity.MEDIUM,
      message: `Calendar event creation failed: ${error.message}`,
      details: { 
        error: error.toString(), 
        stack: error.stack,
        productType 
      },
      orderId
    });

    // Don't fail the entire order for calendar errors
    // But log it for manual follow-up
    return errorId;
  }

  /**
   * Handle email sending errors
   */
  static async handleEmailError(error: any, orderId: string, emailType: string) {
    const errorId = await this.logError({
      category: ErrorCategory.EMAIL,
      severity: ErrorSeverity.LOW,
      message: `Email sending failed: ${error.message}`,
      details: { 
        error: error.toString(),
        emailType 
      },
      orderId
    });

    return errorId;
  }

  /**
   * Retry mechanism for transient failures
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Operation failed on attempt ${attempt}/${maxRetries}:`, error.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Send critical alert notifications
   */
  private static async sendCriticalAlert(errorId: string, params: any) {
    // In production, integrate with Slack, PagerDuty, etc.
    console.error('🚨 CRITICAL ERROR ALERT:', {
      errorId,
      category: params.category,
      message: params.message,
      timestamp: new Date().toISOString()
    });

    // Could send webhook to monitoring service
    // await fetch(process.env.SLACK_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     text: `🚨 TinkerTank Critical Error: ${params.message}`,
    //     attachments: [{
    //       color: 'danger',
    //       fields: [
    //         { title: 'Error ID', value: errorId, short: true },
    //         { title: 'Category', value: params.category, short: true },
    //         { title: 'Order ID', value: params.orderId || 'N/A', short: true }
    //       ]
    //     }]
    //   })
    // });
  }

  /**
   * Check system health
   */
  static async healthCheck() {
    const checks = {
      database: false,
      stripe: false,
      calendar: false
    };

    try {
      // Database check
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      await this.logError({
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.CRITICAL,
        message: 'Database health check failed',
        details: { error: error.toString() }
      });
    }

    // Add other health checks as needed
    return checks;
  }
}

// Helper function for wrapping async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    category: ErrorCategory;
    severity: ErrorSeverity;
    orderId?: string;
    paymentIntentId?: string;
  }
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    await ErrorHandler.logError({
      ...context,
      message: error.message,
      details: { error: error.toString(), stack: error.stack }
    });
    return null;
  }
}
