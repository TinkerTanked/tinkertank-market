import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface NotificationConfig {
  slackWebhook?: string;
  emailAlerts?: string[];
  smsAlerts?: string[];
}

export class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig = {}) {
    this.config = config;
  }

  /**
   * Send booking confirmation notification to staff
   */
  async notifyBookingConfirmed(orderId: string, customerName: string, totalAmount: number) {
    const message = `✅ New booking confirmed!\n\nOrder: ${orderId}\nCustomer: ${customerName}\nAmount: $${totalAmount.toFixed(2)} AUD`;
    
    await this.sendSlackNotification(message, 'good');
  }

  /**
   * Send payment failure alert
   */
  async notifyPaymentFailed(orderId: string, reason: string) {
    const message = `❌ Payment failed\n\nOrder: ${orderId}\nReason: ${reason}`;
    
    await this.sendSlackNotification(message, 'warning');
  }

  /**
   * Send calendar creation failure alert
   */
  async notifyCalendarError(orderId: string, error: string) {
    const message = `📅 Calendar event creation failed\n\nOrder: ${orderId}\nError: ${error}\n\n⚠️ Manual intervention required`;
    
    await this.sendSlackNotification(message, 'danger');
  }

  /**
   * Send critical system error alert
   */
  async notifyCriticalError(errorId: string, category: string, message: string) {
    const alertMessage = `🚨 CRITICAL ERROR\n\nError ID: ${errorId}\nCategory: ${category}\nMessage: ${message}\n\nImmediate attention required!`;
    
    await this.sendSlackNotification(alertMessage, 'danger');
    
    // Also send to emergency contacts
    await this.sendEmergencyAlert(alertMessage);
  }

  /**
   * Send daily booking summary
   */
  async sendDailyBookingSummary(summary: {
    totalBookings: number;
    totalRevenue: number;
    upcomingEvents: number;
    pendingOrders: number;
  }) {
    const today = format(new Date(), 'EEEE, MMMM d, yyyy');
    
    const message = `📊 Daily Summary - ${today}\n\n` +
      `📅 Total Bookings: ${summary.totalBookings}\n` +
      `💰 Revenue: $${summary.totalRevenue.toFixed(2)} AUD\n` +
      `🎯 Upcoming Events: ${summary.upcomingEvents}\n` +
      `⏳ Pending Orders: ${summary.pendingOrders}`;

    await this.sendSlackNotification(message, 'good');
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(message: string, color: 'good' | 'warning' | 'danger' = 'good') {
    if (!this.config.slackWebhook) {
      console.log('📢 Slack notification (webhook not configured):', message);
      return;
    }

    try {
      await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'TinkerTank Market Notification',
          attachments: [{
            color,
            text: message,
            timestamp: Math.floor(Date.now() / 1000)
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  /**
   * Send emergency alert via multiple channels
   */
  private async sendEmergencyAlert(message: string) {
    // In production, integrate with emergency contact systems
    console.error('🚨 EMERGENCY ALERT:', message);
    
    // Could integrate with:
    // - PagerDuty
    // - SMS service
    // - Phone call service
    // - Email alerts to multiple recipients
  }

  /**
   * Send booking reminder notifications
   */
  async sendBookingReminder(eventId: string, reminderType: '24h' | '1h') {
    const message = `🔔 Booking reminder (${reminderType})\n\nEvent ID: ${eventId}`;
    
    console.log('📧 Booking reminder:', message);
    // Implementation would send actual reminder emails/SMS
  }
}

// Export singleton instance
export const notificationService = new NotificationService({
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  emailAlerts: process.env.ALERT_EMAILS?.split(','),
  smsAlerts: process.env.ALERT_PHONES?.split(',')
});
