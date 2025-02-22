// src/services/email/emailService.js
import { Resend } from 'resend';

class EmailService {
  constructor() {
    console.group('Email Service Initialization');
    const apiKey = process.env.REACT_APP_RESEND_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Resend API key is missing');
      this.isInitialized = false;
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      // Use a simple verified email as sender during development
      this.from = process.env.NODE_ENV === 'development' 
        ? 'onboarding@resend.dev'  // Use Resend's default sender
        : 'Atomik Trading <onboarding@sandbox.resend.dev>';
      
      this.isInitialized = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isInitialized = false;
    }
    console.groupEnd();
  }

  async sendWelcomeEmail(props) {
    console.group('Sending Welcome Email');
    console.log('Service initialized:', this.isInitialized);
    console.log('Recipient:', props.email);
    console.log('From address:', this.from);

    if (!this.isInitialized) {
      throw new Error('Email service is not properly initialized');
    }

    if (!props.email) {
      throw new Error('Email is required');
    }

    try {
      console.log('Attempting to send email...');
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: props.email,
        subject: 'Welcome to Atomik Trading',
        text: 'Thank you for subscribing to our newsletter!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #00C6E0;">Welcome to Atomik Trading!</h1>
            <p>Thank you for subscribing to our newsletter.</p>
            <p>We'll keep you updated with the latest trading insights and platform updates.</p>
          </div>
        `
      });

      if (error) {
        console.error('Resend API error:', error);
        throw error;
      }

      console.log('✅ Email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Email sending error:', error);
      // Check for specific error types
      if (error.message?.includes('CORS')) {
        throw new Error('Unable to send email due to CORS restrictions. Please check your API configuration.');
      }
      throw error;
    } finally {
      console.groupEnd();
    }
  }
}

export const emailService = new EmailService();