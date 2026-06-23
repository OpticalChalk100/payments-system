// backend/src/services/twoFactorService.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { Op } = require('sequelize');
const { User, TwoFactorCode } = require('../models');
const { logger } = require('../utils/logger');
const { sendEmail } = require('../utils/email');

class TwoFactorService {
  async enable2FA(userId) {
    try {
      const secret = speakeasy.generateSecret({
        name: `DigitalWallet:${userId}`,
        length: 20
      });

      await User.update(
        { two_factor_secret: secret.base32 },
        { where: { id: userId } }
      );

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      
      logger.info(`2FA enabled for user ${userId}`);
      return {
        secret: secret.base32,
        qrCode: qrCodeUrl
      };
    } catch (error) {
      logger.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  async verify2FA(userId, token) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user || !user.two_factor_secret) {
        return false;
      }

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: token
      });

      if (verified) {
        await User.update(
          { two_factor_enabled: true },
          { where: { id: userId } }
        );
      }

      return verified;
    } catch (error) {
      logger.error('Error verifying 2FA:', error);
      return false;
    }
  }

  async generateTransactionOTP(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      await TwoFactorCode.create({
        user_id: userId,
        code: code,
        type: 'transaction',
        expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

      // Send OTP via email/SMS
      await sendEmail({
        to: user.email,
        subject: 'Transaction Verification Code',
        text: `Your verification code is: ${code}. This code expires in 10 minutes.`
      });

      return code;
    } catch (error) {
      logger.error('Error generating OTP:', error);
      throw error;
    }
  }

  async verifyTransactionOTP(userId, code) {
    try {
      const record = await TwoFactorCode.findOne({
        where: {
          user_id: userId,
          code: code,
          type: 'transaction',
          is_used: false,
          expires_at: { [Op.gt]: new Date() }
        }
      });

      if (!record) {
        return false;
      }

      await record.update({ is_used: true });
      return true;
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      return false;
    }
  }

  async disable2FA(userId, token) {
    try {
      // Verify token before disabling
      const user = await User.findByPk(userId);
      
      if (!user || !user.two_factor_secret) {
        throw new Error('2FA not enabled');
      }

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: token
      });

      if (!verified) {
        throw new Error('Invalid 2FA token');
      }

      await User.update(
        { 
          two_factor_secret: null,
          two_factor_enabled: false 
        },
        { where: { id: userId } }
      );

      logger.info(`2FA disabled for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      throw error;
    }
  }
}

module.exports = new TwoFactorService();