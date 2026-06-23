const express = require('express');
const { authenticate } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

const router = express.Router();

// Get Dashboard Analytics (trends, spending patterns, volume, alerts)
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const analytics = await analyticsService.generateDashboardAnalytics(req.userId);
    res.json({
      status: 'success',
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
