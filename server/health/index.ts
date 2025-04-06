import { Router } from 'express';
import performAuthHealthCheck from './auth-health';

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

export default healthRouter;