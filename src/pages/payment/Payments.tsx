import { useEffect, useState, useMemo } from 'react';
import { DollarSign, TrendingUp, CreditCard, Smartphone, RefreshCw } from 'lucide-react';
import { StatCard, Badge, Select } from '../../components/ui';

import TableCard, { Column } from '@/components/Stats/TableCard'; 
import { formatPrice } from '@/hook/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/contexts/ToastContext';
import { getPaymentsSummary, getTransactions, refundTransaction } from '@/api/admin/payment.api';
import { PaymentsSummary, Transaction,paymentMethod as PaymentMethod } from '@/type/admin/payment';

import { PaginationMeta } from '@/type/catalog/product';
import { formatMillionAr } from '@/hook/format';

type TransactionStatus = 'completed' | 'pending' | 'failed' | 'refunded';

export default function AdminPayments() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | ''>('');
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 11);
    return date.toISOString().split('T')[0];
  });

  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  const loadSummary = async () => {
    try {
      setLoadingSummary(true);
      const data = await getPaymentsSummary({ from, to });
      setSummary(data);
    } catch (error) {
      console.error(error);
      toast(t('Failed to load payment summary'), 'error');
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);

      const data = await getTransactions({
        page,
        limit,
        method: methodFilter === 'all' ? undefined : methodFilter,
        status: statusFilter || undefined,
      });

      setTransactions(data.data);
      setMeta(data.meta);
    } catch (error) {
      console.error(error);
      toast(t('Failed to load transactions'), 'error');
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [from, to]);

  useEffect(() => {
    loadTransactions();
  }, [page, limit, methodFilter, statusFilter]);

  const handleRefund = async (transaction: Transaction) => {
    try {
      setRefundingId(transaction.id);
      await refundTransaction(transaction.id, transaction.amount);
      toast(t('Refund initiated successfully'), 'success');
      await loadTransactions();
    } catch (error) {
      console.error(error);
      toast(t('Failed to refund transaction'), 'error');
    } finally {
      setRefundingId(null);
    }
  };

  const handleMethodChange = (value: string) => {
    setPage(1);
    setMethodFilter(value as PaymentMethod | 'all');
  };

  const handleStatusChange = (value: string) => {
    setPage(1);
    setStatusFilter(value as TransactionStatus | '');
  };

  const paymentData = summary?.seriesByMonth ?? [];

  const totalPaymentVolume = paymentData.reduce(
    (total, item) => total + item.mvola + item.orangeMoney + item.card + item.cod,
    0
  );

  const mobileMoneyVolume = paymentData.reduce(
    (total, item) => total + item.mvola + item.orangeMoney,
    0
  );

  const mobileMoneyPercentage = totalPaymentVolume > 0
    ? Math.round((mobileMoneyVolume / totalPaymentVolume) * 100)
    : 0;

  const currentPage = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;
  const totalTransactions = meta?.total ?? 0;

  const columns = useMemo<Column<Transaction>[]>(() => [
    {
      key: 'id',
      header: t('Transaction'),
      className: 'font-mono text-xs text-accent font-bold',
    },
    {
      key: 'orderId',
      header: t('Order'),
      className: 'font-mono text-xs text-primary',
    },
    {
      key: 'buyerName',
      header: t('Buyer'),
      className: 'text-secondary-foreground',
    },
    {
      key: 'sellerName',
      header: t('Seller'),
      className: 'text-secondary-foreground',
    },
    {
      key: 'amount',
      header: t('Amount'),
      className: 'font-bold text-secondary-foreground whitespace-nowrap',
      render: (item) => formatPrice(item.amount),
    },
    {
      key: 'commission',
      header: t('Commission'),
      className: 'text-accent font-medium whitespace-nowrap',
      render: (item) => formatPrice(item.commission),
    },
    {
      key: 'method',
      header: t('Method'),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (item) => (
        <Badge
          variant={
            item.status === 'completed'
              ? 'success'
              : item.status === 'pending'
                ? 'warning'
                : item.status === 'failed'
                  ? 'danger'
                  : 'outline'
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: t('Date'),
      className: 'text-muted-foreground',
    },
    {
      key: 'action',
      header: t('Action'),
      render: (item) =>
        item.status === 'completed' ? (
          <button
            type="button"
            disabled={refundingId === item.id}
            onClick={() => handleRefund(item)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary disabled:opacity-50"
          >
            {refundingId === item.id ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              t('Refund')
            )}
          </button>
        ) : null,
    },
  ], [t, refundingId]);

  if (loadingSummary && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold font-display text-secondary-foreground">
          {t('Payments')}
        </h1>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            max={to}
            onChange={e => setFrom(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm"
          />

          <span className="text-muted-foreground">-</span>

          <input
            type="date"
            value={to}
            min={from}
            onChange={e => setTo(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('Total volume')}
          value={summary ? formatMillionAr(summary.totalVolume) : '0 Ar'}
          icon={<DollarSign className="w-5 h-5" />}
          color="#0077B6"
        />

        <StatCard
          title={t('Platform commission')}
          value={summary ? formatMillionAr(summary.totalCommission) : '0 Ar'}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#5ABCB9"
        />

        <StatCard
          title={t('Transactions')}
          value={totalTransactions.toLocaleString()}
          icon={<CreditCard className="w-5 h-5" />}
          color="#0077B6"
        />

        <StatCard
          title={t('Mobile money')}
          value={`${mobileMoneyPercentage}%`}
          icon={<Smartphone className="w-5 h-5" />}
          color="#5ABCB9"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold font-display text-secondary-foreground mb-4">
            {t('Revenue by payment method')}
          </h2>

          {paymentData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              {t('No payment data available')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={paymentData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${(Number(v) / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={v => [formatPrice(Number(v))]}
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="mvola" name="MVola" fill="#5ABCB9" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="orangeMoney" name="Orange Money" fill="#f97316" stackId="a" />
                <Bar dataKey="card" name="Card" fill="#0077B6" stackId="a" />
                <Bar dataKey="cod" name="COD" fill="#D0CCD0" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold font-display text-secondary-foreground mb-4">
            {t('Payment method share')}
          </h2>

          <div className="space-y-3">
            {[
              { name: 'MVola', key: 'mvola', color: '#5ABCB9' },
              { name: 'Orange Money', key: 'orangeMoney', color: '#f97316' },
              { name: 'Bank card', key: 'card', color: '#0077B6' },
              { name: 'Cash on delivery', key: 'cod', color: '#D0CCD0' }
            ].map(method => {
              const amount = paymentData.reduce((total, item) => {
                const value = item[method.key as keyof typeof item];
                return total + (typeof value === 'number' ? value : 0);
              }, 0);

              const pct = totalPaymentVolume > 0
                ? Math.round((amount / totalPaymentVolume) * 100)
                : 0;

              return (
                <div key={method.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: method.color }}
                      />
                      <span className="text-secondary-foreground">{method.name}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-secondary-foreground">{pct}%</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatPrice(amount)}
                      </span>
                    </div>
                  </div>

                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: method.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Utilisation de TableCard ici */}
      <div className="flex flex-col">
        <TableCard
          title={t('Transactions')}
          className="rounded-b-none border-b-0"
          data={transactions}
          columns={columns}
          rowKey={(item) => item.id}
          headerAction={
            <div className="flex flex-wrap items-center gap-2">
              {loadingTransactions && (
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
              )}
              <Select
                options={[
                  { value: 'all', label: t('All methods') },
                  { value: 'MVola', label: 'MVola' },
                  { value: 'Orange Money', label: 'Orange Money' },
                  { value: 'Card', label: 'Card' },
                  { value: 'COD', label: 'COD' }
                ]}
                value={methodFilter}
                onChange={e => handleMethodChange(e.target.value)}
                className="w-40"
              />
              <Select
                options={[
                  { value: '', label: t('All statuses') },
                  { value: 'completed', label: t('Completed') },
                  { value: 'pending', label: t('Pending') },
                  { value: 'failed', label: t('Failed') },
                  { value: 'refunded', label: t('Refunded') }
                ]}
                value={statusFilter}
                onChange={e => handleStatusChange(e.target.value)}
                className="w-40"
              />
            </div>
          }
        />

        {/* État vide pris en charge en dehors du tableau pour matcher le style original */}
        {transactions.length === 0 && !loadingTransactions && (
          <div className="bg-card border-x border-border py-10 text-center text-sm text-muted-foreground">
            {t('No transactions found')}
          </div>
        )}

        <div className="px-5 py-3 border border-border rounded-b-xl bg-secondary flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            {t('Showing')} {transactions.length} {t('transactions')}
          </span>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-muted-foreground">
              {t('Volume')}:{' '}
              <span className="font-bold text-secondary-foreground">
                {formatPrice(transactions.reduce((sum, transaction) => sum + transaction.amount, 0))}
              </span>
            </span>

            <span className="text-muted-foreground">
              {t('Commission')}:{' '}
              <span className="font-bold text-accent">
                {formatPrice(transactions.reduce((sum, transaction) => sum + transaction.commission, 0))}
              </span>
            </span>

            {totalPages > 1 && (
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(value => Math.max(1, value - 1))}
                  className="px-3 py-1 rounded border border-border bg-card disabled:opacity-50"
                >
                  {t('Previous')}
                </button>

                <span className="px-2 py-1">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(value => value + 1)}
                  className="px-3 py-1 rounded border border-border bg-card disabled:opacity-50"
                >
                  {t('Next')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}