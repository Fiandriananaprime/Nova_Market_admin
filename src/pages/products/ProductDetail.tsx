import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Package,
  Pencil,
  ShieldCheck,
  Star,
  Tag,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import {  Product } from '@/type/catalog/product';
import { Review, Store } from '@/type/catalog/store';
import { StatusBadge } from '../../components/ui';
import { formatPrice } from '@/hook/format';
import { useTranslation } from 'react-i18next';

interface ProductDetailsProps {
  product: Product;
  seller: Store;
  reviews: Review[];
  onBack?: () => void;
  onEdit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

export default function ProductDetails({
  product,
  seller,
  reviews = [],
  onBack,
  onEdit,
  onApprove,
  onReject,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
}: ProductDetailsProps) {
  const { t } = useTranslation();
  const images =
    product.images?.map((image) => image.url) ?? [];
  const displayStatus = product.moderationStatus ?? product.status;

  const [selectedImage, setSelectedImage] = useState(0);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
    }).format(new Date(date));

  const nextImage = () => {
    if (!images.length) return;

    setSelectedImage((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  };

  const previousImage = () => {
    if (!images.length) return;

    setSelectedImage((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  };

  return (
    <div className="min-h-screen bg-background text-secondary-foreground">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-muted"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div>
            <p className="text-sm text-muted-foreground">
              {t("Products / Details")}
            </p>

            <h1 className="text-2xl font-semibold tracking-tight">
              {t("Product Details")}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onPrevious && (
            <button
              onClick={onPrevious}
              disabled={!canGoPrevious}
              aria-label={t("Previous product")}
              title={t("Previous product")}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {onNext && (
            <button
              onClick={onNext}
              disabled={!canGoNext}
              aria-label={t("Next product")}
              title={t("Next product")}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          )}

          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
            >
              <Pencil size={16} />
              {t("Edit product")}
            </button>
          )}
        </div>
      </div>

      {/* Main product */}
      <section className="rounded-xl border border-border bg-card">
        <div className="grid gap-8 p-6 lg:grid-cols-[420px_1fr]">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 shadow-sm transition hover:bg-card"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 shadow-sm transition hover:bg-card"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Package size={48} />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image + index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-18 w-18 shrink-0 overflow-hidden rounded-lg border-2 bg-muted ${
                      selectedImage === index
                        ? 'border-primary'
                        : 'border-border'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product information */}
          <div className="flex flex-col">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {displayStatus && <StatusBadge status={displayStatus} />}

              {product.brand && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {product.brand}
                </span>
              )}

              {product.categoryName && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {product.categoryName}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold tracking-tight">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star
                  size={17}
                  className="fill-current"
                />

                <span className="font-semibold">
                  {product.rating?.toFixed(1) ?? '—'}
                </span>
              </div>

              <span className="text-sm text-muted-foreground">
                {product.reviewsCount ?? 0} {t("reviews")}
              </span>
            </div>

            {/* Price */}
            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="text-3xl font-bold">
                {formatPrice(product.price)}
              </span>

            </div>

            {/* Basic info */}
            <div className="mt-7 grid grid-cols-2 gap-4 border-y border-border py-6 sm:grid-cols-3">
              <InfoItem label="SKU" value={product.sku || 'N/A'} />

              <InfoItem
                label="Stock"
                value={`${product.stock} ${t("units")}`}
              />

              <InfoItem
                label={t("Category")}
                value={product.categoryName ?? 'N/A'}
              />

              <InfoItem
                label={t("Created")}
                value={product.createdAt ? formatDate(product.createdAt) : 'N/A'}
              />
            </div>

            {/* Tags */}
            {(product.tags ?? []).length > 0 && (
              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Tag size={15} />
                  {t("Tags")}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(product.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Moderation */}
            {product.moderationStatus === 'pending' && (
              <div className="mt-7 flex flex-wrap gap-3">
                {onApprove && (
                  <button
                    onClick={onApprove}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    <CheckCircle2 size={17} />
                    {t("Approve")}
                  </button>
                )}

                {onReject && (
                  <button
                    onClick={onReject}
                    className="flex items-center gap-2 rounded-lg border border-destructive px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                  >
                    <XCircle size={17} />
                    {t("Reject")}
                  </button>
                )}

              </div>
            )}
          </div>
        </div>
      </section>

      {/* Description + Specs */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Description */}
        <section className="rounded-xl border border-border bg-card p-6">
          <SectionTitle title={t("Description")} />

          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {product.description || t("No description available.")}
          </p>
        </section>

        {/* Specifications */}
        <section className="rounded-xl border border-border bg-card p-6">
          <SectionTitle title={t("Specifications")} />

          {Object.keys(product.specs ?? {}).length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              {Object.entries(product.specs ?? {}).map(
                ([key, value], index) => (
                  <div
                    key={key}
                    className={`grid grid-cols-[40%_60%] px-4 py-3 text-sm ${
                      index % 2 === 0 ? 'bg-muted/40' : ''
                    }`}
                  >
                    <span className="font-medium">{key}</span>

                    <span className="text-muted-foreground">
                      {value}
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyState text={t("No specifications available.")} />
          )}
        </section>
      </div>

      {/* Variants */}
      {(product.variants ?? []).length > 0 && (
        <section className="mt-6 rounded-xl border border-border bg-card p-6">
          <SectionTitle title={t("Variants")} />

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(product.variants ?? []).map((variant) => (
              <div
                key={variant.name}
                className="rounded-lg border border-border p-4"
              >
                <p className="text-sm font-semibold">
                  {variant.name}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {variant.values?.map((value) => (
                    <span
                      key={value}
                      className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Seller */}
      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <SectionTitle title={t("Seller")} />

        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-muted">
              {seller?.logoUrl ? (
                <img
                  src={seller.logoUrl}
                  alt={seller.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserRound size={25} />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {seller?.name ?? product.storeName ?? t('Unknown seller')}
                </h3>

                {seller?.verified && (
                  <ShieldCheck
                    size={17}
                    className="text-primary"
                  />
                )}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {seller?.location ?? t("Location unavailable")}
              </p>
            </div>
          </div>

          {seller && (
            <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
              <InfoItem
                label={t("Rating")}
                value={`${seller.rating.toFixed(1)} / 5`}
              />

              <InfoItem
                label={t("Products")}
                value={seller.productsCount.toString()}
              />

              <InfoItem
                label={t("Followers")}
                value={seller.followersCount.toString()}
              />

              <InfoItem
                label={t("Joined")}
                value={seller.joinedYear}
              />
            </div>
          )}
        </div>

        {seller?.description && (
          <p className="mt-5 border-t border-border pt-5 text-sm leading-6 text-muted-foreground">
            {seller.description}
          </p>
        )}
      </section>

      {/* Reviews */}
      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle title={t("Customer Reviews")} />

          <div className="flex items-center gap-2">
            <Star
              size={18}
              className="fill-current"
            />

            <span className="font-semibold">
              {product.rating?.toFixed(1) ?? 'N/A'}
            </span>

            <span className="text-sm text-muted-foreground">
              ({product.reviewsCount})
            </span>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="mt-5 divide-y divide-border">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="py-5 first:pt-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <CircleUserRound size={19} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        {review.customerName}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {formatDate(review.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map(
                      (_, index) => (
                        <Star
                          key={index}
                          size={14}
                          className={
                            index < review.rating
                              ? 'fill-current'
                              : 'text-muted-foreground'
                          }
                        />
                      ),
                    )}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {review.comment}
                </p>

                {review.replied && review.reply && (
                  <div className="mt-4 rounded-lg bg-muted/60 p-4">
                    <p className="text-xs font-semibold">
                      {t("Seller response")}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {review.reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text={t("No reviews available.")} />
        )}
      </section>

      {/* Metadata */}
      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <SectionTitle title={t("Product Metadata")} />

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetadataItem
            icon={<Package size={17} />}
            label={t("Product ID")}
            value={product.id}
          />

          <MetadataItem
            icon={<UserRound size={17} />}
            label={t("Seller ID")}
            value={product.storeId}
          />

          <MetadataItem
            icon={<Tag size={17} />}
            label={t("Category ID")}
            value={product.categoryId}
          />

          <MetadataItem
            icon={<Calendar size={17} />}
            label={t("Created")}
            value={product.createdAt ? formatDate(product.createdAt) : 'N/A'}
          />
        </div>
      </section>
    </div>
  );
}

const SectionTitle = ({ title }: { title: string }) => {
  return (
    <h2 className="text-lg font-semibold tracking-tight">
      {title}
    </h2>
  );
};

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

const MetadataItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>

      <p className="mt-2 truncate text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

const EmptyState = ({ text }: { text: string }) => {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
};
