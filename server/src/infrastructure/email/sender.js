import nodemailer from 'nodemailer';
import logger from '../../shared/logger/logger.js';

let transporter;

async function initTransporter() {
  if (transporter) return transporter;

  // Use Ethereal Email for testing if no real SMTP credentials are provided
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.info('[Email] Creating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    // Production SMTP
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });
  }

  return transporter;
}

/**
 * Sends an OTP email.
 * @param {string} email 
 * @param {string} otp 
 */
export async function sendOTP(email, otp) {
  try {
    const tp = await initTransporter();
    
    const info = await tp.sendMail({
      from: `"CareerPilot AI" <${process.env.EMAIL_USER || 'no-reply@careerpilot.ai'}>`,
      to: email,
      subject: "Your CareerPilot AI Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2>CareerPilot AI</h2>
          <p>Your one-time password (OTP) for login is:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; color: #3B82F6;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });

    logger.info(`[Email] OTP sent to ${email}. Message ID: ${info.messageId}`);
    
    // Log Ethereal URL if using test account
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      logger.info(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    logger.error(`[Email] Failed to send OTP to ${email}:`, error.message);
    throw new Error('Failed to send OTP email');
  }
}
