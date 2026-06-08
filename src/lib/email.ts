import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

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
    /**
     * Customer-selected location for this line item, e.g. "Manly Library",
     * "TinkerTank Neutral Bay" or "Your Venue". Stored as a free-form string
     * on OrderItem.location at checkout time.
     */
    location?: string | null;
    /**
     * Full street address supplied by the customer when location is
     * "Your Venue" (birthday parties only).
     */
    venueAddress?: string | null;
  }[];
}

// -----------------------------------------------------------------------------
// Per-location display details for the booking confirmation email.
// Keys are the lowercase form of OrderItem.location strings used at checkout.
// -----------------------------------------------------------------------------
interface LocationDetails {
  displayName: string;
  address: string;
  /** Plain text — rendered as paragraphs in the email. */
  notes: string;
}

const LOCATION_DETAILS: Record<string, LocationDetails> = {
  'manly library': {
    displayName: 'TinkerTank @ Manly Library',
    address: 'Market Place, Manly NSW 2095',
    notes:
      'Meet us at the **Main Entrance**. Look for the TinkerTank welcome sign.\n\n' +
      'There is **no on-site parking**. Paid parking is available at Whistler Street and Wentworth Street car parks (~3 min walk).'
  },
  'neutral bay': {
    displayName: 'TinkerTank Neutral Bay',
    address: '50 Yeo St, Neutral Bay NSW 2089',
    notes:
      'Enter via the **Main Entrance**, then take the lift to Level One. You can also take the lift up from the Woolworths car park underneath.\n\n' +
      '**Parking:** Free Woolworths underground parking (2-hour limit), with lift access, or Street parking.'
  }
};
// Aliases — these map to the same canonical entry as "neutral bay".
LOCATION_DETAILS['tinkertank neutral bay'] = LOCATION_DETAILS['neutral bay'];

const UNKNOWN_LOCATION_NOTES =
  "We'll be in touch shortly to confirm your location and arrival details. " +
  'If you need anything sooner please reply to this email or call us on 1300 670 104.';

/**
 * Resolve display info for a single order item's location. Handles the special
 * "Your Venue" case (uses the customer-supplied venueAddress) and falls back
 * to a safe "we'll be in touch" message for unknown locations.
 */
function resolveLocationDetails(
  location: string | null | undefined,
  venueAddress: string | null | undefined
): LocationDetails {
  const key = (location || '').trim().toLowerCase();

  if (key === 'your venue') {
    return {
      displayName: 'Your Venue',
      address: venueAddress?.trim() || '',
      notes: venueAddress?.trim()
        ? 'We bring the fun!'
        : UNKNOWN_LOCATION_NOTES
    };
  }

  const mapped = LOCATION_DETAILS[key];
  if (mapped) return mapped;

  // Unknown / unmapped — never silently show the wrong address.
  return {
    displayName: location?.trim() || 'Location to be confirmed',
    address: '',
    notes: UNKNOWN_LOCATION_NOTES
  };
}

/**
 * Build a Google Calendar "Add Event" URL for a single booking item.
 *
 * Timezone convention used throughout this codebase:
 *   - Camps: bookingDate is stored as the calendar day at UTC 14:00 (midnight
 *     local-ish). We strip the time and force the canonical Sydney session
 *     hours — Day Camp 9am–3pm, All Day Camp 9am–5pm.
 *   - Birthdays: bookingDate is stored with the customer-selected slot encoded
 *     as UTC hours (e.g. a 10am party = 2026-08-01T10:00:00Z). We treat the
 *     UTC hours as Sydney wall-clock and assume a 2hr duration.
 * The Google Calendar URL uses `ctz=Australia/Sydney` so the times are added
 * as Sydney local time regardless of the recipient's own timezone.
 */
function buildCalendarUrl(
  orderId: string,
  item: OrderWithItems['orderItems'][number],
  location: LocationDetails
): string {
  const d = item.bookingDate;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const isBirthday = item.product.type === 'BIRTHDAY';
  const isAllDayCamp = !isBirthday && item.product.name.toLowerCase().includes('all day');

  let startHHMMSS: string;
  let endHHMMSS: string;
  if (isBirthday) {
    const sh = d.getUTCHours();
    const sm = d.getUTCMinutes();
    const eh = (sh + 2) % 24; // 2hr party duration
    startHHMMSS = `${String(sh).padStart(2, '0')}${String(sm).padStart(2, '0')}00`;
    endHHMMSS = `${String(eh).padStart(2, '0')}${String(sm).padStart(2, '0')}00`;
  } else if (isAllDayCamp) {
    startHHMMSS = '090000';
    endHHMMSS = '170000';
  } else {
    startHHMMSS = '090000';
    endHHMMSS = '150000';
  }

  const dates = `${dateStr}T${startHHMMSS}/${dateStr}T${endHHMMSS}`;
  const title = `TinkerTank ${item.product.name} — ${item.student.name}`;
  const locationLine = location.address
    ? `${location.displayName}, ${location.address}`
    : location.displayName;
  const details = [
    `Student: ${item.student.name}`,
    `Booking: ${item.product.name}`,
    `Order: TinkerTank Booking #${orderId.slice(-8).toUpperCase()}`,
    'Questions? Reply to your confirmation email or contact hello@tinkertank.rocks / 1300 670 104.'
  ].join('\n\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates,
    ctz: 'Australia/Sydney',
    location: locationLine,
    details
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Convert "**bold**" markers and "\n\n" paragraph breaks in a notes string to
 * minimal email-safe HTML. Keeps things narrow on purpose — full Markdown is
 * overkill for our small, curated notes block.
 */
function renderLocationNotes(notes: string, color: string): string {
  return notes
    .split(/\n\n+/)
    .map(
      para =>
        `<p style="margin: 0 0 8px 0; color: ${color}; font-size: 14px;">${para
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`
    )
    .join('');
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

// -----------------------------------------------------------------------------
// SES client (lazy + cached). Authenticates via the pod's IRSA role on EKS,
// or via AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY when those env vars are set.
// -----------------------------------------------------------------------------
let cachedSes: SESv2Client | null = null;
function getSesClient(): SESv2Client {
  if (cachedSes) return cachedSes;
  const region = process.env.SES_REGION || process.env.AWS_REGION || 'ap-southeast-2';
  cachedSes = new SESv2Client({
    region,
    credentials: process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        }
      : undefined // Falls back to IRSA / instance role
  });
  return cachedSes;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Low-level SES send. Uses the SESv2 SDK SendEmail with simple HTML content
 * (no attachments needed for booking confirmations).
 */
async function sendViaSes(params: {
  to: string;
  from: string;
  subject: string;
  html: string;
  configurationSetName?: string;
}): Promise<SendEmailResult> {
  try {
    const client = getSesClient();
    const result = await client.send(
      new SendEmailCommand({
        FromEmailAddress: params.from,
        Destination: { ToAddresses: [params.to] },
        Content: {
          Simple: {
            Subject: { Data: params.subject, Charset: 'UTF-8' },
            Body: { Html: { Data: params.html, Charset: 'UTF-8' } }
          }
        },
        ConfigurationSetName: params.configurationSetName
      })
    );
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Email] SES send failed:', message);
    return { success: false, error: message };
  }
}

export async function sendBookingConfirmationEmail(order: OrderWithItems): Promise<SendEmailResult> {
  const { subject, body } = generateBookingConfirmationEmail(order);

  const from = process.env.SES_FROM || process.env.SMTP_FROM;
  if (!from) {
    console.error('[Email] SES_FROM not configured — cannot send booking confirmation for order', order.id);
    return { success: false, error: 'SES_FROM not configured' };
  }
  if (!order.customerEmail) {
    console.error('[Email] Order has no customer email — skipping confirmation for order', order.id);
    return { success: false, error: 'No customer email' };
  }

  console.log(`[Email] Sending booking confirmation to ${order.customerEmail} for order ${order.id}`);
  const result = await sendViaSes({
    to: order.customerEmail,
    from,
    subject,
    html: body,
    configurationSetName: process.env.SES_CONFIGURATION_SET || undefined
  });

  if (result.success) {
    console.log(`[Email] Booking confirmation sent (messageId=${result.messageId})`);
  }
  return result;
}

export function generateBookingConfirmationEmail(order: OrderWithItems) {
  const timezone = 'Australia/Sydney';
  
  const formatDateTime = (date: Date) => {
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a');
  };

  const orderItemsHtml = order.orderItems.map(item => {
    const itemLocation = resolveLocationDetails(item.location, item.venueAddress);
    const locationLabel = itemLocation.address
      ? `${itemLocation.displayName} — ${itemLocation.address}`
      : itemLocation.displayName;
    const calendarUrl = buildCalendarUrl(order.id, item, itemLocation);
    return `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">${item.product.name}</h3>
      <p style="margin: 0 0 4px 0; color: #6b7280; text-transform: capitalize;">${item.product.type.toLowerCase()}</p>
      <p style="margin: 0 0 4px 0; color: #374151;"><strong>Student:</strong> ${item.student.name}</p>
      <p style="margin: 0 0 4px 0; color: #374151;"><strong>Date:</strong> ${formatDateTime(item.bookingDate)}</p>
      <p style="margin: 0 0 4px 0; color: #374151;"><strong>Location:</strong> ${locationLabel}</p>
      ${item.student.allergies ? `<p style="margin: 0 0 4px 0; color: #dc2626;"><strong>Allergies:</strong> ${item.student.allergies}</p>` : ''}
      <p style="margin: 0 0 12px 0; color: #374151; font-weight: 600;">$${item.price.toFixed(2)} AUD</p>
      <p style="margin: 0;">
        <a href="${calendarUrl}"
           style="display: inline-block; background: #2563eb; color: white; padding: 8px 14px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          📅 Add this to my calendar
        </a>
      </p>
    </div>
  `;
  }).join('');

  // Build one "📍 Location & Arrival Information" block per *distinct* location
  // in the order. Deduplicate on (displayName, address) so a multi-day Manly
  // booking only renders the Manly block once.
  const locationBlocks: { details: LocationDetails; key: string }[] = [];
  const seenLocationKeys = new Set<string>();
  for (const item of order.orderItems) {
    const details = resolveLocationDetails(item.location, item.venueAddress);
    const dedupeKey = `${details.displayName}|${details.address}`;
    if (seenLocationKeys.has(dedupeKey)) continue;
    seenLocationKeys.add(dedupeKey);
    locationBlocks.push({ details, key: dedupeKey });
  }

  const locationBlocksHtml = locationBlocks
    .map(
      ({ details }) => `
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; color: #92400e;">📍 Location &amp; Arrival Information</h3>
      <p style="margin: 0 0 8px 0; color: #92400e;"><strong>${details.displayName}</strong></p>
      ${details.address ? `<p style="margin: 0 0 8px 0; color: #92400e;">${details.address}</p>` : ''}
      ${renderLocationNotes(details.notes, '#92400e')}
    </div>`
    )
    .join('');

  // "What to Bring" only applies to camp bookings (birthday parties are catered
  // and we provide all materials, so the camp checklist is misleading there).
  const hasCampItem = order.orderItems.some(item => item.product.type === 'CAMP');
  const whatToBringHtml = hasCampItem
    ? `
    <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; color: #166534;">💡 What to Bring</h3>
      <ul style="margin: 0; padding-left: 20px; color: #166534;">
        <li>Water bottle (labeled with child's name)</li>
        <li>Lunch</li>
        <li>Comfortable clothes that can get messy</li>
        <li>Closed-toe shoes</li>
        <li>Any snacks for longer sessions</li>
      </ul>
    </div>`
    : '';

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

    ${locationBlocksHtml}

    ${whatToBringHtml}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <div style="text-align: center; color: #6b7280; font-size: 14px;">
      <p>Questions? Reply to this email or contact us:</p>
      <p>📧 hello@tinkertank.rocks | 📞 1300 670 104</p>
      <p style="margin-top: 20px;">
        <a href="https://tinkertank.rocks" style="color: #2563eb;">TinkerTank</a> - 
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
