import { Address } from "../user"
import { PaginationMeta } from "../catalog/product";
export type paymentMethod = 'mvola' | 'orange_money' | 'card' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type deliveryMethod = 'standard' | 'express' | 'pickup';

export type OrderQueryParam = {
    search?: string,
    page?: number,
    limit?: number,
    status?: OrderStatus,
    paymentMethod?: paymentMethod,
    sortAmount?: 'asc' | 'desc',
    sortDate?: 'asc' | 'desc',
    deliveryStatus?: string,
    sellerId?: string,
    buyerId?: string,
    deliveryId?: string,
}
export interface OrderItem {
    productId: string,
    productName: string,
    image: string,
    price: number,
    qty: number,
    sellerId: string,
    sellerName: string
}
export interface OrderSeller {
    id: string,
    name: string
}
export interface TrackingPoint {
    id?: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
}
export interface Order {
    id: string,
    buyerId: string,
    buyerName: string,
    items: OrderItem[],
    sellers: OrderSeller[],
    subtotal: number,
    deliveryFee: number,
    total: number,
    status: OrderStatus,
    deliveryMethod: deliveryMethod,
    paymentMethod: paymentMethod,
    paymentStatus: PaymentStatus,
    address: Address
    tracking: TrackingPoint[],
    deliveryTracking?: DeliveryTracking;
    deliveryId?: string | null;
    estimatedDelivery: string,
    note?: string,
    createdAt: string
}

export interface DeliveryTracking {
    status: string;
    pendingReason?: string | null;
    currentLocation?: TrackingPoint | null;
    estimatedDelivery?: string | null;
    updatedAt: string;
    driver?: { id: string; name: string; phone?: string | null; vehicle?: string | null } | null;
    history?: TrackingPoint[];
    events?: Array<{ id?: string; status?: string; description?: string; timestamp?: string }>;
}

export interface OrderResponse {
    data : Order[],
    meta: PaginationMeta,
    counts: {
        all: number,
        pending: number,
        confirmed: number,
        processing: number,
        preparing: number,
        shipped: number,
        delivered: number,
        cancelled: number,
        totalPrice: number
    }
}

export interface OrderSellerDetails extends OrderSeller {
    avatarUrl?: string;
}

export interface OrderDetails extends Order {
    buyerAvatarUrl?: string;
    buyerPhone?: string,
    buyerEmail: string,
    sellers: OrderSellerDetails[];
}
