// backend/src/services/paymentGatewayService.js
const { logger } = require('../utils/logger');

// Dynamically require stripe only if a key is provided and not mock
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('mock')) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

class PaymentGatewayService {
  constructor() {
    this.gateways = {
      stripe: {
        name: 'Stripe',
        enabled: true
      },
      paypal: {
        name: 'PayPal',
        enabled: false
      }
    };
  }

  async processPayment(paymentData) {
    try {
      if (this.gateways.stripe.enabled) {
        return await this.processStripePayment(paymentData);
      }
      
      if (this.gateways.paypal.enabled) {
        return await this.processPayPalPayment(paymentData);
      }

      throw new Error('No payment gateway available');
    } catch (error) {
      logger.error('Payment processing error:', error);
      throw error;
    }
  }

  async processStripePayment(paymentData) {
    try {
      if (!stripe) {
        // Fallback to mock Stripe payment
        const mockId = 'pi_mock_' + Date.now() + Math.random().toString(36).substring(2, 7);
        logger.info(`[MOCK STRIPE] Payment intent created for $${paymentData.amount} (ID: ${mockId})`);
        return {
          id: mockId,
          status: 'succeeded',
          amount: paymentData.amount,
          currency: paymentData.currency || 'usd',
          client_secret: 'pi_mock_secret_' + Math.random().toString(36).substring(2, 15),
          metadata: paymentData.metadata
        };
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: paymentData.currency || 'usd',
        payment_method_types: ['card'],
        metadata: {
          transactionId: paymentData.metadata?.transactionId || '',
          source: paymentData.source || '',
          destination: paymentData.destination || ''
        }
      });

      logger.info(`Stripe payment created: ${paymentIntent.id}`);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        client_secret: paymentIntent.client_secret,
        metadata: paymentIntent.metadata
      };

    } catch (error) {
      logger.error('Stripe payment failed:', error);
      throw error;
    }
  }

  async processPayPalPayment(paymentData) {
    return {
      id: 'PAYPAL_' + Date.now(),
      status: 'pending',
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD'
    };
  }

  async confirmPayment(paymentIntentId) {
    try {
      if (!stripe || paymentIntentId.startsWith('pi_mock')) {
        logger.info(`[MOCK STRIPE] Payment confirmed for ID: ${paymentIntentId}`);
        return {
          id: paymentIntentId,
          status: 'succeeded',
          amount: 0,
          currency: 'usd'
        };
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      logger.info(`Payment confirmed: ${paymentIntentId}`);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      };
    } catch (error) {
      logger.error('Payment confirmation failed:', error);
      throw error;
    }
  }
}

module.exports = new PaymentGatewayService();