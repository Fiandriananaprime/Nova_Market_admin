import { GetProductsResponse } from "../catalog/product";

export interface AdminGetProductsResponse extends GetProductsResponse {
  counts: {
    all: number;
    approved: number;
    pending: number;
    rejected: number;
  };
}

export interface AdminGetProductsQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: 'all' | 'approved' | 'pending' | 'rejected' | 'inactive';
  sortBy?: 'price' | 'status' | 'submitted';
  sortDirection?: 'asc' | 'desc';
}
