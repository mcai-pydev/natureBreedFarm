export type HealthStatus = 'success' | 'warning' | 'error' | 'info' | 'ok';

export interface HealthCheckResult {
  status: HealthStatus;
  message: string;
  timestamp?: string;
  details?: any;
}