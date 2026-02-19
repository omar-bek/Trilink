import { config } from '../config/env';

/**
 * Generate password reset email HTML template
 */
export const generatePasswordResetEmail = (resetToken: string, userName?: string): string => {
  const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;
  const greeting = userName ? `Hello ${userName},` : 'Hello,';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border: 1px solid #e9ecef;">
        <h1 style="color: #3b82f6; margin-top: 0;">Password Reset Request</h1>
        
        <p>${greeting}</p>
        
        <p>We received a request to reset your password for your TriLink Platform account.</p>
        
        <p>Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
        
        <p><strong>This link will expire in 1 hour.</strong></p>
        
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #6c757d; margin-bottom: 0;">
          This is an automated message from TriLink Platform. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate password reset email text version
 */
export const generatePasswordResetEmailText = (resetToken: string, userName?: string): string => {
  const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;
  const greeting = userName ? `Hello ${userName},` : 'Hello,';
  
  return `
${greeting}

We received a request to reset your password for your TriLink Platform account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

---
This is an automated message from TriLink Platform. Please do not reply to this email.
  `.trim();
};
