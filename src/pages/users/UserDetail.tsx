import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Store,
  UserX,
  UserCheck,
  Loader2,
} from 'lucide-react';

import { Button, StatusBadge } from '../../components/ui';
import {
  getUserById,
  updateUserStatus,
} from '@/api/admin/user.api';
import { User } from '@/type/user';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/api/errorMessage';

export default function UserDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await getUserById(id);
        setUser(data);
      } catch (error) {
        toast(getApiErrorMessage(error, 'Unable to load user details.'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleStatusChange = async () => {
    if (!user) return;

    const newStatus =
      user.status === 'active'
        ? 'suspended'
        : 'active';

    try {
      setUpdatingStatus(true);

      const updatedUser = await updateUserStatus(
        user.id,
        newStatus
      );

      setUser(updatedUser);
      toast(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully.`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast(getApiErrorMessage(error, 'Unable to update user status.'), 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold text-secondary-foreground">
          {t("User not found")}
        </h2>

        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/admin/users')}
        >
          {t("Back to users")}
        </Button>
      </div>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <div className="space-y-5">

      {/* Back */}
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-secondary-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("Back to users")}
      </Link>

      {/* Profile header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

          <div className="flex items-center gap-4">

            {/* Avatar */}
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={fullName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                  user.role === 'admin'
                    ? 'bg-accent'
                    : user.role === 'seller'
                      ? 'bg-primary'
                      : 'bg-darkMutedForeground'
                }`}
              >
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
            )}

            <div>
              <h1 className="text-xl font-bold font-display text-secondary-foreground">
                {fullName}
              </h1>

              <p className="text-sm text-muted-foreground">
                {user.email}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    user.role === 'admin'
                      ? 'bg-accent/10 text-accent'
                      : user.role === 'seller'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {user.role}
                </span>

                <StatusBadge status={user.status} />
              </div>
            </div>
          </div>

          {/* Main action */}
          <Button
            variant={
              user.status === 'active'
                ? 'outline'
                : 'accent'
            }
            onClick={handleStatusChange}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : user.status === 'active' ? (
              <>
                <UserX className="w-4 h-4" />
                {t("Suspend user")}
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                {t("Activate user")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Account information */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">

          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold font-display text-secondary-foreground">
              {t("Account information")}
            </h2>
          </div>

          <div className="p-5 space-y-4">

            <InfoRow
              label={t("First name")}
              value={user.firstName}
            />

            <InfoRow
              label={t("Last name")}
              value={user.lastName}
            />

            <InfoRow
              label="Email"
              value={user.email}
              icon={<Mail className="w-4 h-4" />}
            />

            <InfoRow
              label={t("Phone")}
              value={user.phone || 'Not provided'}
              icon={<Phone className="w-4 h-4" />}
            />

            <InfoRow
              label={t("Role")}
              value={user.role}
            />

            <InfoRow
              label={t("Status")}
              value={
                <StatusBadge status={user.status} />
              }
            />
          </div>
        </div>

        {/* Activity */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">

          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold font-display text-secondary-foreground">
              {t("Activity")}
            </h2>
          </div>

          <div className="p-5 space-y-5">

            {user.role === 'buyer' && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("Orders")}
                  </p>

                  <p className="font-semibold text-secondary-foreground">
                    {user.ordersCount ?? 0}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  {t("Member since")}
                </p>

                <p className="font-semibold text-secondary-foreground">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {user.role === 'seller' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold font-display text-secondary-foreground">Stores</h2>
          </div>
          <div className="divide-y divide-border">
            {(user.stores ?? []).map((store) => (
              <Link
                key={store.id}
                to={`/admin/stores/${store.id}`}
                className="p-5 flex items-center gap-3 hover:bg-secondary/40"
              >
                {store.logo ? (
                  <img src={store.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Store className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-secondary-foreground">{store.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {store.location || 'No location'} · {store.productsCount} products
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Addresses */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">

        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold font-display text-secondary-foreground">
            Addresses
          </h2>
        </div>

        {user.addresses?.length ? (
          <div className="divide-y divide-border">
            {user.addresses.map((address) => (
              <div
                key={address.id}
                className="p-5 flex items-start justify-between gap-4"
              >
                <div className="flex gap-3">

                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-secondary-foreground">
                        {address.label || address.recipientName}
                      </p>

                      {address.isDefault && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Default
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      {[address.street, address.district].filter(Boolean).join(', ')}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {[address.city, address.region, address.postalCode].filter(Boolean).join(', ')}
                    </p>

                    {address.phone && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {address.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-muted-foreground">
            ({t("No address registered.")})
          </div>
        )}
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

function InfoRow({
  label,
  value,
  icon,
}: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>

      <div className="text-sm font-medium text-secondary-foreground text-right">
        {value}
      </div>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}
