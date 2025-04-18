/**
 * This module defines the routes for user authentication and profile management.
 * It includes the following functionalities:
 * 
 * 1. User login:
 *    - Authenticates a user and generates a JWT token.
 * 
 * 2. User registration:
 *    - Registers a new user with validation and rate limiting.
 * 
 * 3. User verification:
 *    - Verifies if a user exists based on their email.
 * 
 * 4. Password reset:
 *    - Resets the password for a user with validation and rate limiting.
 * 
 * The module uses express-rate-limit for rate limiting and includes input validation middleware.
 */
const express = require("express");
const { login, register, resetPassword, verifyUser } = require("../controllers/authController");
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Async handler wrapper for consistent error handling
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// Rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: {
      message: 'Too many attempts. Please try again later.',
      status: 429
    }
  }
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  message: {
    error: {
      message: 'Too many login attempts. Please try again later.',
      status: 429
    }
  }
});

// Input validation middleware
const validateAuthInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      error: {
        message: 'Valid email is required',
        status: 400
      }
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      error: {
        message: 'Password must be at least 6 characters long',
        status: 400
      }
    });
  }

  next();
};

// Registration validation middleware
const validateRegistration = (req, res, next) => {
  const { email, password, fullName, role,itAdmin } = req.body;

  if (!fullName  || fullName .trim().length === 0) {
    return res.status(400).json({
      error: {
        message: 'Name is required',
        status: 400
      }
    });
  }

  if (!role) {
    return res.status(400).json({
      error: {
        message: 'Role is required',
        status: 400
      }
    });
  }

  next();
};

// Route for user login
router.post("/login", 
  loginLimiter,
  validateAuthInput,
  asyncHandler(async (req, res) => {
    const result = await login(req, res);
    return result;
  })
);

// Route for user registration
router.post("/register",
  authLimiter,
  validateAuthInput,
  validateRegistration,
  asyncHandler(async (req, res) => {
    const result = await register(req, res);
    return result;
  })
);

// Route for user verification
router.post('/verify-user',
  authLimiter,
  asyncHandler(async (req, res) => {
    const result = await verifyUser(req, res);
    return result;
  })
);

// Route for resetting password
router.post("/reset-password",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        error: {
          message: 'Valid email is required',
          status: 400
        }
      });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        error: {
          message: 'Password must be at least 8 characters long',
          status: 400
        }
      });
    }

    // Proceed with resetting the password
    const result = await resetPassword(req, res);
    return result;
  })
);

// Error handling middleware specific to auth routes
router.use((err, req, res, next) => {
  console.error('Auth route error:', err);

  // Handle Firebase Auth specific errors
  if (err.code === 'auth/user-not-found') {
    return res.status(404).json({
      error: {
        message: 'User not found',
        status: 404
      }
    });
  }

  if (err.code === 'auth/wrong-password') {
    return res.status(401).json({
      error: {
        message: 'Invalid credentials',
        status: 401
      }
    });
  }

  if (err.code === 'auth/email-already-in-use') {
    return res.status(409).json({
      error: {
        message: 'Email already registered',
        status: 409
      }
    });
  }

  if (err.code === 'auth/invalid-email') {
    return res.status(400).json({
      error: {
        message: 'Invalid email format',
        status: 400
      }
    });
  }

  if (err.code === 'auth/weak-password') {
    return res.status(400).json({
      error: {
        message: 'Password is too weak',
        status: 400
      }
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Authentication error' 
        : err.message,
      status: err.status || 500
    }
  });
});

module.exports = router;