import nodemailer from 'nodemailer';
import ENV_CONFIG from '../config/config.env.js';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: ENV_CONFIG.NODEMAILER_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: ENV_CONFIG.NODEMAILER_USER_EMAIL,
      pass: ENV_CONFIG.NODEMAILER_USER_PASSWORD
    }
  });

  const mailOptions = {
    from: ENV_CONFIG.NODEMAILER_USER_EMAIL,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;