/**
 * Route and button status types
 */
export type RouteRenderStatus = 'success' | 'error' | 'incomplete' | 'not-tested';
export type ButtonBindingStatus = 'bound' | 'unbound' | 'not-tested';

/**
 * Route status interface
 */
export interface RouteStatus {
  path: string;
  renders: RouteRenderStatus;
  role: 'public' | 'authenticated' | 'admin' | 'unknown';
  lastTested?: string;
}

/**
 * Button binding status interface
 */
export interface ButtonStatus {
  id: string;
  route: string;
  status: ButtonBindingStatus;
  handler?: string;
  lastTested?: string;
}

/**
 * Coverage summary interface
 */
export interface CoverageSummary {
  routes: {
    total: number;
    tested: number;
    successful: number;
    failed: number;
    incomplete: number;
  };
  buttons: {
    total: number;
    bound: number;
    unbound: number;
  };
}

/**
 * Coverage details interface
 */
export interface CoverageDetails {
  routes: {
    api: RouteStatus[];
    client: RouteStatus[];
  };
  buttons: ButtonStatus[];
  summary: CoverageSummary;
}

/**
 * Coverage API response interface
 */
export interface CoverageApiResponse {
  status: string;
  timestamp: string;
  routes: {
    api: RouteStatus[];
    client: RouteStatus[];
  };
  buttons: ButtonStatus[];
  summary: CoverageSummary;
}