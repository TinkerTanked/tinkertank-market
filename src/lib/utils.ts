import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(price);
}

export function formatDuration(duration: string): string {
  return duration.replace('hours', 'hrs').replace('hour', 'hr');
}

export function getAgeColor(ageRange: string): string {
  if (ageRange.includes('5-') || ageRange.includes('6-')) return 'bg-green-100 text-green-800';
  if (ageRange.includes('8-') || ageRange.includes('9-')) return 'bg-blue-100 text-blue-800';
  if (ageRange.includes('12') || ageRange.includes('14') || ageRange.includes('16')) return 'bg-purple-100 text-purple-800';
  return 'bg-orange-100 text-orange-800';
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'camps': return '🏕️';
    case 'birthdays': return '🎉';
    case 'subscriptions': return '🔥';
    default: return '⚡';
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'camps': return 'bg-emerald-500';
    case 'birthdays': return 'bg-pink-500';
    case 'subscriptions': return 'bg-orange-500';
    default: return 'bg-blue-500';
  }
}
