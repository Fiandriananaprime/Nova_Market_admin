import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import {
  Package,
  MapPin,
  CreditCard,
  Truck,
  User,
  Store,
  ChevronRight,
  Clock,
  FileText,
  ArrowLeft
} from 'lucide-react';

import type {
  OrderDetails,
  OrderItem,
  OrderSellerDetails,
} from '@/type/order/order';
import { formatPrice, formatDate } from '@/hook/format';
import TableCard, { Column } from '@/components/Stats/TableCard';
import { useTranslation } from 'react-i18next';
import { getOrderDetailsById, getOrderTracking } from '@/api/admin/order.api';
import { useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage } from '@/api/errorMessage';
import NotFound from '@/pages/NotFound';
import { Badge, PaymentBadge } from '@/components/ui';
import type { DeliveryTracking } from '@/type/order/order';
import { OrderTrackingMap } from './OrderTrackingMap';

type Tab = 'summary' | 'tracking';


export default function OrderReceipt() {
  const [ order,setOrder ]= useState<OrderDetails>();
  const { toast }= useToast()
  const navigate = useNavigate();
  const { t } = useTranslation();
  const  { id } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [loading, setLoading] = useState(true)
  const [liveTracking, setLiveTracking] = useState<DeliveryTracking | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  useEffect(() => {
    const fetchOrderDetails = async () => {
        if(!id) {
            setLoading(false)
            return;
        }
        try {
            const response = await getOrderDetailsById(id);
            setOrder(response);
        }
        catch(e) {
            toast(getApiErrorMessage(e,"Unable to fetch order"),"error")
        }
        finally{
            setLoading(false)
        }
    }
    fetchOrderDetails()
  },[])

  useEffect(() => {
    if (activeTab !== 'tracking' || !id) return;
    let active = true;
    let requestPending = false;
    let initialRequest = true;
    let trackingErrorNotified = false;
    const loadTracking = async () => {
      if (requestPending) return;
      requestPending = true;
      const showLoading = initialRequest;
      initialRequest = false;
      if (showLoading) setTrackingLoading(true);

      try {
        const data = await getOrderTracking(id);
        if (active) {
          setLiveTracking(data);
          trackingErrorNotified = false;
        }
      } catch (error) {
        if (active && !trackingErrorNotified) {
          toast(getApiErrorMessage(error, 'Unable to load live delivery tracking.'), 'error');
          trackingErrorNotified = true;
        }
      } finally {
        requestPending = false;
        if (active && showLoading) setTrackingLoading(false);
      }
    };

    void loadTracking();
    const interval = window.setInterval(() => void loadTracking(), 10_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [activeTab, id, toast]);

  const itemsBySeller = useMemo(() => {
    if (!order) return {};
    return order.items.reduce<Record<string, OrderItem[]>>(
      (groups, item) => {
        if (!groups[item.sellerId]) {
          groups[item.sellerId] = [];
        }

        groups[item.sellerId].push(item);

        return groups;
      },
      {},
    );
  }, [order?.items]);

  const getSeller = (
    sellerId: string,
  ): OrderSellerDetails | undefined => {
    return order?.sellers.find((seller) => seller.id === sellerId);
  };

  if (loading) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
        Loading...
        </div>
    );
   }

  if(!order){
    return <NotFound prop={t('Order')} />
  }

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-card shadow-sm">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-secondary-foreground p-5 pb-0"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("Go Back")}
      </button>
      <div className="border-b border-gray-200 bg-card px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-secondary-foreground" />

              <h1 className="text-lg font-semibold text-secondary-foreground">
                {t('Order')} #{order.id}
              </h1>
            </div>

            <p className="mt-1 text-sm text-secondary-foreground">
              {t('Ordered on')} {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
              <Badge children={order.status} />

            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-foreground">
              {t('Payment')}: {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`relative py-4 text-sm font-medium text-secondary-foreground `
             }
          >
            {t('Order summary')}

            {activeTab === 'summary' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-900" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracking')}
            className={`relative flex items-center gap-2 py-4 text-sm font-medium text-secondary-foreground`}
          >
            <Truck className="h-4 w-4" />

            {t('Delivery tracking')}

            {activeTab === 'tracking' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-900" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'summary' && (
        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-gray-200 p-5">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-secondary-foreground" />

                <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
                  {t('Buyer')}
                </h2>
              </div>

              <Link
                to={`/admin/users/${order.buyerId}`}
                className="group flex items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50"
              >
                <img
                  src={order.buyerAvatarUrl}
                  alt={order.buyerName}
                  className="h-11 w-11 rounded-full object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-secondary-foreground group-hover:underline">
                    {order.buyerName}
                  </p>

                  <p className="text-xs text-secondary-foreground">
                    {t('ID')}: {order.buyerId}
                  </p>

                  <p className="mt-1 text-xs text-secondary-foreground">
                    {order.buyerEmail}
                  </p>

                  <p className="text-xs text-secondary-foreground">
                    {order.buyerPhone}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-secondary-foreground" />
              </Link>
            </section>

            <section className="rounded-xl border border-gray-200 p-5">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary-foreground" />

                <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
                  {t('Delivery')}
                </h2>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <p>{order.address.id}</p>
                <p>{order.address.phone}</p>
                <p>
                  {[
                    order.address.street,
                    order.address.district,
                    order.address.city,
                    order.address.region,
                    order.address.postalCode,
                  ].filter(Boolean).join(', ')}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xs text-secondary-foreground">
                  {t('Delivery method')}
                </span>

                <span className="text-sm font-medium text-secondary-foreground">
                  {order.deliveryMethod}
                </span>
              </div>
            </section>
          </div>

          <section className="mt-6">
            <div className="mb-4 flex items-center gap-2">
              <Store className="h-4 w-4 text-secondary-foreground" />

              <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
                {t('Ordered items')}
              </h2>
            </div>

            <div className="space-y-5">
              {Object.entries(itemsBySeller).map(([sellerId, items]) => {
                const seller = getSeller(sellerId);

                const columns: Column<(typeof items)[number]>[] = [
                  {
                    key: 'product',
                    header: t('Product'),
                    render: (item) => (
                      <Link
                        to={`/admin/products/${item.productId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="group flex items-center gap-3"
                      >
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
                        />

                        <div className="min-w-0">
                          <p className="truncate font-medium text-secondary-foreground group-hover:underline">
                            {item.productName}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {t('Product')} #{item.productId}
                          </p>
                        </div>
                      </Link>
                    ),
                  },
                  {
                    key: 'price',
                    header: t('Unit price'),
                    render: (item) => (
                      <span className="font-medium text-secondary-foreground">
                        {formatPrice(item.price)}
                      </span>
                    ),
                  },
                  {
                    key: 'qty',
                    header: t('Quantity'),
                    render: (item) => (
                      <span className="text-muted-foreground">
                        {item.qty}
                      </span>
                    ),
                  },
                  {
                    key: 'total',
                    header: t('Total'),
                    className: 'text-right',
                    render: (item) => (
                      <span className="font-semibold text-secondary-foreground">
                        {formatPrice(item.price * item.qty)}
                      </span>
                    ),
                  },
                ];

                return (
                  <TableCard
                    key={sellerId}
                    title={
                      seller?.name ??
                      items[0]?.sellerName ??
                      t('Seller')
                    }
                    data={items}
                    columns={columns}
                    rowKey={(item) => item.productId}
                    className="overflow-hidden"
                    headerAction={
                      <Link
                        to={`/admin/store/${sellerId}`}
                        className="group flex items-center gap-2"
                      >
                        {seller?.avatarUrl ? (
                          <img
                            src={seller.avatarUrl}
                            alt={seller.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                            <Store className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}

                        <span className="text-sm font-medium text-secondary-foreground group-hover:underline">
                          {seller?.name ?? items[0]?.sellerName}
                        </span>

                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    }
                  />
                );
              })}
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-gray-200 p-5">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-secondary-foreground" />

                <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
                  {t('Payment')}
                </h2>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-secondary-foreground">
                    {t('Method')}
                  </dt>

                  <dd className="font-medium text-secondary-foreground">
                    <PaymentBadge method= {order.paymentMethod} />
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-secondary-foreground">
                    {t('Status')}
                  </dt>

                  <dd className="font-medium text-secondary-foreground">
                    {order.paymentStatus}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-gray-200 p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary-foreground" />

                <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
                  {t('Note')}
                </h2>
              </div>

              <p className="text-sm leading-6 text-gray-600">
                {order.note || t('No note for this order.')}
              </p>
            </section>
          </div>

          <section className="mt-6 rounded-xl border border-gray-200 p-5">

            <div className="ml-auto max-w-md space-y-3 text-sm">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
              {t('Summary')}
            </h2>
              <div className="flex justify-between gap-4">
                <span className="text-secondary-foreground">
                  {t('Subtotal')}
                </span>

                <span className="font-medium text-secondary-foreground">
                  {formatPrice(order.subtotal)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-secondary-foreground">
                  {t('Shipping fee')}
                </span>

                <span className="font-medium text-secondary-foreground">
                  {formatPrice(order.deliveryFee)}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between gap-4">
                  <span className="text-base font-semibold text-secondary-foreground">
                    {t('Total')}
                  </span>

                  <span className="text-lg font-bold text-secondary-foreground">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {order.estimatedDelivery && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-card p-4">
              <Clock className="h-5 w-5 text-secondary-foreground" />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-secondary-foreground">
                  {t('Estimated delivery')}
                </p>

                <p className="mt-1 text-sm font-semibold text-secondary-foreground">
                  {formatDate(order.estimatedDelivery)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="p-6">
          <div className="mx-auto w-full">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                <Truck className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <h2 className="font-semibold text-secondary-foreground">
                  {t('Delivery tracking')}
                </h2>

                <p className="text-sm text-secondary-foreground">
                  {t('Order')} #{order.id}
                </p>
              </div>
            </div>

            <OrderTrackingMap
              orderId={order.id}
              points={liveTracking?.history?.length ? liveTracking.history : order.tracking}
              currentLocation={liveTracking?.currentLocation}
              destination={order.address}
              status={liveTracking?.status ?? order.status}
              loading={trackingLoading}
            />

            <div className="rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-secondary-foreground">
                {t('Delivery tracking')}
              </p>

              {(liveTracking?.history?.length ? liveTracking.history : order.tracking).length > 0 ? (
                <ol className="mt-3 space-y-3">
                  {(liveTracking?.history?.length ? liveTracking.history : order.tracking).map((point, index) => (
                    <li
                      key={point.id ?? `${point.timestamp}-${index}`}
                      className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-secondary-foreground"
                    >
                      <div>{point.latitude}, {point.longitude}</div>
                      <time className="text-xs text-muted-foreground">
                        {formatDate(point.timestamp)}
                      </time>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-secondary-foreground">
                  {t('No tracking updates yet.')}
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-secondary-foreground">
                  {t('Delivery method')}
                </p>

                <p className="mt-2 font-medium text-secondary-foreground">
                  {order.deliveryMethod}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-secondary-foreground">
                  {t('Status')}
                </p>

                <p className="mt-2 font-medium text-secondary-foreground">
                  {order.status}
                </p>
              </div>
            </div>

            {order.estimatedDelivery && (
              <div className="mt-5 rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-secondary-foreground" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-secondary-foreground">
                      {t('Estimated delivery')}
                    </p>

                    <p className="mt-1 font-medium text-secondary-foreground">
                      {formatDate(order.estimatedDelivery)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-secondary-foreground" />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-secondary-foreground">
                    {t('Delivery address')}
                  </p>

                  <div className="mt-2 text-sm leading-6 text-secondary-foreground">
                    <p>{order.address.id}</p>
                    <p>
                      {[
                        order.address.street,
                        order.address.district,
                        order.address.city,
                        order.address.region,
                        order.address.postalCode,
                      ].filter(Boolean).join(', ')}
                    </p>

                    {order.address.phone && (
                      <p>{order.address.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
                {t('History')}
              </h3>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-gray-900" />
                    <div className="mt-2 h-10 w-px bg-gray-200" />
                  </div>

                  <div>
                    <p className="font-medium text-secondary-foreground">
                      {t('Order created')}
                    </p>

                    <p className="mt-1 text-sm text-secondary-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div>
                    <div className="h-3 w-3 rounded-full bg-gray-900" />
                  </div>

                  <div>
                    <p className="font-medium text-secondary-foreground">
                      {t('Current status')}: {order.status}
                    </p>

                    {order.estimatedDelivery && (
                      <p className="mt-1 text-sm text-secondary-foreground">
                        {t('Estimated delivery on')}{' '}
                        {formatDate(order.estimatedDelivery)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
