import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Package,
  Percent,
  Power,
  Search,
  Sparkles,
  Store,
  Tag,
  TicketPercent,
  Users,
  X,
} from 'lucide-react';
import { Button, Modal, Skeleton, StatusBadge } from '@/components/ui';
import { formatPrice } from '@/hook/format';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage } from '@/api/errorMessage';
import { getAdminPromotions, updateAdminPromotionStatus } from '@/api/admin/payment.api';
import type { Promotion, PromotionStatus } from '@/type/admin/payment';
import type { Product } from '@/type/catalog/product';
import { getProductById } from '@/api/admin/product.public.api';
import type { PaginationMeta } from '@/type/catalog/product';

const PAGE_SIZE = 10;
const promotionStatuses: Array<PromotionStatus | 'all'> = ['all', 'active', 'scheduled', 'inactive', 'expired'];

export default function AdminPromotions() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [status, setStatus] = useState<PromotionStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminPromotions({
        page,
        limit: PAGE_SIZE,
        status: status === 'all' ? undefined : status,
        search: debouncedSearch || undefined,
      });
      setPromotions(response.data ?? []);
      setMeta(response.meta);
    } catch (cause) {
      setError(getApiErrorMessage(cause, t('Failed to load promotions')));
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch, t]);

  useEffect(() => {
    void fetchPromotions();
  }, [fetchPromotions]);

  const showProducts = async (productIds: string[]) => {
    setShowProductsModal(true);
    setProductSearch('');
    setSelectedProducts([]);
    if (!productIds.length) return;
    setProductsLoading(true);
    const results = await Promise.allSettled(productIds.map((id) => getProductById(id)));
    setSelectedProducts(results.flatMap((result) => result.status === 'fulfilled' && result.value ? [result.value] : []));
    setProductsLoading(false);
  };

  const togglePromotion = async (promotion: Promotion) => {
    const nextStatus = promotion.status === 'active' ? 'inactive' : 'active';
    setUpdatingId(promotion.id);
    try {
      const updated = await updateAdminPromotionStatus(promotion.id, nextStatus);
      setPromotions((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast(t(nextStatus === 'active' ? 'Promotion activated' : 'Promotion deactivated'));
    } catch (cause) {
      toast(getApiErrorMessage(cause, t('Failed to update promotion status')), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (value: string) => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  const formatDiscount = (promotion: Promotion) => promotion.type === 'percentage'
    ? `${promotion.discount}%`
    : formatPrice(promotion.discount);
  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('all');
    setPage(1);
  };
  const visibleProducts = selectedProducts.filter((product) => {
    const query = productSearch.trim().toLocaleLowerCase();
    return !query || [product.name, product.brand, product.sku, product.categoryName].some((value) => value?.toLocaleLowerCase().includes(query));
  });

  return <main className="space-y-6 animate-page-in">
    <header className="relative overflow-hidden rounded-3xl border border-border bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[.07] px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" aria-hidden="true"/>{t('Promotion management')}</span>
          <h1 className="text-2xl font-bold tracking-tight text-secondary-foreground sm:text-3xl">{t('Promotions')}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{t('Review marketplace campaigns, understand their terms and control which promotions are live.')}</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/80 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Tag className="h-5 w-5" aria-hidden="true"/></span>
          <div><p className="text-2xl font-bold leading-none text-secondary-foreground">{meta.total}</p><p className="mt-1 text-xs text-muted-foreground">{t('Matching promotions')}</p></div>
        </div>
      </div>
    </header>

    <section aria-label={t('Promotion filters')} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search by promotion, store or code')} aria-label={t('Search promotions')} className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm text-secondary-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"/>
          {search && <button type="button" onClick={() => setSearch('')} aria-label={t('Clear search')} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"><X className="h-4 w-4" aria-hidden="true"/></button>}
        </div>
        <div role="group" aria-label={t('Filter by promotion status')} className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
          {promotionStatuses.map((item) => <button key={item} type="button" aria-pressed={status === item} onClick={() => { setStatus(item); setPage(1); }} className={`min-h-10 shrink-0 rounded-xl px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${status === item ? 'bg-primary text-white shadow-sm' : 'border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'}`}>{t(item === 'all' ? 'All promotions' : item.charAt(0).toUpperCase() + item.slice(1))}</button>)}
        </div>
      </div>
    </section>

    {loading && <div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <div key={index} className="rounded-2xl border border-border bg-card p-5"><div className="flex gap-4"><Skeleton className="h-12 w-12 shrink-0 rounded-xl"/><div className="flex-1 space-y-3"><Skeleton className="h-5 w-2/3"/><Skeleton className="h-4 w-1/2"/><Skeleton className="h-20 w-full rounded-xl"/></div></div></div>)}</div>}

    {!loading && error && <div role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/[.05] p-8 text-center"><p className="text-sm font-medium text-destructive">{error}</p><Button className="mt-4" variant="outline" size="sm" onClick={() => void fetchPromotions()}>{t('Retry')}</Button></div>}

    {!loading && !error && promotions.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><TicketPercent className="h-7 w-7" aria-hidden="true"/></span>
      <h2 className="mt-4 text-lg font-semibold text-secondary-foreground">{t('No promotions found')}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{t('There are no promotions matching the selected filter.')}</p>
      {(status !== 'all' || search) && <Button className="mt-5" variant="outline" size="sm" onClick={clearFilters}>{t('Clear filters')}</Button>}
    </div>}

    {!loading && !error && promotions.length > 0 && <div className="grid gap-4 xl:grid-cols-2">
      {promotions.map((promotion, index) => {
        const canToggle = promotion.status === 'active' || promotion.status === 'inactive';
        const active = promotion.status === 'active';
        const used = promotion.usedCount ?? 0;
        const limit = promotion.usageLimit;
        const usagePercent = limit && limit > 0 ? Math.min((used / limit) * 100, 100) : null;
        return <article key={promotion.id} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[.04] sm:p-6" style={{ animationDelay: `${Math.min(index * 35, 210)}ms` }}>
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}><Tag className="h-5 w-5" aria-hidden="true"/></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-semibold text-secondary-foreground">{promotion.name}</h2><StatusBadge status={promotion.status}/></div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true"/><span className="truncate">{promotion.storeName}</span></p>
            </div>
            {promotion.isAutomatic && <span title={t('Automatic promotion')} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300"><Sparkles className="h-3.5 w-3.5" aria-hidden="true"/><span className="hidden sm:inline">{t('Automatic')}</span></span>}
          </div>

          <div className="mt-5 flex items-end justify-between gap-3 rounded-xl bg-gradient-to-r from-primary/[.08] to-transparent p-4">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Promotion value')}</p><p className="mt-1 flex items-center gap-1.5 text-2xl font-bold tracking-tight text-primary">{promotion.type === 'percentage' && <Percent className="h-5 w-5" aria-hidden="true"/>}{formatDiscount(promotion)}</p></div>
            {promotion.code && <div className="max-w-[48%] text-right"><p className="text-xs text-muted-foreground">{t('Promo code')}</p><code className="mt-1 inline-block max-w-full truncate rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-sm font-semibold tracking-wide text-secondary-foreground">{promotion.code}</code></div>}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border/80 p-3"><CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true"/><div className="min-w-0"><p className="text-[11px] text-muted-foreground">{t('Campaign period')}</p><p className="truncate text-xs font-medium text-secondary-foreground">{formatDate(promotion.startDate)} – {formatDate(promotion.endDate)}</p></div></div>
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border/80 p-3"><Package className="h-4 w-4 shrink-0 text-primary" aria-hidden="true"/><div><p className="text-[11px] text-muted-foreground">{t('Products')}</p><p className="text-xs font-medium text-secondary-foreground">{promotion.productsCount} {t(promotion.productsCount === 1 ? 'product' : 'products')}</p></div></div>
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border/80 p-3"><Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true"/><div><p className="text-[11px] text-muted-foreground">{t('Usage')}</p><p className="text-xs font-medium text-secondary-foreground">{used}{limit ? ` / ${limit}` : ` ${t('used')}`}</p></div></div>
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border/80 p-3"><Clock3 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true"/><div className="min-w-0"><p className="text-[11px] text-muted-foreground">{t('Order conditions')}</p><p className="truncate text-xs font-medium text-secondary-foreground">{promotion.minimumOrderAmount != null ? `${t('From')} ${formatPrice(promotion.minimumOrderAmount)}` : t('No minimum')}</p></div></div>
          </div>

          {usagePercent !== null && <div className="mt-3"><div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground"><span>{t('Usage limit')}</span><span>{Math.round(usagePercent)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${usagePercent}%` }}/></div></div>}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {promotion.maximumDiscount != null && <span className="inline-flex items-center gap-1"><ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true"/>{t('Max discount')} {formatPrice(promotion.maximumDiscount)}</span>}
              {promotion.isAutomatic && <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" aria-hidden="true"/>{t('Applied automatically')}</span>}
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void showProducts(promotion.productIds)}><Package className="h-4 w-4" aria-hidden="true"/>{t('View products')}</Button>
              {canToggle && <Button variant={active ? 'ghost' : 'primary'} size="sm" disabled={updatingId === promotion.id} loading={updatingId === promotion.id} onClick={() => void togglePromotion(promotion)}><Power className="h-4 w-4" aria-hidden="true"/>{t(active ? 'Deactivate' : 'Activate')}</Button>}
            </div>
          </div>
        </article>;
      })}
    </div>}

    {!loading && !error && promotions.length > 0 && <footer className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-muted-foreground">{t('Showing')} <span className="font-semibold text-secondary-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, meta.total)}</span> {t('of')} <span className="font-semibold text-secondary-foreground">{meta.total}</span></p>
      <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft className="h-4 w-4" aria-hidden="true"/>{t('Previous')}</Button><span aria-live="polite" className="min-w-20 text-center text-xs font-medium text-muted-foreground">{t('Page')} {meta.page ?? page} {t('of')} {meta.totalPages ?? 1}</span><Button variant="outline" size="sm" disabled={page >= (meta.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)}>{t('Next')}<ChevronRight className="h-4 w-4" aria-hidden="true"/></Button></div>
    </footer>}

    <Modal open={showProductsModal} onClose={() => setShowProductsModal(false)} title={t('Promotion products')} className="max-w-4xl max-h-[88vh]">
      {productsLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-border"><Skeleton className="aspect-[4/3] w-full rounded-none"/><div className="space-y-2 p-4"><Skeleton className="h-4 w-4/5"/><Skeleton className="h-3 w-2/5"/><Skeleton className="mt-4 h-5 w-1/2"/></div></div>)}</div> : selectedProducts.length === 0 ? <div className="py-12 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground"><Package className="h-7 w-7" aria-hidden="true"/></span><p className="mt-4 text-sm font-medium text-secondary-foreground">{t('No products found')}</p><p className="mt-1 text-xs text-muted-foreground">{t('This promotion has no products associated with it.')}</p></div> : <div>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold text-secondary-foreground">{selectedProducts.length} {t(selectedProducts.length === 1 ? 'product' : 'products')}</p><p className="mt-0.5 text-xs text-muted-foreground">{t('Products included in this promotion')}</p></div>
          <label className="relative block w-full sm:max-w-xs"><span className="sr-only">{t('Search products in this promotion')}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/><input type="search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder={t('Search products in this promotion')} className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"/></label>
        </div>
        {visibleProducts.length === 0 ? <div className="rounded-xl border border-dashed border-border py-10 text-center"><Search className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true"/><p className="mt-2 text-sm text-muted-foreground">{t('No products match this search.')}</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map((product) => {
          const image = product.images?.find((item) => item.isDefault) ?? product.images?.[0];
          const productStatus = product.moderationStatus ?? product.status;
          return <article key={product.id} className="group overflow-hidden rounded-2xl border border-border bg-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[.05]">
            <div className="relative aspect-[4/3] overflow-hidden bg-secondary/60">{image ? <img src={image.url} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"/> : <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="h-9 w-9" aria-hidden="true"/></div>}{productStatus && <div className="absolute left-3 top-3"><StatusBadge status={productStatus}/></div>}</div>
            <div className="p-4"><div className="min-h-12"><h4 className="line-clamp-2 text-sm font-semibold leading-5 text-secondary-foreground">{product.name}</h4><p className="mt-1 truncate text-xs text-muted-foreground">{product.brand || product.categoryName || t('No brand')}</p></div><div className="mt-4 flex items-end justify-between gap-2"><div><p className="text-[11px] text-muted-foreground">{t('Price')}</p><p className="text-base font-bold text-primary">{formatPrice(product.price)}</p></div><div className="text-right"><p className="text-[11px] text-muted-foreground">{t('Stock')}</p><p className={`text-sm font-semibold ${product.stock <= (product.lowStockThreshold ?? 0) ? 'text-amber-600 dark:text-amber-400' : 'text-secondary-foreground'}`}>{product.stock}</p></div></div>{product.sku && <p className="mt-3 truncate border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">SKU · {product.sku}</p>}</div>
          </article>;
        })}</div>}
      </div>}
    </Modal>
  </main>;
}
