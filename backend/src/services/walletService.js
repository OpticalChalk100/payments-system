// backend/src/services/walletService.js
const { Wallet, Transaction, User, PaymentAnalytics, sequelize } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const fraudDetectionService = require('./fraudDetectionService');
const paymentGatewayService = require('./paymentGatewayService');

class WalletService {
  async createWallet(userId) {
    try {
      const wallet = await Wallet.create({
        user_id: userId,
        wallet_address: `0x${uuidv4().replace(/-/g, '')}`,
        balance: 100000.00 // Give initial balance of $100000 for testing/demonstration
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
    return wallet ? parseFloat(wallet.balance) : 0;
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

      if (parseFloat(senderWallet.balance) < parseFloat(amount)) {
        throw new Error('Insufficient balance');
      }

      // Validate receiver
      let receiver;
      if (receiverEmail.startsWith('0x')) {
        const receiverWalletRecord = await Wallet.findOne({ where: { wallet_address: receiverEmail } });
        if (!receiverWalletRecord) {
          throw new Error('Receiver wallet address not found');
        }
        receiver = await User.findByPk(receiverWalletRecord.user_id);
      } else {
        receiver = await User.findOne({ 
          where: { email: receiverEmail } 
        });
      }

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
        balance: parseFloat(senderWallet.balance) - parseFloat(amount)
      }, { transaction });

      await receiverWallet.update({
        balance: parseFloat(receiverWallet.balance) + parseFloat(netAmount)
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
        currency: 'INR',
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
      // If transaction is not committed/finished, roll it back
      if (!transaction.finished) {
        await transaction.rollback();
      }
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
        [Op.or]: [
          { sender_wallet_id: wallet.id },
          { receiver_wallet_id: wallet.id }
        ]
      },
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        { 
          model: Wallet, 
          as: 'sender', 
          include: [{ model: User, as: 'user', attributes: ['id', 'email', 'full_name'] }] 
        },
        { 
          model: Wallet, 
          as: 'receiver', 
          include: [{ model: User, as: 'user', attributes: ['id', 'email', 'full_name'] }] 
        }
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
    try {
      const [analytics, created] = await PaymentAnalytics.findOrCreate({
        where: { user_id: userId, period: 'monthly' },
        defaults: {
          total_transactions: 0,
          total_volume: 0.00,
          avg_transaction_amount: 0.00,
          unique_recipients: 0
        }
      });

      const totalTx = analytics.total_transactions + 1;
      const totalVol = parseFloat(analytics.total_volume) + parseFloat(amount);
      const avgAmt = totalVol / totalTx;

      await analytics.update({
        total_transactions: totalTx,
        total_volume: totalVol,
        avg_transaction_amount: avgAmt
      });

      logger.info(`Updated analytics for user ${userId}`);
    } catch (error) {
      logger.error('Error updating analytics in walletService:', error);
    }
  }
}

module.exports = new WalletService();