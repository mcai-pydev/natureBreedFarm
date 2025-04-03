/**
 * Boot System Type Definitions
 */

export interface BootCheckResult {
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  details?: any;
}

export interface BootModule {
  name: string;
  description: string;
  check(): Promise<BootCheckResult>;
}