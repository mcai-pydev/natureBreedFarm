import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { bootSystem } from "./boot/index";
import { seedAnimalData, seedUserData } from "./seed-data";

const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add authentication debugging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && 
      req.path !== '/api/login' && 
      req.path !== '/api/register' && 
      req.path !== '/api/health') {
      
    // Wait a tiny bit to ensure auth middleware has run
    setTimeout(() => {
      const user = req.user || (req as any).user;
      console.log('🔍 Auth Debug -', req.path, {
        isAuthenticated: req.isAuthenticated?.() || false,
        hasJwtUser: !!(req as any).user,
        username: user?.username || 'none',
        role: user?.role || 'none',
        method: req.isAuthenticated?.() ? 'session' : ((req as any).user ? 'jwt' : 'none'),
        timestamp: new Date().toISOString()
      });
    }, 0);
  }
  next();
});

// Request timing and logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0"
  }, async () => {
    log(`serving on port ${port}`);
    
    if (!isProduction) {
      // Seed user data to database
      try {
        log('Seeding user data to database...');
        const userSeedResult = await seedUserData();
        if (userSeedResult.success) {
          log(`✅ User seed successful: ${userSeedResult.message}`);
        } else {
          log(`⚠️ User seed warning: ${userSeedResult.message}`);
        }
      } catch (error) {
        log(`❌ Error seeding user data: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Seed animal data from in-memory to database - only in development
    if (!isProduction) {
      try {
        log('Seeding animal data from in-memory to database...');
        const animalSeedResult = await seedAnimalData();
        if (animalSeedResult.success) {
          log(`✅ Animal seed successful: ${animalSeedResult.message}`);
        } else {
          log(`⚠️ Animal seed warning: ${animalSeedResult.message}`);
        }
      } catch (error) {
        log(`❌ Error seeding animal data: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Run boot system checks after server has started
    try {
      log('Running system boot checks...');
      const bootStatus = await bootSystem();
      log(`Boot status: ${bootStatus.overallStatus.toUpperCase()}`);
      
      if (bootStatus.overallStatus === 'error') {
        log('⚠️ WARNING: System boot completed with errors. Check /api/health for details.');
      } else if (bootStatus.overallStatus === 'warning') {
        log('⚠️ System boot completed with warnings. Check /api/health for details.');
      } else {
        log('✅ System boot completed successfully!');
      }
    } catch (error) {
      log(`❌ Error during system boot: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
})();
