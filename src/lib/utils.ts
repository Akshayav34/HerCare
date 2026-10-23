import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'Not specified';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTime(timeString?: string): string {
  if (!timeString) return '';
  try {
    // If format is HH:mm or HH:mm:ss
    const [hours, minutes] = timeString.split(':');
    const d = new Date();
    d.setHours(parseInt(hours, 10));
    d.setMinutes(parseInt(minutes, 10));
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return timeString;
  }
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function calculateAge(dobString?: string): number | null {
  if (!dobString) return null;
  try {
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  } catch {
    return null;
  }
}

/**
 * Resolves the canonical public application URL.
 * Prioritizes VITE_APP_URL when configured.
 * Sanitizes against localhost in production environments.
 */
export function getAppBaseUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const clean = envUrl.trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined' && window.location) {
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // In production (e.g. *.vercel.app), avoid embedding localhost
      if (!isLocalHost && (clean.includes('localhost') || clean.includes('127.0.0.1'))) {
        return window.location.origin;
      }
    }
    return clean;
  }
  return typeof window !== 'undefined' && window.location ? window.location.origin : '';
}

/**
 * Generates the public emergency viewer link for a bearer token.
 */
export function getEmergencyCardUrl(plainToken: string): string {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/emergency/${plainToken}`;
}
