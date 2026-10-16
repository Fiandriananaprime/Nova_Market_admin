import {AdminGetProductsQueryParams, AdminGetProductsResponse} from "@/type/admin/product";
import { api } from "../axios";
import { Product, ProductModerationStatus } from "@/type/catalog/product";

export const getAdminProducts = async (params?: AdminGetProductsQueryParams): Promise<AdminGetProductsResponse> => {
    const response = await api.get<AdminGetProductsResponse>("/admin/products", { params });
    return response.data;
}

export const getAdminProductById = async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/admin/products/${encodeURIComponent(id)}`);
    return response.data;
}

export const updateProductStatus = async (
  id: string,
  status: Extract<ProductModerationStatus, 'approved' | 'rejected'>,
): Promise<Product> => {
    const response = await api.patch(`/admin/products/${encodeURIComponent(id)}/moderation`, { action: status });
    return response.data;
}