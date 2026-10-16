import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Activity, ArrowDownUp, Clock3, MapPin, PackageCheck, RefreshCw, Search, ShoppingBag, Truck } from 'lucide-react';
import { getOrder } from '@/api/admin/order.api';
import { Button, Pagination, Skeleton, StatusBadge, StatCard } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage } from '@/api/errorMessage';
import { useTranslation } from 'react-i18next';
import { formatMillionAr, formatPrice } from '@/hook/format';
import type { Order, OrderQueryParam, OrderStatus, TrackingPoint } from '@/type/order/order';

const statuses: Array<OrderStatus | 'all'> = ['all', 'pending', 'confirmed', 'processing', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const lastLocation = (order: Order): TrackingPoint | undefined => order.deliveryTracking?.currentLocation ?? order.tracking?.at(-1);

export default function AdminOrdersList() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [allMapOrders, setAllMapOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [payment, setPayment] = useState<OrderQueryParam['paymentMethod'] | 'all'>('all');
  const [deliveryStatus, setDeliveryStatus] = useState('all');
  const [sellerId, setSellerId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [sortDate, setSortDate] = useState<OrderQueryParam['sortDate']>('desc');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [counts, setCounts] = useState({ all: 0, pending: 0, delivered: 0, totalPrice: 0 });
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getOrder({ search: search.trim() || undefined, page, limit: 100, status: status === 'all' ? undefined : status,
      paymentMethod: payment === 'all' ? undefined : payment, sortDate,
      deliveryStatus: deliveryStatus === 'all' ? undefined : deliveryStatus,
      sellerId: sellerId.trim() || undefined, buyerId: buyerId.trim() || undefined })
      .then((result) => {
        if (!active) return;
        setOrders(result.data ?? []);
        setCounts(result.counts ?? { all: 0, pending: 0, delivered: 0, totalPrice: 0 });
        setPages(result.meta?.totalPages || 1);
        setSelectedId((current) => result.data.some((order) => order.id === current) ? current : result.data[0]?.id ?? null);
      })
      .catch((error) => { if (active) toast(error instanceof Error ? error.message : t('Failed to fetch orders Data'), 'error'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [buyerId, deliveryStatus, page, payment, reload, search, sellerId, sortDate, status, toast, t]);

  useEffect(() => {
    let active = true;
    setMapLoading(true);
    const params = { search: search.trim() || undefined, limit: 100, status: status === 'all' ? undefined : status,
      paymentMethod: payment === 'all' ? undefined : payment, sortDate,
      deliveryStatus: deliveryStatus === 'all' ? undefined : deliveryStatus,
      sellerId: sellerId.trim() || undefined, buyerId: buyerId.trim() || undefined };
    const loadMapOrders = async () => {
      try {
        const first = await getOrder({ ...params, page: 1 });
        if (!active) return;
        const collected = [...first.data];
        setAllMapOrders(collected);
        setSelectedId((current) => current && collected.some((order) => order.id === current) ? current : collected[0]?.id ?? null);
        for (let start = 2; start <= (first.meta?.totalPages || 1); start += 4) {
          const batchPages = Array.from({ length: Math.min(4, (first.meta?.totalPages || 1) - start + 1) }, (_, index) => start + index);
          const batch = await Promise.all(batchPages.map((mapPage) => getOrder({ ...params, page: mapPage })));
          if (!active) return;
          collected.push(...batch.flatMap((result) => result.data));
          setAllMapOrders([...collected]);
        }
      } catch (error) {
        if (active) toast(getApiErrorMessage(error, t('Unable to load all order locations.')), 'error');
      } finally {
        if (active) setMapLoading(false);
      }
    };
    void loadMapOrders();
    return () => { active = false; };
  }, [buyerId, deliveryStatus, payment, reload, search, sellerId, sortDate, status, toast, t]);

  const selected = useMemo(() => allMapOrders.find((order) => order.id === selectedId) ?? orders.find((order) => order.id === selectedId) ?? null, [allMapOrders, orders, selectedId]);
  const mapOrders = allMapOrders.filter((order) => lastLocation(order));
  const coords = mapOrders.map((order) => lastLocation(order)!);
  const latMin = Math.min(...coords.map((point) => point.latitude), -25.7), latMax = Math.max(...coords.map((point) => point.latitude), -12.0);
  const lonMin = Math.min(...coords.map((point) => point.longitude), 43.2), lonMax = Math.max(...coords.map((point) => point.longitude), 50.6);
  const markerPosition = (point: TrackingPoint) => ({
    left: `${12 + ((point.longitude - lonMin) / (lonMax - lonMin || 1)) * 76}%`,
    top: `${12 + (1 - (point.latitude - latMin) / (latMax - latMin || 1)) * 76}%`,
  });

  return <div className="space-y-6 animate-page-in">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.18em] text-primary">{t('Operations')}</p><h1 className="text-2xl font-bold tracking-tight text-secondary-foreground">{t('Orders')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('Monitor every order and delivery across NovaMarket.')}</p></div>
      <Button variant="outline" size="sm" onClick={() => setReload((key) => key + 1)}><RefreshCw className="h-4 w-4" />{t('Refresh orders')}</Button>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title={t('Total Orders')} value={counts.all} icon={<ShoppingBag className="h-5 w-5" />} color="#147D76" />
      <StatCard title={t('Pending')} value={counts.pending} icon={<Clock3 className="h-5 w-5" />} color="#D89132" />
      <StatCard title={t('Delivered')} value={counts.delivered} icon={<PackageCheck className="h-5 w-5" />} color="#3F9B73" />
      <StatCard title={t('Total Volume')} value={formatMillionAr(counts.totalPrice)} icon={<Activity className="h-5 w-5" />} color="#6959C8" />
    </div>

    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div><h2 className="font-semibold text-secondary-foreground">{t('Delivery tracking map')}</h2><p className="mt-0.5 text-xs text-muted-foreground">{t('Select a marker or an order to inspect its delivery.')}</p></div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${mapLoading ? 'animate-pulse' : ''}`} />{mapOrders.length} / {allMapOrders.length} {t('orders with location')}</span>
      </div>
      <div className="grid lg:grid-cols-[1.55fr_1fr]">
        <div className="relative min-h-[300px] overflow-hidden border-b border-border bg-[#edf4f1] dark:bg-[#172c31] lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(30deg, transparent 47%, rgba(20,125,118,.10) 48%, rgba(20,125,118,.10) 49%, transparent 50%),linear-gradient(120deg, transparent 46%, rgba(20,125,118,.08) 47%, rgba(20,125,118,.08) 48%, transparent 49%),radial-gradient(ellipse at 52% 48%,rgba(96,158,137,.16),transparent 57%)', backgroundSize: '110px 100px, 140px 120px, 100% 100%' }} />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-[.25em] text-emerald-900/30 dark:text-emerald-100/30">Madagascar · {t('Delivery network')}</div>
          {mapOrders.map((order, index) => { const point = lastLocation(order)!; const pos = markerPosition(point); return <button key={order.id} title={`${order.id} · ${order.buyerName}`} onClick={() => setSelectedId(order.id)} style={pos} className={`absolute z-10 flex h-8 min-w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white px-1.5 text-[10px] font-bold text-white shadow-lg transition hover:z-20 hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedId === order.id ? 'scale-125 bg-primary ring-4 ring-primary/20' : index % 2 ? 'bg-[#D89132]' : 'bg-[#147D76]'}`} aria-label={`${t('Track order')} ${order.id}`}>{index + 1}</button>; })}
          {!mapLoading && mapOrders.length === 0 && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center"><MapPin className="h-8 w-8 text-muted-foreground/60"/><p className="text-sm font-medium text-secondary-foreground">{t('No delivery location in this result')}</p><p className="text-xs text-muted-foreground">{t('Orders appear here when delivery coordinates are available.')}</p></div>}
          {mapLoading && <div className="absolute inset-0 grid grid-cols-3 gap-4 p-8 opacity-60">{Array.from({length: 6}).map((_, index) => <Skeleton key={index} className="h-8 w-8 rounded-full" />)}</div>}
          <div className="absolute bottom-3 left-3 rounded-lg border border-white/60 bg-white/80 px-2.5 py-1.5 text-[10px] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-300">{mapLoading ? t('Loading all filtered order locations...') : t('Map shows all orders matching the active filters.')}</div>
        </div>
        <div className="flex min-h-[300px] flex-col">
          {selected ? <div className="flex-1 p-5" key={selected.id}>
            <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-primary">#{selected.id}</p><h3 className="mt-1 text-lg font-semibold text-secondary-foreground">{selected.buyerName}</h3></div><StatusBadge status={selected.status} /></div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><span className="text-secondary-foreground">{[selected.address?.street, selected.address?.district, selected.address?.city, selected.address?.region].filter(Boolean).join(', ') || t('Address unavailable')}</span></div>
              <div className="flex items-center gap-2.5"><Truck className="h-4 w-4 shrink-0 text-primary"/><span className="text-secondary-foreground">{selected.deliveryTracking?.driver?.name ?? t('Driver not assigned')}</span><span className="ml-auto text-xs text-muted-foreground">{selected.deliveryTracking?.driver?.vehicle ?? selected.deliveryMethod}</span></div>
              <div className="flex items-center justify-between border-t border-border pt-3"><span className="text-muted-foreground">{t('Last location update')}</span><span className="text-xs font-medium text-secondary-foreground">{lastLocation(selected) ? new Date(lastLocation(selected)!.timestamp).toLocaleString() : t('Not available')}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">{t('Total')}</span><span className="font-semibold text-secondary-foreground">{formatPrice(selected.total)}</span></div>
            </div>
            <Link to={`/admin/orders/${selected.id}`} className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:brightness-95">{t('Open tracking details')}<MapPin className="h-4 w-4" /></Link>
          </div> : <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">{loading ? t('Loading orders...') : t('Select a tracked order')}</div>}
          <div className="border-t border-border px-4 py-3"><p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t('Tracked orders')}</p><div className="flex gap-2 overflow-x-auto pb-1">{mapOrders.map((order, index) => <button key={order.id} onClick={() => setSelectedId(order.id)} className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs transition ${order.id === selectedId ? 'border-primary/40 bg-primary/8 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}>{index + 1} · {order.id.slice(-8)}</button>)}{!mapOrders.length && !loading && <span className="text-xs text-muted-foreground">{t('No tracked orders on this page')}</span>}</div></div>
        </div>
      </div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={(event) => {setSearch(event.target.value);setPage(1)}} placeholder={t('Search orders, buyers, sellers...')} className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></div>
        <select aria-label={t('Payment')} value={payment} onChange={(event) => {setPayment(event.target.value as typeof payment);setPage(1)}} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-secondary-foreground"><option value="all">{t('All payments')}</option><option value="mvola">MVola</option><option value="orange_money">Orange Money</option><option value="card">{t('Card')}</option><option value="cod">COD</option></select>
        <select aria-label={t('Delivery status')} value={deliveryStatus} onChange={(event) => {setDeliveryStatus(event.target.value);setPage(1)}} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-secondary-foreground"><option value="all">{t('All delivery statuses')}</option>{['pending','preparing','processing','delivered','cancelled','failed'].map((value) => <option key={value} value={value}>{t(value[0].toUpperCase() + value.slice(1))}</option>)}</select>
        <Button variant="outline" size="sm" onClick={() => setSortDate((value) => value === 'desc' ? 'asc' : 'desc')}><ArrowDownUp className="h-4 w-4"/>{t(sortDate === 'desc' ? 'Newest first' : 'Oldest first')}</Button>
      </div>
      <details className="group border-b border-border px-4 py-2"><summary className="w-fit cursor-pointer text-xs font-semibold text-muted-foreground hover:text-primary">{t('Filter by buyer or seller ID')}</summary><div className="grid gap-3 py-3 sm:grid-cols-2"><input value={buyerId} onChange={(event) => {setBuyerId(event.target.value);setPage(1)}} placeholder={t('Buyer ID')} className="h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"/><input value={sellerId} onChange={(event) => {setSellerId(event.target.value);setPage(1)}} placeholder={t('Seller ID')} className="h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"/></div></details>
      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 pt-3">{statuses.map((value) => <button key={value} onClick={() => {setStatus(value);setPage(1)}} className={`relative shrink-0 px-3 py-2 text-xs font-medium capitalize transition ${status === value ? 'text-primary' : 'text-muted-foreground hover:text-secondary-foreground'}`}>{value === 'all' ? t('All') : t(value[0].toUpperCase() + value.slice(1))}{status === value && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary"/>}</button>)}</div>
      {loading ? <div className="space-y-3 p-5">{Array.from({length: 5}).map((_, index) => <Skeleton key={index} className="h-14 w-full rounded-lg" />)}</div> : orders.length ? <div className="divide-y divide-border">{orders.map((order) => <button key={order.id} onClick={() => setSelectedId(order.id)} className={`grid w-full grid-cols-[minmax(130px,1fr)_minmax(110px,1fr)_minmax(120px,1fr)_auto_auto] items-center gap-4 px-5 py-4 text-left transition hover:bg-secondary/40 ${order.id === selectedId ? 'bg-primary/[.035]' : ''}`}>
        <span><span className="block font-mono text-xs font-semibold text-primary">#{order.id}</span><span className="mt-1 block text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span></span>
        <span className="truncate text-sm font-medium text-secondary-foreground">{order.buyerName}</span><span className="truncate text-xs text-muted-foreground">{order.sellers.map((seller) => seller.name).join(', ') || t('Seller unavailable')}</span><StatusBadge status={order.status}/><span className="text-right text-sm font-semibold text-secondary-foreground">{formatPrice(order.total)}</span>
      </button>)}</div> : <div className="p-12 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/40"/><p className="mt-3 text-sm font-semibold text-secondary-foreground">{t('No orders found')}</p><p className="mt-1 text-xs text-muted-foreground">{t('Try adjusting your search or filters')}</p></div>}
      <div className="flex items-center justify-between border-t border-border px-5 py-3"><span className="text-xs text-muted-foreground">{counts.all} {t('orders')}</span><Pagination current={page} total={pages} onChange={setPage}/></div>
    </section>
  </div>;
}
