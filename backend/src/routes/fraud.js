const express = require('express');
const { authenticate } = require('../middleware/auth');
const fraudDetectionService = require('../services/fraudDetectionService');

const router = express.Router();

// Get Fraud Alerts for logged in user
router.get('/alerts', authenticate, async (req, res, next) => {
  try {
    const alerts = await fraudDetectionService.getFraudAlerts(req.userId);
    res.json({
      status: 'success',
      data: alerts
    });
  } catch (error) {
    next(error);
  }
});

// Resolve a Fraud Alert
router.post('/alerts/:id/resolve', authenticate, async (req, res, next) => {
  try {
    const { resolution, notes } = req.body;

    if (!resolution) {
      return res.status(400).json({
        status: 'error',
        message: 'Resolution status is required'
      });
    }

    const alert = await fraudDetectionService.resolveFraudAlert(
      req.params.id,
      resolution,
      notes
    );

    res.json({
      status: 'success',
      message: 'Fraud alert resolved successfully',
      data: alert
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
