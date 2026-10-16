export interface ProductSpecs {
  [key: string]: string;
}
export type RatingCount = {
  all: number;
  "1": number;
  "2": number;
  "3": number;
  "4": number;
  "5": number;
};

export type ProductStatus = 'active' | 'inactive';
export type ProductModerationStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type productStatus = ProductStatus | ProductModerationStatus;
export type productStatusDto = 'pending' | 'approved' | 'rejected';
export interface ProductVariant {
  name?: string;
  values?: string[];
}

export interface ProductImage {
  url: string;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand?: string | null;
  description?: string;
  price: number;
  rating?: number;
  reviewsCount?: number;
  storeId: string;
  storeName?: string;
  categoryId: string;
  categoryName?: string;
  lowStockThreshold?: number;
  images?: ProductImage[];
  stock: number;
  sku?: string;
  tags?: string[];
  specs?: ProductSpecs;
  variants?: ProductVariant[];
  status?: ProductStatus;
  moderationStatus?: ProductModerationStatus;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  soldCount?: number;
  wishlistCount?: number;
}

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total: number;
  totalPages: number;
}

export interface GetProductsResponse {
  data: Product[];
  meta: PaginationMeta;
}

export interface GetProductsQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  category?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  onSale?: boolean;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
}