import { StoreAdmin } from "./admin/seller";

export type UserRole = "admin" | "seller" | "buyer";

export type status = "active" | "suspended";

export interface Address{
    id: string;
    label: string;
    recipientName?: string;
    street?: string;
    district?: string;
    city: string;
    region?: string;
    postalCode?: string | null;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    instructions?: string | null;
    isDefault: boolean;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    role: UserRole;
    status: status;
    avatarUrl?: string | null;
    createdAt: string;
    ordersCount?: number | null;
    addresses?: Address[];
    stores?: Array<Pick<StoreAdmin, "id" | "name" | "logo" | "location" | "productsCount">>;
}