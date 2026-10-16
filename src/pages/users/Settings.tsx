import { useEffect, useState } from 'react';
import { Activity, Bell, Check, Copy, Globe2, KeyRound, Laptop, LockKeyhole, Mail, Monitor, Palette, Phone, RefreshCw, Save, Shield, ShieldAlert, ShieldCheck, Smartphone, Store, UserRound, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Skeleton } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage } from '@/api/errorMessage';
import { useTheme } from '@/contexts/ThemeContext';
import i18n from '@/i18n';
import { formatPrice } from '@/hook/format';
import {
  changeAccountPassword,
  confirmAccountEmailChange,
  confirmAccountPhoneChange,
  disableTwoFactor,
  getAccountProfile,
  getAccountSecurity,
  getAccountSessions,
  getAdminNotificationPreferences,
  getAdminPersonalSettings,
  getPlatformSettingsSummary,
  regenerateRecoveryCodes,
  requestAccountEmailChange,
  requestAccountPhoneChange,
  revokeAccountSession,
  revokeOtherAccountSessions,
  sendSudoVerification,
  setupTwoFactor,
  updateAccountProfile,
  updateAdminNotificationPreferences,
  updateAdminPersonalSettings,
  verifySudoMode,
  verifyTwoFactor,
} from '@/api/account.api';
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

type SettingsTab = 'account' | 'security' | 'preferences';

const defaultNotifications: AdminNotificationPreferences = {
  sellerApplications: false,
  productModeration: false,
  paymentFailures: false,
  fraudAlerts: false,
  systemAlerts: false,
  userReports: false,
};

function SettingsSection({ title, description, icon, children, action }: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span><div><h2 className="font-semibold text-secondary-foreground">{title}</h2>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div></div>
      {action}
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>;
}

function SwitchRow({ title, description, checked, onChange, disabled = false }: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
    <div><p className="text-sm font-medium text-secondary-foreground">{title}</p>{description && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>}</div>
    <button type="button" role="switch" aria-checked={checked} aria-label={title} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-border'}`}><span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}/><span className="sr-only">{checked ? t('On') : t('Off')}</span></button>
  </div>;
}

function TextField({ label, value, onChange, type = 'text', placeholder, autoComplete }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-secondary-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"/></label>;
}

export default function AdminSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [tab, setTab] = useState<SettingsTab>('account');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [security, setSecurity] = useState<AccountSecurity | null>(null);
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [personalSettings, setPersonalSettings] = useState<AdminPersonalSettings | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<AdminNotificationPreferences>(defaultNotifications);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettingsSummary | null>(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sudoChannel, setSudoChannel] = useState<VerificationChannel>('email');
  const [sudoCodeSent, setSudoCodeSent] = useState(false);
  const [sudoCode, setSudoCode] = useState('');
  const [sudoVerified, setSudoVerified] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const results = await Promise.allSettled([
        getAccountProfile(), getAccountSecurity(), getAccountSessions(),
        getAdminPersonalSettings(), getAdminNotificationPreferences(), getPlatformSettingsSummary(),
      ]);
      if (!active) return;
      const [profileResult, securityResult, sessionsResult, settingsResult, notificationsResult, platformResult] = results;
      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
        setSudoChannel(profileResult.value.emailVerified ? 'email' : 'phone');
      }
      else toast(getApiErrorMessage(profileResult.reason, i18n.t('Unable to load account profile.')), 'error');
      if (securityResult.status === 'fulfilled') setSecurity(securityResult.value);
      else toast(getApiErrorMessage(securityResult.reason, i18n.t('Unable to load security settings.')), 'error');
      if (sessionsResult.status === 'fulfilled') setSessions(sessionsResult.value ?? []);
      else toast(getApiErrorMessage(sessionsResult.reason, i18n.t('Unable to load active sessions.')), 'error');
      if (settingsResult.status === 'fulfilled') {
        const preferences: AdminPersonalSettings = {
          theme: settingsResult.value.theme ?? 'system',
          lang: settingsResult.value.lang ?? 'en',
          emailNotifications: settingsResult.value.emailNotifications ?? false,
          pushNotifications: settingsResult.value.pushNotifications ?? false,
          securityAlerts: settingsResult.value.securityAlerts ?? false,
        };
        setPersonalSettings(preferences);
        setTheme(preferences.theme);
        void i18n.changeLanguage(preferences.lang);
      } else toast(getApiErrorMessage(settingsResult.reason, i18n.t('Unable to load preferences.')), 'error');
      if (notificationsResult.status === 'fulfilled') setNotificationPreferences({ ...defaultNotifications, ...notificationsResult.value });
      else toast(getApiErrorMessage(notificationsResult.reason, i18n.t('Unable to load notification preferences.')), 'error');
      if (platformResult.status === 'fulfilled') setPlatformSettings(platformResult.value);
      else toast(getApiErrorMessage(platformResult.reason, i18n.t('Unable to load marketplace settings.')), 'error');
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [setTheme, toast]);

  const runAction = async (key: string, action: () => Promise<void>, success?: string) => {
    setBusy(key);
    try {
      await action();
      if (success) toast(t(success));
    } catch (error) {
      toast(getApiErrorMessage(error, t('Something went wrong. Please try again.')), 'error');
    } finally {
      setBusy(null);
    }
  };

  const refreshSecurity = async () => {
    const [nextSecurity, nextSessions] = await Promise.all([getAccountSecurity(), getAccountSessions()]);
    setSecurity(nextSecurity);
    setSessions(nextSessions ?? []);
  };

  const saveProfile = () => {
    if (!profile) return;
    void runAction('profile', async () => {
      const updated = await updateAccountProfile({ firstName: profile.firstName, lastName: profile.lastName });
      setProfile(updated);
    }, 'Profile updated successfully');
  };

  const requestSudo = () => runAction('sudo-send', async () => {
    await sendSudoVerification(sudoChannel);
    setSudoCodeSent(true);
    setSudoVerified(false);
  }, 'Verification code sent');

  const verifySudo = () => runAction('sudo-verify', async () => {
    await verifySudoMode(sudoChannel, sudoCode.trim());
    setSudoVerified(true);
    setSudoCodeSent(false);
    setSudoCode('');
  }, 'Sudo mode verified for sensitive account changes');

  const startEmailChange = () => runAction('email-request', async () => {
    await requestAccountEmailChange(newEmail.trim());
    setEmailCodeSent(true);
  }, 'Email confirmation code sent');

  const confirmEmailChange = () => runAction('email-confirm', async () => {
    await confirmAccountEmailChange(emailCode.trim());
    const updated = await getAccountProfile();
    setProfile(updated);
    setEmailCodeSent(false);
    setNewEmail('');
    setEmailCode('');
    setSudoVerified(false);
  }, 'Email updated successfully');

  const startPhoneChange = () => runAction('phone-request', async () => {
    await requestAccountPhoneChange(newPhone.trim());
    setPhoneCodeSent(true);
  }, 'Phone confirmation code sent');

  const confirmPhoneChange = () => runAction('phone-confirm', async () => {
    await confirmAccountPhoneChange(phoneCode.trim());
    const updated = await getAccountProfile();
    setProfile(updated);
    setPhoneCodeSent(false);
    setNewPhone('');
    setPhoneCode('');
    setSudoVerified(false);
    await refreshSecurity();
  }, 'Phone updated successfully');

  const savePassword = () => runAction('password', async () => {
    await changeAccountPassword(currentPassword, newPassword);
    setCurrentPassword('');
    setNewPassword('');
    await refreshSecurity();
  }, 'Password changed successfully');

  const savePreferences = () => {
    if (!personalSettings) return;
    void runAction('preferences', async () => {
      await Promise.all([
        updateAdminPersonalSettings(personalSettings),
        updateAdminNotificationPreferences(notificationPreferences),
      ]);
      setTheme(personalSettings.theme);
      await i18n.changeLanguage(personalSettings.lang);
    }, 'Preferences saved successfully');
  };

  const revokeSession = (session: AccountSession) => runAction(`session-${session.id}`, async () => {
    await revokeAccountSession(session.id);
    setSessions((current) => current.filter((item) => item.id !== session.id));
  }, 'Session revoked');

  const revokeOtherSessions = () => runAction('sessions-all', async () => {
    await revokeOtherAccountSessions();
    setSessions((current) => current.filter((session) => session.current));
  }, 'Other sessions revoked');

  const setup2FA = () => runAction('2fa-setup', async () => {
    setTwoFactorSetup(await setupTwoFactor());
  });

  const enable2FA = () => runAction('2fa-verify', async () => {
    const response: RecoveryCodesResponse = await verifyTwoFactor(totpCode.trim());
    setRecoveryCodes(response.codes ?? []);
    setTotpCode('');
    setTwoFactorSetup(null);
    await refreshSecurity();
  }, 'Two-step verification enabled');

  const turnOff2FA = () => runAction('2fa-disable', async () => {
    await disableTwoFactor(disableCode.trim());
    setDisableCode('');
    await refreshSecurity();
  }, 'Two-step verification disabled');

  const showNewRecoveryCodes = () => runAction('recovery-codes', async () => {
    const response = await regenerateRecoveryCodes();
    setRecoveryCodes(response.codes ?? []);
  }, 'Recovery codes regenerated');

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: 'account', label: t('Account'), icon: <UserRound className="h-4 w-4"/> },
    { id: 'security', label: t('Security'), icon: <Shield className="h-4 w-4"/> },
    { id: 'preferences', label: t('Preferences'), icon: <Palette className="h-4 w-4"/> },
  ];

  if (loading) return <div className="mx-auto max-w-5xl space-y-5"><Skeleton className="h-24 w-full rounded-2xl"/><Skeleton className="h-12 w-full rounded-xl"/><Skeleton className="h-72 w-full rounded-2xl"/></div>;

  return <div className="mx-auto max-w-5xl space-y-6 animate-page-in">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.18em] text-primary">{t('Workspace')}</p><h1 className="text-2xl font-bold tracking-tight text-secondary-foreground">{t('Settings')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('Manage your administrator account, access security and workspace preferences.')}</p></div>{profile && <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{`${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()}</div><div><p className="text-sm font-semibold text-secondary-foreground">{profile.firstName} {profile.lastName}</p><p className="text-xs text-muted-foreground">{profile.email}</p></div></div>}</header>

    <nav aria-label={t('Settings sections')} className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5 shadow-sm">{tabs.map((item) => <button key={item.id} type="button" aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-medium transition ${tab === item.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'}`}>{item.icon}{item.label}</button>)}</nav>

    {tab === 'account' && <div className="space-y-5">
      <SettingsSection title={t('Profile information')} description={t('Update the name and contact details shown on your administrator account.')} icon={<UserRound className="h-4 w-4"/>} action={<Button variant="primary" size="sm" loading={busy === 'profile'} onClick={saveProfile}><Save className="h-4 w-4"/>{t('Save profile')}</Button>}>
        {profile ? <div className="grid gap-4 sm:grid-cols-2"><TextField label={t('First name')} value={profile.firstName} onChange={(value) => setProfile({ ...profile, firstName: value })} autoComplete="given-name"/><TextField label={t('Last name')} value={profile.lastName} onChange={(value) => setProfile({ ...profile, lastName: value })} autoComplete="family-name"/><div className="rounded-xl border border-border bg-secondary/40 p-3"><p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Mail className="h-3.5 w-3.5"/>{t('Current email')}</p><p className="mt-1.5 text-sm font-medium text-secondary-foreground">{profile.email}</p><p className="mt-1 text-[11px] text-muted-foreground">{profile.emailVerified ? t('Verified') : t('Not verified')}</p></div><div className="rounded-xl border border-border bg-secondary/40 p-3"><p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Phone className="h-3.5 w-3.5"/>{t('Phone number')}</p><p className="mt-1.5 text-sm font-medium text-secondary-foreground">{profile.phone || t('Not provided')}</p><p className="mt-1 text-[11px] text-muted-foreground">{profile.phoneVerified ? t('Verified') : t('Not verified')}</p></div></div> : <p className="text-sm text-muted-foreground">{t('Account profile unavailable.')}</p>}
      </SettingsSection>

      <SettingsSection title={t('Change email or phone')} description={t('Sensitive contact changes require sudo verification and a confirmation code.')} icon={<ShieldAlert className="h-4 w-4"/>}>
        <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/[.07] p-4">
          <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-xl"><p className="text-sm font-semibold text-secondary-foreground">{t('Sudo mode')}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t('Verify your identity before changing sensitive account information. The verification is managed by the secure account session.')}</p></div>{sudoVerified && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><Check className="h-3.5 w-3.5"/>{t('Verified for this page')}</span>}</div>
          {!sudoVerified && <div className="mt-4 flex flex-wrap items-end gap-2"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{t('Send code to')}</span><select value={sudoChannel} onChange={(event) => setSudoChannel(event.target.value as VerificationChannel)} className="h-10 min-w-40 rounded-lg border border-border bg-background px-3 text-sm text-secondary-foreground"><option value="email" disabled={!profile?.emailVerified}>{t('Email')}</option><option value="phone" disabled={!profile?.phoneVerified}>{t('Phone')}</option></select></label><Button variant="outline" size="sm" loading={busy === 'sudo-send'} disabled={!profile?.emailVerified && !profile?.phoneVerified} onClick={() => void requestSudo()}><ShieldCheck className="h-4 w-4"/>{t('Send verification code')}</Button>{sudoCodeSent && <div className="flex min-w-[200px] flex-1 items-end gap-2"><TextField label={t('Verification code')} value={sudoCode} onChange={setSudoCode} autoComplete="one-time-code"/><Button size="sm" loading={busy === 'sudo-verify'} disabled={!sudoCode.trim()} onClick={() => void verifySudo()}>{t('Verify')}</Button></div>}</div>}
        </div>
        {profile && <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-border p-4"><div className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground"><Mail className="h-4 w-4 text-primary"/>{t('Change email')}</div><TextField label={t('New email')} type="email" value={newEmail} onChange={setNewEmail} autoComplete="email" placeholder={profile.email}/>{emailCodeSent ? <div className="flex items-end gap-2"><TextField label={t('Confirmation code')} value={emailCode} onChange={setEmailCode} autoComplete="one-time-code"/><Button size="sm" loading={busy === 'email-confirm'} disabled={!emailCode.trim()} onClick={() => void confirmEmailChange()}>{t('Confirm')}</Button></div> : <Button variant="outline" size="sm" disabled={!sudoVerified || !newEmail.trim() || newEmail.trim() === profile.email} loading={busy === 'email-request'} onClick={() => void startEmailChange()}>{t('Send confirmation code')}</Button>}</div>
          <div className="space-y-3 rounded-xl border border-border p-4"><div className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground"><Phone className="h-4 w-4 text-primary"/>{t('Change phone')}</div><TextField label={t('New phone number')} type="tel" value={newPhone} onChange={setNewPhone} autoComplete="tel" placeholder={profile.phone ?? '+261 …'}/>{phoneCodeSent ? <div className="flex items-end gap-2"><TextField label={t('Confirmation code')} value={phoneCode} onChange={setPhoneCode} autoComplete="one-time-code"/><Button size="sm" loading={busy === 'phone-confirm'} disabled={!phoneCode.trim()} onClick={() => void confirmPhoneChange()}>{t('Confirm')}</Button></div> : <Button variant="outline" size="sm" disabled={!sudoVerified || !newPhone.trim() || newPhone.trim() === profile.phone} loading={busy === 'phone-request'} onClick={() => void startPhoneChange()}>{t('Send confirmation code')}</Button>}</div>
        </div>}
      </SettingsSection>
    </div>}

    {tab === 'security' && <div className="space-y-5">
      <SettingsSection title={t('Two-step verification')} description={t('Add an authenticator app as a second layer of protection for your account.')} icon={<KeyRound className="h-4 w-4"/>} action={<span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${security?.twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-secondary text-muted-foreground'}`}>{security?.twoFactorEnabled ? t('Enabled') : t('Not enabled')}</span>}>
        {!security?.twoFactorEnabled && !twoFactorSetup && <div className="flex flex-wrap items-center justify-between gap-4"><p className="max-w-xl text-sm leading-6 text-muted-foreground">{t('Use a time-based one-time password (TOTP) app to generate sign-in codes.')}</p><Button variant="primary" size="sm" loading={busy === '2fa-setup'} onClick={() => void setup2FA()}><ShieldCheck className="h-4 w-4"/>{t('Set up two-step verification')}</Button></div>}
        {twoFactorSetup && <div className="grid gap-5 md:grid-cols-[180px_1fr]">{twoFactorSetup.qrCodeUrl ? <img src={twoFactorSetup.qrCodeUrl} alt={t('Authenticator setup QR code')} className="mx-auto h-44 w-44 rounded-xl border border-border bg-white p-2"/> : <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/40 text-center text-xs text-muted-foreground">{t('Enter the setup key in your authenticator app.')}</div>}<div className="space-y-4"><div><p className="text-sm font-semibold text-secondary-foreground">{t('Scan this QR code')}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t('Then enter the six-digit code generated by your authenticator app.')}</p><code className="mt-3 block break-all rounded-lg bg-secondary px-3 py-2 font-mono text-xs text-secondary-foreground">{twoFactorSetup.secret}</code></div><div className="flex items-end gap-2"><TextField label={t('Authenticator code')} value={totpCode} onChange={setTotpCode} autoComplete="one-time-code" placeholder="000000"/><Button size="sm" loading={busy === '2fa-verify'} disabled={!totpCode.trim()} onClick={() => void enable2FA()}>{t('Verify and enable')}</Button></div><Button variant="ghost" size="sm" onClick={() => setTwoFactorSetup(null)}>{t('Cancel setup')}</Button></div></div>}
        {security?.twoFactorEnabled && <div className="flex flex-wrap items-end justify-between gap-4"><p className="max-w-xl text-sm leading-6 text-muted-foreground">{t('Two-step verification is active for this account. Keep your recovery codes somewhere safe.')}</p><div className="flex flex-wrap items-end gap-2"><TextField label={t('Authenticator code')} value={disableCode} onChange={setDisableCode} autoComplete="one-time-code" placeholder="000000"/><Button variant="outline" size="sm" loading={busy === '2fa-disable'} disabled={!disableCode.trim()} onClick={() => void turnOff2FA()}><X className="h-4 w-4"/>{t('Turn off')}</Button><Button variant="ghost" size="sm" loading={busy === 'recovery-codes'} onClick={() => void showNewRecoveryCodes()}><RefreshCw className="h-4 w-4"/>{t('Regenerate recovery codes')}</Button></div></div>}
        {recoveryCodes.length > 0 && <div className="mt-5 rounded-xl border border-emerald-500/25 bg-emerald-500/[.06] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-secondary-foreground">{t('Save your recovery codes')}</p><p className="mt-1 text-xs text-muted-foreground">{t('Each recovery code can only be used once.')}</p></div><Button variant="outline" size="sm" onClick={() => void navigator.clipboard?.writeText(recoveryCodes.join('\n')).then(() => toast(t('Copied')))}><Copy className="h-4 w-4"/>{t('Copy codes')}</Button></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{recoveryCodes.map((code) => <code key={code} className="rounded-md bg-card px-2 py-1.5 text-center font-mono text-xs text-secondary-foreground">{code}</code>)}</div></div>}
      </SettingsSection>

      <SettingsSection title={t('Password')} description={security?.passwordLastChangedAt ? `${t('Last changed')} · ${new Date(security.passwordLastChangedAt).toLocaleDateString()}` : t('Change your password to keep the account secure.')} icon={<LockKeyhole className="h-4 w-4"/>}>
        <div className="grid gap-4 sm:grid-cols-3"><TextField label={t('Current password')} type="password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password"/><TextField label={t('New password')} type="password" value={newPassword} onChange={setNewPassword} autoComplete="new-password"/><div className="flex items-end"><Button variant="primary" size="sm" loading={busy === 'password'} disabled={!currentPassword || newPassword.length < 8} onClick={() => void savePassword()}><Save className="h-4 w-4"/>{t('Update password')}</Button></div></div>
      </SettingsSection>

      <SettingsSection title={t('Active sessions')} description={t('Review devices signed in to your account and revoke sessions you do not recognize.')} icon={<Laptop className="h-4 w-4"/>} action={sessions.some((session) => !session.current) && <Button variant="outline" size="sm" loading={busy === 'sessions-all'} onClick={() => void revokeOtherSessions()}>{t('Sign out other sessions')}</Button>}>
        <div className="divide-y divide-border">{sessions.map((session) => <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">{session.device?.toLowerCase().includes('mobile') ? <Smartphone className="h-4 w-4"/> : <Monitor className="h-4 w-4"/>}</span><div className="min-w-0"><p className="truncate text-sm font-medium text-secondary-foreground">{[session.device, session.browser, session.operatingSystem].filter(Boolean).join(' · ') || t('Unknown device')} {session.current && <span className="ml-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">{t('Current session')}</span>}</p><p className="mt-1 text-xs text-muted-foreground">{[session.location, session.ipAddress].filter(Boolean).join(' · ')}{session.lastActiveAt && ` · ${t('Active')} ${new Date(session.lastActiveAt).toLocaleString()}`}</p></div></div>{!session.current && <Button variant="ghost" size="xs" loading={busy === `session-${session.id}`} onClick={() => void revokeSession(session)}>{t('Revoke')}</Button>}</div>)}{sessions.length === 0 && <p className="py-4 text-sm text-muted-foreground">{t('No active sessions found.')}</p>}</div>
      </SettingsSection>
    </div>}

    {tab === 'preferences' && <div className="space-y-5">
      <SettingsSection title={t('Workspace preferences')} description={t('Choose how this admin workspace looks and which language it uses.')} icon={<Palette className="h-4 w-4"/>}>
        {personalSettings ? <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Palette className="h-3.5 w-3.5"/>{t('Theme')}</span><select value={personalSettings.theme} onChange={(event) => setPersonalSettings({ ...personalSettings, theme: event.target.value as AdminPersonalSettings['theme'] })} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-secondary-foreground"><option value="system">{t('System')}</option><option value="light">{t('Light')}</option><option value="dark">{t('Dark')}</option></select></label><label className="block"><span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Globe2 className="h-3.5 w-3.5"/>{t('Language')}</span><select value={personalSettings.lang} onChange={(event) => setPersonalSettings({ ...personalSettings, lang: event.target.value as AdminPersonalSettings['lang'] })} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-secondary-foreground"><option value="en">English</option><option value="fr">Français</option><option value="mg">Malagasy</option></select></label></div> : <p className="text-sm text-muted-foreground">{t('Preferences unavailable.')}</p>}
      </SettingsSection>

      <SettingsSection title={t('Admin notifications')} description={t('Control which operational events are sent to your administrator account.')} icon={<Bell className="h-4 w-4"/>}>
        <div className="divide-y divide-border">{([
          ['sellerApplications', t('Seller applications'), t('Get notified when new seller applications need review.')],
          ['productModeration', t('Product moderation'), t('Get notified when products are waiting for moderation.')],
          ['paymentFailures', t('Payment failures'), t('Receive alerts about failed or interrupted payments.')],
          ['fraudAlerts', t('Fraud alerts'), t('Receive alerts when suspicious platform activity is detected.')],
          ['systemAlerts', t('System alerts'), t('Receive important platform and service notices.')],
          ['userReports', t('User reports'), t('Get notified when a user report needs attention.')],
        ] as const).map(([key, title, description]) => <SwitchRow key={key} title={title} description={description} checked={notificationPreferences[key]} onChange={(checked) => setNotificationPreferences((current) => ({ ...current, [key]: checked }))}/>)}</div>
      </SettingsSection>

      <SettingsSection title={t('Delivery preferences')} description={t('Choose which account-level channels can deliver administrator notifications.')} icon={<Activity className="h-4 w-4"/>}>
        {personalSettings && <div className="divide-y divide-border"><SwitchRow title={t('Email notifications')} description={t('Send administrator alerts to your account email.')} checked={personalSettings.emailNotifications} onChange={(checked) => setPersonalSettings({ ...personalSettings, emailNotifications: checked })}/><SwitchRow title={t('Push notifications')} description={t('Allow push notifications for important workspace activity.')} checked={personalSettings.pushNotifications} onChange={(checked) => setPersonalSettings({ ...personalSettings, pushNotifications: checked })}/><SwitchRow title={t('Security alerts')} description={t('Keep sign-in and account security alerts enabled.')} checked={personalSettings.securityAlerts} onChange={(checked) => setPersonalSettings({ ...personalSettings, securityAlerts: checked })}/></div>}
      </SettingsSection>

      <div className="flex justify-end"><Button variant="primary" size="md" loading={busy === 'preferences'} disabled={!personalSettings} onClick={savePreferences}><Save className="h-4 w-4"/>{t('Save preferences')}</Button></div>

      <SettingsSection title={t('Marketplace configuration')} description={t('These platform defaults are visible to admins. Editing them is restricted to super administrators.')} icon={<Store className="h-4 w-4"/>}>
        {platformSettings ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {platformSettings.platformName !== undefined && <div className="rounded-xl border border-border bg-secondary/30 p-3"><p className="text-xs font-medium text-muted-foreground">{t('Platform name')}</p><p className="mt-1 text-sm font-semibold text-secondary-foreground">{platformSettings.platformName}</p></div>}
          {platformSettings.commissionRate !== undefined && <div className="rounded-xl border border-border bg-secondary/30 p-3"><p className="text-xs font-medium text-muted-foreground">{t('Default commission rate (%)')}</p><p className="mt-1 text-sm font-semibold text-secondary-foreground">{platformSettings.commissionRate}%</p></div>}
          {platformSettings.defaultDeliveryFee !== undefined && <div className="rounded-xl border border-border bg-secondary/30 p-3"><p className="text-xs font-medium text-muted-foreground">{t('Default delivery fee')}</p><p className="mt-1 text-sm font-semibold text-secondary-foreground">{formatPrice(platformSettings.defaultDeliveryFee)}</p></div>}
          {([
            ['maintenanceMode', t('Maintenance mode')],
            ['allowNewRegistrations', t('New registrations')],
            ['allowNewSellerApplications', t('New seller applications')],
            ['requireSellerApproval', t('Seller approval required')],
            ['requireProductModeration', t('Product moderation required')],
          ] as const).filter(([key]) => platformSettings[key] !== undefined).map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 p-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${platformSettings[key] ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-secondary text-muted-foreground'}`}>{platformSettings[key] ? t('Enabled') : t('Not enabled')}</span></div>)}
        </div> : <p className="text-sm text-muted-foreground">{t('Marketplace settings unavailable.')}</p>}
      </SettingsSection>
    </div>}
  </div>;
}
