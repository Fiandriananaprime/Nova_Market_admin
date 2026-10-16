
import { isAxiosError } from 'axios';
import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Users, Store, Package, AlertCircle } from 'lucide-react';

import { StatCard, StatusBadge, Badge, BarStat, LineStat } from '../../components/ui';
import  TableCard, { Column }  from '@/components/Stats/TableCard';
import { AdminDashboardRevenuePoint, AdminMetrics} from '@/type/admin/dashboard';
import { OrderResponse } from '@/type/order/order';
import { SellerApplicationListResponse, TopSeller } from '@/type/admin/seller';

import { getOrder } from '@/api/admin/order.api';
import { getSellerApplications } from '@/api/admin/sellerApplication';
import { getTopSeller, getDashboardStats } from '@/api/admin/dashboard.api';

import { formatDate, formatMillionAr } from '@/hook/format';
import { useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage } from '@/api/errorMessage';
import { useTranslation } from 'react-i18next';

type DashData = {
  metrics: AdminMetrics,
  revenueSeries: AdminDashboardRevenuePoint[],
  recentOrder: OrderResponse["data"],
  sellerApplications: SellerApplicationListResponse,
  topSellers: TopSeller[],
}
interface RecentOrder {
  id: string;
  buyerName: string;
  total: number;
  status: string;
}

export default function AdminDashboard() {
  const [dashBoardData, setDashBoardData]= useState<DashData>();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const recentOrderColumns: Column<RecentOrder>[] = [
    {
      key: 'id',
      header: t("Order"),
      render: (order) => (
        <span className="font-mono text-xs text-primary font-bold">
          {order.id}
        </span>
      ),
    },
    {
      key: 'buyer',
      header: t("Buyer"),
      render: (order) => (
        <span className="text-secondary-foreground">
          {order.buyerName}
        </span>
      ),
    },
    {
      key: 'amount',
      header: t("Amount"),
      render: (order) => (
        <span className="font-medium text-secondary-foreground whitespace-nowrap">
          {formatMillionAr(order.total)}
        </span>
      ),
    },
    {
      key: 'status',
      header: t("Status"),
      render: (order) => (
        <StatusBadge status={order.status} />
      ),
    },
  ];

  const topSellerColumns: Column<TopSeller>[] = [
    {
      key: 'name',
      header: t("Seller"),
      render: (seller, index) => (
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {index + 1}
          </span>

          <span className="font-medium text-secondary-foreground">
            {seller.name}
          </span>
        </div>
      ),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      render: (seller) => (
        <span className="font-medium text-secondary-foreground">
          {(seller.revenue / 1000000).toFixed(1)}M Ar
        </span>
      ),
    },
    {
      key: 'orders',
      header: t("Orders"),
      render: (seller) => (
        <span className="text-muted-foreground">
          {seller.ordersCount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: t("Status"),
      render: (seller) => (
        <StatusBadge status={seller.status} />
      ),
    },
    {
      key: 'commission',
      header: 'Commission',
      render: (seller) => (
        <span className="text-accent font-medium">
          {((seller.revenue * 0.10) / 1000000).toFixed(1)}M Ar
        </span>
      ),
    },
  ];
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [dashboard, orders, sellerApplications, topSellerResponse] = await Promise.all([
          getDashboardStats(),
          getOrder({ page: 1, limit: 5 }),
          getSellerApplications({ page: 1, limit: 3, status: 'pending' }),
          getTopSeller(),
        ]);
        
        const { metrics, revenueSeries } = dashboard;
        const { data: recentOrder } = orders;
        const { data: sellerApplicationsData, meta: sellerApplicationsMeta, counts: sellerApplicationsCounts } = sellerApplications;
        const { data: topSellers } = topSellerResponse;

        setDashBoardData({
          metrics,
          revenueSeries,
          recentOrder,
          sellerApplications: { data: sellerApplicationsData, meta: sellerApplicationsMeta, counts: sellerApplicationsCounts },
          topSellers,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        const message = isAxiosError(error) && error.response?.status === 403
          ? 'Your account is not authorized to view the admin dashboard.'
          : getApiErrorMessage(error, 'Unable to load dashboard data. Please try again.');
        setFetchError(message);
        toast(message, 'error');
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-6">
      {fetchError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-xl text-sm text-red-700 dark:text-red-300">
          {fetchError}
        </div>
      )}

      {/* Alert */}
      {(dashBoardData?.metrics?.pendingApplications ?? 0) > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />

          <div className="flex-1 text-sm">
            <span className="font-medium text-amber-800 dark:text-amber-300">
              {dashBoardData?.metrics?.pendingApplications ?? 0} {t("seller applications")}
            </span>

            <span className="text-amber-700 dark:text-amber-400">
              {' '}{t("and")} {dashBoardData?.metrics?.pendingProducts ?? 0} {t("products are awaiting review")}
            </span>
          </div>

          <Link
            to="/admin/sellers/applications"
            className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
          >
            {t("Review now →")}
          </Link>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title={t("Total Revenue")} value={formatMillionAr(dashBoardData?.metrics?.totalRevenue ?? 0)} change={14.2} icon={<DollarSign className="w-5 h-5" />} color="#0077B6" />
        <StatCard title={t("Total Orders")} value={dashBoardData?.metrics?.totalOrders ?? 0} change={9.3} icon={<ShoppingCart className="w-5 h-5" />} color="#5ABCB9" />
        <StatCard title={t("Buyers")} value={dashBoardData?.metrics?.totalBuyers ?? 0} change={11.8} icon={<Users className="w-5 h-5" />} color="#0077B6" />
        <StatCard title={t("Sellers")} value={dashBoardData?.metrics?.totalSellers ?? 0} change={6.4} icon={<Store className="w-5 h-5" />} color="#5ABCB9" />
        <StatCard title={t("Products")} value={dashBoardData?.metrics?.totalProducts ?? 0} change={7.1} icon={<Package className="w-5 h-5" />} color="#0077B6" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <BarStat title={t("MarketPlace Revenue")} data={dashBoardData?.revenueSeries} xAxisKey="day" />
        <LineStat title={t("User Growth")} data={dashBoardData?.revenueSeries} xAxisKey="day" />
      </div>

      {/* Tables grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent orders */}
        <TableCard
          title={t("Recent orders")}
          data={dashBoardData?.recentOrder ?? []}
          columns={recentOrderColumns}
          rowKey={(order) => order.id}
          viewAllHref="/admin/orders"
        />

        {/* Pending applications */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold font-display text-secondary-foreground">{t("Pending seller applications")}</h2>
            <Badge variant="warning">{dashBoardData?.sellerApplications.meta.total} {t("pending")}</Badge>
          </div>
          <div className="divide-y divide-border">
            {dashBoardData?.sellerApplications.data.map(app => (
              <div key={app.id} className="px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {(app.store?.name ?? t("Unnamed business"))[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-secondary-foreground truncate">{app.store?.name ?? t("Unnamed business")}</div>
                  <div className="text-xs text-muted-foreground">{app.store?.location ?? t("Location unavailable")} · {app.store?.businessType ?? t("Business type unavailable")} · {app.submittedAt ? formatDate(app.submittedAt) : t("Date unavailable")}</div>
                </div>
                <Link to="/admin/sellers/applications" className="text-xs text-primary hover:underline flex-shrink-0">Review</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Top sellers */}
        <TableCard
          title={t("Top sellers")}
          data={dashBoardData?.topSellers ?? []}
          columns={topSellerColumns}
          rowKey={(seller) => seller.name}
          className="lg:col-span-2"
        />
      </div>
    </div>
  );
}
