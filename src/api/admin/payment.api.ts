import { Transaction, PaymentsSummary, Promotion } from "@/type/admin/payment";
import { api } from "../axios"
import { PaginationMeta } from "@/type/catalog/product";
import { paymentMethod } from "@/type/admin/payment";

export const getTransactions = async ({
  page,
  limit,
  method,
  status,
}: {
  page?: number;
  limit?: number;
  method?: paymentMethod ;
  status?: "completed" | "pending" | "failed" | "refunded";
}) => {
  const response = await api.get<{
    data: Transaction[];
    meta: PaginationMeta;
  }>("/admin/payments/transactions", {
    params: {
      page,
      limit,
      method,
      status,
    },
  });

  return response.data;
};

export const getPaymentsSummary = async ({
  from,
  to,
}: {
  from?: string;
  to?: string;
}) => {
  const response = await api.get<PaymentsSummary>("/admin/payments/summary", {
    params: {
      from,
      to,
    },
  });

  return response.data;
};

export const refundTransaction = async (id: string, amount: number) => {
  const response = await api.post<Transaction>(
    `/admin/payments/transactions/${encodeURIComponent(id)}/refund`,
    { amount },
  );

  return response.data;
};

export const getAdminPromotions = async ({
  page,
  limit,
  status,
  search,
}: {
  page?: number;
  limit?: number;
  status?: "active" | "scheduled" | "inactive" | "expired";
  search?: string;
}) => {
  const response = await api.get<{
    data: Promotion[];
    meta: PaginationMeta;
  }>("/admin/promotions", {
    params: {
      page,
      limit,
      status,
      search,
    },
  });

  return response.data;
};

export const updateAdminPromotionStatus = async (
  id: string,
  status: "active" | "inactive",
): Promise<Promotion> => {
  const response = await api.patch<Promotion>(
    `/admin/promotions/${encodeURIComponent(id)}/status`,
    { status },
  );
  return response.data;
};
