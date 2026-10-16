import { PaginationMeta, Product, RatingCount } from '@/type/catalog/product';
import { baseApi } from '../axios';
import { Store, Review } from '@/type/catalog/store';
export type StarFilter ='all' | '1' | '2' | '3' | '4' | '5';

export const getAllSellers = async (): Promise<{data: Store[], meta: PaginationMeta}> => {
  const response = await baseApi.get('/stores');
  return response.data;
}
export const getSellerById = async (id: string): Promise<Store> => {
  const response = await baseApi.get<Store>(`/stores/${encodeURIComponent(id)}`);
    return response.data;
};

export const getSellerProducts = async (id: string, page?: number, limit?: number): Promise<{ data: Product[], meta:PaginationMeta}> => {
  const response = await baseApi.get(`/stores/${encodeURIComponent(id)}/products`, { params: { page, limit } });
  return response.data;
}

export const getSellerReviews = async (id: string, page:number, limit: number,rating: StarFilter): Promise<{ data: Review[], meta: PaginationMeta,counts:RatingCount }> => {
  const response = await baseApi.get(`/stores/${encodeURIComponent(id)}/reviews`, { params: { page, limit, rating } });
  return response.data;
}