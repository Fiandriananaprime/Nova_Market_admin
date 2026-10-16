export interface Store {
  id: string;
  userId: string;
  name: string;
  slug?: string;
  logoUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  productsCount: number;
  location: string | null;
  joinedYear: string;
  followersCount: number;
  description: string | null;
  isOpen?: boolean;
  isFollowedByCurrentUser?: boolean;
  contact?: {
    phone?: string | null;
    email?: string | null;
    website?: string | null;
  };
}


export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  replied: boolean;
  reply: string | null;
}
