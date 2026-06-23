const express = require('express');
const { authenticate, requireTwoFactor } = require('../middleware/auth');
const walletService = require('../services/walletService');

const router = express.Router();

// Get Wallet Balance
router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const balance = await walletService.getBalance(req.userId);
    res.json({
      status: 'success',
      data: { balance }
    });
  } catch (error) {
    next(error);
  }
});

// Get Paginated Transaction History
router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const history = await walletService.getTransactionHistory(req.userId, page, limit);
    res.json({
      status: 'success',
      data: history
    });
  } catch (error) {
    next(error);
  }
});

// Perform P2P Money Transfer (Checks 2FA code if enabled)
router.post('/transfer', authenticate, requireTwoFactor, async (req, res, next) => {
  try {
    const { receiverEmail, amount, description } = req.body;

    if (!receiverEmail || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid transfer details. Receiver email and positive amount are required.'
      });
    }

    const transfer = await walletService.transfer(
      req.userId,
      receiverEmail,
      parseFloat(amount),
      description
    );

    res.json({
      status: 'success',
      message: 'Transfer completed successfully',
      data: transfer
    });
  } catch (error) {
    // If flagged for fraud review, return a specific response status
    if (error.message === 'Transaction flagged for fraud review') {
      return res.status(403).json({
        status: 'flagged',
        message: error.message
      });
    }
    next(error);
  }
});

module.exports = router;
