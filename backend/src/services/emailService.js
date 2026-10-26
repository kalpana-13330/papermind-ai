const nodemailer = require('nodemailer');

/**
 * Service to handle transactional emails (Password Reset)
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('[EmailService] SMTP transporter initialized.');
    } else {
      console.log('[EmailService] SMTP credentials not provided. Password reset links will be logged to console.');
    }
  }

  /**
   * Send password reset email
   * @param {Object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.name - Recipient name
   * @param {string} options.resetToken - Raw unhashed reset token
   * @param {string} options.resetUrl - Full reset link for frontend
   */
  async sendPasswordResetEmail({ to, name, resetToken, resetUrl }) {
    const from = process.env.EMAIL_FROM || 'AI Research Paper Summarizer <no-reply@aipapersummarizer.com>';
    const subject = 'Password Reset Request - AI Research Paper Summarizer';

    const textContent = `Hello ${name || 'User'},

You requested a password reset for your AI Research Paper Summarizer account.
Please use the following link to reset your password (valid for ${process.env.RESET_PASSWORD_EXPIRE_MINUTES || 60} minutes):

${resetUrl}

If you did not request this, please ignore this email and your password will remain unchanged.

Best regards,
AI Research Paper Summarizer Team`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">Hello ${name || 'User'},</p>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">You recently requested to reset your password for your <strong>AI Research Paper Summarizer</strong> account. Click the button below to reset it:</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.4;">Or copy and paste this URL into your browser:<br/><a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a></p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">This link will expire in ${process.env.RESET_PASSWORD_EXPIRE_MINUTES || 60} minutes. If you did not request a password reset, please ignore this email.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          text: textContent,
          html: htmlContent,
        });
        console.log(`[EmailService] Password reset email sent to ${to}`);
        return true;
      } catch (error) {
        console.error(`[EmailService Error] Failed to send email to ${to}:`, error.message);
        throw error;
      }
    } else {
      // In development or when SMTP is not configured, log clearly
      console.log(`\n================== [DEV EMAIL SIMULATION] ==================`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Reset Token: ${resetToken}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`============================================================\n`);
      return true;
    }
  }
}

module.exports = new EmailService();
