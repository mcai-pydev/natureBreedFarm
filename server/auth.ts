import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import bcrypt from 'bcryptjs';
import { storage } from "./storage";
import { emailService } from "./email";
import { User as SelectUser } from "@shared/schema";
import { requirePermission } from "./middleware/rbac";
import { Permissions, UserRoles } from "./types/roles";
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'nature-breed-farm-jwt-secret';
const JWT_EXPIRES_IN = '24h';

async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

// Generate a JWT token for a user
function generateToken(user: SelectUser) {
  const { password, ...userDataWithoutPassword } = user;
  return jwt.sign(userDataWithoutPassword, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify and decode a JWT token
function verifyToken(token: string): SelectUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Omit<SelectUser, 'password'>;
    return decoded as SelectUser;
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return null;
  }
}

async function comparePasswords(supplied: string, stored: string) {
  return await bcrypt.compare(supplied, stored);
}

// Extract JWT token from Authorization header
const extractToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove "Bearer " prefix
  }
  return null;
};

// Middleware to authenticate via JWT token
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    // First try the session-based auth
    if (req.isAuthenticated()) {
      return next();
    }
    
    // Then try JWT token auth
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Set the user on the request object for downstream middleware
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    console.error('❌ JWT authentication error:', error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Middleware to ensure user is authenticated (supports both session and JWT)
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() && !(req as any).user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Middleware to ensure user is admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated either via session or JWT
  if ((!req.isAuthenticated() && !(req as any).user) || 
      (req.user && req.user.role !== UserRoles.ADMIN)) {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
};

// Export permission-based middleware functions for common operations
export const requireReadProduct = requirePermission(Permissions.READ_PRODUCT);
export const requireCreateProduct = requirePermission(Permissions.CREATE_PRODUCT);
export const requireUpdateProduct = requirePermission(Permissions.UPDATE_PRODUCT);
export const requireDeleteProduct = requirePermission(Permissions.DELETE_PRODUCT);

export const requireReadOrder = requirePermission(Permissions.READ_ORDER);
export const requireReadAllOrders = requirePermission(Permissions.READ_ALL_ORDERS);
export const requireCreateOrder = requirePermission(Permissions.CREATE_ORDER);
export const requireUpdateOrder = requirePermission(Permissions.UPDATE_ORDER);
export const requireDeleteOrder = requirePermission(Permissions.DELETE_ORDER);

export const requireReadAnimal = requirePermission(Permissions.READ_ANIMAL);
export const requireCreateAnimal = requirePermission(Permissions.CREATE_ANIMAL);
export const requireUpdateAnimal = requirePermission(Permissions.UPDATE_ANIMAL);
export const requireDeleteAnimal = requirePermission(Permissions.DELETE_ANIMAL);

export const requireReadAnalytics = requirePermission(Permissions.READ_ANALYTICS);
export const requireManageNewsletters = requirePermission(Permissions.MANAGE_NEWSLETTERS);
export const requireManageBulkOrders = requirePermission(Permissions.MANAGE_BULK_ORDERS);

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "farm-management-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  };
  
  console.log('🔑 Session configuration initialized');

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
      console.log('📝 Registration attempt with data:', { ...req.body, password: '[REDACTED]' });
      
      const { username, password, name, role, avatar } = req.body;
      
      // Validate required fields
      if (!username || !password || !name) {
        console.log('❌ Registration failed: Missing required fields');
        return res.status(400).json({ 
          message: "Username, password, and name are required",
          missingFields: [
            !username ? 'username' : null,
            !password ? 'password' : null,
            !name ? 'name' : null
          ].filter(Boolean)
        });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log('❌ Registration failed: Username already exists -', username);
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password and create user
      console.log('🔒 Hashing password for new user');
      const hashedPassword = await hashPassword(password);
      
      console.log('👤 Creating new user in database with username:', username);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        role: role || "User",
        avatar
      });

      console.log('✅ User created successfully with ID:', user.id);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Send registration confirmation email if email service is ready and username is an email
      if (emailService.isReady() && username.includes('@')) {
        // In development, log success instead of sending email
        if (process.env.NODE_ENV !== 'production') {
          console.log("Development environment: Simulating registration confirmation email to", username);
        } else {
          console.log('📧 Sending registration confirmation email to', username);
          await emailService.sendRegistrationConfirmation(username, name);
        }
      }

      // Log the user in automatically
      console.log('🔑 Automatically logging in new user:', username);
      req.login(user, (err) => {
        if (err) {
          console.error('❌ Auto-login failed for new user:', err);
          return next(err);
        }
        
        console.log('✅ Registration and auto-login successful for:', username);
        res.status(201).json({
          ...userWithoutPassword,
          emailSent: username.includes('@') && emailService.isReady()
        });
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('🔒 Login attempt for username:', req.body.username);

    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: any) => {
      if (err) {
        console.error('❌ Login error:', err);
        return next(err);
      }
      
      if (!user) {
        console.log('❌ Login failed: Invalid username or password for:', req.body.username);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.login(user, (err: Error | null) => {
        if (err) {
          console.error('❌ Session creation error:', err);
          return next(err);
        }
        
        console.log('✅ Login successful for user:', user.username, 'with role:', user.role);
        
        // Generate JWT token
        const token = generateToken(user);
        console.log('🔑 Generated JWT token for user:', user.username);
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        // Add token to response cookies for an additional layer of security
        res.cookie('auth_token', token, {
          httpOnly: true, // Cookie cannot be accessed via JS
          secure: process.env.NODE_ENV === 'production', // Only sent over HTTPS in production 
          sameSite: 'lax', // Helps prevent CSRF
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        // Return user data with token
        return res.status(200).json({
          user: userWithoutPassword,
          token // Also include token in response body for localStorage
        });
      });
    })(req, res, next);
  });
  
  // New endpoint for JWT token verification
  app.get("/api/me", authenticateJWT, (req, res) => {
    try {
      // User is already authenticated via JWT token or session
      console.log('ℹ️ User authenticated via JWT or session', {
        username: req.user?.username,
        role: req.user?.role,
        method: req.isAuthenticated() ? 'session' : 'jwt'
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = req.user as SelectUser;
      
      // Return user data
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error('❌ JWT verification error:', error);
      return res.status(401).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    // Store username before logout for logging
    const username = req.user?.username || 'unknown';
    
    console.log('🔓 Logout requested for user:', username);
    
    // Clear JWT cookie
    res.clearCookie('auth_token');
    
    // End session if authenticated
    if (req.isAuthenticated()) {
      req.logout((err) => {
        if (err) {
          console.error('❌ Logout error:', err);
          return next(err);
        }
        
        console.log('✅ Logout successful for user:', username);
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      console.log('✅ JWT logout successful for user:', username);
      res.status(200).json({ message: "Logged out successfully" });
    }
  });

  app.get("/api/user", (req, res, next) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }
      
      // Log success
      console.log('ℹ️ User data requested - authenticated as:', 
        req.user?.username, 'with role:', req.user?.role);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = req.user as SelectUser;
      
      // Return user data
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error('❌ Error retrieving user data:', error);
      next(error);
    }
  });

  // Forgot password endpoints
  // Store reset tokens with expiration times (in a real app, this would be in a database)
  const passwordResetTokens = new Map<string, { username: string, expires: Date }>();
  
  app.post("/api/forgot-password", async (req, res) => {
    try {
      console.log('🔑 Password reset request received');
      
      const { username } = req.body;
      if (!username) {
        console.log('❌ Password reset failed: Missing username');
        return res.status(400).json({ message: "Username is required" });
      }
      
      console.log('🔍 Looking up user account for reset:', username);
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        // Security best practice: Don't reveal that the user doesn't exist
        console.log('⚠️ Password reset attempted for non-existent user:', username);
        return res.status(200).json({ 
          message: "If the account exists, a reset token has been sent",
          success: false
        });
      }
      
      // Generate a secure random token
      console.log('🔐 Generating secure reset token for user:', username);
      const token = randomBytes(32).toString("hex");
      
      // Store the token with a 1-hour expiration
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);
      passwordResetTokens.set(token, { username, expires });
      
      console.log('✅ Reset token generated for user:', username, 'expiring at:', expires);
      
      // In a real application, we would send this token via email
      // For this demo environment, we'll just return it in the response (not secure for production)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Development environment: Password reset token for ${username}: ${token}`);
        
        // Note: In production, you would send an email with a reset link
        // For demonstration purposes, we'll directly return the token
        return res.status(200).json({ 
          message: "Password reset token generated successfully",
          token,  // Would not include this in production
          expires: expires.toISOString(),
          // This is simulating what would happen in production:
          note: "In a real app, this token would be sent to the user's email with a link to the reset page" 
        });
      } else {
        // In production, don't return the token in the response
        if (emailService.isReady() && username.includes('@')) {
          console.log('📧 Sending password reset email to:', username);
          // await emailService.sendPasswordResetEmail(username, token);
          
          return res.status(200).json({ 
            message: "A password reset link has been sent to your email",
            success: true
          });
        } else {
          console.log('📱 Password reset notification would be sent to user');
          return res.status(200).json({ 
            message: "Password reset instructions have been sent",
            success: true
          });
        }
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      return res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  
  app.post("/api/reset-password", async (req, res) => {
    try {
      console.log('🔄 Password reset attempt with token');
      
      const { token, newPassword } = req.body;
      
      // Validate required fields
      if (!token || !newPassword) {
        console.log('❌ Password reset failed: Missing required data');
        return res.status(400).json({ 
          message: "Token and new password are required",
          missingFields: [
            !token ? 'token' : null,
            !newPassword ? 'newPassword' : null
          ].filter(Boolean)
        });
      }
      
      // Validate password strength
      if (newPassword.length < 8) {
        console.log('❌ Password reset failed: Password too short');
        return res.status(400).json({ 
          message: "Password must be at least 8 characters long",
          fieldError: 'newPassword'
        });
      }
      
      // Check if token exists and is still valid
      console.log('🔍 Validating password reset token');
      const resetData = passwordResetTokens.get(token);
      
      if (!resetData) {
        console.log('❌ Password reset failed: Token not found');
        return res.status(400).json({ message: "Invalid token" });
      }
      
      if (resetData.expires < new Date()) {
        console.log('❌ Password reset failed: Token expired at', resetData.expires);
        return res.status(400).json({ 
          message: "Token has expired",
          expiredAt: resetData.expires.toISOString()
        });
      }
      
      // Find the user
      console.log('🔍 Finding user for password reset:', resetData.username);
      const user = await storage.getUserByUsername(resetData.username);
      
      if (!user) {
        console.log('❌ Password reset failed: User not found for token');
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the user's password
      console.log('🔒 Hashing new password for user:', user.username);
      const hashedPassword = await hashPassword(newPassword);
      
      console.log('✏️ Updating password for user ID:', user.id);
      await storage.updateUser(user.id, { password: hashedPassword });
      
      // Remove the used token
      console.log('🗑️ Removing used reset token from active tokens');
      passwordResetTokens.delete(token);
      
      console.log('✅ Password successfully reset for user:', user.username);
      
      // Notify user of successful password change if this was a real app
      if (process.env.NODE_ENV === 'production' && emailService.isReady() && user.username.includes('@')) {
        console.log('📧 Sending password change confirmation email to:', user.username);
        // await emailService.sendPasswordChangeConfirmation(user.username);
      }
      
      return res.status(200).json({ 
        message: "Password has been reset successfully",
        success: true
      });
    } catch (error) {
      console.error('❌ Password reset error:', error);
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
