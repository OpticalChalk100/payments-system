const express = require('express');
const authRoutes = require('./auth');
const walletRoutes = require('./wallet');
const analyticsRoutes = require('./analytics');
const fraudRoutes = require('./fraud');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/fraud', fraudRoutes);

module.exports = router;
