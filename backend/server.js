/**
 * This module sets up and configures the Express server for the application.
 * 
 * Key functionalities:
 * - Middleware setup (security, CORS, compression, body parsing, logging).
 * - API routes for authentication, user, project, form, grade, and evaluator management.
 * - Health check and debug endpoints.
 * - Error handling.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require('helmet');
const compression = require('compression');
const db = require("./config/firebaseAdmin");

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.vercel.app", "https://*.firebase.com", "https://*.googleapis.com"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    /\.vercel\.app$/,
    /localhost/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Body parser middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Firebase connection check middleware
const checkFirebaseConnection = (req, res, next) => {
  if (!db) {
    console.error('Firebase not initialized');
    return res.status(500).json({
      error: {
        message: 'Database connection error',
        status: 500
      }
    });
  }
  next();
};

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production'
    },
    firebase: {
      isInitialized: !!db,
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasDatabaseUrl: !!process.env.FIREBASE_DATABASE_URL
    },
    server: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// Enhanced health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV,
    firebase: db ? 'connected' : 'not initialized',
    timestamp: new Date().toISOString()
  });
});

// Apply Firebase check to all API routes
app.use('/api/auth', checkFirebaseConnection, require("./routes/authRoutes"));
app.use('/api/users', checkFirebaseConnection, require("./routes/userRoutes"));
app.use('/api/projects', checkFirebaseConnection, require("./routes/projectRoutes"));
app.use('/api/forms', checkFirebaseConnection, require("./routes/formRoutes"));
app.use('/api/grades', checkFirebaseConnection, require("./routes/finalGradeRoutes"));
app.use('/api/evaluators', checkFirebaseConnection, require("./routes/evaluatorRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      status: 404,
      path: req.path
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);

  // Handle Firebase Admin initialization errors
  if (err.code === 'app/no-app') {
    return res.status(500).json({
      error: {
        message: 'Firebase initialization failed',
        status: 500,
        code: err.code
      }
    });
  }

  // Handle Firebase permission errors
  if (err.code === 'permission-denied') {
    return res.status(403).json({
      error: {
        message: 'Firebase permission denied',
        status: 403,
        code: err.code
      }
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: err.message,
        status: 400,
        type: 'validation'
      }
    });
  }

  // Handle unauthorized errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: {
        message: 'Invalid token',
        status: 401,
        type: 'auth'
      }
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message,
      status: err.status || 500,
      path: req.path
    }
  });
});

// Start the server only if this file is executed directly
if (require.main === module) {
  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Firebase status: ${db ? 'connected' : 'not initialized'}`);
  });
}

module.exports = app;

// vite.config.js
module.exports = {
  server: {
    port: 4001, // New port
  },
};