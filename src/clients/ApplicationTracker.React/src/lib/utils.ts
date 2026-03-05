import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ApiError } from '@/api/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getToastErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status >= 500 || err.status === 405) {
      return 'Something went wrong on our end. Please try again later.';
    }
    return err.message || fallback;
  }
  return 'Unable to reach the server. Please check your connection.';
}
