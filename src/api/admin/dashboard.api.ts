import { api } from "../axios";
import { AdminDashboardResponse } from "@/type/admin/dashboard";
import { TopSeller } from "@/type/admin/seller";

export const getDashboardStats = async (): Promise<AdminDashboardResponse> => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};

export const getTopSeller = async (): Promise<{ data: TopSeller[] }> => {
  const response = await api.get("/admin/top-sellers");
  return response.data;
};