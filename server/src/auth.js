import { ConfidentialClientApplication } from '@azure/msal-node';
import session from 'express-session';
import cookieParser from 'cookie-parser';

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
    console.warn('⚠️  Azure AD credentials not configured. SSO will be disabled.');
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

  // Configure session middleware
  app.use(session({
    secret: SESSION_SECRET || 'fallback-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS in production, HTTP in dev
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' // Same-domain cookies (frontend and backend on same domain)
    }
  }));

  console.log('✅ Azure AD authentication configured with MSAL');
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
