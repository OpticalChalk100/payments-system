// backend/src/services/fraudDetectionService.js
const { Op } = require('sequelize');
const { Transaction, FraudAlert, Wallet, User, sequelize } = require('../models');
const { logger } = require('../utils/logger');
const { sendEmail, sendSMS } = require('../utils/notification');

class FraudDetectionService {
  constructor() {
    this.thresholds = {
      maxTransactionAmount: 10000,
      maxDailyTransactions: 50,
      maxDailyVolume: 50000,
      unusualLocation: true,
      velocityCheck: true
    };
  }

  async analyzeTransaction(transaction) {
    try {
      const factors = [];
      let score = 0;

      // Factor 1: Transaction amount check
      if (parseFloat(transaction.amount) > this.thresholds.maxTransactionAmount) {
        factors.push({ factor: 'amount_exceeds_threshold', weight: 0.3 });
        score += 0.3;
      }

      // Factor 2: Transaction velocity (frequency)
      const recentTransactions = await this.getRecentTransactions(
        transaction.sender_wallet_id,
        5 // last 5 minutes
      );

      if (recentTransactions.length >= 5) {
        factors.push({ factor: 'high_transaction_velocity', weight: 0.25 });
        score += 0.25;
      }

      // Factor 3: Daily volume check
      const dailyVolume = await this.getDailyVolume(transaction.sender_wallet_id);
      if (parseFloat(dailyVolume) + parseFloat(transaction.amount) > this.thresholds.maxDailyVolume) {
        factors.push({ factor: 'daily_volume_exceeded', weight: 0.2 });
        score += 0.2;
      }

      // Factor 4: Unusual patterns (time, amount, etc.)
      const unusualPattern = await this.detectUnusualPattern(transaction);
      if (unusualPattern) {
        factors.push({ factor: 'unusual_pattern', weight: 0.15 });
        score += 0.15;
      }

      // Factor 5: Recipient risk score
      const recipientRisk = await this.getRecipientRisk(transaction.receiver_wallet_id);
      if (recipientRisk) {
        factors.push({ factor: 'high_risk_recipient', weight: 0.1 });
        score += 0.1;
      }

      // Determine if transaction is fraudulent
      const isFraudulent = score >= 0.6;

      logger.info(`Fraud analysis for transaction ${transaction.id}: score=${score}, isFraudulent=${isFraudulent}`);

      return {
        isFraudulent,
        score,
        factors,
        confidence: score * 100
      };

    } catch (error) {
      logger.error('Error analyzing transaction:', error);
      // Default to safe if analysis fails
      return { isFraudulent: false, score: 0, factors: [], confidence: 0 };
    }
  }

  async getRecentTransactions(walletId, minutes = 5) {
    const timeThreshold = new Date(Date.now() - minutes * 60 * 1000);
    
    return await Transaction.findAll({
      where: {
        sender_wallet_id: walletId,
        created_at: { [Op.gte]: timeThreshold },
        status: 'completed'
      }
    });
  }

  async getDailyVolume(walletId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Transaction.sum('amount', {
      where: {
        sender_wallet_id: walletId,
        created_at: { [Op.gte]: today },
        status: 'completed'
      }
    });

    return result || 0;
  }

  async detectUnusualPattern(transaction) {
    // Check for unusual patterns like:
    // 1. Round numbers
    // 2. Unusual time of day (3 AM)
    // 3. First transaction with this recipient
    
    const hour = new Date().getHours();
    if (hour >= 1 && hour <= 4) {
      return true; // Unusual time
    }

    // Check if amount is a round number
    if (parseFloat(transaction.amount) % 100 === 0) {
      return true;
    }

    return false;
  }

  async getRecipientRisk(walletId) {
    // Implement recipient risk scoring based on history/flags
    // For demonstration, return random risk
    return Math.random() < 0.2;
  }

  async sendAlert(transactionId, fraudCheck) {
    try {
      const transaction = await Transaction.findByPk(transactionId, {
        include: [
          { model: Wallet, as: 'sender', include: [{ model: User, as: 'user' }] },
          { model: Wallet, as: 'receiver', include: [{ model: User, as: 'user' }] }
        ]
      });

      if (!transaction || !transaction.sender || !transaction.sender.user) {
        logger.error(`Cannot find sender details for transaction ${transactionId} to alert`);
        return;
      }

      const factorsText = fraudCheck.factors.map(f => f.factor).join(', ');

      const alert = await FraudAlert.create({
        transaction_id: transactionId,
        user_id: transaction.sender.user_id,
        alert_type: 'suspicious_transaction',
        severity: fraudCheck.score >= 0.8 ? 'high' : 'medium',
        description: `Suspicious transaction detected. Score: ${fraudCheck.score}, Factors: ${factorsText}`
      });

      // Send notifications
      await sendEmail({
        to: transaction.sender.user.email,
        subject: '⚠️ Fraud Alert: Suspicious Transaction Detected',
        html: `
          <h2>Fraud Alert</h2>
          <p>We detected a potentially fraudulent transaction:</p>
          <ul>
            <li>Amount: ₹${transaction.amount}</li>
            <li>Recipient: ${transaction.receiver && transaction.receiver.user ? transaction.receiver.user.email : 'Unknown'}</li>
            <li>Fraud Score: ${fraudCheck.score}</li>
            <li>Confidence: ${fraudCheck.confidence}%</li>
            <li>Factors: ${factorsText}</li>
          </ul>
          <p>If this was not you, please contact support immediately.</p>
        `
      });

      // Send SMS alert
      await sendSMS({
        to: transaction.sender.user.phone,
        message: `Fraud alert: Suspicious transaction of ₹${transaction.amount} detected. Contact support if not authorized.`
      });

      // Log alert
      logger.warn(`Fraud alert created for transaction ${transactionId}`);

      return alert;

    } catch (error) {
      logger.error('Error sending fraud alert:', error);
    }
  }

  async getFraudAlerts(userId) {
    return await FraudAlert.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
  }

  async resolveFraudAlert(alertId, resolution, notes) {
    const alert = await FraudAlert.findByPk(alertId);
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    await alert.update({
      is_resolved: true,
      resolved_at: new Date(),
      resolution: resolution,
      notes: notes
    });

    logger.info(`Fraud alert ${alertId} resolved: ${resolution}`);
    return alert;
  }
}

module.exports = new FraudDetectionService();