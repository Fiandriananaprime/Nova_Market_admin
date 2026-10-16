import { api } from './axios';
import type {
  AccountProfile,
  AccountSecurity,
  AccountSession,
  AdminNotificationPreferences,
  AdminPersonalSettings,
  PlatformSettingsSummary,
  RecoveryCodesResponse,
  TwoFactorSetup,
  VerificationChannel,
} from '@/type/account';

export const getAccountProfile = async () =>
  (await api.get<AccountProfile>('/account/profile')).data;

export const updateAccountProfile = async (payload: Pick<AccountProfile, 'firstName' | 'lastName' | 'phone'>) =>
  (await api.patch<AccountProfile>('/account/profile', payload)).data;

export const getAccountSecurity = async () =>
  (await api.get<AccountSecurity>('/account/security')).data;

export const setupTwoFactor = async () =>
  (await api.post<TwoFactorSetup>('/account/2fa/setup')).data;

export const verifyTwoFactor = async (code: string) =>
  (await api.post<RecoveryCodesResponse>('/account/2fa/verify', { code })).data;

export const disableTwoFactor = async (code: string) =>
  api.post('/account/2fa/disable', { code });

export const regenerateRecoveryCodes = async () =>
  (await api.post<RecoveryCodesResponse>('/account/2fa/recovery-codes')).data;

export const getAccountSessions = async () =>
  (await api.get<AccountSession[]>('/account/sessions')).data;

export const revokeAccountSession = async (id: string) =>
  api.delete(`/account/sessions/${encodeURIComponent(id)}`);

export const revokeOtherAccountSessions = async () =>
  api.delete('/account/sessions');

export const changeAccountPassword = async (currentPassword: string, newPassword: string) =>
  api.patch('/account/password', { currentPassword, newPassword });

export const sendSudoVerification = async (channel: VerificationChannel) =>
  api.post(`/auth/sudo/${channel}`);

export const verifySudoMode = async (channel: VerificationChannel, code: string) =>
  api.post(`/auth/sudo/${channel}/verify`, { code });

export const requestAccountEmailChange = async (email: string) =>
  api.patch('/account/email', { email });

export const confirmAccountEmailChange = async (code: string) =>
  api.post('/account/email/confirm', { code });

export const requestAccountPhoneChange = async (phone: string) =>
  api.patch('/account/phone', { phone });

export const confirmAccountPhoneChange = async (code: string) =>
  api.post('/account/phone/confirm', { code });

export const getAdminPersonalSettings = async () =>
  (await api.get<AdminPersonalSettings>('/admin/settings')).data;

export const updateAdminPersonalSettings = async (settings: AdminPersonalSettings) =>
  (await api.patch<AdminPersonalSettings>('/admin/settings', settings)).data;

export const getAdminNotificationPreferences = async () =>
  (await api.get<AdminNotificationPreferences>('/admin/notifications/preferences')).data;

export const updateAdminNotificationPreferences = async (preferences: AdminNotificationPreferences) =>
  (await api.patch<AdminNotificationPreferences>('/admin/notifications/preferences', preferences)).data;

export const getPlatformSettingsSummary = async () =>
  (await api.get<PlatformSettingsSummary>('/admin/platform-settings')).data;
