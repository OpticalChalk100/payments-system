const { sequelize } = require('../config/database');
const User = require('./user');
const Wallet = require('./wallet');
const Transaction = require('./transaction');
const TwoFactorCode = require('./twoFactorCode');
const FraudAlert = require('./fraudAlert');
const PaymentAnalytics = require('./paymentAnalytics');

// Associations

// User <-> Wallet
User.hasOne(Wallet, { as: 'wallet', foreignKey: 'user_id', onDelete: 'CASCADE' });
Wallet.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

// User <-> TwoFactorCode
User.hasMany(TwoFactorCode, { as: 'twoFactorCodes', foreignKey: 'user_id', onDelete: 'CASCADE' });
TwoFactorCode.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

// User <-> FraudAlert
User.hasMany(FraudAlert, { as: 'fraudAlerts', foreignKey: 'user_id', onDelete: 'CASCADE' });
FraudAlert.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

// User <-> PaymentAnalytics
User.hasMany(PaymentAnalytics, { as: 'analytics', foreignKey: 'user_id', onDelete: 'CASCADE' });
PaymentAnalytics.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

// Wallet <-> Transaction (Sent / Received)
Wallet.hasMany(Transaction, { as: 'sentTransactions', foreignKey: 'sender_wallet_id' });
Wallet.hasMany(Transaction, { as: 'receivedTransactions', foreignKey: 'receiver_wallet_id' });
Transaction.belongsTo(Wallet, { as: 'sender', foreignKey: 'sender_wallet_id' });
Transaction.belongsTo(Wallet, { as: 'receiver', foreignKey: 'receiver_wallet_id' });

// Transaction <-> FraudAlert
Transaction.hasOne(FraudAlert, { as: 'fraudAlert', foreignKey: 'transaction_id', onDelete: 'CASCADE' });
FraudAlert.belongsTo(Transaction, { as: 'transaction', foreignKey: 'transaction_id' });

module.exports = {
  sequelize,
  User,
  Wallet,
  Transaction,
  TwoFactorCode,
  FraudAlert,
  PaymentAnalytics
};
