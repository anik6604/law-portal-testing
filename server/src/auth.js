/**
 * Authentication Module - Azure AD OAuth2 with MSAL
 * 
 * Implements TAMU NetID SSO integration with Redis session management.
 * 
 * @author TAMU CSCE 482 Capstone Team (Fall 2025)
 */

import { ConfidentialClientApplication } from '@azure/msal-node';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

let msalInstance = null;
let authConfig = null;

/**
 * Configure MSAL authentication with Azure AD
 * This is Microsoft's recommended approach (not deprecated)
 */
export function configureAuth(app) {
  const {
    AZURE_AD_CLIENT_ID,
    AZURE_AD_CLIENT_SECRET,
    AZURE_AD_TENANT_ID,
    AZURE_AD_REDIRECT_URI,
    SESSION_SECRET
  } = process.env;

  // Validate environment variables
  if (!AZURE_AD_CLIENT_ID || !AZURE_AD_CLIENT_SECRET || !AZURE_AD_TENANT_ID) {
    console.warn('WARNING: Azure AD credentials not configured. SSO will be disabled.');
    return false;
  }

  // Configure MSAL
  authConfig = {
    auth: {
      clientId: AZURE_AD_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}`,
      clientSecret: AZURE_AD_CLIENT_SECRET,
    },
    system: {
      loggerOptions: {
        loggerCallback(loglevel, message, containsPii) {
          if (loglevel <= 1) { // Error level
            console.error(message);
          }
        },
        piiLoggingEnabled: false,
        logLevel: 3, // Warning
      }
    }
  };

  msalInstance = new ConfidentialClientApplication(authConfig);

  // Configure cookie parser
  app.use(cookieParser());

  // Configure Redis for session storage (if REDIS_URL is provided)
  let sessionStore;
  if (process.env.REDIS_URL) {
    try {
      const redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      });

      redisClient.on('error', (err) => console.error('Redis Client Error:', err));
      redisClient.on('connect', () => console.log('Connected to Redis for session storage'));

      // Connect to Redis
      redisClient.connect().catch(console.error);

      sessionStore = new RedisStore({
        client: redisClient,
        prefix: 'tamu-law:',
        ttl: 86400, // 24 hours in seconds
      });

      console.log('Using Redis for persistent session storage');
    } catch (error) {
      console.error('FAILED to connect to Redis, falling back to MemoryStore:', error.message);
      sessionStore = undefined; // Will use default MemoryStore
    }
  } else {
    console.warn('WARNING: REDIS_URL not configured. Using MemoryStore (sessions will be lost on restart)');
  }

  const isProd = process.env.NODE_ENV === 'production';

  // Configure session middleware
  app.use(session({
    store: sessionStore, // Use Redis if available, otherwise default MemoryStore
    secret: SESSION_SECRET || 'fallback-secret-change-me',
    name: 'tamu.sid', // Explicit cookie name
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: isProd, // HTTPS only in production
      sameSite: isProd ? 'none' : 'lax', // OAuth cross-site redirect requires 'none' in prod
    }
  }));

  console.log('Azure AD authentication configured with MSAL');
  return true;
}

/**
 * Get MSAL instance
 */
export function getMsalInstance() {
  return msalInstance;
}

/**
 * Get auth config
 */
export function getAuthConfig() {
  return authConfig;
}

/**
 * Middleware to check if user is authenticated
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  
  res.status(401).json({
    error: 'Unauthorized',
    message: 'You must be logged in with a TAMU account to access this resource',
    loginUrl: '/auth/login'
  });
}

/**
 * Middleware to check if user has TAMU email (for admin/faculty routes)
 */
export function requireTAMUEmail(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }

  const email = req.session.user?.email || '';
  if (!email.endsWith('@tamu.edu') && !email.endsWith('@law.tamu.edu')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access restricted to TAMU faculty and staff only'
    });
  }

  next();
}
