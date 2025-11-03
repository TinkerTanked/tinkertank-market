import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications';
import { z } from 'zod';

const BookingIssueSchema = z.object({
  orderId: z.string(),
  customerEmail: z.string().email(),
  issueType: z.enum(['calendar_not_created', 'wrong_date', 'cancellation_request', 'other']),
  description: z.string().min(10),
  contactMethod: z.enum(['email', 'phone']).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = BookingIssueSchema.parse(body);

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: {
        orderItems: {
          include: {
            product: true,
            student: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify customer email matches
    if (order.customerEmail.toLowerCase() !== validatedData.customerEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email does not match order records' },
        { status: 403 }
      );
    }

    // Create support ticket (in production, integrate with support system)
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    console.log('🎫 Support ticket created:', {
      ticketId,
      orderId: validatedData.orderId,
      issueType: validatedData.issueType,
      customerEmail: validatedData.customerEmail,
      description: validatedData.description
    });

    // Send notification to support team
    const alertMessage = `🎫 New Support Ticket: ${ticketId}\n\n` +
      `📋 Issue Type: ${validatedData.issueType.replace('_', ' ')}\n` +
      `📧 Customer: ${validatedData.customerEmail}\n` +
      `🆔 Order: ${validatedData.orderId}\n` +
      `📝 Description: ${validatedData.description}\n\n` +
      `Products: ${order.orderItems.map(item => item.product.name).join(', ')}`;

    await notificationService.notifyBookingConfirmed(
      validatedData.orderId, 
      `Support Ticket: ${validatedData.issueType}`, 
      0
    );

    // Send auto-response to customer
    const customerMessage = generateCustomerResponse(validatedData.issueType, ticketId);
    
    console.log('📧 Auto-response sent to customer:', {
      to: validatedData.customerEmail,
      subject: customerMessage.subject,
      ticketId
    });

    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Support ticket created successfully',
      estimatedResponse: getEstimatedResponseTime(validatedData.issueType)
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

function generateCustomerResponse(issueType: string, ticketId: string) {
  const baseMessage = {
    subject: `TinkerTank Support - Ticket #${ticketId}`,
    greeting: 'Thank you for contacting TinkerTank support.',
    footer: '\n\nBest regards,\nTinkerTank Support Team\nhello@tinkertank.com.au\n(02) 9999-9999'
  };

  switch (issueType) {
    case 'calendar_not_created':
      return {
        ...baseMessage,
        body: `${baseMessage.greeting}\n\nWe've received your report about missing calendar events. Our team is investigating and will create your calendar events manually within the next 2 hours.\n\nYou'll receive an updated confirmation email once this is resolved.${baseMessage.footer}`
      };
    
    case 'wrong_date':
      return {
        ...baseMessage,
        body: `${baseMessage.greeting}\n\nWe've received your request to change your booking date. Our team will review the request and contact you within 24 hours with available alternatives.\n\nPlease note that date changes are subject to availability.${baseMessage.footer}`
      };
    
    case 'cancellation_request':
      return {
        ...baseMessage,
        body: `${baseMessage.greeting}\n\nWe've received your cancellation request. Our team will process this within 24 hours and send you confirmation along with refund details if applicable.\n\nRefunds are processed according to our cancellation policy.${baseMessage.footer}`
      };
    
    default:
      return {
        ...baseMessage,
        body: `${baseMessage.greeting}\n\nWe've received your inquiry and assigned it ticket number ${ticketId}. Our team will review your request and respond within 24-48 hours.\n\nIf this is urgent, please call us at (02) 9999-9999.${baseMessage.footer}`
      };
  }
}

function getEstimatedResponseTime(issueType: string): string {
  switch (issueType) {
    case 'calendar_not_created':
      return '2 hours';
    case 'wrong_date':
    case 'cancellation_request':
      return '24 hours';
    default:
      return '24-48 hours';
  }
}
