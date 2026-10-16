import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  MapPin,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { getSellerApplicationById, updateSellerApplicationStatus,
} from '@/api/admin/sellerApplication';
import { getApiErrorMessage } from '@/api/errorMessage';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/hook/format';
import type { SellerApplication, SellerApplicationStatus} from '@/type/admin/seller';



const SellerApplicationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [application, setApplication] =
    useState<SellerApplication | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [decision, setDecision] = useState<'approve' | 'reject' | null>(
    null
  );

  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchApplication = async () => {
      if (!id) return;

      try {
        setLoading(true);

        const data = await getSellerApplicationById(id);

        setApplication(data);
      } catch (error) {
        console.error(
          'Failed to fetch seller application:',
          error
        );
        toast(getApiErrorMessage(error, 'Unable to load this seller application.'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const handleDecision = async () => {
    if (!application || !id || !decision) return;

    if (decision === 'reject' && !reason.trim()) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);

      const updatedApplication =
        await updateSellerApplicationStatus(id, {
          action: decision === 'approve' ? 'approved' : 'rejected',
          reason: reason.trim() || undefined,
        });

      setApplication(updatedApplication);
      setDecision(null);
      setReason('');
      toast(`Application ${decision === 'approve' ? 'approved' : 'rejected'} successfully.`);
    } catch (error) {
      console.error('Failed to update seller application:', error);
      const message = getApiErrorMessage(error, 'Unable to update this seller application. Please try again.');
      setActionError(message);
      toast(message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">
          Loading application...
        </p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-secondary-foreground font-medium">
            {t("Seller application not found")}
          </p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={() =>
              navigate('/admin/sellers/applications')
            }
          >
            {t("Back to applications")}
          </Button>
        </div>
      </div>
    );
  }

  const isPending = application.status === 'pending';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/sellers/applications"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-secondary-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("Back to applications")}
          </Link>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display text-secondary-foreground">
              {t("Seller Application")}
            </h1>

            <StatusBadge status={application.status} />
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            Application #{application.id}
          </p>
        </div>

        {isPending && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setDecision('reject')}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {t("Reject")}
            </Button>

            <Button
              variant="accent"
              onClick={() => setDecision('approve')}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {t("Approve")}
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main information */}
        <div className="xl:col-span-2 space-y-6">
          {/* Business */}
          <Section
            title="Business information"
            description="Information provided by the seller"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-secondary-foreground">
                  {application.store?.name ?? t("Unnamed business")}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {application.store?.businessType ?? t("Business type unavailable")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem
                icon={<Building2 />}
                label={t("Business name")}
                value={application.store?.name ?? t("Unnamed business")}
              />

              <InfoItem
                icon={<MapPin />}
                label={t("Location")}
                value={application.store?.location ?? t("Location unavailable")}
              />

              <InfoItem
                icon={<Building2 />}
                label={t("Business type")}
                value={application.store?.businessType ?? t("Business type unavailable")}
              />
            </div>
          </Section>

          {/* Application information */}
          <Section
            title={t("Application information")}
            description={t("Details about this seller application")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem
                icon={<Calendar />}
                label={t("Application date")}
                value={application.submittedAt ? formatDate(application.submittedAt) : t("Date unavailable")}
              />

              <InfoItem
                icon={<Check />}
                label={t("Status")}
                value={getStatusLabel(application.status)}
              />

              <InfoItem
                icon={<Building2 />}
                label={t("Applicant ID")}
                value={application.applicantUserId}
              />
            </div>
          </Section>
        </div>

        {/* Review */}
        <div>
          {isPending ? (
            <section className="bg-card border border-border rounded-xl overflow-hidden sticky top-6">
              <div className="px-6 py-5 border-b border-border">
                <h2 className="font-semibold text-secondary-foreground">
                  {t("Review application")}
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  {t("Decide whether to approve or reject this seller.")}
                </p>
              </div>

              <div className="p-6 space-y-5">
                {actionError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {actionError}
                  </p>
                )}

                {/* Decision */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('approve')}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      decision === 'approve'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <Check
                      className={`w-5 h-5 mb-3 ${
                        decision === 'approve'
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                      }`}
                    />

                    <p className="font-medium text-sm text-secondary-foreground">
                      {t("Approve")}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      {t("Accept seller")}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('reject')}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      decision === 'reject'
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <X
                      className={`w-5 h-5 mb-3 ${
                        decision === 'reject'
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                      }`}
                    />

                    <p className="font-medium text-sm text-secondary-foreground">
                      {t("Reject")}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      {t("Decline seller")}
                    </p>
                  </button>
                </div>

                {/* Reason */}
                {decision && (
                  <div>
                    <label
                      htmlFor="reason"
                      className="block text-sm font-medium text-secondary-foreground mb-2"
                    >
                      {t("Reason")}
                      {decision === 'reject' ? (
                        <span className="text-red-500 ml-1">*</span>
                      ) : (
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          {t("Optional")}
                        </span>
                      )}
                    </label>

                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={6}
                      placeholder={
                        decision === 'reject'
                          ? t("Explain why this application is being rejected...")
                          : t("Add an optional note...")
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-secondary-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />

                    {decision === 'reject' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {t("A reason is required when rejecting an application.")}
                      </p>
                    )}
                  </div>
                )}

                {/* Action */}
                {decision && (
                  <Button
                    type="button"
                    variant={
                      decision === 'approve'
                        ? 'accent'
                        : 'danger'
                    }
                    disabled={
                      actionLoading ||
                      (decision === 'reject' && !reason.trim())
                    }
                    onClick={handleDecision}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {decision === 'approve' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}

                    {actionLoading
                      ? t("Processing...")
                      : decision === 'approve'
                        ? t("Approve application")
                        : t("Reject application")}
                  </Button>
                )}

                {!decision && (
                  <p className="text-xs text-center text-muted-foreground">
                    {t("Select a decision to continue.")}
                  </p>
                )}
              </div>
            </section>
          ) : (
            <section className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3">
                <StatusBadge status={application.status} />

                <div>
                  <p className="font-medium text-secondary-foreground">
                    {t("Application reviewed")}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {t("This application is no longer pending.")}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="bg-card border border-border rounded-xl overflow-hidden">
    <div className="px-6 py-5 border-b border-border">
      <h2 className="font-semibold text-secondary-foreground">
        {title}
      </h2>

      {description && (
        <p className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      )}
    </div>

    <div className="p-6">{children}</div>
  </section>
);

const InfoItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-muted-foreground [&>svg]:w-4 [&>svg]:h-4">
      {icon}
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="text-sm font-medium text-secondary-foreground mt-1">
        {value}
      </p>
    </div>
  </div>
);

const StatusBadge = ({
  status,
}: {
  status: SellerApplicationStatus;
}) => {
  const styles = {
    pending:
      'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    approved:
      'bg-green-500/10 text-green-600 border-green-500/20',
    rejected:
      'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-semibold ${styles[status]}`}
    >
      {getStatusLabel(status)}
    </span>
  );
};

const getStatusLabel = (status: SellerApplicationStatus) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};


export default SellerApplicationDetails;