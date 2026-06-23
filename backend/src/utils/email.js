const { logger } = require('./logger');

async function sendEmail({ to, subject, text, html }) {
  // Mock email implementation. Prints to console/logger
  logger.info(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
  logger.info(`[EMAIL CONTENT] ${text || html}`);
  return { messageId: 'mock-email-id-' + Date.now() };
}

module.exports = { sendEmail };
