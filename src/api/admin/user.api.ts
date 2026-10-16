import { api } from "../axios";
import { User, UserRole, status } from "@/type/user";
import { PaginationMeta } from "@/type/catalog/product";

type GetAllUserProp = {
  search?: string;
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: status;
}

type GetAllUserResponse = {
  data: User[];
  meta: PaginationMeta;
  counts: {
    all: number;
    buyer: number;
    seller: number;
    admin: number;
  }
}

export const getAllUser = async (params: GetAllUserProp): Promise<GetAllUserResponse> => {
    const response = await api.get("/admin/users", { params });
    return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
};

export const updateUserStatus = async (id: string, status: status): Promise<User> => {
    const response = await api.patch(`/admin/users/${id}/status`, status);
    return response.data;
}