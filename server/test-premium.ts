import { sendWelcomeEmail, sendTradeConfirmationEmail } from './src/utils/email';

const TEST_EMAIL = "chavatasiva@gmail.com";

async function testPremiumDesign() {
    console.log("💎 Launching Hyper-Premium Email Test...");
    try {
        console.log("Sending Welcome Email...");
        await sendWelcomeEmail(TEST_EMAIL);
        
        console.log("Sending Trade Confirmation (BUY)...");
        await sendTradeConfirmationEmail(TEST_EMAIL, 'BUY', 'NVDA', 25, 875.40, 125480.20);
        
        console.log("Sending Trade Confirmation (SELL)...");
        await sendTradeConfirmationEmail(TEST_EMAIL, 'SELL', 'BTC', 0.5, 64200.15, 157580.28);

        console.log("✨ Hyper-Premium Design Test Complete! Check your inbox.");
    } catch (error) {
        console.error("❌ Design Test Failed!");
        console.error(error);
    }
}

testPremiumDesign();
