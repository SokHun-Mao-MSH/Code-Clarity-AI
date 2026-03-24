import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ensureDate(date: any): Date {
  if (!date) return new Date();
  if (typeof date.toDate === 'function') {
    return date.toDate();
  }
  return new Date(date);
}
