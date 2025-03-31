import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { emailService } from "./email";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "farm-management-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, name, role, avatar } = req.body;
      
      if (!username || !password || !name) {
        return res.status(400).json({ message: "Username, password, and name are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        name,
        role: role || "User",
        avatar
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Send registration confirmation email if email service is ready and username is an email
      if (emailService.isReady() && username.includes('@')) {
        // In development, log success instead of sending email
        if (process.env.NODE_ENV !== 'production') {
          console.log("Development environment: Simulating registration confirmation email to", username);
        } else {
          await emailService.sendRegistrationConfirmation(username, name);
        }
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          ...userWithoutPassword,
          emailSent: username.includes('@') && emailService.isReady()
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Forgot password endpoints
  // Store reset tokens with expiration times (in a real app, this would be in a database)
  const passwordResetTokens = new Map<string, { username: string, expires: Date }>();
  
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        // Don't reveal that the user doesn't exist for security reasons
        return res.status(200).json({ message: "If the account exists, a reset token has been sent" });
      }
      
      // Generate a reset token
      const token = randomBytes(32).toString("hex");
      
      // Store the token with a 1-hour expiration
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);
      passwordResetTokens.set(token, { username, expires });
      
      // In a real application, we would send this token via email
      // For this demo, we'll just return it in the response (not secure for production)
      console.log(`Password reset token for ${username}: ${token}`);
      
      // Note: In production, you would send an email with a reset link
      // For demonstration purposes, we'll directly return the token
      return res.status(200).json({ 
        message: "Password reset token generated successfully",
        token,  // Would not include this in production
        // This is simulating what would happen in production:
        note: "In a real app, this token would be sent to the user's email with a link to the reset page" 
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      // Check if token exists and is still valid
      const resetData = passwordResetTokens.get(token);
      if (!resetData || resetData.expires < new Date()) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Find the user
      const user = await storage.getUserByUsername(resetData.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the user's password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });
      
      // Remove the used token
      passwordResetTokens.delete(token);
      
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ message: "Failed to reset password" });
    }
  });
  
  // Create initial admin user if not exists (commented out as we handle this in storage.ts)
  // This was causing duplicate admin users between auth.ts and storage.ts
  // (async () => {
  //   const adminUser = await storage.getUserByUsername("admin");
  //   if (!adminUser) {
  //     await storage.createUser({
  //       username: "admin",
  //       password: await hashPassword("admin123"),
  //       name: "Chief Ijeh",
  //       role: "Admin",
  //       avatar: "/chief_ijeh.jpg"
  //     });
  //     console.log("Created initial admin user: admin / admin123");
  //   }
  // })();
}
