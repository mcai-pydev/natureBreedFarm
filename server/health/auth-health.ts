import axios from 'axios';
import { storage } from '../storage';
// Use node-fetch instead of require for compatibility
import fetch from 'node-fetch';

interface AuthHealthCheckResult {
  status: 'ok' | 'error';
  details: {
    adminUserExists: boolean;
    loginFunctional: boolean;
    jwtFunctional: boolean;
    sessionFunctional: boolean;
  };
  message: string;
  timestamp: string;
}

/**
 * Performs a comprehensive health check of the authentication system.
 * This includes checking admin user existence, login functionality, JWT tokens, and sessions.
 */
export async function performAuthHealthCheck(baseUrl: string = 'http://localhost:5000'): Promise<AuthHealthCheckResult> {
  const timestamp = new Date().toISOString();
  const result: AuthHealthCheckResult = {
    status: 'ok',
    details: {
      adminUserExists: false,
      loginFunctional: false,
      jwtFunctional: false,
      sessionFunctional: false,
    },
    message: 'Auth system is healthy',
    timestamp
  };

  try {
    // Check 1: Admin user exists
    // Try all possible admin usernames that could be in the system
    const adminUser = await storage.getUserByUsername('admin@naturebreedfarm.org') || 
                      await storage.getUserByUsername('admin') ||
                      await storage.getUserByUsername('admin@farm.com');
    result.details.adminUserExists = !!adminUser;
    
    if (!adminUser) {
      console.error('❌ Admin user not found in database');
      result.status = 'error';
      result.message = 'Admin user not found in database. Please run the seed-admin.js script.';
      return result;
    }
    
    console.log('✅ Found admin user:', adminUser.username);

    // Check 2: Login functionality
    try {
      // Use the actual username we found
      const loginResponse = await axios.post(`${baseUrl}/api/login`, {
        username: adminUser.username,
        password: 'admin123'
      });
      
      result.details.loginFunctional = loginResponse.status === 200 && !!loginResponse.data.token;
      
      // If login was successful and we got a token
      if (result.details.loginFunctional && loginResponse.data.token) {
        // Check 3: JWT token works
        try {
          const jwtResponse = await axios.get(`${baseUrl}/api/me`, {
            headers: {
              Authorization: `Bearer ${loginResponse.data.token}`
            }
          });
          
          result.details.jwtFunctional = jwtResponse.status === 200 && !!jwtResponse.data.id;
        } catch (jwtError) {
          console.error('❌ JWT verification failed:', jwtError instanceof Error ? jwtError.message : String(jwtError));
          result.details.jwtFunctional = false;
        }
        
        // Check 4: Session works
        // We use a cookie jar, but this is a simple test
        try {
          const sessionResponse = await axios.get(`${baseUrl}/api/user`, {
            headers: {
              Cookie: `auth_token=${loginResponse.data.token}`
            },
            withCredentials: true
          });
          
          result.details.sessionFunctional = sessionResponse.status === 200 && !!sessionResponse.data.id;
        } catch (sessionError) {
          console.error('❌ Session verification failed:', sessionError instanceof Error ? sessionError.message : String(sessionError));
          result.details.sessionFunctional = false;
        }
      }
    } catch (loginError) {
      console.error('❌ Login attempt failed:', loginError instanceof Error ? loginError.message : String(loginError));
      result.details.loginFunctional = false;
    }
    
    // Determine overall status
    if (!result.details.adminUserExists || 
        !result.details.loginFunctional ||
        (!result.details.jwtFunctional && !result.details.sessionFunctional)) {
      result.status = 'error';
      result.message = 'Auth system has issues';
    }
    
    return result;
  } catch (error) {
    console.error('❌ Auth health check error:', error);
    return {
      status: 'error',
      details: {
        adminUserExists: false,
        loginFunctional: false,
        jwtFunctional: false,
        sessionFunctional: false,
      },
      message: `Auth health check failed: ${error instanceof Error ? error.message : String(error)}`,
      timestamp
    };
  }
}

export default performAuthHealthCheck;