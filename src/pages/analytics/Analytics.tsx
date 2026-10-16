import { useEffect, useState } from "react"

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  PackageSearch,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react"

import { Link } from "react-router"

import { formatMillionAr, formatPrice } from "@/hook/format"

import { useTranslation } from "react-i18next"

import { useToast } from "@/contexts/ToastContext"

import { getApiErrorMessage } from "@/api/errorMessage"
import { getAnalytics } from "@/api/admin/analytics.api"
import { getDashboardStats } from "@/api/admin/dashboard.api"
import { getAdminProductById } from "@/api/admin/product.api"

import type { AnalyticsPeriod, AnalyticsResponse } from "@/type/admin/Analytics"
import type { AdminTopProduct } from "@/type/admin/dashboard"
const dateFilters: {
  label: string
  value: AnalyticsPeriod
}[] = [
  { label: "Today", value: "today" },

  { label: "Last 7 days", value: "7d" },

  { label: "Last 30 days", value: "30d" },

  { label: "Last 3 months", value: "3m" },

  { label: "Custom range", value: "custom" },
]

const chartTooltipStyle = {
  background: "var(--card)",

  border: "1px solid var(--border)",

  borderRadius: "12px",

  color: "var(--foreground)",

  fontSize: "12px",
}

function formatCount(value: number | undefined, locale: string) {
  return value == null ? "—" : new Intl.NumberFormat(locale).format(value)
}

function formatPercent(value: number | undefined, locale: string) {
  return value == null || !Number.isFinite(value)
    ? "—"
    : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`
}

function formatDateTick(value: string, locale: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
      }).format(date)
}

function getMonthKey(value: string | undefined) {
  if (!value) return undefined

  const isoMonth = value.match(/^(\d{4})-(\d{1,2})/)
  if (isoMonth) return `${isoMonth[1]}-${isoMonth[2].padStart(2, "0")}`

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? undefined
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function formatMonthTick(value: string, locale: string) {
  const month = getMonthKey(value)
  if (!month) return value

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "2-digit",
  }).format(new Date(`${month}-01T00:00:00`))
}

function formatProductDate(value: string | undefined, locale: string) {
  if (!value) return "—"

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date)
}

type TopProductReport = AdminTopProduct & { createdAt?: string }

function MetricCard({
  label,

  value,

  helper,

  icon: Icon,

  accent,
}: {
  label: string

  value: string

  helper: string

  icon: typeof DollarSign

  accent: string
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 truncate font-display text-2xl font-bold tracking-tight text-secondary-foreground sm:text-3xl">
            {value}
          </p>
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            color: accent,
            backgroundColor: `color-mix(in srgb, ${accent} 13%, transparent)`,
          }}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{helper}</p>
    </article>
  )
}

function SectionHeading({
  eyebrow,

  title,

  description,
}: {
  eyebrow: string

  title: string

  description?: string
}) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-lg font-bold text-secondary-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

function ChartEmptyState({ label }: { label: string }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border px-5 text-center">
      <Activity
        className="mb-3 h-5 w-5 text-muted-foreground"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-secondary-foreground">
        {t("No data available")}
      </p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function DataTable<T extends object>({
  label,

  data,

  columns,
}: {
  label: string

  data: T[]

  columns: {
    key: keyof T
    label: string
    format?: (value: unknown) => string
  }[]
}) {
  const { t } = useTranslation()

  if (data.length === 0) return null

  return (
    <details className="mt-3 border-t border-border pt-3">
      <summary className="w-fit cursor-pointer rounded text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        {t("View data table")} — {label}
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className="px-2 py-2 font-semibold"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className="border-b border-border/70 last:border-0"
              >
                {columns.map((column) => {
                  const value = row[column.key]

                  return (
                    <td
                      key={String(column.key)}
                      className="px-2 py-2 text-secondary-foreground"
                    >
                      {column.format
                        ? column.format(value)
                        : String(value ?? "—")}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)

  const [loading, setLoading] = useState(true)

  const [loadError, setLoadError] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  const [period, setPeriod] = useState<AnalyticsPeriod>("30d")

  const [fromDate, setFromDate] = useState("")

  const [toDate, setToDate] = useState("")

  const [topProducts, setTopProducts] = useState<TopProductReport[]>([])

  const [topProductsLoading, setTopProductsLoading] = useState(true)

  const [topProductsError, setTopProductsError] = useState(false)

  const [productDatesIncomplete, setProductDatesIncomplete] = useState(false)

  const { toast } = useToast()

  const { t, i18n } = useTranslation()

  const locale = i18n.language || "fr-MG"

  const invalidRange = Boolean(fromDate && toDate && fromDate > toDate)

  const missingCustomDates = period === "custom" && (!fromDate || !toDate)

  useEffect(() => {
    if (period === "custom" && (!fromDate || !toDate || fromDate > toDate)) {
      setLoading(false)

      setLoadError(false)

      return
    }

    let active = true

    const fetchData = async () => {
      setLoading(true)

      setLoadError(false)

      setData(null)

      try {
        const response = await getAnalytics({
          period,

          ...(period === "custom" && { from: fromDate, to: toDate }),
        })

        if (active) setData(response)
      } catch (error) {
        if (active) {
          setLoadError(true)

          toast(
            getApiErrorMessage(error, "Error while fetching analytics"),
            "error",
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchData()

    return () => {
      active = false
    }
  }, [period, fromDate, toDate, refreshKey, toast])

  useEffect(() => {
    let active = true

    const fetchTopProducts = async () => {
      setTopProductsLoading(true)
      setTopProductsError(false)
      setProductDatesIncomplete(false)

      try {
        const dashboard = await getDashboardStats()
        const products = (dashboard.topProducts ?? []).slice(0, 5)
        const productDetails = await Promise.allSettled(
          products.map((product) =>
            product.productId
              ? getAdminProductById(product.productId)
              : Promise.resolve(null),
          ),
        )

        if (!active) return

        const enrichedProducts = products.map((product, index) => {
          const result = productDetails[index]
          const detail =
            result?.status === "fulfilled" ? result.value : null

          return {
            ...product,
            createdAt: detail?.createdAt,
          }
        })
        const hasMissingDates = productDetails.some(
          (result) => {
            if (result.status === "rejected" || !result.value?.createdAt) {
              return true
            }

            return Number.isNaN(new Date(result.value.createdAt).getTime())
          },
        )

        setTopProducts(enrichedProducts)
        setProductDatesIncomplete(hasMissingDates)
      } catch (error) {
        if (active) {
          setTopProductsError(true)
          setTopProducts([])
          toast(
            getApiErrorMessage(error, "Error while fetching top products"),
            "error",
          )
        }
      } finally {
        if (active) setTopProductsLoading(false)
      }
    }

    void fetchTopProducts()

    return () => {
      active = false
    }
  }, [refreshKey, toast])

  const handlePeriodChange = (value: AnalyticsPeriod) => {
    setPeriod(value)

    if (value !== "custom") {
      setFromDate("")

      setToDate("")
    }
  }

  const revenueSeries = data?.revenueSeries ?? []

  const orderSeries = data?.orderSeries ?? []

  const topSellers = [...(data?.topSellers ?? [])]

    .filter((seller) => seller.sellerName || seller.sellerId)

    .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))

    .slice(0, 5)

  const categories = [...(data?.topCategories ?? [])]

    .filter((category) => category.name)

    .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))

    .slice(0, 6)

  const topProductsByRevenue = [...topProducts]
    .filter((product) => product.name || product.productId)
    .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
    .map((product, index) => ({
      ...product,
      productName:
        product.name || product.productId || `${t("Product")} ${index + 1}`,
    }))
  const productCreationData = topProductsByRevenue
    .flatMap((product) => {
      if (!product.createdAt) return []

      const createdTimestamp = new Date(product.createdAt).getTime()
      if (!Number.isFinite(createdTimestamp)) return []

      return [
        {
          ...product,
          createdTimestamp,
          unitsSold: product.unitsSold ?? 0,
        },
      ]
    })
    .map((product, index) => ({
      ...product,
      productRank: index + 1,
    }))

  const monthlyTrendMap = new Map<
    string,
    {
      month: string
      revenue?: number
      buyers?: number
      sellers?: number
      orders?: number
    }
  >()
  for (const point of revenueSeries) {
    const month = getMonthKey(point.month)
    if (!month) continue

    monthlyTrendMap.set(month, {
      month,
      revenue: point.revenue,
      buyers: point.buyers,
      sellers: point.sellers,
      orders: 0,
    })
  }
  for (const point of orderSeries) {
    const month = getMonthKey(point.day)
    if (!month) continue

    const current = monthlyTrendMap.get(month) ?? { month }
    current.orders = (current.orders ?? 0) + (point.orders ?? 0)
    monthlyTrendMap.set(month, current)
  }
  const monthlyTrend = [...monthlyTrendMap.values()].sort((a, b) =>
    a.month.localeCompare(b.month),
  )

  const deliveredRate =
    data?.deliveredOrders != null && data.orders != null && data.orders > 0
      ? (data.deliveredOrders / data.orders) * 100
      : undefined

  const cancelledRate =
    data?.cancelledOrders != null && data.orders != null && data.orders > 0
      ? (data.cancelledOrders / data.orders) * 100
      : undefined

  const exportReport = () => {
    if (!data) return

    const rows: (string | number | undefined)[][] = [
      [t("Section"), t("Metric"), t("Value")],

      [
        t("Overview"),
        t("Period"),
        period === "custom"
          ? `${fromDate} - ${toDate}`
          : t(
              dateFilters.find((filter) => filter.value === period)?.label ??
                "Last 30 days",
            ),
      ],

      [t("Overview"), t("Revenue"), data.revenue ?? data.totalRevenue],

      [t("Overview"), t("Orders"), data.orders ?? data.totalOrders],

      [t("Overview"), t("Buyers"), data.buyers ?? data.totalBuyers],

      [t("Overview"), t("Sellers"), data.sellers ?? data.totalSellers],

      [t("Orders"), t("Delivered orders"), data.deliveredOrders],

      [t("Orders"), t("Cancelled orders"), data.cancelledOrders],

      [t("Operations"), t("Low stock products"), data.lowStockProducts],

      [
        t("Operations"),
        t("Pending seller applications"),
        data.pendingSellerApplications,
      ],

      [
        t("Operations"),
        t("Products awaiting moderation"),
        data.pendingProductModeration,
      ],

      [t("Platform totals"), t("Total revenue"), data.totalRevenue],

      [t("Platform totals"), t("Total orders"), data.totalOrders],

      [t("Platform totals"), t("Total buyers"), data.totalBuyers],

      [t("Platform totals"), t("Total sellers"), data.totalSellers],

      ...revenueSeries.map((point) => [
        t("Monthly revenue"),
        point.month,
        point.revenue,
      ]),

      ...orderSeries.map((point) => [
        t("Daily activity"),
        point.day,
        point.orders,
      ]),

      ...topSellers.map((seller) => [
        t("Top sellers"),
        seller.sellerName ?? seller.sellerId,
        seller.revenue,
      ]),

      ...categories.map((category) => [
        t("Category share"),
        category.name,
        category.percentage,
      ]),
      ...topProductsByRevenue.map((product) => [
        t("Top products"),
        `${product.name ?? product.productId} | ${t("Created at")}: ${product.createdAt ?? ""} | ${t("Units sold")}: ${product.unitsSold ?? ""}`,
        product.revenue,
      ]),
    ]

    const csv = `\uFEFF${rows

      .map((row) =>
        row

          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)

          .join(","),
      )

      .join("\r\n")}`

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    )

    const anchor = document.createElement("a")

    anchor.href = url

    anchor.download = `novamarket-report-${
      period === "custom" ? `${fromDate}-to-${toDate}` : period
    }.csv`

    document.body.appendChild(anchor)

    anchor.click()

    anchor.remove()

    URL.revokeObjectURL(url)
  }

  const metrics = [
    {
      label: t("Revenue"),

      value:
        data?.revenue != null || data?.totalRevenue != null
          ? formatMillionAr(data.revenue ?? data.totalRevenue ?? 0)
          : "—",

      helper:
        data?.revenue != null ? t("Selected period") : t("Platform total"),

      icon: DollarSign,

      accent: "var(--primary)",
    },

    {
      label: t("Orders"),

      value: formatCount(data?.orders ?? data?.totalOrders, locale),

      helper: data?.orders != null ? t("Selected period") : t("Platform total"),

      icon: ShoppingBag,

      accent: "#9a6700",
    },

    {
      label: t("Buyers"),

      value: formatCount(data?.buyers ?? data?.totalBuyers, locale),

      helper: data?.buyers != null ? t("Selected period") : t("Platform total"),

      icon: Users,

      accent: "#4f80b8",
    },

    {
      label: t("Sellers"),

      value: formatCount(data?.sellers ?? data?.totalSellers, locale),

      helper:
        data?.sellers != null ? t("Selected period") : t("Platform total"),

      icon: Store,

      accent: "#7662a8",
    },
  ]

  return (
    <div className="mx-auto max-w-[1480px] space-y-7 pb-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-secondary-foreground sm:text-3xl">
              {t("Platform reports")}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              {t("Overview")}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t(
              "Understand marketplace performance, trends and operational workload.",
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            disabled={loading || missingCustomDates || invalidRange}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {t("Refresh")}
          </button>
          <button
            type="button"
            onClick={exportReport}
            disabled={!data || loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
            {t("Export CSV")}
          </button>
        </div>
      </header>

      <section
        aria-label={t("Report period")}
        className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("Report period")}
          </div>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={t("Choose a report period")}
          >
            {dateFilters.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                onClick={() => handlePeriodChange(value)}
                className={`min-h-10 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  period === value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                }`}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        {period === "custom" && (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="report-from-date"
                className="mb-1.5 block text-xs font-semibold text-secondary-foreground"
              >
                {t("From")}
              </label>
              <input
                id="report-from-date"
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>
            <div>
              <label
                htmlFor="report-to-date"
                className="mb-1.5 block text-xs font-semibold text-secondary-foreground"
              >
                {t("To")}
              </label>
              <input
                id="report-to-date"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>
            {(invalidRange || missingCustomDates) && (
              <p
                className="text-sm text-destructive sm:col-span-2"
                role="status"
              >
                {invalidRange
                  ? t("The start date must be before the end date.")
                  : t("Choose both dates to load the report.")}
              </p>
            )}
          </div>
        )}
      </section>

      {loading && data && (
        <p
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
          role="status"
        >
          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          {t("Updating report...")}
        </p>
      )}

      {loadError && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div>
            <p className="text-sm font-semibold text-secondary-foreground">
              {t("Report could not be loaded")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Check your connection and try again.")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            disabled={loading || missingCustomDates || invalidRange}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("Try again")}
          </button>
        </div>
      )}

      {loading && !data ? (
        <div
          className="space-y-6"
          aria-busy="true"
          aria-label={t("Loading analytics")}
        >
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
            <div className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
          </div>
        </div>
      ) : data && !missingCustomDates && !invalidRange ? (
        <div className="space-y-7">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <SectionHeading
              eyebrow={t("Revenue")}
              title={t("Revenue and growth")}
              description={t("Monthly revenue and marketplace growth.")}
            />
            {monthlyTrend.length === 0 ? (
              <ChartEmptyState
                label={t(
                  "Revenue and growth data will appear here when available for this period.",
                )}
              />
            ) : (
              <>
                <div
                  className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground"
                  aria-label={t("Chart legend")}
                >
                  {[
                    [t("Revenue"), "var(--primary)"],
                    [t("Buyers"), "#4f80b8"],
                    [t("Sellers"), "#7662a8"],
                    [t("Orders"), "#9a6700"],
                  ].map(([label, color]) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      {label}
                    </span>
                  ))}
                </div>
                <div
                  role="img"
                  aria-label={t(
                    "Revenue, buyer, seller and order growth by month. Revenue uses the left scale and counts use the right scale. See the data table below for exact values.",
                  )}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart
                      data={monthlyTrend}
                      margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="report-revenue-fill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--primary)"
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--primary)"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="var(--border)"
                        strokeDasharray="3 5"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(value: string) =>
                          formatMonthTick(value, locale)
                        }
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={18}
                      />
                      <YAxis
                        yAxisId="revenue"
                        width={60}
                        tickFormatter={(value: number) =>
                          `${(value / 1_000_000).toFixed(0)}M`
                        }
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="volume"
                        orientation="right"
                        allowDecimals={false}
                        width={38}
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          name === t("Revenue")
                            ? formatPrice(Number(value ?? 0))
                            : formatCount(Number(value ?? 0), locale),
                          String(name),
                        ]}
                        labelFormatter={(value) =>
                          formatMonthTick(String(value), locale)
                        }
                        contentStyle={chartTooltipStyle}
                      />
                      <Area
                        yAxisId="revenue"
                        type="monotone"
                        dataKey="revenue"
                        name={t("Revenue")}
                        stroke="var(--primary)"
                        strokeWidth={3.5}
                        fill="url(#report-revenue-fill)"
                        activeDot={{
                          r: 6,
                          strokeWidth: 2,
                          stroke: "var(--card)",
                        }}
                        connectNulls
                      />
                      <Line
                        yAxisId="volume"
                        type="monotone"
                        dataKey="buyers"
                        name={t("Buyers")}
                        stroke="#4f80b8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                      <Line
                        yAxisId="volume"
                        type="monotone"
                        dataKey="sellers"
                        name={t("Sellers")}
                        stroke="#7662a8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                      <Line
                        yAxisId="volume"
                        type="monotone"
                        dataKey="orders"
                        name={t("Orders")}
                        stroke="#9a6700"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={false}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
            <DataTable
              label={t("Revenue and growth")}
              data={monthlyTrend}
              columns={[
                {
                  key: "month",
                  label: t("Month"),
                  format: (value) =>
                    formatMonthTick(String(value ?? ""), locale),
                },
                {
                  key: "revenue",
                  label: t("Revenue"),
                  format: (value) =>
                    value == null ? "—" : formatPrice(Number(value)),
                },
                {
                  key: "buyers",
                  label: t("Buyers"),
                  format: (value) =>
                    formatCount(
                      value == null ? undefined : Number(value),
                      locale,
                    ),
                },
                {
                  key: "sellers",
                  label: t("Sellers"),
                  format: (value) =>
                    formatCount(
                      value == null ? undefined : Number(value),
                      locale,
                    ),
                },
                {
                  key: "orders",
                  label: t("Orders"),
                  format: (value) =>
                    formatCount(
                      value == null ? undefined : Number(value),
                      locale,
                    ),
                },
              ]}
            />
          </section>

          <section
            aria-label={t("Key metrics")}
            className="grid grid-cols-2 gap-3 xl:grid-cols-4"
          >
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <SectionHeading
                eyebrow={t("Product performance")}
                title={t("Top products by creation date")}
                description={t("Top products positioned by their creation date.")}
              />
              {topProductsLoading ? (
                <div
                  className="h-56 animate-pulse rounded-xl border border-border bg-secondary/50"
                  aria-busy="true"
                  aria-label={t("Loading top products")}
                />
              ) : topProductsError ? (
                <ChartEmptyState
                  label={t("Top products could not be loaded. Refresh to try again.")}
                />
              ) : productCreationData.length === 0 ? (
                <ChartEmptyState
                  label={
                    topProducts.length === 0
                      ? t("No top products are available for this report.")
                      : t("Product creation dates will appear here when available.")
                  }
                />
              ) : (
                <div
                  role="img"
                  aria-label={t(
                    "Top products placed by creation date. The table below includes sales and revenue.",
                  )}
                >
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(220, productCreationData.length * 42)}
                  >
                    <ScatterChart
                      data={productCreationData}
                      margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid
                        stroke="var(--border)"
                        strokeDasharray="3 5"
                        vertical={false}
                      />
                      <XAxis
                        type="number"
                        dataKey="createdTimestamp"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(value: number) =>
                          formatDateTick(new Date(value).toISOString(), locale)
                        }
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={18}
                      />
                      <YAxis
                        type="number"
                        dataKey="productRank"
                        domain={[1, Math.max(productCreationData.length, 1)]}
                        ticks={productCreationData.map(
                          (_, index) => index + 1,
                        )}
                        tickFormatter={(value: number) =>
                          productCreationData[value - 1]?.productName ?? ""
                        }
                        tick={{
                          fontSize: 10,
                          fill: "var(--muted-foreground)",
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={110}
                        reversed
                        allowDecimals={false}
                      />
                      <Tooltip
                        formatter={(value) => [
                          t("Top product rank {{rank}}", { rank: value }),
                          t("Top products"),
                        ]}
                        labelFormatter={(value) =>
                          formatDateTick(
                            new Date(Number(value)).toISOString(),
                            locale,
                          )
                        }
                        contentStyle={chartTooltipStyle}
                      />
                      <Scatter
                        name={t("Top products")}
                        data={productCreationData}
                        dataKey="productRank"
                        fill="var(--primary)"
                        shape="circle"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
              {productDatesIncomplete && (
                <p
                  className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-secondary-foreground"
                  role="status"
                >
                  {t(
                    "Some product creation dates could not be loaded. Those products are omitted from the chart.",
                  )}
                </p>
              )}
              {topProductsByRevenue.length > 0 && (
                <div className="mt-4 overflow-x-auto border-t border-border pt-3">
                  <table className="w-full min-w-[620px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th scope="col" className="px-2 py-2 font-semibold">
                          #
                        </th>
                        <th scope="col" className="px-2 py-2 font-semibold">
                          {t("Product")}
                        </th>
                        <th scope="col" className="px-2 py-2 font-semibold">
                          {t("Created at")}
                        </th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold">
                          {t("Units sold")}
                        </th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold">
                          {t("Revenue")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductsByRevenue.map((product, index) => (
                        <tr
                          key={product.productId ?? `${product.name}-${index}`}
                          className="border-b border-border/70 last:border-0"
                        >
                          <td className="px-2 py-2 font-semibold text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="px-2 py-2">
                            <p className="font-medium text-secondary-foreground">
                              {product.name || t("Unknown product")}
                            </p>
                            <p className="mt-0.5 text-muted-foreground">
                              {product.storeName || "—"}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-secondary-foreground">
                            {formatProductDate(product.createdAt, locale)}
                          </td>
                          <td className="px-2 py-2 text-right text-secondary-foreground">
                            {formatCount(product.unitsSold, locale)}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-right font-semibold text-secondary-foreground">
                            {product.revenue == null
                              ? "—"
                              : formatMillionAr(product.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <SectionHeading
                eyebrow={t("Order activity")}
                title={t("Marketplace activity")}
                description={t("Daily orders, buyers and sellers.")}
              />
              {orderSeries.length === 0 ? (
                <ChartEmptyState
                  label={t(
                    "Activity data will appear here when available for this period.",
                  )}
                />
              ) : (
                <>
                  <div
                    className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground"
                    aria-label={t("Chart legend")}
                  >
                    {[
                      [t("Orders"), "var(--primary)"],

                      [t("Buyers"), "#4f80b8"],

                      [t("Sellers"), "#9a6700"],
                    ].map(([label, color]) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-2"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        {label}
                      </span>
                    ))}
                  </div>
                  <div
                    role="img"
                    aria-label={t(
                      "Daily orders, buyers and sellers chart. See the data table below for exact values.",
                    )}
                  >
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart
                        data={orderSeries}
                        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="var(--border)"
                          strokeDasharray="3 5"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="day"
                          tickFormatter={(value: string) =>
                            formatDateTick(value, locale)
                          }
                          tick={{
                            fontSize: 10,
                            fill: "var(--muted-foreground)",
                          }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={20}
                        />
                        <YAxis
                          allowDecimals={false}
                          width={44}
                          tick={{
                            fontSize: 10,
                            fill: "var(--muted-foreground)",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          labelFormatter={(value) =>
                            formatDateTick(String(value), locale)
                          }
                          contentStyle={chartTooltipStyle}
                        />
                        <Line
                          type="monotone"
                          dataKey="orders"
                          name={t("Orders")}
                          stroke="var(--primary)"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="buyers"
                          name={t("Buyers")}
                          stroke="#4f80b8"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="sellers"
                          name={t("Sellers")}
                          stroke="#9a6700"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
              <DataTable
                label={t("Marketplace activity")}
                data={orderSeries}
                columns={[
                  {
                    key: "day",
                    label: t("Day"),
                    format: (value) =>
                      formatDateTick(String(value ?? ""), locale),
                  },

                  {
                    key: "orders",
                    label: t("Orders"),
                    format: (value) =>
                      formatCount(
                        value == null ? undefined : Number(value),
                        locale,
                      ),
                  },

                  {
                    key: "buyers",
                    label: t("Buyers"),
                    format: (value) =>
                      formatCount(
                        value == null ? undefined : Number(value),
                        locale,
                      ),
                  },

                  {
                    key: "sellers",
                    label: t("Sellers"),
                    format: (value) =>
                      formatCount(
                        value == null ? undefined : Number(value),
                        locale,
                      ),
                  },
                ]}
              />
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <SectionHeading
                eyebrow={t("Marketplace")}
                title={t("Top sellers")}
                description={t("Ranked by revenue in the selected report.")}
              />
              {topSellers.length === 0 ? (
                <ChartEmptyState
                  label={t(
                    "Seller rankings will appear here when report data is available.",
                  )}
                />
              ) : (
                <ol className="space-y-4">
                  {topSellers.map((seller, index) => {
                    const maxRevenue = Math.max(
                      ...topSellers.map((item) => item.revenue ?? 0),
                      1,
                    )

                    return (
                      <li
                        key={seller.sellerId ?? `${seller.sellerName}-${index}`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-2 font-medium text-secondary-foreground">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary text-[11px] font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                            <span className="truncate">
                              {seller.sellerName || t("Unknown seller")}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-secondary-foreground">
                            {seller.revenue == null
                              ? "—"
                              : formatMillionAr(seller.revenue)}
                          </span>
                        </div>
                        <div
                          className="h-2 overflow-hidden rounded-full bg-secondary"
                          role="progressbar"
                          aria-label={t("Revenue share for {{seller}}", {
                            seller: seller.sellerName || t("Unknown seller"),
                          })}
                          aria-valuemin={0}
                          aria-valuemax={maxRevenue}
                          aria-valuenow={seller.revenue ?? 0}
                        >
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                            style={{
                              width: `${Math.max(0, Math.min(100, ((seller.revenue ?? 0) / maxRevenue) * 100))}%`,
                            }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </article>

            <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <SectionHeading
                eyebrow={t("Marketplace")}
                title={t("Category share")}
                description={t("Share of sales across the leading categories.")}
              />
              {categories.length === 0 ? (
                <ChartEmptyState
                  label={t(
                    "Category breakdown will appear here when report data is available.",
                  )}
                />
              ) : (
                <ul className="space-y-4">
                  {categories.map((category, index) => {
                    const colors = [
                      "var(--primary)",
                      "#4f80b8",
                      "#9a6700",
                      "#7662a8",
                      "#4a9b82",
                      "#d27658",
                    ]

                    const percentage = Math.max(
                      0,
                      Math.min(100, category.percentage ?? 0),
                    )

                    return (
                      <li key={`${category.name}-${index}`}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium text-secondary-foreground">
                            {category.name}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-secondary-foreground">
                            {formatPercent(category.percentage, locale)}
                          </span>
                        </div>
                        <div
                          className="h-2 overflow-hidden rounded-full bg-secondary"
                          role="progressbar"
                          aria-label={t("Category share for {{category}}", {
                            category: category.name,
                          })}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={percentage}
                        >
                          <div
                            className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colors[index % colors.length],
                            }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </article>
          </section>

          <section>
            <SectionHeading
              eyebrow={t("Operations")}
              title={t("Operational health")}
              description={t(
                "Delivery outcomes and queues that may need admin attention.",
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("Delivered orders")}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-secondary-foreground">
                      {formatCount(data.deliveredOrders, locale)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("Delivery rate")}:{" "}
                      {formatPercent(deliveredRate, locale)}
                    </p>
                  </div>
                  <CheckCircle2
                    className="h-5 w-5 text-primary"
                    aria-hidden="true"
                  />
                </div>
              </article>
              <article className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("Cancelled orders")}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-secondary-foreground">
                      {formatCount(data.cancelledOrders, locale)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("Cancellation rate")}:{" "}
                      {formatPercent(cancelledRate, locale)}
                    </p>
                  </div>
                  <ShieldAlert
                    className="h-5 w-5 text-amber-600"
                    aria-hidden="true"
                  />
                </div>
              </article>
              <OperationalQueue
                label={t("Low stock products")}
                value={data.lowStockProducts}
                icon={PackageSearch}
                href="/admin/products"
                action={t("Review products")}
                locale={locale}
              />
              <OperationalQueue
                label={t("Pending seller applications")}
                value={data.pendingSellerApplications}
                icon={Store}
                href="/admin/sellers/applications"
                action={t("Review applications")}
                locale={locale}
              />
              <OperationalQueue
                label={t("Products awaiting moderation")}
                value={data.pendingProductModeration}
                icon={ClipboardCheck}
                href="/admin/products"
                action={t("Review products")}
                locale={locale}
              />
            </div>
          </section>
        </div>
      ) : !loading && !loadError && !missingCustomDates && !invalidRange ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center">
          <Activity
            className="mx-auto h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 font-semibold text-secondary-foreground">
            {t("No report data yet")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Try another date range to view marketplace analytics.")}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function OperationalQueue({
  label,

  value,

  icon: Icon,

  href,

  action,

  locale,
}: {
  label: string

  value: number | undefined

  icon: typeof PackageSearch

  href: string

  action: string

  locale: string
}) {
  const { t } = useTranslation()

  const hasItems = (value ?? 0) > 0

  return (
    <article
      className={`rounded-xl border p-4 ${
        hasItems
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-secondary-foreground">
            {formatCount(value, locale)}
          </p>
        </div>
        <Icon
          className={`h-5 w-5 ${
            hasItems ? "text-amber-700" : "text-muted-foreground"
          }`}
          aria-hidden="true"
        />
      </div>
      <Link
        to={href}
        className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {action}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">{t("for {{queue}}", { queue: label })}</span>
      </Link>
    </article>
  )
}
