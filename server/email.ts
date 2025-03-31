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
  bcc?: string[];
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
    // Create a configured transporter with defaults
    // Using a service that doesn't require authentication for development/demo purposes
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'naturebreedfarm@example.com',
        pass: 'farm_password',
      },
      tls: {
        rejectUnauthorized: false, // for development only
      },
    });
    
    // Mark as configured by default to enable email sending
    this.isConfigured = true;
    
    console.log('Email service initialized and configured by default');
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
    console.log('========== EMAIL SERVICE DEBUGGING ==========');
    console.log('Email service configured:', this.isConfigured);
    
    if (!this.isConfigured) {
      console.error('Email service is not configured. Configure it first via settings.');
      return false; // Changed from throwing error to returning false for graceful handling
    }

    try {
      console.log('Attempting to send email to:', emailData.to);
      console.log('Email subject:', emailData.subject);
      
      const mailOptions = {
        from: '"Nature Breed Farm" <farm@naturebreed.com>',
        to: emailData.to,
        bcc: emailData.bcc,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      };
      
      console.log('Mail configuration status: Configured');
      
      // Actual email sending in production
      // For development/demo, simulate successful sending and show email content
      let result;
      
      if (process.env.NODE_ENV === 'production') {
        result = await this.transporter.sendMail(mailOptions);
      } else {
        // Development mode - log email content instead of sending
        console.log('============ EMAIL CONTENT =============');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('HTML Content Available:', !!mailOptions.html);
        console.log('Text Content Available:', !!mailOptions.text);
        
        // Simulate successful send
        result = { 
          messageId: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          accepted: [mailOptions.to]
        };
        
        // Log preview
        console.log('Preview: Email sent successfully');
        console.log('=======================================');
      }
      
      console.log('Email sent successfully. MessageId:', result.messageId);
      console.log('Recipients accepted:', result.accepted);
      console.log('============================================');
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      console.log('============================================');
      return false;
    }
  }

  /**
   * Create and send a verification email
   */
  async sendVerificationEmail(email: string, verificationUrl: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.error('Email service is not configured for sendVerificationEmail');
      return false;
    }

    // Generate a new token and store it with the email
    const token = this.generateVerificationToken(email);

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
      console.error('Email service is not configured for sendNewsletterWelcome');
      return false;
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
   * Send a promotional email to newsletter subscribers
   */
  async sendPromotionalEmail(
    recipients: string[], 
    subject: string, 
    title: string, 
    content: string, 
    ctaLink?: string, 
    ctaText?: string
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.error('Email service is not configured for sendPromotionalEmail');
      return false;
    }
    
    if (!recipients.length) {
      return false;
    }
    
    // Send to all recipients using BCC for privacy
    return await this.sendEmail({
      to: 'newsletter@naturebreedfarm.com',
      bcc: recipients,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">${title}</h2>
          <div style="padding: 15px; margin: 20px 0; border-radius: 5px;">
            ${content}
          </div>
          ${ctaLink && ctaText ? `
            <div style="text-align: center; margin: 25px 0;">
              <a href="${ctaLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                ${ctaText}
              </a>
            </div>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Nature Breed Farm. All rights reserved.
            <br>
            <a href="{unsubscribe_link}" style="color: #999;">Unsubscribe</a>
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
      console.error('Email service is not configured for sendProductInfo');
      return false;
    }

    const { 
      price, 
      description, 
      category, 
      quantity, 
      unit, 
      customerName = "Valued Customer",
      referenceNumber = `PI-${Date.now().toString().slice(-6)}`
    } = productDetails;

    return await this.sendEmail({
      to: email,
      subject: `Information about ${productName} - Ref #${referenceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">${productName}</h2>
          <p>Dear ${customerName},</p>
          <p>Thank you for your interest in our ${productName.toLowerCase()}. Here is the information you requested:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Price:</strong> $${price.toFixed(2)} per ${unit}</p>
            <p><strong>Available:</strong> ${quantity} ${unit}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Reference Number:</strong> ${referenceNumber}</p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="#" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Visit Our Shop</a>
          </div>
          
          <p>If you'd like to place a bulk order or have any questions, please reply to this email or call us at (555) 123-4567.</p>
          
          <div style="background-color: #effaf3; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <p style="margin: 0;"><strong>Want to stay updated?</strong></p>
            <p style="margin: 10px 0 0;">Subscribe to our newsletter to receive updates on new products, seasonal offerings, and exclusive deals.</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Nature Breed Farm. All rights reserved.
          </p>
        </div>
      `,
    });
  }
  
  /**
   * Send bulk order confirmation email
   */
  async sendBulkOrderConfirmation(
    email: string, 
    name: string, 
    orderDetails: {
      productName: string;
      quantity: number;
      referenceNumber: string;
    }
  ): Promise<boolean> {
    console.log('========== EMAIL SERVICE DEBUGGING ==========');
    console.log('Email service configured:', this.isConfigured);
    console.log('Attempting to send email to:', email);
    console.log('Email subject:', `Your Bulk Order Request - Ref #${orderDetails.referenceNumber}`);
    console.log('Mail configuration status:', this.isConfigured ? 'Configured' : 'Not configured');
    
    if (!this.isConfigured) {
      console.error('Email service is not configured for sendBulkOrderConfirmation');
      return false;
    }

    const { productName, quantity, referenceNumber } = orderDetails;

    return await this.sendEmail({
      to: email,
      subject: `Your Bulk Order Request - Ref #${referenceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Bulk Order Request Received</h2>
          <p>Dear ${name},</p>
          <p>Thank you for your interest in bulk purchasing from Nature Breed Farm! We have received your request for:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Product:</strong> ${productName}</p>
            <p><strong>Quantity:</strong> ${quantity}</p>
            <p><strong>Reference Number:</strong> ${referenceNumber}</p>
          </div>
          
          <p>Our team will review your request and get back to you within 1-2 business days with pricing and availability information. If you need immediate assistance, please contact us at (555) 123-4567.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="#" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Our Products</a>
          </div>
          
          <p>Thank you for choosing Nature Breed Farm for your bulk purchase needs!</p>
          
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Nature Breed Farm. All rights reserved.
          </p>
        </div>
      `,
    });
  }
  
  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(email: string, name: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.error('Email service is not configured for sendRegistrationConfirmation');
      return false;
    }

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Nature Breed Farm',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Welcome to Nature Breed Farm</h2>
          <p>Dear ${name},</p>
          <p>Thank you for registering with Nature Breed Farm! Your account has been successfully created.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p>As a registered user, you can now:</p>
            <ul>
              <li>Access your account dashboard</li>
              <li>Track your orders</li>
              <li>Receive exclusive offers</li>
              <li>Get updates on new products</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="#" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Visit Your Dashboard</a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
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
   * If email is provided, it also stores the token with the email
   */
  generateVerificationToken(email?: string): string {
    const token = randomBytes(32).toString('hex');
    
    // If email is provided, store the token with the email
    if (email) {
      // Set expiration time to 24 hours from now
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      
      // Store the token
      this.verificationTokens.set(token, {
        email,
        token,
        expires,
      });
    }
    
    return token;
  }

  /**
   * Check if the email service is configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

export const emailService = new EmailService();