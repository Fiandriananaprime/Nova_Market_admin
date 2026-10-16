export type AdminMetrics = {
    totalRevenue: number;
    totalOrders: number;
    totalBuyers: number;
    totalSellers: number;
    totalProducts: number;
    pendingApplications: number;
    pendingProducts: number;
};

export type AdminTopProduct = {
    productId?: string;
    name?: string;
    storeName?: string;
    unitsSold?: number;
    revenue?: number;
};

export type AdminDashboardResponse = {
    metrics: AdminMetrics;
    revenueSeries: AdminDashboardRevenuePoint[];
    topProducts?: AdminTopProduct[];
};

export type AdminRevenue = {
    month: string;
    revenue: number;
    sellers: number;
    buyers: number;
};

export type AdminDashboardRevenuePoint = {
    day: string;
    revenue: number;
    sellers: number;
    buyers: number;
};
