export type AnalyticsPeriod = "today" | "7d" | "30d" | "3m" | "custom"

export type AnalyticsQuery = {
  period: AnalyticsPeriod

  from?: string

  to?: string
}

export type TopSellerAnalytics = {
  sellerId?: string

  sellerName?: string

  revenue?: number
}

export type TopCategoryAnalytics = {
  name?: string

  percentage?: number
}

export interface AnalyticsResponse {
  period?: string

  orders?: number

  revenue?: number

  buyers?: number

  sellers?: number

  products?: number

  deliveredOrders?: number

  cancelledOrders?: number

  lowStockProducts?: number

  pendingSellerApplications?: number

  pendingProductModeration?: number

  totalRevenue?: number

  totalOrders?: number

  totalBuyers?: number

  totalSellers?: number

  revenueSeries?: AdminRevenuePoint[]

  orderSeries?: AdminOrderSeries[]

  topSellers?: TopSellerAnalytics[]

  topCategories?: TopCategoryAnalytics[]
}

export type AdminRevenuePoint = {
  month?: string

  revenue?: number

  sellers?: number

  buyers?: number
}

export type AdminOrderSeries = {
  day?: string

  orders?: number

  sellers?: number

  buyers?: number
}
