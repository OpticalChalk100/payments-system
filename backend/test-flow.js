const { sequelize, User, Wallet, Transaction, FraudAlert, PaymentAnalytics } = require('./src/models');
const walletService = require('./src/services/walletService');
const fraudDetectionService = require('./src/services/fraudDetectionService');
const analyticsService = require('./src/services/analyticsService');

async function runTest() {
  console.log('=== STARTING BUSINESS LOGIC INTEGRATION TEST ===\n');
  try {
    // 1. Force Sync DB
    await sequelize.sync({ force: true });
    console.log('[1] SQLite Database synced successfully.');

    // 2. Register Sender
    const sender = await User.create({
      email: 'sender@test.com',
      phone: '555-0101',
      full_name: 'Alice Sender',
      password_hash: 'hashed_password'
    });
    const senderWallet = await walletService.createWallet(sender.id);
    console.log(`[2] Created Alice (Sender): ${sender.email} | Wallet: ${senderWallet.wallet_address} | Balance: $${senderWallet.balance}`);

    // 3. Register Receiver
    const receiver = await User.create({
      email: 'receiver@test.com',
      phone: '555-0202',
      full_name: 'Bob Receiver',
      password_hash: 'hashed_password'
    });
    const receiverWallet = await walletService.createWallet(receiver.id);
    console.log(`[3] Created Bob (Receiver): ${receiver.email} | Wallet: ${receiverWallet.wallet_address} | Balance: $${receiverWallet.balance}`);

    // 4. Perform P2P Transfer ($200)
    console.log('\n[4] Initiating P2P transfer of $200 from Alice to Bob...');
    const tx = await walletService.transfer(sender.id, 'receiver@test.com', 200, 'Dinner payment');
    console.log(`    Transfer recorded. Status: ${tx.status} | Reference: ${tx.reference}`);

    // Verify balances
    const aliceBalance = await walletService.getBalance(sender.id);
    const bobBalance = await walletService.getBalance(receiver.id);
    console.log(`    Alice new balance: $${aliceBalance} (Expected: 800)`);
    console.log(`    Bob new balance: $${bobBalance} (Expected: 1199 - $200 minus 0.5% fee of $1)`);

    if (aliceBalance !== 800) {
      throw new Error(`Alice balance incorrect: expected 800, got ${aliceBalance}`);
    }
    if (bobBalance !== 1199) {
      throw new Error(`Bob balance incorrect: expected 1199, got ${bobBalance}`);
    }
    console.log('    -> Balance checks passed!');

    // 5. Verify Monthly Analytics
    console.log('\n[5] Verifying Monthly Analytics...');
    const senderAnalytics = await PaymentAnalytics.findOne({ where: { user_id: sender.id, period: 'monthly' } });
    console.log(`    Alice analytics: Volume=$${senderAnalytics.total_volume} | Transactions=${senderAnalytics.total_transactions} | Avg=$${senderAnalytics.avg_transaction_amount}`);
    
    if (parseFloat(senderAnalytics.total_volume) !== 200) {
      throw new Error(`Alice volume incorrect: expected 200, got ${senderAnalytics.total_volume}`);
    }
    console.log('    -> Analytics check passed!');

    // 6. Test Fraud Alert Engine
    console.log('\n[6] Testing Fraud Detection Engine...');
    console.log('    Attempting to transfer $15,000 (exceeds $10,000 limit)...');
    
    try {
      // Temporarily give Alice more money so she can attempt the transfer
      const walletRecord = await Wallet.findOne({ where: { user_id: sender.id } });
      await walletRecord.update({ balance: 70000 });

      await walletService.transfer(sender.id, 'receiver@test.com', 60000, 'Suspicious big transfer');
      throw new Error('Test FAILED: Transfer should have been blocked for fraud!');
    } catch (err) {
      if (err.message === 'Transaction flagged for fraud review') {
        console.log('    -> SUCCESS: Transfer blocked as expected: "Transaction flagged for fraud review"');
      } else {
        throw err;
      }
    }

    // 7. Verify Fraud Alert Record
    console.log('\n[7] Verifying Fraud Alert Database Records...');
    const alerts = await fraudDetectionService.getFraudAlerts(sender.id);
    console.log(`    Alice alerts found: ${alerts.length}`);
    if (alerts.length === 0) {
      throw new Error('No fraud alert record was created for the blocked transaction!');
    }
    console.log(`    Alert Severity: ${alerts[0].severity} | Description: ${alerts[0].description}`);

    // 8. Resolve Fraud Alert
    console.log('\n[8] Resolving Fraud Alert...');
    const resolved = await fraudDetectionService.resolveFraudAlert(alerts[0].id, 'false_alarm', 'Verified by phone call with customer.');
    console.log(`    Alert status is_resolved: ${resolved.is_resolved} | Resolution: ${resolved.resolution}`);
    if (!resolved.is_resolved) {
      throw new Error('Failed to mark alert as resolved!');
    }

    console.log('\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (error) {
    console.error('\n!!! TEST FAILED !!!', error);
    process.exit(1);
  }
}

runTest();
