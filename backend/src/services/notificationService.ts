import nodemailer from 'nodemailer';
import Config from '../models/Config';

// Placeholder for SMS/Push providers (e.g., Twilio, Firebase)
// Since we don't have actual keys, we'll log to console or simulate.

export const sendEmail = async (to: string[], subject: string, text: string) => {
  console.log(`[NotificationService] Preparing to send email to ${to.join(', ')}`);

  try {
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_USER !== 'your-email@gmail.com') {
      // Use configured SMTP
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, 
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('[NotificationService] Using configured SMTP server');
    } else {
      // Fallback to Ethereal Email (Test Account)
      console.log('[NotificationService] SMTP not fully configured. Using Ethereal Test Account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Smart Helmet System" <system@helmet.com>',
      to: to.join(', '),
      subject,
      text,
    });

    console.log(`[NotificationService] Email sent: ${info.messageId}`);
    
    // If using Ethereal, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[NotificationService] Preview Email URL: ${previewUrl}`);
      console.log(`[NotificationService] ^^^ CLICK THE LINK ABOVE TO SEE THE OTP ^^^`);
    }

  } catch (error) {
    console.error('[NotificationService] Email Error:', error);
  }
};

export const sendSMS = async (to: string[], message: string) => {
  console.log(`[NotificationService] Sending SMS to ${to.join(', ')}: ${message}`);
};

export const sendPush = async (userIds: string[], title: string, body: string) => {
  console.log(`[NotificationService] Sending Push to users ${userIds.join(', ')}: ${title} - ${body}`);
};

export const notifyAlert = async (alert: any, device: any) => {
  try {
    const config = await Config.findOne().sort({ createdAt: -1 });
    if (!config) return;

    const { notifications } = config;
    if (!notifications) return;

    const recipients = [...(notifications.adminEmails || [])];
    const emergencyContacts = [...(notifications.emergencyContacts || [])];
    
    // Construct Message
    const subject = `[${alert.severity.toUpperCase()}] Alert: ${alert.type}`;
    const message = `
      Alert Type: ${alert.type}
      Severity: ${alert.severity}
      Value: ${alert.value}
      Device: ${device?.deviceId || 'Unknown'}
      User: ${device?.assignedUser?.name || 'Unassigned'}
      Location: ${device?.lat}, ${device?.lng}
      Time: ${new Date().toLocaleString()}
    `;

    // Email
    if (notifications.emailEnabled && recipients.length > 0) {
      await sendEmail(recipients, subject, message);
    }

    // SMS
    if (notifications.smsEnabled && emergencyContacts.length > 0) {
      await sendSMS(emergencyContacts, `CRITICAL: ${alert.type} detected for ${device?.assignedUser?.name || 'worker'}.`);
    }

    // Push (simulated to all admins)
    if (notifications.pushEnabled) {
      // Logic to find admin user IDs would go here
      await sendPush(['admin-ids'], subject, message);
    }

  } catch (error) {
    console.error('Notification Error:', error);
  }
};
