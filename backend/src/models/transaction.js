const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sender_wallet_id: {
    type: DataTypes.UUID,
    allowNull: true // Null for external deposits if supported
  },
  receiver_wallet_id: {
    type: DataTypes.UUID,
    allowNull: true // Null for external withdrawals if supported
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  fee: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending' // pending, completed, failed, flagged
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false // transfer, deposit, withdrawal
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  payment_gateway_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  gateway_response: {
    type: DataTypes.JSON,
    allowNull: true
  },
  is_fraud_flagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fraud_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Transaction;
