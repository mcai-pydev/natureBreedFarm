import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface VerificationToken {
  email: string;
  token: string;
  expires: Date;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private verificationTokens: Map<string, VerificationToken> = new Map();
  private isConfigured: boolean = false;

  constructor() {
    // Create an unconfigured transporter initially
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: {
        user: 'user',
        pass: 'pass',
      },
      tls: {
        rejectUnauthorized: false, // for testing only
      },
    });
    
    // Mark as not configured
    this.isConfigured = false;
  }

  /**
   * Initialize the email transporter with the provided configuration
   */
  configure(config: EmailConfig): boolean {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
      });

      this.isConfigured = true;
      return true;
    } catch (error) {
      console.error('Email configuration error:', error);
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Send an email with the provided data
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('Email service is not configured');
    }

    try {
      await this.transporter.sendMail({
        from: '"Nature Breed Farm" <farm@naturebreed.com>',
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Create and send a verification email
   */
  async sendVerificationEmail(email: string, verificationUrl: string): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('Email service is not configured');
    }

    // Generate a new token
    const token = this.generateVerificationToken();
    
    // Set expiration time to 24 hours from now
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    
    // Store the token
    this.verificationTokens.set(token, {
      email,
      token,
      expires,
    });

    // Create full verification URL
    const fullVerificationUrl = `${verificationUrl}?token=${token}`;

    return await this.sendEmail({
      to: email,
      subject: 'Please verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p>Thank you for subscribing to Nature Breed Farm's newsletter!</p>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${fullVerificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${fullVerificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Nature Breed Farm. All rights reserved.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send a newsletter subscription confirmation email
   */
  async sendNewsletterWelcome(email: string): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('Email service is not configured');
    }

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Nature Breed Farm Newsletter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Welcome to Our Newsletter!</h2>
          <p>Dear Subscriber,</p>
          <p>Thank you for confirming your subscription to the Nature Breed Farm newsletter.</p>
          <p>You'll now receive updates about:</p>
          <ul>
            <li>New products and seasonal offerings</li>
            <li>Special promotions and discounts</li>
            <li>Farm events and activities</li>
            <li>Farming tips and educational content</li>
          </ul>
          <p>Visit our shop anytime at <a href="https://naturebreedfarm.com/shop">naturebreedfarm.com/shop</a>.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Nature Breed Farm. All rights reserved.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send product information email
   */
  async sendProductInfo(email: string, productName: string, productDetails: any): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('Email service is not configured');
    }

    const { price, description, category, quantity, unit } = productDetails;

    return await this.sendEmail({
      to: email,
      subject: `Information about ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">${productName}</h2>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Price:</strong> $${price.toFixed(2)} per ${unit}</p>
            <p><strong>Available:</strong> ${quantity} ${unit}</p>
            <p><strong>Description:</strong> ${description}</p>
          </div>
          <div style="text-align: center; margin: 25px 0;">
            <a href="#" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Visit Our Shop</a>
          </div>
          <p>Thank you for your interest in our products. If you'd like to place a bulk order or have any questions, please reply to this email or call us at (555) 123-4567.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Nature Breed Farm. All rights reserved.
          </p>
        </div>
      `,
    });
  }

  /**
   * Verify an email token
   */
  verifyEmailToken(token: string): string | null {
    const verification = this.verificationTokens.get(token);
    
    if (!verification) {
      return null;
    }
    
    // Check if token has expired
    if (new Date() > verification.expires) {
      this.verificationTokens.delete(token);
      return null;
    }
    
    // Token is valid, return the email
    const email = verification.email;
    
    // Remove the token to prevent reuse
    this.verificationTokens.delete(token);
    
    return email;
  }

  /**
   * Generate a random verification token
   */
  private generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Check if the email service is configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

export const emailService = new EmailService();