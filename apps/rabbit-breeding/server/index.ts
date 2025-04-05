import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { registerRoutes } from './routes';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function startServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  });
  
  // Register all routes
  const server = await registerRoutes(app);
  
  // Start listening
  server.listen(PORT, () => {
    console.log(`🐰 Rabbit Breeding Micro-App server is running on port ${PORT}`);
  });
  
  return server;
}

// Start the server
if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default startServer;