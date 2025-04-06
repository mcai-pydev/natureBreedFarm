/**
 * Auth System Health Check
 * 
 * This module provides functions to validate that the authentication system
 * is functioning correctly.
 */

import axios from 'axios';

// Interface for auth check result
export interface AuthCheckResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

/**
 * Performs a comprehensive check of the authentication system
 * by trying to login with test credentials and verifying the session.
 */
export async function checkAuthSystem(): Promise<AuthCheckResult> {
  try {
    // Get base URL based on environment
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.API_URL || '') // In production, use API_URL env var if set
      : 'http://localhost:5000';    // In development, use localhost
      
    // Test admin login
    console.log('Testing admin login...');
    const loginResponse = await axios.post(`${baseUrl}/api/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    // First check that we have a successful response
    if (loginResponse.status !== 200) {
      return {
        status: 'error',
        message: 'Login failed with status code: ' + loginResponse.status,
        details: {
          statusCode: loginResponse.status,
          dataReceived: loginResponse.data ? true : false
        }
      };
    }
    
    // Our authentication system returns either:
    // 1. { id, username, ... } (old format)
    // 2. { user: { id, username, ... }, token: "..." } (new format) 
    // Check for both formats
    const hasUserId = loginResponse.data?.id || (loginResponse.data?.user && loginResponse.data.user.id);
    
    if (!hasUserId) {
      return {
        status: 'error',
        message: 'Login succeeded but returned unexpected data structure',
        details: {
          statusCode: loginResponse.status,
          dataReceived: loginResponse.data ? true : false,
          dataFormat: loginResponse.data?.user ? 'nested user object' : 'unknown format'
        }
      };
    }
    
    // Keep the cookie for the next request
    const cookies = loginResponse.headers['set-cookie'];
    
    // Now check if we can access a protected endpoint
    console.log('Testing protected endpoint access...');
    try {
      const userResponse = await axios.get(`${baseUrl}/api/user`, {
        headers: {
          Cookie: cookies?.join('; ')
        }
      });
      
      // If we get here, we successfully accessed a protected endpoint
      // Check for user data in different possible formats
      const userData = userResponse.data?.user || userResponse.data;
      
      return {
        status: 'success',
        message: 'Auth system is fully functional with session persistence',
        details: {
          userId: userData?.id,
          username: userData?.username,
          role: userData?.role
        }
      };
    } catch (userError) {
      // If we can't access the user endpoint after login, authentication might work
      // but sessions might not be maintained properly
      return {
        status: 'warning',
        message: 'Login works but session persistence may have issues',
        details: {
          loginSuccess: true,
          sessionPersistence: false,
          error: userError instanceof Error ? userError.message : String(userError)
        }
      };
    }
  } catch (loginError) {
    // Check if the error is related to credentials
    if (axios.isAxiosError(loginError) && loginError.response?.status === 401) {
      return {
        status: 'warning',
        message: 'Login endpoint is functioning but credentials were rejected',
        details: {
          statusCode: loginError.response.status,
          responseData: loginError.response.data
        }
      };
    }
    
    // Any other error indicates a more serious problem
    return {
      status: 'error',
      message: `Auth system check failed: ${loginError instanceof Error ? loginError.message : String(loginError)}`,
      details: {
        error: loginError instanceof Error ? loginError.stack : String(loginError)
      }
    };
  }
}

/**
 * A simpler check that only verifies the login endpoint is responding
 * without validating credentials.
 */
export async function checkAuthEndpoints(): Promise<AuthCheckResult> {
  try {
    // Get base URL based on environment
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.API_URL || '') // In production, use API_URL env var if set
      : 'http://localhost:5000';    // In development, use localhost
    
    // Just check if the login endpoint responds
    await axios.options(`${baseUrl}/api/login`);
    
    return {
      status: 'success',
      message: 'Auth endpoints are accessible'
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Auth endpoints check failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}