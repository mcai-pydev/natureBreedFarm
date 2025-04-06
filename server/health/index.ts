import { Router } from 'express';
import performAuthHealthCheck from './auth-health';
import { checkRouteHealth, getRouteCoverageDetails } from './route-health';

const healthRouter = Router();

/**
 * General health check endpoint
 */
healthRouter.get('/', async (req, res) => {
  // Basic service health check
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'active',
      db: 'connected',
    },
  });
});

/**
 * Specific auth health check endpoint
 */
healthRouter.get('/auth', async (req, res) => {
  try {
    const result = await performAuthHealthCheck(
      process.env.NODE_ENV === 'production'
        ? `https://${req.headers.host}`
        : `http://${req.headers.host || 'localhost:5000'}`
    );
    
    res.status(result.status === 'ok' ? 200 : 500).json(result);
  } catch (error) {
    console.error('❌ Error in auth health check:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to perform auth health check: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Boot status health check
 */
healthRouter.get('/boot', async (req, res) => {
  try {
    // Read from boot-status.json file to report current boot status
    // This is implementation-specific, but we can mock it for now
    const bootStatus = {
      status: 'active',
      timestamp: new Date().toISOString(),
      components: {
        auth: process.env.AUTH_BOOT_STATUS || 'ok',
        database: process.env.DB_BOOT_STATUS || 'ok',
        api: 'ok',
      },
    };
    
    res.json(bootStatus);
  } catch (error) {
    console.error('❌ Error checking boot status:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to check boot status: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Routes health check endpoint
 */
healthRouter.get('/routes', async (req, res) => {
  try {
    const result = await checkRouteHealth();
    result.timestamp = new Date().toISOString();
    
    res.status(result.status === 'success' ? 200 : 500).json(result);
  } catch (error) {
    console.error('❌ Error in routes health check:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to perform routes health check: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Detailed route coverage and button binding status
 * This endpoint is primarily for developer use and internal monitoring
 */
healthRouter.get('/coverage', async (req, res) => {
  try {
    const coverageDetails = getRouteCoverageDetails();
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      routes: coverageDetails.routes,
      buttons: coverageDetails.buttons,
      summary: coverageDetails.summary
    });
  } catch (error) {
    console.error('❌ Error retrieving coverage details:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to retrieve coverage details: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    });
  }
});

export default healthRouter;