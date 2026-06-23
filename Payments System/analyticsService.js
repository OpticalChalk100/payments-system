// backend/src/services/analyticsService.js
const { sequelize, Transaction, PaymentAnalytics } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

class AnalyticsService {
  async getUserAnalytics(userId, period = 'monthly') {
    try {
      const wallet = await Wallet.findOne({ where: { user_id: userId } });
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Get transaction statistics
      const stats = await this.getTransactionStats(wallet.id, period);
      
      // Get spending patterns
      const patterns = await this.getSpendingPatterns(wallet.id, period);
      
      // Get daily/weekly trends
      const trends = await this.getTransactionTrends(wallet.id, period);
      
      // Generate insights
      const insights = await this.generateInsights(stats, patterns);

      return {
        stats,
        patterns,
        trends,
        insights,
        period
      };

    } catch (error) {
      logger.error('Error getting user analytics:', error);
      throw error;
    }
  }

  async getTransactionStats(walletId, period) {
    const dateFilter = this.getDateFilter(period);

    const stats = await Transaction.findAll({
      where: {
        [Op.or]: [
          { sender_wallet_id: walletId },
          { receiver_wallet_id: walletId }
        ],
        created_at: dateFilter,
        status: 'completed'
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_transactions'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_volume'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'avg_amount'],
        [sequelize.fn('MAX', sequelize.col('amount')), 'max_amount'],
        [sequelize.fn('MIN', sequelize.col('amount')), 'min_amount']
      ]
    });

    // Get incoming vs outgoing
    const incoming = await Transaction.sum('amount', {
      where: {
        receiver_wallet_id: walletId,
        created_at: dateFilter,
        status: 'completed'
      }
    });

    const outgoing = await Transaction.sum('amount', {
      where: {
        sender_wallet_id: walletId,
        created_at: dateFilter,
        status: 'completed'
      }
    });

    return {
      ...stats[0].dataValues,
      incoming: incoming || 0,
      outgoing: outgoing || 0,
      net_flow: (incoming || 0) - (outgoing || 0)
    };
  }

  async getSpendingPatterns(walletId, period) {
    const dateFilter = this.getDateFilter(period);

    // Get top recipients
    const topRecipients = await Transaction.findAll({
      where: {
        sender_wallet_id: walletId,
        created_at: dateFilter,
        status: 'completed'
      },
      attributes: [
        'receiver_wallet_id',
        [sequelize.fn('COUNT', sequelize.col('Transaction.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['receiver_wallet_id'],
      order: [[sequelize.literal('total'), 'DESC']],
      limit: 5
    });

    // Get transaction size distribution
    const sizeDistribution = await this.getSizeDistribution(walletId, dateFilter);

    return {
      top_recipients: topRecipients,
      size_distribution: sizeDistribution
    };
  }

  async getTransactionTrends(walletId, period) {
    const dateFilter = this.getDateFilter(period);
    const interval = this.getInterval(period);

    const trends = await Transaction.findAll({
      where: {
        [Op.or]: [
          { sender_wallet_id: walletId },
          { receiver_wallet_id: walletId }
        ],
        created_at: dateFilter,
        status: 'completed'
      },
      attributes: [
        [sequelize.fn('DATE_TRUNC', interval, sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'volume']
      ],
      group: ['date'],
      order: [['date', 'ASC']]
    });

    return trends;
  }

  async generateInsights(stats, patterns) {
    const insights = [];

    // Check spending patterns
    if (stats.outgoing > stats.incoming * 1.5) {
      insights.push({
        type: 'spending',
        severity: 'medium',
        message: 'Your outgoing payments are significantly higher than incoming',
        recommendation: 'Review your spending habits'
      });
    }

    // Check for concentration risk
    if (patterns.top_recipients && patterns.top_recipients.length > 0) {
      const topShare = patterns.top_recipients[0].total / stats.total_volume;
      if (topShare > 0.4) {
        insights.push({
          type: 'concentration',
          severity: 'low',
          message: 'A large portion of your payments go to a single recipient',
          recommendation: 'Consider diversifying your payment recipients'
        });
      }
    }

    // Check transaction size patterns
    if (stats.avg_amount > stats.median_amount * 2) {
      insights.push({
        type: 'outliers',
        severity: 'low',
        message: 'You have some unusually large transactions',
        recommendation: 'Check for potential fraudulent activity'
      });
    }

    return insights;
  }

  getDateFilter(period) {
    const now = new Date();
    switch(period) {
      case 'daily':
        return { [Op.gte]: new Date(now.setDate(now.getDate() - 1)) };
      case 'weekly':
        return { [Op.gte]: new Date(now.setDate(now.getDate() - 7)) };
      case 'monthly':
        return { [Op.gte]: new Date(now.setMonth(now.getMonth() - 1)) };
      case 'yearly':
        return { [Op.gte]: new Date(now.setFullYear(now.getFullYear() - 1)) };
      default:
        return { [Op.gte]: new Date(now.setMonth(now.getMonth() - 1)) };
    }
  }

  getInterval(period) {
    switch(period) {
      case 'daily':
        return 'hour';
      case 'weekly':
        return 'day';
      case 'monthly':
        return 'day';
      case 'yearly':
        return 'month';
      default:
        return 'day';
    }
  }

  async getSizeDistribution(walletId, dateFilter) {
    const ranges = [
      { min: 0, max: 10 },
      { min: 10, max: 50 },
      { min: 50, max: 100 },
      { min: 100, max: 500 },
      { min: 500, max: 1000 },
      { min: 1000, max: 5000 },
      { min: 5000, max: null }
    ];

    const distribution = await Promise.all(ranges.map(async (range) => {
      const where = {
        sender_wallet_id: walletId,
        created_at: dateFilter,
        status: 'completed'
      };

      if (range.max !== null) {
        where.amount = { [Op.between]: [range.min, range.max] };
      } else {
        where.amount = { [Op.gte]: range.min };
      }

      const count = await Transaction.count({ where });
      return {
        range: `${range.min}-${range.max || '5000+'}`,
        count
      };
    }));

    return distribution;
  }

  async generateDashboardAnalytics(userId) {
    try {
      const [monthlyStats, weeklyStats, dailyStats, fraudAlerts] = await Promise.all([
        this.getUserAnalytics(userId, 'monthly'),
        this.getUserAnalytics(userId, 'weekly'),
        this.getUserAnalytics(userId, 'daily'),
        FraudAlert.findAll({
          where: { 
            user_id: userId,
            is_resolved: false,
            created_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        })
      ]);

      return {
        overview: {
          monthly: monthlyStats.stats,
          weekly: weeklyStats.stats,
          daily: dailyStats.stats,
          active_alerts: fraudAlerts.length
        },
        patterns: {
          monthly: monthlyStats.patterns,
          weekly: weeklyStats.patterns
        },
        trends: {
          monthly: monthlyStats.trends,
          weekly: weeklyStats.trends
        },
        insights: {
          monthly: monthlyStats.insights,
          weekly: weeklyStats.insights
        }
      };

    } catch (error) {
      logger.error('Error generating dashboard analytics:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();