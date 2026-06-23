const { logger } = require('./logger');
const { sendEmail } = require('./email');

async function sendSMS({ to, message }) {
  logger.info(`[MOCK SMS SENT] To: ${to} | Message: ${message}`);
  return { sid: 'mock-sms-sid-' + Date.now() };
}

module.exports = {
  sendEmail,
  sendSMS
};
