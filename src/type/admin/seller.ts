import { PaginationMeta } from "../catalog/product";
import { OrderStatus } from "../order/order";
export type SellerApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface SellerApplication {
  id: string;
  applicantUserId: string;
  status: SellerApplicationStatus;
  submittedAt: string | null;
  store?: {
    name?: string | null;
    location?: string | null;
    businessType?: 'individual' | 'company' | null;
    taxId?: string | null;
    registrationNumber?: string | null;
  };
  comments?: string | null;
  rejectionReason?: string | null;
}

export interface SellerApplicationResponse {
  data: SellerApplication[];
  meta: PaginationMeta;
}

export interface SellerApplicationSummary {
  id: string;
  applicantUserId: string;
  status: SellerApplicationStatus;
  submittedAt: string | null;
  store?: SellerApplication['store'];
}

export interface SellerApplicationListResponse {
  data: SellerApplicationSummary[];
  meta: PaginationMeta;
  counts: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface TopSeller {
  id: string;
  name: string;
  location: string | null;
  category: string | null;
  logoUrl: string | null;
  status: 'active' | 'suspended';
  revenue: number;
  ordersCount: number;
  rating: number;
}

export interface StoreAdmin {
  id: string;
  userId: string;
  name: string;
  logo: string | null;
  cover: string | null;
  verified: boolean;
  rating: number;
  productsCount: number;
  productIds: string[];
  location: string;
  joinedYear: number;
  followersCount: number;
  description: string;
  owner?: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    status: 'active' | 'suspended';
    avatarUrl?: string | null;
    storesCount?: number;
  };
  reviewsCount: number;
  annualRevenue: number;
  orders: Array<{
    id: string;
    buyerId: string;
    buyerName: string;
    total: number;
    storeTotal: number;
    itemsCount: number;
    status: OrderStatus;
    createdAt: string;
  }>;
}