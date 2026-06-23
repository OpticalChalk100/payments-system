const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { User, Wallet } = require('../models');
const { authenticate } = require('../middleware/auth');
const walletService = require('../services/walletService');
const twoFactorService = require('../services/twoFactorService');
const { logger } = require('../utils/logger');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345';

// Register User
router.post('/register', async (req, res, next) => {
  try {
    const { email, phone, full_name, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email already registered' });
    }

    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ status: 'error', message: 'Phone number already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({
      email,
      phone,
      full_name,
      password_hash,
      is_verified: true // Mark verified for demo purposes
    });

    // Create Wallet
    const wallet = await walletService.createWallet(user.id);

    // Generate token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          two_factor_enabled: user.two_factor_enabled
        },
        wallet: {
          id: wallet.id,
          wallet_address: wallet.wallet_address,
          balance: wallet.balance
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// Login User
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Invalid email or password' });
    }

    // Check if 2FA enabled
    if (user.two_factor_enabled) {
      return res.json({
        status: 'requires_2fa',
        data: {
          userId: user.id,
          email: user.email
        }
      });
    }

    // Otherwise generate JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    const wallet = await Wallet.findOne({ where: { user_id: user.id } });

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          two_factor_enabled: user.two_factor_enabled
        },
        wallet: wallet ? {
          id: wallet.id,
          wallet_address: wallet.wallet_address,
          balance: wallet.balance
        } : null
      }
    });

  } catch (error) {
    next(error);
  }
});

// Complete 2FA Login
router.post('/2fa/login', async (req, res, next) => {
  try {
    const { userId, token } = req.body;

    const user = await User.findByPk(userId);
    if (!user || !user.two_factor_secret) {
      return res.status(400).json({ status: 'error', message: 'User not found or 2FA not set up' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token
    });

    if (!verified) {
      return res.status(400).json({ status: 'error', message: 'Invalid verification code' });
    }

    const jwtToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    const wallet = await Wallet.findOne({ where: { user_id: user.id } });

    res.json({
      status: 'success',
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          two_factor_enabled: user.two_factor_enabled
        },
        wallet: wallet ? {
          id: wallet.id,
          wallet_address: wallet.wallet_address,
          balance: wallet.balance
        } : null
      }
    });

  } catch (error) {
    next(error);
  }
});

// Enable 2FA (Generates QR Code and Secret)
router.post('/2fa/enable', authenticate, async (req, res, next) => {
  try {
    const result = await twoFactorService.enable2FA(req.userId);
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Verify 2FA (Confirms setup and marks as enabled)
router.post('/2fa/verify', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    const verified = await twoFactorService.verify2FA(req.userId, token);

    if (verified) {
      res.json({
        status: 'success',
        message: 'Two-factor authentication verified and enabled'
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Invalid verification token'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    const disabled = await twoFactorService.disable2FA(req.userId, token);

    if (disabled) {
      res.json({
        status: 'success',
        message: 'Two-factor authentication disabled'
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Could not disable 2FA'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Get Current User Profile (Utility endpoint)
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const wallet = await Wallet.findOne({ where: { user_id: user.id } });

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          two_factor_enabled: user.two_factor_enabled
        },
        wallet: wallet ? {
          id: wallet.id,
          wallet_address: wallet.wallet_address,
          balance: wallet.balance
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
