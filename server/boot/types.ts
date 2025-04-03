/**
 * Boot System Type Definitions
 */

export interface BootModule {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  details?: any;
}