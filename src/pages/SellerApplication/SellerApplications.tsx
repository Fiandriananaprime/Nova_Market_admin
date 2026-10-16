import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Building2, CalendarDays, MapPin, Search, Store, UserRound, Users, XCircle } from 'lucide-react';
import { getSellerApplications } from '@/api/admin/sellerApplication';
import type { SellerApplicationSummary, SellerApplicationStatus } from '@/type/admin/seller';
import { Button, Skeleton, StatCard, StatusBadge } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage } from '@/api/errorMessage';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/hook/format';

type Filter = SellerApplicationStatus | 'all';
const filters: Filter[] = ['all', 'pending', 'approved', 'rejected'];

export default function SellerApplications() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [apps, setApps] = useState<SellerApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getSellerApplications({ page, limit: 24, status: filter === 'all' ? undefined : filter })
      .then(({ data, meta, counts: responseCounts }) => {
        if (!active) return;
        setApps(data ?? []);
        setCounts(responseCounts ?? { all: 0, pending: 0, approved: 0, rejected: 0 });
        setPages(meta?.totalPages || 1);
      })
      .catch((error) => active && toast(getApiErrorMessage(error, 'Unable to load seller applications.'), 'error'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [filter, page, toast]);

  const visibleApps = apps.filter((app) => {
    const query = search.trim().toLowerCase();
    return !query || [app.store?.name, app.store?.location, app.applicantUserId, app.id]
      .some((value) => value?.toLowerCase().includes(query));
  });

  const statCards = [
    { title: t('Total applications'), value: counts.all, color: '#147D76', icon: <Users className="h-5 w-5"/> },
    { title: t('Pending review'), value: counts.pending, color: '#D89132', icon: <CalendarDays className="h-5 w-5"/> },
    { title: t('Approved'), value: counts.approved, color: '#3F9B73', icon: <Store className="h-5 w-5"/> },
    { title: t('Rejected'), value: counts.rejected, color: '#C65A55', icon: <XCircle className="h-5 w-5"/> },
  ];

  return <div className="space-y-6 animate-page-in">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.18em] text-primary">{t('Marketplace onboarding')}</p><h1 className="text-2xl font-bold tracking-tight text-secondary-foreground">{t('Seller Applications')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('Review business details and decide who can join the marketplace.')}</p></div><span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">{counts.pending} {t('awaiting review')}</span></div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{statCards.map((card) => <StatCard key={card.title} title={card.title} value={card.value} icon={card.icon} color={card.color}/>)}</div>

    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={(event) => {setSearch(event.target.value);setPage(1)}} placeholder={t('Search business, applicant or location...')} className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"/></div>
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-secondary/70 p-1">{filters.map((value) => <button key={value} onClick={() => {setFilter(value);setPage(1)}} className={`rounded-md px-3 py-2 text-xs font-semibold capitalize transition ${filter === value ? 'bg-card text-secondary-foreground shadow-sm' : 'text-muted-foreground hover:text-secondary-foreground'}`}>{value === 'all' ? t('All applications') : t(value[0].toUpperCase() + value.slice(1))}<span className="ml-1.5 opacity-65">{counts[value]}</span></button>)}</div>
      </div>

      {loading ? <div className="grid gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3">{Array.from({length: 6}).map((_, index) => <div key={index} className="rounded-xl border border-border p-5"><div className="flex gap-3"><Skeleton className="h-12 w-12 rounded-xl"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3"/><Skeleton className="h-3 w-1/3"/></div></div><Skeleton className="mt-5 h-16 w-full rounded-lg"/><Skeleton className="mt-4 h-9 w-full rounded-lg"/></div>)}</div>
        : visibleApps.length ? <div className="grid gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3">{visibleApps.map((app) => {
          const name = app.store?.name || t('Unnamed business');
          return <article key={app.id} className="group flex min-h-[260px] flex-col rounded-xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[.06]">
            <div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5"/></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="truncate font-semibold text-secondary-foreground">{name}</h2><StatusBadge status={app.status}/></div><p className="mt-1 text-xs text-muted-foreground">{t(app.store?.businessType === 'company' ? 'Company' : 'Individual seller')}</p></div></div>
            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 rounded-lg bg-secondary/45 p-3.5">
              <div className="min-w-0"><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><MapPin className="h-3 w-3"/>{t('Location')}</p><p className="mt-1 truncate text-sm font-medium text-secondary-foreground">{app.store?.location || t('Location unavailable')}</p></div>
              <div className="min-w-0"><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><CalendarDays className="h-3 w-3"/>{t('Applied')}</p><p className="mt-1 truncate text-sm font-medium text-secondary-foreground">{app.submittedAt ? formatDate(app.submittedAt) : t('Date unavailable')}</p></div>
              <div className="col-span-2 min-w-0 border-t border-border/70 pt-3"><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><UserRound className="h-3 w-3"/>{t('Applicant ID')}</p><p className="mt-1 truncate font-mono text-xs text-secondary-foreground">{app.applicantUserId}</p></div>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 pt-4"><span className="font-mono text-[10px] text-muted-foreground">#{app.id.slice(-12)}</span><Link to={`/admin/sellers/applications/${app.id}`}><Button variant={app.status === 'pending' ? 'primary' : 'outline'} size="sm">{app.status === 'pending' ? t('Review application') : t('View details')}<ArrowUpRight className="h-3.5 w-3.5"/></Button></Link></div>
          </article>;
        })}</div> : <div className="p-14 text-center"><Store className="mx-auto h-9 w-9 text-muted-foreground/40"/><p className="mt-3 font-semibold text-secondary-foreground">{t('No applications found')}</p><p className="mt-1 text-sm text-muted-foreground">{t('Try adjusting your search or filters')}</p><Button variant="ghost" size="sm" className="mt-3" onClick={() => {setSearch('');setFilter('all')}}>{t('Reset')}</Button></div>}
      <div className="flex items-center justify-between border-t border-border px-5 py-3"><span className="text-xs text-muted-foreground">{counts.all} {t('applications')}</span><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{t('Page')} {page} {t('of')} {pages}</span><div className="flex gap-1"><Button variant="outline" size="xs" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>{t('Previous')}</Button><Button variant="outline" size="xs" disabled={page >= pages || loading} onClick={() => setPage((value) => Math.min(pages, value + 1))}>{t('Next')}</Button></div></div></div>
    </section>
  </div>;
}
