import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock Nodemailer
const mockTransporter = {
  sendMail: vi.fn()
};

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => mockTransporter)
}));

// Mock environment variables for email
beforeEach(() => {
  process.env.EMAIL_HOST = 'smtp.gmail.com';
  process.env.EMAIL_PORT = '587';
  process.env.EMAIL_USER = 'test@tinkertank.com.au';
  process.env.EMAIL_PASS = 'test-password';
  process.env.EMAIL_FROM = 'TinkerTank <bookings@tinkertank.com.au>';
});

describe('Email Notification Integration Tests', () => {
  const mockOrder = {
    id: 'order_email_123',
    customerName: 'Email Test Parent',
    customerEmail: 'emailtest@parent.com',
    customerPhone: '+61488999000',
    status: 'PAID',
    totalAmount: 32000, // $320
    currency: 'AUD',
    paidAt: new Date('2025-03-01T10:30:00Z'),
    createdAt: new Date('2025-03-01T10:30:00Z'),
    orderItems: [{
      id: 'item_email_123',
      productId: 'product_email_123',
      studentId: 'student_email_123',
      bookingDate: new Date('2025-03-20T09:30:00Z'),
      price: 32000,
      product: {
        id: 'product_email_123',
        name: 'AI & Machine Learning Camp',
        type: 'CAMP',
        duration: 450, // 7.5 hours
        ageMin: 12,
        ageMax: 17,
        description: 'Introduction to artificial intelligence and machine learning concepts'
      },
      student: {
        id: 'student_email_123',
        name: 'Email Test Student',
        age: 14,
        allergies: 'Tree nuts',
        medicalNotes: 'Has mild asthma, inhaler available',
        parentName: 'Email Test Parent',
        parentEmail: 'emailtest@parent.com',
        parentPhone: '+61488999000'
      }
    }]
  };

  const mockEvent = {
    id: 'event_email_123',
    title: 'AI & Machine Learning Camp - Email Test Student',
    startDateTime: new Date('2025-03-20T09:30:00Z'),
    endDateTime: new Date('2025-03-20T17:00:00Z'),
    type: 'CAMP',
    location: {
      id: 'location_email_123',
      name: 'TinkerTank Innovation Center',
      address: '123 Innovation Drive, Technology Park NSW 2015',
      timezone: 'Australia/Sydney'
    },
    maxCapacity: 16,
    currentBookings: 8
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransporter.sendMail.mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 OK'
    });
  });

  describe('Booking Confirmation Emails', () => {
    it('should send comprehensive booking confirmation email', async () => {
      const emailService = {
        async sendBookingConfirmation(orderData: any, events: any[]) {
          const emailContent = this.generateBookingConfirmationEmail(orderData, events);
          
          return await mockTransporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: orderData.customerEmail,
            subject: emailContent.subject,
            html: emailContent.html,
            attachments: emailContent.attachments
          });
        },

        generateBookingConfirmationEmail(order: any, events: any[]) {
          const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
          const formatDate = (date: Date) => date.toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const formatTime = (date: Date) => date.toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          const orderItem = order.orderItems[0];
          const event = events[0];

          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; color: #333; }
                  .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                  .content { padding: 20px; }
                  .booking-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
                  .important { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
                  .footer { background: #6b7280; color: white; padding: 15px; text-align: center; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>🎉 Booking Confirmed!</h1>
                  <p>Thank you for choosing TinkerTank</p>
                </div>
                
                <div class="content">
                  <h2>Hello ${order.customerName},</h2>
                  <p>We're excited to confirm your booking! Here are the details:</p>
                  
                  <div class="booking-details">
                    <h3>📅 Event Details</h3>
                    <p><strong>Program:</strong> ${orderItem.product.name}</p>
                    <p><strong>Student:</strong> ${orderItem.student.name} (Age ${orderItem.student.age})</p>
                    <p><strong>Date:</strong> ${formatDate(event.startDateTime)}</p>
                    <p><strong>Time:</strong> ${formatTime(event.startDateTime)} - ${formatTime(event.endDateTime)}</p>
                    <p><strong>Location:</strong> ${event.location.name}<br>
                       ${event.location.address}</p>
                  </div>

                  <div class="booking-details">
                    <h3>💰 Payment Summary</h3>
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Total Paid:</strong> ${formatCurrency(order.totalAmount)} ${order.currency}</p>
                    <p><strong>Payment Date:</strong> ${formatDate(order.paidAt)}</p>
                  </div>

                  ${orderItem.student.allergies || orderItem.student.medicalNotes ? `
                    <div class="important">
                      <h3>⚠️ Important Medical Information</h3>
                      ${orderItem.student.allergies ? `<p><strong>Allergies:</strong> ${orderItem.student.allergies}</p>` : ''}
                      ${orderItem.student.medicalNotes ? `<p><strong>Medical Notes:</strong> ${orderItem.student.medicalNotes}</p>` : ''}
                      <p>Please ensure your child has any necessary medications with them.</p>
                    </div>
                  ` : ''}

                  <div class="booking-details">
                    <h3>📋 What to Bring</h3>
                    <ul>
                      <li>Water bottle and snacks</li>
                      <li>Comfortable clothing suitable for hands-on activities</li>
                      <li>Any required medications</li>
                      <li>Enthusiasm for learning!</li>
                    </ul>
                  </div>

                  <div class="booking-details">
                    <h3>📞 Contact Information</h3>
                    <p>If you have any questions or need to make changes to your booking:</p>
                    <p><strong>Email:</strong> bookings@tinkertank.com.au</p>
                    <p><strong>Phone:</strong> 1300 TINKER (1300 846 537)</p>
                    <p><strong>Emergency Contact:</strong> +61 400 123 456</p>
                  </div>

                  <p>We can't wait to see ${orderItem.student.name} at TinkerTank!</p>
                  <p>Best regards,<br>The TinkerTank Team</p>
                </div>

                <div class="footer">
                  <p>TinkerTank - Inspiring Young Innovators</p>
                  <p>This email was sent to ${order.customerEmail}</p>
                </div>
              </body>
            </html>
          `;

          // Generate iCal attachment
          const startDate = event.startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
          const endDate = event.endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
          const uid = `${event.id}@tinkertank.com.au`;

          const icalContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TinkerTank//Booking System//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:REQUEST',
            'BEGIN:VTIMEZONE',
            'TZID:Australia/Sydney',
            'BEGIN:STANDARD',
            'DTSTART:20200405T030000',
            'RRULE:FREQ=YEARLY;BYMONTH=4;BYDAY=1SU',
            'TZNAME:AEST',
            'TZOFFSETFROM:+1100',
            'TZOFFSETTO:+1000',
            'END:STANDARD',
            'BEGIN:DAYLIGHT',
            'DTSTART:20201004T020000',
            'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=1SU',
            'TZNAME:AEDT',
            'TZOFFSETFROM:+1000',
            'TZOFFSETTO:+1100',
            'END:DAYLIGHT',
            'END:VTIMEZONE',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTART;TZID=Australia/Sydney:${startDate.slice(0, -1)}`,
            `DTEND;TZID=Australia/Sydney:${endDate.slice(0, -1)}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${orderItem.product.description}\\n\\nStudent: ${orderItem.student.name}\\n${orderItem.student.allergies ? `Allergies: ${orderItem.student.allergies}\\n` : ''}${orderItem.student.medicalNotes ? `Medical: ${orderItem.student.medicalNotes}\\n` : ''}\\nOrder: ${order.id}`,
            `LOCATION:${event.location.name}\\, ${event.location.address}`,
            `ORGANIZER:CN=TinkerTank:mailto:bookings@tinkertank.com.au`,
            `ATTENDEE:CN=${order.customerName}:mailto:${order.customerEmail}`,
            'STATUS:CONFIRMED',
            'SEQUENCE:0',
            `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
            'END:VEVENT',
            'END:VCALENDAR'
          ].join('\r\n');

          return {
            subject: `TinkerTank Booking Confirmation - ${orderItem.product.name}`,
            html,
            attachments: [{
              filename: 'booking.ics',
              content: icalContent,
              contentType: 'text/calendar'
            }]
          };
        }
      };

      const result = await emailService.sendBookingConfirmation(mockOrder, [mockEvent]);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'TinkerTank <bookings@tinkertank.com.au>',
        to: 'emailtest@parent.com',
        subject: 'TinkerTank Booking Confirmation - AI & Machine Learning Camp',
        html: expect.stringContaining('Email Test Student'),
        attachments: [{
          filename: 'booking.ics',
          content: expect.stringContaining('BEGIN:VCALENDAR'),
          contentType: 'text/calendar'
        }]
      });

      expect(result.messageId).toBe('test-message-id');
    });

    it('should handle birthday party confirmation emails with special formatting', async () => {
      const birthdayOrder = {
        ...mockOrder,
        id: 'order_birthday_email_123',
        orderItems: [{
          ...mockOrder.orderItems[0],
          product: {
            id: 'product_birthday_123',
            name: 'Deluxe Birthday Party Package',
            type: 'BIRTHDAY',
            duration: 120,
            description: 'Complete birthday party with activities, decorations, and cake'
          },
          student: {
            ...mockOrder.orderItems[0].student,
            name: 'Birthday Child',
            age: 7
          }
        }]
      };

      const birthdayEvent = {
        ...mockEvent,
        id: 'event_birthday_email_123',
        title: '🎂 Birthday Child\'s Birthday Party',
        type: 'BIRTHDAY',
        endDateTime: new Date('2025-03-20T11:30:00Z') // 2 hours
      };

      const emailService = {
        generateBirthdayConfirmationEmail(order: any, event: any) {
          const orderItem = order.orderItems[0];
          const student = orderItem.student;

          const html = `
            <div style="text-align: center; background: linear-gradient(135deg, #ff6b6b, #feca57); color: white; padding: 30px;">
              <h1>🎉🎂 Birthday Party Confirmed! 🎂🎉</h1>
              <h2>Get ready for ${student.name}'s amazing ${student.age}th birthday celebration!</h2>
            </div>
            
            <div style="padding: 20px;">
              <h3>🎊 Party Details</h3>
              <p><strong>Birthday Child:</strong> ${student.name} (turning ${student.age}!)</p>
              <p><strong>Date:</strong> ${event.startDateTime.toLocaleDateString('en-AU', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}</p>
              <p><strong>Time:</strong> ${event.startDateTime.toLocaleTimeString('en-AU', { 
                hour: '2-digit', minute: '2-digit', hour12: true 
              })} - ${event.endDateTime.toLocaleTimeString('en-AU', { 
                hour: '2-digit', minute: '2-digit', hour12: true 
              })}</p>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>🎈 What's Included</h3>
                <ul>
                  <li>🎯 Interactive STEM activities and games</li>
                  <li>🎨 Creative projects for all guests</li>
                  <li>🎂 Birthday cake and celebration</li>
                  <li>🎁 Special birthday surprise for ${student.name}</li>
                  <li>📸 Photo opportunities and memories</li>
                  <li>🎉 Party decorations and setup</li>
                </ul>
              </div>
              
              ${student.allergies ? `
                <div style="background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
                  <h3>⚠️ Allergy Alert</h3>
                  <p><strong>${student.name} has allergies:</strong> ${student.allergies}</p>
                  <p>We'll ensure all activities and food are allergy-safe!</p>
                </div>
              ` : ''}
              
              <p>We're so excited to make ${student.name}'s ${student.age}th birthday absolutely magical! 🌟</p>
            </div>
          `;

          return {
            subject: `🎉 ${student.name}'s Birthday Party Confirmed - Let's Celebrate!`,
            html
          };
        }
      };

      const emailContent = emailService.generateBirthdayConfirmationEmail(birthdayOrder, birthdayEvent);

      expect(emailContent.subject).toBe('🎉 Birthday Child\'s Birthday Party Confirmed - Let\'s Celebrate!');
      expect(emailContent.html).toContain('turning 7!');
      expect(emailContent.html).toContain('🎂 Birthday cake and celebration');
      expect(emailContent.html).toContain('Tree nuts');
    });
  });

  describe('Reminder Emails', () => {
    it('should send event reminder email 24 hours before', async () => {
      const reminderService = {
        async sendEventReminder(eventId: string) {
          // Mock finding event and booking details
          const eventDetails = {
            ...mockEvent,
            startDateTime: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 hours from now
            bookings: [{
              student: mockOrder.orderItems[0].student,
              order: mockOrder
            }]
          };

          const reminderEmail = this.generateReminderEmail(eventDetails);
          
          return await mockTransporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: eventDetails.bookings[0].order.customerEmail,
            subject: reminderEmail.subject,
            html: reminderEmail.html
          });
        },

        generateReminderEmail(event: any) {
          const booking = event.bookings[0];
          const student = booking.student;
          const order = booking.order;

          const html = `
            <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
              <h1>⏰ Reminder: Event Tomorrow!</h1>
              <p>Don't forget - ${student.name} has an awesome session coming up!</p>
            </div>
            
            <div style="padding: 20px;">
              <h2>Hi ${order.customerName},</h2>
              <p>Just a friendly reminder that ${student.name} is booked for:</p>
              
              <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <h3>${event.title}</h3>
                <p><strong>Date:</strong> Tomorrow, ${event.startDateTime.toLocaleDateString('en-AU', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}</p>
                <p><strong>Time:</strong> ${event.startDateTime.toLocaleTimeString('en-AU', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</p>
                <p><strong>Location:</strong> ${event.location.name}</p>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>📋 Don't Forget to Bring</h3>
                <ul>
                  <li>✅ Water bottle and healthy snacks</li>
                  <li>✅ Comfortable clothes for hands-on activities</li>
                  ${student.allergies ? `<li>✅ Any necessary medications for ${student.allergies} allergy</li>` : ''}
                  ${student.medicalNotes ? `<li>✅ Inhaler or other medical needs</li>` : ''}
                  <li>✅ Excitement and curiosity!</li>
                </ul>
              </div>
              
              <p>If you need to make any changes or have questions, please contact us at bookings@tinkertank.com.au or call 1300 TINKER.</p>
              
              <p>See you tomorrow!</p>
              <p>The TinkerTank Team 🚀</p>
            </div>
          `;

          return {
            subject: `Reminder: ${student.name}'s ${event.title.split(' - ')[0]} is Tomorrow!`,
            html
          };
        }
      };

      const result = await reminderService.sendEventReminder('event_email_123');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'TinkerTank <bookings@tinkertank.com.au>',
        to: 'emailtest@parent.com',
        subject: expect.stringContaining('Reminder: Email Test Student\'s'),
        html: expect.stringContaining('Tomorrow')
      });
    });

    it('should send follow-up email after event completion', async () => {
      const followUpService = {
        async sendEventFollowUp(eventId: string) {
          const eventDetails = {
            ...mockEvent,
            startDateTime: new Date(Date.now() - (2 * 60 * 60 * 1000)), // 2 hours ago
            endDateTime: new Date(Date.now() - (30 * 60 * 1000)), // 30 minutes ago
            bookings: [{
              student: mockOrder.orderItems[0].student,
              order: mockOrder
            }]
          };

          const followUpEmail = this.generateFollowUpEmail(eventDetails);
          
          return await mockTransporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: eventDetails.bookings[0].order.customerEmail,
            subject: followUpEmail.subject,
            html: followUpEmail.html
          });
        },

        generateFollowUpEmail(event: any) {
          const booking = event.bookings[0];
          const student = booking.student;
          const order = booking.order;

          const html = `
            <div style="background: #059669; color: white; padding: 20px; text-align: center;">
              <h1>🌟 Thanks for Joining TinkerTank!</h1>
              <p>We hope ${student.name} had an amazing time!</p>
            </div>
            
            <div style="padding: 20px;">
              <h2>Hi ${order.customerName},</h2>
              <p>Thank you for bringing ${student.name} to today's session:</p>
              
              <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                <h3>${event.title}</h3>
                <p>Completed today at ${event.endDateTime.toLocaleTimeString('en-AU')}</p>
              </div>
              
              <div style="background: #fef7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>🎯 What ${student.name} Learned Today</h3>
                <ul>
                  <li>🤖 Advanced programming concepts and logic</li>
                  <li>🧠 Problem-solving and critical thinking skills</li>
                  <li>👥 Collaboration and teamwork</li>
                  <li>💡 Creative project development</li>
                  <li>🔬 Real-world STEM applications</li>
                </ul>
              </div>
              
              <div style="background: #fff7ed; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>📚 Continue the Learning at Home</h3>
                <p>Here are some resources to keep ${student.name} engaged:</p>
                <ul>
                  <li><a href="https://scratch.mit.edu" style="color: #2563eb;">Scratch Programming</a> - Visual programming for kids</li>
                  <li><a href="https://code.org" style="color: #2563eb;">Code.org</a> - Free coding lessons</li>
                  <li><a href="https://www.nasa.gov/audience/forkids/" style="color: #2563eb;">NASA Kids</a> - Space science activities</li>
                </ul>
              </div>
              
              <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>🎉 Keep the Fun Going!</h3>
                <p>Loved today's session? Check out our upcoming programs:</p>
                <ul>
                  <li>🚀 Advanced Robotics Workshop - Next Saturday</li>
                  <li>🎮 Game Development Bootcamp - Starting next month</li>
                  <li>🧬 Biology & Technology Lab - New program!</li>
                </ul>
                <p><a href="https://tinkertank.com.au/programs" style="color: #2563eb; font-weight: bold;">View All Programs →</a></p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 18px; margin-bottom: 15px;">How was your TinkerTank experience?</p>
                <a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 0 10px;">⭐ Leave a Review</a>
                <a href="#" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 0 10px;">📷 Share Photos</a>
              </div>
              
              <p>Thank you for choosing TinkerTank to inspire ${student.name}'s love of learning!</p>
              <p>Best regards,<br>The TinkerTank Team 🎓</p>
            </div>
          `;

          return {
            subject: `Thanks ${student.name}! How was your TinkerTank experience?`,
            html
          };
        }
      };

      const result = await followUpService.sendEventFollowUp('event_email_123');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'TinkerTank <bookings@tinkertank.com.au>',
        to: 'emailtest@parent.com',
        subject: 'Thanks Email Test Student! How was your TinkerTank experience?',
        html: expect.stringContaining('Advanced programming concepts')
      });
    });
  });

  describe('Cancellation and Update Emails', () => {
    it('should send event cancellation email with refund information', async () => {
      const cancellationService = {
        async sendCancellationNotification(eventId: string, reason: string) {
          const eventDetails = {
            ...mockEvent,
            status: 'CANCELLED',
            cancellationReason: reason,
            bookings: [{
              student: mockOrder.orderItems[0].student,
              order: mockOrder
            }]
          };

          const cancellationEmail = this.generateCancellationEmail(eventDetails);
          
          return await mockTransporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: eventDetails.bookings[0].order.customerEmail,
            subject: cancellationEmail.subject,
            html: cancellationEmail.html
          });
        },

        generateCancellationEmail(event: any) {
          const booking = event.bookings[0];
          const student = booking.student;
          const order = booking.order;

          const html = `
            <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
              <h1>❗ Event Cancellation Notice</h1>
              <p>We sincerely apologize for this inconvenience</p>
            </div>
            
            <div style="padding: 20px;">
              <h2>Dear ${order.customerName},</h2>
              <p>We regret to inform you that the following event has been cancelled:</p>
              
              <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
                <h3>${event.title}</h3>
                <p><strong>Originally scheduled:</strong> ${event.startDateTime.toLocaleDateString('en-AU', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} at ${event.startDateTime.toLocaleTimeString('en-AU', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</p>
                <p><strong>Reason:</strong> ${event.cancellationReason}</p>
              </div>
              
              <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>💰 Refund Information</h3>
                <p>You will receive a <strong>full refund</strong> of ${(order.totalAmount / 100).toFixed(2)} ${order.currency} within 3-5 business days.</p>
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Refund will be processed to:</strong> Your original payment method</p>
              </div>
              
              <div style="background: #fef7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>🎯 Alternative Options</h3>
                <p>We'd love to offer ${student.name} these alternative sessions:</p>
                <ul>
                  <li>🗓️ Same program on a different date (if available)</li>
                  <li>🔄 Credit toward any other TinkerTank program</li>
                  <li>📞 Priority booking for similar future events</li>
                </ul>
                <p><strong>To discuss alternatives, please reply to this email or call us at 1300 TINKER.</strong></p>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>📞 Need Assistance?</h3>
                <p>Our team is here to help:</p>
                <p><strong>Email:</strong> bookings@tinkertank.com.au</p>
                <p><strong>Phone:</strong> 1300 TINKER (1300 846 537)</p>
                <p><strong>Hours:</strong> Monday-Friday 9AM-6PM, Saturday 9AM-4PM</p>
              </div>
              
              <p>We sincerely apologize for any inconvenience this cancellation may cause. We're committed to making this right and hope to see ${student.name} in a future program.</p>
              
              <p>Thank you for your understanding.</p>
              <p>Best regards,<br>The TinkerTank Team</p>
            </div>
          `;

          return {
            subject: `Event Cancelled - Full Refund Processing for ${student.name}`,
            html
          };
        }
      };

      const result = await cancellationService.sendCancellationNotification('event_email_123', 'Instructor illness');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'TinkerTank <bookings@tinkertank.com.au>',
        to: 'emailtest@parent.com',
        subject: 'Event Cancelled - Full Refund Processing for Email Test Student',
        html: expect.stringContaining('Instructor illness')
      });
    });

    it('should send event update notification for time/location changes', async () => {
      const updateService = {
        generateUpdateEmail(originalEvent: any, updatedEvent: any, booking: any) {
          const student = booking.student;
          const order = booking.order;

          const formatDateTime = (date: Date) => `${date.toLocaleDateString('en-AU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })} at ${date.toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}`;

          const html = `
            <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
              <h1>📅 Event Update Notice</h1>
              <p>Important changes to ${student.name}'s booking</p>
            </div>
            
            <div style="padding: 20px;">
              <h2>Hi ${order.customerName},</h2>
              <p>We need to update you about changes to ${student.name}'s upcoming session:</p>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>📝 What's Changed</h3>
                
                ${originalEvent.startDateTime.getTime() !== updatedEvent.startDateTime.getTime() ? `
                  <div style="margin: 10px 0;">
                    <p><strong>Date & Time Update:</strong></p>
                    <p style="text-decoration: line-through; color: #6b7280;">Was: ${formatDateTime(originalEvent.startDateTime)}</p>
                    <p style="color: #059669; font-weight: bold;">Now: ${formatDateTime(updatedEvent.startDateTime)}</p>
                  </div>
                ` : ''}
                
                ${originalEvent.location.id !== updatedEvent.location.id ? `
                  <div style="margin: 10px 0;">
                    <p><strong>Location Update:</strong></p>
                    <p style="text-decoration: line-through; color: #6b7280;">Was: ${originalEvent.location.name}</p>
                    <p style="color: #059669; font-weight: bold;">Now: ${updatedEvent.location.name}<br>
                       ${updatedEvent.location.address}</p>
                  </div>
                ` : ''}
              </div>
              
              <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>✅ Confirmed Details</h3>
                <p><strong>Program:</strong> ${updatedEvent.title}</p>
                <p><strong>Student:</strong> ${student.name}</p>
                <p><strong>New Date & Time:</strong> ${formatDateTime(updatedEvent.startDateTime)}</p>
                <p><strong>Location:</strong> ${updatedEvent.location.name}<br>${updatedEvent.location.address}</p>
                <p><strong>Order ID:</strong> ${order.id}</p>
              </div>
              
              <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>📎 Updated Calendar Invite</h3>
                <p>Please find the updated calendar invite attached to this email. This will automatically update your calendar with the new details.</p>
              </div>
              
              <div style="background: #fdf2f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>❓ Can't Make the New Time?</h3>
                <p>If these changes don't work for your schedule, we're happy to:</p>
                <ul>
                  <li>🔄 Transfer to another available session</li>
                  <li>💰 Provide a full refund</li>
                  <li>🎫 Issue a credit for future use</li>
                </ul>
                <p><strong>Please contact us within 24 hours if you need to make changes.</strong></p>
              </div>
              
              <p>We apologize for any inconvenience these changes may cause and appreciate your flexibility.</p>
              
              <p>Questions? Contact us at bookings@tinkertank.com.au or 1300 TINKER.</p>
              
              <p>Looking forward to seeing ${student.name} at the updated time!</p>
              <p>Best regards,<br>The TinkerTank Team</p>
            </div>
          `;

          return {
            subject: `Update: ${student.name}'s TinkerTank Session - New Details Inside`,
            html
          };
        }
      };

      const originalEvent = {
        ...mockEvent,
        startDateTime: new Date('2025-03-20T09:30:00Z'),
        location: { id: 'loc1', name: 'Original Location' }
      };

      const updatedEvent = {
        ...mockEvent,
        startDateTime: new Date('2025-03-20T14:30:00Z'), // Changed time
        location: { id: 'loc2', name: 'New Location', address: '456 New Address' }
      };

      const booking = {
        student: mockOrder.orderItems[0].student,
        order: mockOrder
      };

      const emailContent = updateService.generateUpdateEmail(originalEvent, updatedEvent, booking);

      expect(emailContent.subject).toBe('Update: Email Test Student\'s TinkerTank Session - New Details Inside');
      expect(emailContent.html).toContain('New Location');
      expect(emailContent.html).toContain('2:30 PM'); // Updated time
    });
  });

  describe('Email Error Handling', () => {
    it('should handle email delivery failures gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP connection failed'));

      const emailService = {
        async sendEmailWithRetry(emailData: any, maxRetries = 3) {
          let lastError;
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const result = await mockTransporter.sendMail(emailData);
              return { success: true, result, attempt };
            } catch (error) {
              lastError = error;
              
              if (attempt < maxRetries) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
              }
            }
          }
          
          return { success: false, error: lastError, attempts: maxRetries };
        }
      };

      const result = await emailService.sendEmailWithRetry({
        from: process.env.EMAIL_FROM,
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>'
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
    });

    it('should validate email addresses before sending', () => {
      const emailValidator = {
        validateEmail(email: string) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          
          return {
            isValid: emailRegex.test(email),
            error: emailRegex.test(email) ? null : 'Invalid email format'
          };
        },

        validateEmailList(emails: string[]) {
          const results = emails.map(email => ({
            email,
            ...this.validateEmail(email)
          }));

          return {
            valid: results.filter(r => r.isValid),
            invalid: results.filter(r => !r.isValid),
            allValid: results.every(r => r.isValid)
          };
        }
      };

      const testEmails = [
        'valid@example.com',
        'invalid-email',
        'another@valid.co.uk',
        '@invalid.com',
        'missing-domain@'
      ];

      const validation = emailValidator.validateEmailList(testEmails);

      expect(validation.valid).toHaveLength(2);
      expect(validation.invalid).toHaveLength(3);
      expect(validation.allValid).toBe(false);
      expect(validation.valid[0].email).toBe('valid@example.com');
      expect(validation.invalid[0].error).toBe('Invalid email format');
    });
  });

  describe('Email Template Testing', () => {
    it('should generate responsive HTML email templates', () => {
      const templateService = {
        generateResponsiveEmail(content: any) {
          return `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${content.subject}</title>
                <style>
                  @media only screen and (max-width: 600px) {
                    .container { width: 100% !important; padding: 10px !important; }
                    .content { padding: 15px !important; }
                    h1 { font-size: 24px !important; }
                    h2 { font-size: 20px !important; }
                    .button { width: 100% !important; padding: 15px !important; }
                  }
                  
                  .container { max-width: 600px; margin: 0 auto; }
                  .content { padding: 20px; }
                  .button { 
                    background: #3b82f6; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block; 
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="content">
                    ${content.body}
                  </div>
                </div>
              </body>
            </html>
          `;
        }
      };

      const emailContent = {
        subject: 'Test Responsive Email',
        body: `
          <h1>Welcome to TinkerTank!</h1>
          <p>This email should look great on all devices.</p>
          <a href="#" class="button">Take Action</a>
        `
      };

      const html = templateService.generateResponsiveEmail(emailContent);

      expect(html).toContain('@media only screen and (max-width: 600px)');
      expect(html).toContain('max-width: 600px');
      expect(html).toContain('class="container"');
      expect(html).toContain('Welcome to TinkerTank!');
    });
  });
});
