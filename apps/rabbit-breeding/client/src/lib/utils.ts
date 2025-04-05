import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string or Date object to a human-readable format
 * @param date The date to format
 * @param includeTime Whether to include the time in the output
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | undefined, includeTime: boolean = false): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Calculate and format the age string from a birth date
 * @param dateOfBirth The birth date
 * @returns Age string in format "X years, Y months"
 */
export function getAgeString(dateOfBirth: string | Date | undefined): string {
  if (!dateOfBirth) return 'Unknown';
  
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) return 'Invalid date';
  
  const now = new Date();
  
  // Calculate difference in milliseconds
  const diffTime = now.getTime() - birthDate.getTime();
  
  // Convert to months
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
  
  if (diffMonths < 0) {
    return 'Future date';
  }
  
  if (diffMonths < 1) {
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
  
  if (diffMonths < 24) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
  }
  
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  
  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
}