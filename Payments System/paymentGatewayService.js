// backend/src/services/paymentGatewayService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const { logger } = require('../utils/logger');

class PaymentGatewayService {
  constructor() {
    this.gateways = {
      stripe: {
        name: 'Stripe',
        enabled: true
      },
      // Add other gateways
      paypal: {
        name: 'PayPal',
        enabled: false
      }
    };
  }

  async processPayment(paymentData) {
    try {
      // Primary: Stripe
      if (this.gateways.stripe.enabled) {
        return await this.processStripePayment(paymentData);
      }
      
      // Fallback to PayPal if configured
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
    // Implement PayPal integration
    // This is a placeholder
    return {
      id: 'PAYPAL_' + Date.now(),
      status: 'pending',
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD'
    };
  }

  async confirmPayment(paymentIntentId) {
    try {
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

module.exports = PaymentGatewayService;