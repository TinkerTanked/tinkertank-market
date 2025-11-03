import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface OrderWithItems {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  orderItems: {
    id: string;
    product: {
      name: string;
      type: string;
    };
    student: {
      name: string;
      allergies?: string;
    };
    bookingDate: Date;
    price: number;
  }[];
}

interface CalendarEvent {
  id: string;
  title: string;
  startDateTime: Date;
  endDateTime: Date;
  location: {
    name: string;
    address: string;
  };
}

export async function sendBookingConfirmationEmail(order: OrderWithItems) {
  const emailContent = generateBookingConfirmationEmail(order);
  
  // In production, use a real email service like SendGrid, Resend, etc.
  console.log('📧 Booking confirmation email:');
  console.log('To:', order.customerEmail);
  console.log('Subject:', emailContent.subject);
  console.log('Body:', emailContent.body);
  
  // Simulate email sending
  return { success: true, messageId: `msg_${Date.now()}` };
}

export function generateBookingConfirmationEmail(order: OrderWithItems) {
  const timezone = 'Australia/Sydney';
  
  const formatDateTime = (date: Date) => {
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a');
  };

  const orderItemsHtml = order.orderItems.map(item => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">${item.product.name}</h3>
      <p style="margin: 0 0 4px 0; color: #6b7280; text-transform: capitalize;">${item.product.type.toLowerCase()}</p>
      <p style="margin: 0 0 4px 0; color: #374151;"><strong>Student:</strong> ${item.student.name}</p>
      <p style="margin: 0 0 4px 0; color: #374151;"><strong>Date:</strong> ${formatDateTime(item.bookingDate)}</p>
      ${item.student.allergies ? `<p style="margin: 0 0 4px 0; color: #dc2626;"><strong>Allergies:</strong> ${item.student.allergies}</p>` : ''}
      <p style="margin: 0; color: #374151; font-weight: 600;">$${item.price.toFixed(2)} AUD</p>
    </div>
  `).join('');

  const subject = `TinkerTank Booking Confirmation - Order #${order.id.slice(-8).toUpperCase()}`;
  
  const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  
  <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for choosing TinkerTank</p>
  </div>

  <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 8px 8px;">
    
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${order.customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Great news! Your booking has been confirmed and we're excited to see you soon. 
      Here are the details of your reservation:
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 16px 0; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Order Details</h2>
      <p><strong>Order Number:</strong> #${order.id.slice(-8).toUpperCase()}</p>
      <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)} AUD</p>
      <p><strong>Booking Date:</strong> ${formatDateTime(order.createdAt)}</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 16px 0; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Your Bookings</h2>
      ${orderItemsHtml}
    </div>

    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; color: #92400e;">📍 Location & Arrival Information</h3>
      <p style="margin: 0 0 8px 0; color: #92400e;"><strong>TinkerTank Neutral Bay</strong></p>
      <p style="margin: 0 0 8px 0; color: #92400e;">123 Neutral Bay Road, Neutral Bay NSW 2089</p>
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        Please arrive 10 minutes early. Parking is available on-site.
      </p>
    </div>

    <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; color: #166534;">💡 What to Bring</h3>
      <ul style="margin: 0; padding-left: 20px; color: #166534;">
        <li>Water bottle (labeled with child's name)</li>
        <li>Comfortable clothes that can get messy</li>
        <li>Closed-toe shoes</li>
        <li>Any snacks for longer sessions</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=TinkerTank%20Activity&details=Your%20confirmed%20TinkerTank%20booking" 
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        📅 Add to Calendar
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <div style="text-align: center; color: #6b7280; font-size: 14px;">
      <p>Questions? Reply to this email or contact us:</p>
      <p>📧 hello@tinkertank.com.au | 📞 (02) 9999-9999</p>
      <p style="margin-top: 20px;">
        <a href="https://tinkertank.com.au" style="color: #2563eb;">TinkerTank</a> - 
        Where imagination meets innovation
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();

  return { subject, body };
}

export async function sendBookingReminderEmail(eventId: string) {
  // Implementation for reminder emails 24-48 hours before events
  console.log('📧 Sending reminder email for event:', eventId);
}

export async function sendBookingCancellationEmail(orderId: string) {
  // Implementation for cancellation notifications
  console.log('📧 Sending cancellation email for order:', orderId);
}
