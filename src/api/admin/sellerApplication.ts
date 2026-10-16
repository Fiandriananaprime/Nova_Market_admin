import { api } from "../axios";
import {
  SellerApplication,
  SellerApplicationListResponse,
  SellerApplicationStatus,
} from "@/type/admin/seller";

type SellerApplicationQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: SellerApplicationStatus;
};

type UpdateSellerApplicationStatusParams = {
  action: 'approved' | 'rejected';
  reason?: string;
};
export const getSellerApplications = async (params: SellerApplicationQueryParams): Promise<SellerApplicationListResponse> => {
    const response = await api.get("/admin/sellers/applications", { params });
    return response.data;
}

export const getSellerApplicationById = async (id: string): Promise<SellerApplication> => {
    const response = await api.get<SellerApplication>(
      `/admin/sellers/applications/${encodeURIComponent(id)}`
    );
    return response.data;
}

export const updateSellerApplicationStatus = async (id: string, { action, reason }: UpdateSellerApplicationStatusParams): Promise<SellerApplication> => {
  const response = await api.patch<SellerApplication>(
    `/admin/sellers/applications/${encodeURIComponent(id)}`,
    { action, reason }
  );
  return response.data;
}