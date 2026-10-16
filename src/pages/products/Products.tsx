import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, RefreshCw, Search } from 'lucide-react';
import { Tabs, StatusBadge } from '../../components/ui';
import TableCard, { type Column } from '@/components/Stats/TableCard';
import { getAdminProducts } from '@/api/admin/product.api';
import { Product, productStatusDto } from '@/type/catalog/product';
import { useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage } from '@/api/errorMessage';
import { formatPrice } from '@/hook/format';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';


export default function AdminProducts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<productStatusDto | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchRequest, setSearchRequest] = useState(0);
  const [sortBy, setSortBy] = useState<'price' | 'status' | 'submitted'>('submitted');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeFilter, setActiveFilter] = useState<'status' | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [counts, setCounts] = useState({
    all: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const handleTabChange = (id: string) => {
    if (id === 'all' || id === 'approved' || id === 'pending' || id === 'rejected') {
      setActiveTab(id);
      setPage(1);
    }
  };

  const resetFilters = () => {
    setActiveTab('all');
    setSearchInput('');
    setSearch('');
    setSortBy('submitted');
    setSortDirection('desc');
    setPage(1);
    setActiveFilter(null);
    setReloadKey((key) => key + 1);
  };

  const changeSort = (nextSort: 'price' | 'status' | 'submitted') => {
    if (sortBy === nextSort) {
      setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(nextSort);
      setSortDirection('desc');
    }
    setPage(1);
  };

  const sortableHeader = (label: string, sort: 'price' | 'status' | 'submitted') => (
    <button type="button" onClick={() => changeSort(sort)} className="inline-flex items-center gap-1 hover:text-primary">
      {label}
      {sortDirection === 'asc'
        ? <ArrowUp className={`h-3.5 w-3.5 ${sortBy === sort ? '' : 'opacity-30'}`} />
        : <ArrowDown className={`h-3.5 w-3.5 ${sortBy === sort ? '' : 'opacity-30'}`} />}
    </button>
  );

  const filterHeader = (label: string) => {
    const options = [['all', t('All statuses')], ['approved', t('Approved')], ['pending', t('Pending')], ['rejected', t('Rejected')]];
    const selected = activeTab;
    return (
      <div className="relative inline-flex items-center gap-1">
        <button type="button" onClick={() => setActiveFilter(activeFilter === 'status' ? null : 'status')} className="inline-flex items-center gap-1 hover:text-primary">
          {label}<ArrowDown className="h-3.5 w-3.5" />
        </button>
        {selected !== 'all' && <span className="max-w-20 truncate rounded bg-primary/10 px-1 text-[9px] normal-case text-primary">{selected}</span>}
        {activeFilter === 'status' && (
          <div className="absolute left-0 top-full z-30 mt-1 min-w-40 rounded-md border border-border bg-card p-1 normal-case shadow-lg">
            {options.map(([value, optionLabel]) => (
              <button key={value} type="button" onClick={() => {
                handleTabChange(value);
                setPage(1);
                setActiveFilter(null);
              }} className="block w-full rounded px-2 py-1.5 text-left text-xs font-normal text-secondary-foreground hover:bg-secondary">
                {optionLabel}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: t("PRODUCT"),
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-secondary-foreground truncate max-w-[180px]">
            {p.id}
          </span>
        </div>
      ),
    },
    {
      key: 'storeName',
      header: t("SELLER"),
      render: (p) => (
        <Link
          className="text-muted-foreground hover:underline"
          to={`/admin/stores/${p.storeId}`}
          onClick={(e) => e.stopPropagation()}
        >
          {p.storeName || t('Unknown seller')}
        </Link>
      ),
    },
    {
      key: 'price',
      header: sortableHeader(t("PRICE"), 'price'),
      render: (p) => (
        <span className="font-medium text-secondary-foreground whitespace-nowrap">
          {formatPrice ? formatPrice(p.price) : `${p.price} Ar`}
        </span>
      ),
    },
    {
      key: 'category',
      header: t("CATEGORY"),
      render: (p) => (
        <Link
          to={`/admin/categories/${p.categoryId}`}
          className="text-muted-foreground hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {p.categoryName || t('Category unavailable')}
        </Link>
      ),
    },
    {
      key: 'status',
      header: filterHeader(t("STATUS")),
      render: (p) => {
        const status = p.moderationStatus ?? p.status;
        return status ? <StatusBadge status={status} /> : null;
      },
    },
    {
      key: 'submittedAt',
      header: sortableHeader(t("SUBMITTED"), 'submitted'),
      render: (p) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getAdminProducts({
          page,
          limit: 20,
          status: activeTab !== 'all' ? activeTab : undefined,
          search: search || undefined,
          sortBy,
          sortDirection,
        });
        setCounts(response.counts);
        setProducts(response.data);
        setTotalPages(response.meta?.totalPages ?? 1);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast(getApiErrorMessage(error, 'Unable to load products.'), 'error');
      }
    };

    fetchProducts();
  }, [page, activeTab, search, searchRequest, sortBy, sortDirection, reloadKey]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    setSearchRequest((request) => request + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold font-display text-secondary-foreground">
          {t("Product Moderation")}
        </h1>
        <button
          type="button"
          onClick={resetFilters}
          title={t('Refresh products')}
          className="p-2 text-muted-foreground hover:bg-secondary rounded-lg"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">{t('Refresh products')}</span>
        </button>
      </div>

      <div className="overflow-x-auto mb-4">
        <Tabs tabs = {[
          { id: 'all', label: t("All"), count: counts.all },
          { id: 'approved', label: t("Approved"), count: counts.approved },
          { id: 'pending', label: t("Pending"), count: counts.pending },
          { id: 'rejected', label: t("Rejected"), count: counts.rejected },
        ]} 
      active={activeTab} 
      onChange={handleTabChange} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-visible">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <form
            onSubmit={handleSearch}
            className="flex items-center max-w-xs w-[300px]"
          >
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("Search products...")}
              className="w-full pl-3 pr-4 py-2 text-sm bg-secondary border border-border rounded-l-lg text-secondary-foreground focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="h-9 w-9 flex items-center justify-center bg-foreground rounded-r-lg border border-foreground flex-shrink-0"
            >
              <Search className="w-4 h-4 text-white" />
            </button>
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t("Previous page")}
            >
              −
            </button>
            <span className="text-sm text-muted-foreground">
               {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page >= totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t("Next page")}
            >
              +
            </button>
          </div>
        </div>

        <TableCard
          title=""
          data={products}
          columns={columns}
          rowKey={(product) => product.id}
          rowHref={(product) => `/admin/products/${product.id}?status=${activeTab}`}
          className="border-0 rounded-none"
          headerOverflowVisible
        />
      </div>
    </div>
  );
}