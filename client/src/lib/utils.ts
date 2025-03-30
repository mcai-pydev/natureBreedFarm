import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date in a readable format
 * @param date Date object or date string to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  let dateObj: Date;
  try {
    dateObj = date instanceof Date ? date : new Date(date);
    // Check if valid date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj)
}
