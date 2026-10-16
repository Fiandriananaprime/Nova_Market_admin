
export type paymentMethod = 'mvola' | 'orange_money' | 'card' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'refunded';

export interface Transaction {
    id: string,
    orderId: string,
    buyerName:string,
    sellerName: string,
    amount: number,
    method: paymentMethod,
    commission: number,
    status: TransactionStatus,
    date: string
}

export interface PaymentsSummary {
  totalVolume: number;
  totalCommission: number;

  seriesByMonth: Array<{
    month: string;
    mvola: number;
    orangeMoney: number;
    card: number;
    cod: number;
  }>;
}

export interface Promotion {
    id:string,
    storeId:string,
    storeName:string,
    name:string,
    type: PromotionType,
    discount:number,
    productIds:string[],
    productsCount: number,
    startDate:string,
    endDate:string,
    status: PromotionStatus,
    code?: string | null,
    minimumOrderAmount?: number | null,
    maximumDiscount?: number | null,
    usageLimit?: number | null,
    usedCount?: number,
    isAutomatic?: boolean,
}

export type PromotionStatus = 'active' | 'scheduled' | 'inactive' | 'expired'
export type PromotionType= 'percentage' | 'fixed';
