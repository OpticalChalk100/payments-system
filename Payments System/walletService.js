// backend/src/services/walletService.js
const { Wallet, Transaction, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { fraudDetectionService } = require('./fraudDetectionService');
const { paymentGatewayService } = require('./paymentGatewayService');

class WalletService {
  async createWallet(userId) {
    try {
      const wallet = await Wallet.create({
        user_id: userId,
        wallet_address: `0x${uuidv4().replace(/-/g, '')}`,
        balance: 100000.00
      });
      
      logger.info(`Wallet created for user ${userId}`);
      return wallet;
    } catch (error) {
      logger.error('Error creating wallet:', error);
      throw error;
    }
  }

  async getBalance(userId) {
    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    return wallet ? wallet.balance : 0;
  }

  async transfer(senderId, receiverEmail, amount, description = '') {
    const transaction = await sequelize.transaction();

    try {
      // Validate sender wallet
      const senderWallet = await Wallet.findOne({ 
        where: { user_id: senderId },
        lock: true,
        transaction
      });

      if (!senderWallet) {
        throw new Error('Sender wallet not found');
      }

      if (senderWallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Validate receiver
      const receiver = await User.findOne({ 
        where: { email: receiverEmail } 
      });

      if (!receiver) {
        throw new Error('Receiver not found');
      }

      if (receiver.id === senderId) {
        throw new Error('Cannot transfer to yourself');
      }

      const receiverWallet = await Wallet.findOne({ 
        where: { user_id: receiver.id },
        lock: true,
        transaction
      });

      if (!receiverWallet) {
        throw new Error('Receiver wallet not found');
      }

      // Calculate fee (0% - fee removed)
      const fee = 0;
      const netAmount = amount;

      // Update balances
      await senderWallet.update({
        balance: senderWallet.balance - amount
      }, { transaction });

      await receiverWallet.update({
        balance: receiverWallet.balance + netAmount
      }, { transaction });

      // Create transaction record
      const transfer = await Transaction.create({
        sender_wallet_id: senderWallet.id,
        receiver_wallet_id: receiverWallet.id,
        amount: amount,
        fee: fee,
        type: 'transfer',
        description: description,
        reference: `TX-${Date.now()}-${uuidv4().substring(0, 8)}`,
        status: 'pending'
      }, { transaction });

      // Fraud detection check
      const fraudCheck = await fraudDetectionService.analyzeTransaction(transfer);
      
      if (fraudCheck.isFraudulent) {
        await transfer.update({
          is_fraud_flagged: true,
          fraud_score: fraudCheck.score,
          status: 'flagged'
        }, { transaction });

        await transaction.commit();
        
        // Notify about fraud
        await fraudDetectionService.sendAlert(transfer.id, fraudCheck);

        throw new Error('Transaction flagged for fraud review');
      }

      // Process payment through gateway
      const gatewayResponse = await paymentGatewayService.processPayment({
        amount: amount,
        currency: 'USD',
        source: senderWallet.wallet_address,
        destination: receiverWallet.wallet_address,
        metadata: { transactionId: transfer.id }
      });

      await transfer.update({
        payment_gateway_id: gatewayResponse.id,
        gateway_response: gatewayResponse,
        status: 'completed',
        completed_at: new Date()
      }, { transaction });

      await transaction.commit();

      // Update analytics
      await this.updateAnalytics(senderId, amount, 'sent');
      await this.updateAnalytics(receiver.id, amount, 'received');

      logger.info(`Transfer completed: ${transfer.id}`);
      return transfer;

    } catch (error) {
      await transaction.rollback();
      logger.error('Transfer failed:', error);
      throw error;
    }
  }

  async getTransactionHistory(userId, page = 1, limit = 20) {
    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const offset = (page - 1) * limit;

    const transactions = await Transaction.findAndCountAll({
      where: {
        [sequelize.Op.or]: [
          { sender_wallet_id: wallet.id },
          { receiver_wallet_id: wallet.id }
        ]
      },
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        { model: Wallet, as: 'sender', include: ['user'] },
        { model: Wallet, as: 'receiver', include: ['user'] }
      ]
    });

    return {
      transactions: transactions.rows,
      total: transactions.count,
      page,
      totalPages: Math.ceil(transactions.count / limit)
    };
  }

  async updateAnalytics(userId, amount, type) {
    // Update user analytics in real-time
    // Implementation would depend on analytics requirements
  }
}

module.exports = new WalletService();