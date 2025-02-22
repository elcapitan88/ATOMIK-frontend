// src/services/email/emailTypes.ts

// Base email interface
export interface BaseEmailProps {
    email: string;
    firstName?: string;
  }
  
  // Marketing Emails
  export interface WelcomeEmailProps extends BaseEmailProps {
    verificationLink?: string;
  }
  
  export interface NewsletterEmailProps extends BaseEmailProps {
    subject: string;
    content: string;
  }
  
  // Account Emails
  export interface PasswordResetEmailProps extends BaseEmailProps {
    resetLink: string;
    expirationTime: string;
  }
  
  export interface AccountVerificationEmailProps extends BaseEmailProps {
    verificationCode: string;
    verificationLink: string;
  }
  
  export interface LoginAlertEmailProps extends BaseEmailProps {
    loginTime: string;
    ipAddress: string;
    location?: string;
    deviceInfo?: string;
  }
  
  // Trading Emails
  export interface TradeExecutionEmailProps extends BaseEmailProps {
    tradeId: string;
    symbol: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    timestamp: string;
    broker: string;
    accountId: string;
  }
  
  export interface WebhookAlertEmailProps extends BaseEmailProps {
    webhookId: string;
    status: 'SUCCESS' | 'FAILED' | 'DELAYED';
    timestamp: string;
    errorDetails?: string;
  }
  
  export interface PositionUpdateEmailProps extends BaseEmailProps {
    symbol: string;
    positionSize: number;
    currentPrice: number;
    profitLoss: number;
    changePercentage: number;
  }
  
  export interface MarginCallEmailProps extends BaseEmailProps {
    accountId: string;
    currentMargin: number;
    requiredMargin: number;
    callAmount: number;
    deadline: string;
  }
  
  // Subscription Emails
  export interface SubscriptionUpdateEmailProps extends BaseEmailProps {
    planName: string;
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'UPCOMING_RENEWAL';
    effectiveDate: string;
    nextBillingDate?: string;
    amount?: number;
  }
  
  export interface PaymentFailureEmailProps extends BaseEmailProps {
    planName: string;
    amount: number;
    failureReason: string;
    retryDate: string;
  }
  
  // System Emails
  export interface SystemMaintenanceEmailProps extends BaseEmailProps {
    maintenanceTime: string;
    duration: string;
    affectedServices: string[];
    expectedImpact: string;
  }
  
  export interface ServiceDisruptionEmailProps extends BaseEmailProps {
    service: string;
    status: 'DEGRADED' | 'DOWN' | 'RESTORED';
    startTime: string;
    expectedResolution?: string;
    details: string;
  }
  
  // API Related Emails
  export interface ApiKeyEmailProps extends BaseEmailProps {
    keyId: string;
    action: 'CREATED' | 'REVOKED' | 'EXPIRED';
    expirationDate?: string;
  }
  
  export interface WebhookConfigEmailProps extends BaseEmailProps {
    webhookUrl: string;
    action: 'CREATED' | 'UPDATED' | 'DELETED';
    configDetails: {
      events: string[];
      security?: {
        authType: 'HMAC' | 'JWT' | 'BASIC';
        keyId?: string;
      };
    };
  }
  
  // Email Template Types
  export type EmailTemplate = 
    | 'WELCOME'
    | 'NEWSLETTER'
    | 'PASSWORD_RESET'
    | 'ACCOUNT_VERIFICATION'
    | 'LOGIN_ALERT'
    | 'TRADE_EXECUTION'
    | 'WEBHOOK_ALERT'
    | 'POSITION_UPDATE'
    | 'MARGIN_CALL'
    | 'SUBSCRIPTION_UPDATE'
    | 'PAYMENT_FAILURE'
    | 'SYSTEM_MAINTENANCE'
    | 'SERVICE_DISRUPTION'
    | 'API_KEY'
    | 'WEBHOOK_CONFIG';
  
  // Email Priority Types
  export type EmailPriority = 'HIGH' | 'MEDIUM' | 'LOW';
  
  // Email Configuration Interface
  export interface EmailConfig {
    template: EmailTemplate;
    priority: EmailPriority;
    props: 
      | WelcomeEmailProps
      | NewsletterEmailProps
      | PasswordResetEmailProps
      | AccountVerificationEmailProps
      | LoginAlertEmailProps
      | TradeExecutionEmailProps
      | WebhookAlertEmailProps
      | PositionUpdateEmailProps
      | MarginCallEmailProps
      | SubscriptionUpdateEmailProps
      | PaymentFailureEmailProps
      | SystemMaintenanceEmailProps
      | ServiceDisruptionEmailProps
      | ApiKeyEmailProps
      | WebhookConfigEmailProps;
    metadata?: {
      category: string;
      userId?: string;
      traceId?: string;
      retryCount?: number;
    };
  }
  
  // Email Response Interface
  export interface EmailResponse {
    id: string;
    status: 'SENT' | 'FAILED' | 'BOUNCED' | 'DELIVERED';
    sentAt: string;
    deliveredAt?: string;
    error?: {
      code: string;
      message: string;
    };
  }
  
  // Email Service Error Types
  export type EmailErrorType = 
    | 'INVALID_RECIPIENT'
    | 'TEMPLATE_ERROR'
    | 'SENDING_FAILED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'INVALID_CONFIGURATION'
    | 'AUTHENTICATION_ERROR'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';
  
  export interface EmailError {
    type: EmailErrorType;
    message: string;
    code: string;
    details?: any;
    timestamp: string;
    retriable: boolean;
  }