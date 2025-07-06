const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config(); // Ensure environment variables are loaded

const sendEmail = async (options) => {
  // 1) Create a transporter
  // For Gmail, ensure you have "Less secure app access" ON or use an App Password if 2FA is enabled.
  // Using an App Password is more secure than enabling "Less secure app access".
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or use host/port for other services
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // Use App Password here if 2FA is enabled
    },
    // For Gmail, you might need to enable "Less secure app access" in your Google account settings
    // or generate an "App Password" if you have 2-Step Verification enabled.
    // Using an App Password is the recommended and more secure method.
    // If using OAuth2, the setup is different:
    // auth: {
    //   type: 'OAuth2',
    //   user: process.env.GMAIL_USER,
    //   clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
    //   clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
    //   refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
    //   // accessToken: process.env.GMAIL_OAUTH_ACCESS_TOKEN, // Optional
    // }
  });

  // 2) Define the email options
  const mailOptions = {
    from: `Classifieds Platform <${process.env.GMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // For plain text
    // html: options.html // For HTML content
  };

  // 3) Actually send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    // Depending on the app's needs, you might throw the error or handle it
    // For now, logging it. In a real app, you might want to throw an error
    // to be caught by the global error handler if email sending is critical.
    // throw new Error('There was an error sending the email. Try again later.');
  }
};

const sendVerificationEmail = async (userEmail, verificationToken, req) => {
  const verificationUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/verify-email/${verificationToken}`;

  const message = `Welcome to Our Classifieds Platform!

Please verify your email address by clicking on the link below, or by pasting it into your browser:
${verificationUrl}

If you did not create an account on our platform, please ignore this email.

This link will expire in 10 minutes.

Thanks,
The Team`;

  try {
    await sendEmail({
      email: userEmail,
      subject: 'Email Verification - Classifieds Platform',
      message,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Handle or throw error as appropriate for your application flow
  }
};


const sendPasswordResetEmail = async (userEmail, resetToken, req) => {
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/reset-password/${resetToken}`; // Assuming this will be the frontend URL eventually

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password.
Please click on the following link, or paste this into your browser to complete the process:
${resetUrl}

If you did not request this, please ignore this email and your password will remain unchanged.
This link will expire in 10 minutes.`;

  try {
    await sendEmail({
      email: userEmail,
      subject: 'Password Reset Request - Classifieds Platform',
      message,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
};


module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail
};
