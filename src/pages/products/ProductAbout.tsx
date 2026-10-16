import ProductDetail from '@/pages/products/ProductDetail';
import { updateProductStatus } from '@/api/admin/product.api';
import { getAdminProducts } from '@/api/admin/product.api';
import { getProductById } from '@/api/admin/product.public.api';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { useEffect, useState } from 'react';
import { Product } from '@/type/catalog/product';
import { Review, Store } from '@/type/catalog/store';
import { getSellerById } from '@/api/admin/store..public.api';
import { getProductReviews } from '@/api/admin/product.public.api';
import {useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage } from '@/api/errorMessage';
import { useTranslation } from 'react-i18next';

const ProductAbout = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product>();
  const [seller, setSeller] = useState<Store>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [productIds, setProductIds] = useState<string[]>([]);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();
  const statusFilter = searchParams.get('status');

  useEffect(() => {
    const fetchProductIds = async () => {
      try {
        const queryStatus =
          statusFilter === 'pending' || statusFilter === 'approved' || statusFilter === 'rejected'
            ? statusFilter
            : undefined;
        const firstPage = await getAdminProducts({
          page: 1,
          limit: 100,
          status: queryStatus,
        });
        const allProducts = [...firstPage.data];
        const totalPages = firstPage.meta?.totalPages ?? 1;

        for (let page = 2; page <= totalPages; page += 1) {
          const response = await getAdminProducts({ page, limit: 100, status: queryStatus });
          allProducts.push(...response.data);
        }

        setProductIds(allProducts.map((item) => item.id));
      } catch {
        setProductIds([]);
      }
    };

    fetchProductIds();
  }, [statusFilter]);

  const currentProductIndex = product ? productIds.indexOf(product.id) : -1;
  const previousProductId = currentProductIndex > 0 ? productIds[currentProductIndex - 1] : undefined;
  const nextProductId = currentProductIndex >= 0 ? productIds[currentProductIndex + 1] : undefined;

  const navigateToProduct = (productId: string) => {
    const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    navigate(`/admin/products/${productId}${query}`);
  };

  const handleStatusChange = async (status: 'approved' | 'rejected') => {
    if (!product) return;

    try {
      const updatedProduct = await updateProductStatus(product.id, status);
      setProduct((currentProduct) =>
        currentProduct
          ? { ...currentProduct, ...updatedProduct, status: updatedProduct.status }
          : currentProduct,
      );
      toast(
        t(
          `Product ${status}.`,
          status === 'approved'
            ? 'Produit approuvé.'
            : 'Produit rejeté.',
        ),
        'success',
      );
    } catch (error) {
      toast(
        getApiErrorMessage(
          error,
          t("Unable to update product status."),
        ),
        'error',
      );
    }
  };
  
  useEffect(() => {
    const fetchProduct = async () => {
     try {
      setLoading(true);
      if (id) {
        const productData = await getProductById(id);
        setProduct(productData);

        const sellerData = await getSellerById(productData.storeId);
        setSeller(sellerData);

        const reviewsData = await getProductReviews(id);
        setReviews(reviewsData.data);
      }
    } catch{
        toast(t("Error fetching product data"), 'error');
    } finally {
        setLoading(false);
    }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
        {t("Loading product...")}
      </div>
    );
  }

  if (!product || !seller) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-muted-foreground">
        <p>{t("Product not found.")}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-muted"
        >
          {t("Go back")}
        </button>
      </div>
    );
  }

  return (
    <ProductDetail
      product={product}
      seller={seller}
      reviews={reviews}
      onBack={() => navigate(-1)}
      onApprove={() => handleStatusChange('approved')}
      onReject={() => handleStatusChange('rejected')}
      onPrevious={() => previousProductId && navigateToProduct(previousProductId)}
      onNext={() => nextProductId && navigateToProduct(nextProductId)}
      canGoPrevious={Boolean(previousProductId)}
      canGoNext={Boolean(nextProductId)}
    />

  );
}

export default ProductAbout;