// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { logger } = require('../utils/logger');
const twoFactorService = require('../services/twoFactorService');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345';
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ 
      status: 'error', 
      message: 'Please authenticate' 
    });
  }
};

const requireTwoFactor = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (user.two_factor_enabled) {
      const { two_factor_code } = req.body;
      
      if (!two_factor_code) {
        return res.status(401).json({
          status: 'error',
          message: 'Two-factor authentication required',
          requires2FA: true
        });
      }

      const isValid = await twoFactorService.verify2FA(user.id, two_factor_code);
      if (!isValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid two-factor code'
        });
      }
    }
    
    next();
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { authenticate, requireTwoFactor };