import {
    ArrowUpRight,
    BadgeCheck,
    CalendarDays,
    MapPin,
    Package,
    ShoppingBag,
    Star,
    Users,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { formatDate, formatPrice,formatMillionAr as formatCount } from '@/hook/format';
import  { StoreAdmin } from '@/type/admin/seller';
import { OrderStatus } from '@/type/order/order';
import { useTranslation } from 'react-i18next';
interface StoreCardProps {
    store: StoreAdmin;
}

const statusStyles: Record<OrderStatus, string> = {
    pending: 'bg-amber-500/10 text-amber-600',
    confirmed: 'bg-blue-500/10 text-blue-600',
    processing: 'bg-indigo-500/10 text-indigo-600',
    preparing: 'bg-orange-500/10 text-orange-600',
    shipped: 'bg-purple-500/10 text-purple-600',
    delivered: 'bg-emerald-500/10 text-emerald-600',
    cancelled: 'bg-red-500/10 text-red-600',
    refunded: 'bg-slate-500/10 text-slate-600',
};



const StoreCard = ({ store }: StoreCardProps) => {
    const { t } = useTranslation();
    const statusLabels: Record<OrderStatus, string> = {
        pending: t('Pending'),
        confirmed: t('Confirmed'),
        processing: t('Processing'),
        preparing: t('Preparing'),
        shipped: t('Shipped'),
        delivered: t('Delivered'),
        cancelled: t('Cancelled'),
        refunded: t('Refunded'),
    };
    const orders = store.orders ?? [];
    const navigate = useNavigate();
    return (
        <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            {/* Cover */}
            <div className="relative h-36 overflow-hidden">
                {store.cover ? (
                    <img
                        src={store.cover}
                        alt={`${store.name} cover`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="h-full w-full bg-secondary" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Verified */}
                {store.verified && (
                    <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
                        <BadgeCheck className="h-4 w-4 text-primary" />
                        {t("Verified")}
                    </div>
                )}

            </div>

            {/* Content */}
            <div className="relative px-5 pb-5 pt-10">
                {/* Logo */}
                <div className="absolute z-1 top-[-48px] left-5">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border-4 border-card bg-card shadow-lg">
                        {store.logo ? (
                            <img
                                src={store.logo}
                                alt={store.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-secondary">
                                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-secondary-foreground">
                            {store.name}
                        </h3>

                        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {store.location || 'No location'}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1">
                        <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                        <span className="text-sm font-semibold text-secondary-foreground">
                            {store.rating?.toFixed(1) ?? '0.0'}
                        </span>
                    </div>
                </div>

                {/* Description */}
                {store.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {store.description}
                    </p>
                )}

                {/* Stats */}
                <div className="mt-5 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-secondary/30 py-3">
                    <div className="flex flex-col items-center gap-1 px-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-bold text-secondary-foreground">
                            {formatCount(store.productsCount)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            {t("Products")}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 px-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-bold text-secondary-foreground">
                            {formatCount(store.followersCount)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            {t("Followers")}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 px-2">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-bold text-secondary-foreground">
                            {orders.length}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            {t("Orders")}
                        </span>
                    </div>
                </div>

                {/* Revenue */}
                <div className="mt-4 rounded-xl bg-primary/5 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                        {t("Annual revenue")}
                    </p>

                    <p className="mt-1 text-xl font-bold tracking-tight text-secondary-foreground">
                        {formatPrice(store.annualRevenue ?? 0)}
                    </p>
                </div>

                {/* Recent orders */}
                {orders.length > 0 && (
                    <div className="mt-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-secondary-foreground">
                                {t("Recent orders")}
                            </h4>

                            <span className="text-xs text-muted-foreground">
                                {orders.length} total
                            </span>
                        </div>

                        <div className="space-y-2">
                            {orders.slice(0, 3).map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-2.5"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-secondary-foreground">
                                            {order.id}
                                        </p>

                                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                            {order.buyerName} ·{' '}
                                            {order.itemsCount} {t("items")}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyles[order.status]}`}
                                        >
                                            {statusLabels[order.status]}
                                        </span>

                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDate(order.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {t("Joined")} {store.joinedYear}
                    </div>

                    <button
                        type="button"
                        className="flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:underline"
                        onClick={() => navigate(`/admin/sellers/${store.id}`)}
                    >
                        {t("View store")}
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                </div>
            </div>
        </article>
    );
};

export default StoreCard;