import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with tailwind-merge to prevent conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a human readable string
 */
export function formatDate(date: Date | string | number | undefined | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Capitalizes the first letter of each word in a string
 */
export function capitalize(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Gets age in months from a birth date
 */
export function getAgeInMonths(birthDate: Date | string | null | undefined): number | null {
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  const now = new Date();
  
  const monthDiff = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(0, monthDiff);
}

/**
 * Gets a human readable age string
 */
export function getAgeString(birthDate: Date | string | null | undefined): string {
  if (!birthDate) return 'Unknown age';
  
  const months = getAgeInMonths(birthDate);
  if (months === null) return 'Unknown age';
  
  if (months < 1) {
    // Calculate days
    const birth = new Date(birthDate);
    const now = new Date();
    const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  }
  
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  
  return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}

/**
 * Generates a gender badge color class
 */
export function getGenderColorClass(gender: string | undefined | null): string {
  if (!gender) return 'bg-gray-100 text-gray-800';
  
  switch (gender.toLowerCase()) {
    case 'male':
      return 'bg-blue-100 text-blue-800';
    case 'female':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Generates a status badge color class
 */
export function getStatusColorClass(status: string | undefined | null): string {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'breeding':
      return 'bg-purple-100 text-purple-800';
    case 'retired':
      return 'bg-orange-100 text-orange-800';
    case 'sold':
      return 'bg-blue-100 text-blue-800';
    case 'deceased':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}