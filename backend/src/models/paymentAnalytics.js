const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentAnalytics = sequelize.define('PaymentAnalytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  period: {
    type: DataTypes.STRING(20),
    allowNull: false // daily, weekly, monthly
  },
  total_transactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_volume: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  avg_transaction_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  unique_recipients: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  peak_activity_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'payment_analytics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PaymentAnalytics;
