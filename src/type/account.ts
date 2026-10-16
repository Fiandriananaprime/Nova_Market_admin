export type VerificationChannel = 'email' | 'phone';
export type AccountTheme = 'light' | 'dark' | 'system';
export type AccountLanguage = 'en' | 'fr' | 'mg';

export interface AccountProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
}

export interface AccountSecurity {
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  passwordLastChangedAt?: string | null;
  lastLoginAt?: string | null;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

export interface RecoveryCodesResponse {
  codes: string[];
}

export interface AccountSession {
  id: string;
  device?: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  location?: string | null;
  lastActiveAt: string;
  createdAt: string;
  current: boolean;
}

export interface AdminPersonalSettings {
  theme: AccountTheme;
  lang: AccountLanguage;
  emailNotifications: boolean;
  pushNotifications: boolean;
  securityAlerts: boolean;
}

export interface AdminNotificationPreferences {
  sellerApplications: boolean;
  productModeration: boolean;
  paymentFailures: boolean;
  fraudAlerts: boolean;
  systemAlerts: boolean;
  userReports: boolean;
}

export interface PlatformSettingsSummary {
  platformName?: string;
  commissionRate?: number;
  defaultDeliveryFee?: number;
  maintenanceMode?: boolean;
  allowNewRegistrations?: boolean;
  allowNewSellerApplications?: boolean;
  requireProductModeration?: boolean;
  requireSellerApproval?: boolean;
  defaultLanguage?: AccountLanguage;
  timezone?: string;
}
