import { api } from "../axios";
import { OrderResponse, OrderQueryParam, Order, OrderDetails, DeliveryTracking } from "@/type/order/order";
import { getUserById } from "./user.api";
import { getSellerById } from "./store..public.api";

export const getOrder = async (params: OrderQueryParam): Promise<OrderResponse> => {
    const response = await api.get("/admin/orders" ,{params});
    return response.data
}

export const getOrderById = async (id:string): Promise<Order> => {
    const response = await api.get(`/admin/orders/${id}`)
    return response.data
}

export const getOrderTracking = async (id: string): Promise<DeliveryTracking> => {
    const response = await api.get(`/admin/orders/${encodeURIComponent(id)}/tracking`);
    return response.data;
}

export const getOrderDetailsById = async (
  id: string
): Promise<OrderDetails> => {
  const order = await getOrderById(id);

  const buyer = await getUserById(order.buyerId);

  const sellers = await Promise.all(
    order.sellers.map(async (seller) => {
      const sellerDetails = await getSellerById(seller.id);

      return {
        id:sellerDetails.id,
        name:sellerDetails.name,
        avatarUrl: sellerDetails.logoUrl ?? undefined,
      };
    })
  );

  return {
    ...order,
    buyerEmail: buyer.email,
    buyerPhone: buyer.phone ?? undefined,
    buyerAvatarUrl: buyer.avatarUrl ?? undefined,
    sellers,
  };
};
