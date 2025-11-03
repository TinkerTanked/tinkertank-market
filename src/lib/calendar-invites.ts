import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  location: {
    name: string;
    address: string;
  };
}

interface AttendeeInfo {
  name: string;
  email: string;
}

export function generateICalContent(event: CalendarEvent, attendee: AttendeeInfo): string {
  const timezone = 'Australia/Sydney';
  
  // Convert to UTC for iCal format
  const startUTC = toZonedTime(event.startDateTime, 'UTC');
  const endUTC = toZonedTime(event.endDateTime, 'UTC');
  
  const formatICalDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  const uid = `event-${event.id}@tinkertank.com.au`;
  const now = new Date();
  const timestamp = formatICalDate(now);

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TinkerTank//TinkerTank Market//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${formatICalDate(startUTC)}`,
    `DTEND:${formatICalDate(endUTC)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || 'TinkerTank Activity'}`,
    `LOCATION:${event.location.name}, ${event.location.address}`,
    `ORGANIZER;CN=TinkerTank:MAILTO:hello@tinkertank.com.au`,
    `ATTENDEE;CN=${attendee.name};RSVP=TRUE:MAILTO:${attendee.email}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:EMAIL',
    'DESCRIPTION:Reminder: TinkerTank activity tomorrow',
    `SUMMARY:${event.title} - Tomorrow`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icalContent;
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date) => {
    return format(toZonedTime(date, 'Australia/Sydney'), "yyyyMMdd'T'HHmmss");
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startDateTime)}/${formatGoogleDate(event.endDateTime)}`,
    details: event.description || 'TinkerTank Activity',
    location: `${event.location.name}, ${event.location.address}`,
    ctz: 'Australia/Sydney'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const formatOutlookDate = (date: Date) => {
    return toZonedTime(date, 'UTC').toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    subject: event.title,
    startdt: formatOutlookDate(event.startDateTime),
    enddt: formatOutlookDate(event.endDateTime),
    body: event.description || 'TinkerTank Activity',
    location: `${event.location.name}, ${event.location.address}`,
    allday: 'false',
    uid: `event-${event.id}@tinkertank.com.au`
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function generateAppleCalendarUrl(event: CalendarEvent): string {
  // Apple Calendar uses the same format as Google Calendar
  return generateGoogleCalendarUrl(event);
}
