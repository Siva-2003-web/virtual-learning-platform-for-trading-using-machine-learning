// Forced sync for Render deployment - v2
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';

// Force Node.js to prefer IPv4 over IPv6 globally
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

// Create Nodemailer Transporter using your Gmail account
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    },
    // PERMANENT FIX: Force IPv4 lookup only to bypass Render IPv6 issues
    lookup: (hostname: string, options: any, callback: any) => {
        return dns.lookup(hostname, { family: 4 }, callback);
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000
} as any);

/**
 * Sends a hyper-premium welcome or account creation email
 */
export const sendWelcomeEmail = async (userEmail: string) => {
    try {
        const mailOptions = {
            from: `"Stellix Premium" <${process.env.GMAIL_USER}>`,
            to: userEmail,
            subject: 'Your Journey into the Future of Trading Begins Now',
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050505; padding: 40px 0;">
                        <tr>
                            <td align="center">
                                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #12131a; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                                    <!-- Header -->
                                    <tr>
                                        <td align="center" style="padding: 60px 40px 40px 40px; background: linear-gradient(180deg, rgba(0, 229, 255, 0.05) 0%, rgba(18, 19, 26, 0) 100%);">
                                            <div style="font-size: 36px; font-weight: 900; color: #00E5FF; letter-spacing: 8px; margin-bottom: 8px;">STELLIX</div>
                                            <div style="height: 1px; width: 60px; background: #00E5FF; margin: 15px auto;"></div>
                                            <div style="font-size: 13px; font-weight: 500; color: #71717a; text-transform: uppercase; letter-spacing: 3px;">Elite Trading Infrastructure</div>
                                        </td>
                                    </tr>
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 0 60px 40px 60px;">
                                            <h2 style="color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 20px; text-align: center;">Welcome to the Inner Circle.</h2>
                                            <p style="color: #a1a1aa; font-size: 16px; line-height: 1.8; text-align: center; margin-bottom: 40px;">Your Stellix account is active. You now have access to institutional-grade execution speed, advanced analytics, and a seamless trading experience designed for the modern investor.</p>
                                            
                                            <!-- CTA Button -->
                                            <div style="text-align: center; margin-bottom: 50px;">
                                                <a href="http://localhost:5173" style="display: inline-block; padding: 18px 45px; background: #00E5FF; color: #000000; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; box-shadow: 0 8px 25px rgba(0, 229, 255, 0.4); text-transform: uppercase; letter-spacing: 1px;">Initialize Dashboard</a>
                                            </div>

                                            <!-- Feature List -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="padding: 20px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                                                        <div style="color: #ffffff; font-weight: 600; margin-bottom: 5px; font-size: 15px;">🚀 Zero-Latency Execution</div>
                                                        <div style="color: #71717a; font-size: 13px;">Experience trades that happen at the speed of thought.</div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 40px; background-color: #0b0c11; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                                            <p style="color: #52525b; font-size: 12px; margin: 0;">&copy; 2026 Stellix Global. All systems operational. This is a secure automated notification.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Premium Welcome Email Sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending Welcome Email:', error);
        throw error;
    }
};

/**
 * Sends a hyper-premium trade confirmation email
 */
export const sendTradeConfirmationEmail = async (userEmail: string, tradeType: 'BUY' | 'SELL', stockSymbol: string, shares: number, price: number, newBalance: number) => {
    try {
        const primaryColor = tradeType === 'BUY' ? '#00FF85' : '#FF3D71';
        const actionText = tradeType === 'BUY' ? 'PURCHASED' : 'LIQUIDATED';
        const totalValue = (shares * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedBalance = newBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const mailOptions = {
            from: `"Stellix Orders" <${process.env.GMAIL_USER}>`,
            to: userEmail,
            subject: `Trade Confirmation: ${tradeType === 'BUY' ? '+' : '-'}${shares} ${stockSymbol}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050505; padding: 40px 0;">
                        <tr>
                            <td align="center">
                                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #12131a; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                                    <!-- Header -->
                                    <tr>
                                        <td align="center" style="padding: 50px 40px 30px 40px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                             <div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 4px;">STELLIX</div>
                                        </td>
                                    </tr>
                                    <!-- Body -->
                                    <tr>
                                        <td style="padding: 40px 50px;">
                                            <div style="text-align: center; margin-bottom: 30px;">
                                                <span style="background: ${primaryColor}20; color: ${primaryColor}; padding: 8px 16px; border-radius: 30px; font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Trade Confirmed</span>
                                                <h1 style="color: #ffffff; font-size: 32px; font-weight: 800; margin: 20px 0 10px 0;">Order Executed Successfully</h1>
                                                <p style="color: #71717a; font-size: 15px; margin: 0;">Market order filled at institutional pricing.</p>
                                            </div>

                                            <!-- Order Receipt Card -->
                                            <div style="background-color: #1a1b24; border-radius: 16px; padding: 30px; border: 1px solid rgba(255,255,255,0.05);">
                                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                    <tr>
                                                        <td style="color: #71717a; font-size: 14px; padding-bottom: 15px;">Transaction Type</td>
                                                        <td style="color: ${primaryColor}; font-weight: 800; font-size: 14px; text-align: right; padding-bottom: 15px; letter-spacing: 1px;">${tradeType}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="color: #71717a; font-size: 14px; padding-bottom: 15px;">Asset Symbol</td>
                                                        <td style="color: #ffffff; font-weight: 700; font-size: 14px; text-align: right; padding-bottom: 15px;">${stockSymbol}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="color: #71717a; font-size: 14px; padding-bottom: 15px;">Shares Executed</td>
                                                        <td style="color: #ffffff; font-weight: 700; font-size: 14px; text-align: right; padding-bottom: 15px;">${shares.toLocaleString()} units</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="color: #71717a; font-size: 14px; padding-bottom: 25px;">Price Per Unit</td>
                                                        <td style="color: #ffffff; font-weight: 700; font-size: 14px; text-align: right; padding-bottom: 25px;">$${price.toLocaleString()}</td>
                                                    </tr>
                                                    <tr>
                                                        <td colspan="2" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 25px;">
                                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                                <tr>
                                                                    <td style="color: #ffffff; font-size: 18px; font-weight: 700;">Final Value</td>
                                                                    <td style="color: #00E5FF; font-weight: 800; font-size: 24px; text-align: right;">$${totalValue}</td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>

                                            <!-- Balance Info -->
                                            <div style="margin-top: 30px; background: linear-gradient(90deg, #1f202a 0%, #171821 100%); border-radius: 12px; padding: 20px; text-align: center; border: 1px dashed rgba(255,255,255,0.1);">
                                                <p style="color: #71717a; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1.5px;">Remaining Buying Power</p>
                                                <div style="color: #ffffff; font-size: 28px; font-weight: 700;">$${formattedBalance}</div>
                                            </div>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 30px; background-color: #0b0c11; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                                            <p style="color: #3f3f46; font-size: 11px; margin: 0;">This email is a digital receipt for your market activities on the Stellix Platform.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Premium Trade Confirmation Sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending Trade Email:', error);
        throw error;
    }
};
