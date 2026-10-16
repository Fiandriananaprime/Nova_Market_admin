import { Eye, Package, Truck, CreditCard, User, Calendar } from "lucide-react";
import { Order } from "@/type/order/order";
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router';

interface OrderCardProps {
  order: Order;
}

const statusStyles: Record<Order["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  preparing: "bg-orange-100 text-orange-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

const paymentStatusStyles: Record<Order["paymentStatus"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
  partially_refunded: "bg-gray-100 text-gray-700",
};


export default function OrderCard({ order }: OrderCardProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const statusLabels: Record<Order["status"], string> = {
      pending: t("Pending"),
      confirmed: t("Confirmed"),
      processing: t("Processing"),
      preparing: t("Preparing"),
      shipped: t("Shipped"),
      delivered: t("Delivered"),
      cancelled: t("Cancelled"),
      refunded: t("Refunded"),
    };
    
    const paymentLabels: Record<Order["paymentStatus"], string> = {
      pending: t("Pending"),
      paid: t("Paid"),
      failed: t("Failed"),
      refunded: t("Refunded"),
      partially_refunded: t("Partially refunded"),
    };
    
    const deliveryLabels: Record<Order["deliveryMethod"], string> = {
      standard: t("Standard"),
      express: t("Express"),
      pickup: t("Pickup"),
    };
    
    const paymentMethodLabels: Record<Order["paymentMethod"], string> = {
      mvola: "MVola",
      orange_money: "Orange Money",
      card: t("Card"),
      cod: t("Cash on delivery"),
    };
  const totalItems = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("Order")}</p>

          <h3 className="font-semibold text-secondary-foreground">
            #{order.id}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={15} />
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            statusStyles[order.status]
          }`}
        >
          {statusLabels[order.status]}
        </span>
      </div>

      {/* Buyer */}
      <div className="mt-5 flex items-center gap-3 rounded-lg bg-muted/40 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <User size={17} />
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{t("Customer")}</p>
          <p className="text-sm font-medium text-secondary-foreground">
            {order.buyerName}
          </p>
        </div>
      </div>

      {/* Main information */}
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Items */}
        <div>
          <div className="mb-1 flex items-center gap-2 text-muted-foreground">
            <Package size={15} />
            <span className="text-xs">{t("Items")}</span>
          </div>

          <p className="font-medium text-secondary-foreground">
            {totalItems} item{totalItems > 1 ? "s" : ""}
          </p>
        </div>

        {/* Sellers */}
        <div>
          <div className="mb-1 flex items-center gap-2 text-muted-foreground">
            <User size={15} />
            <span className="text-xs">{t("Sellers")}</span>
          </div>

          <p className="font-medium text-secondary-foreground">
            {order.sellers.length}
          </p>
        </div>

        {/* Delivery */}
        <div>
          <div className="mb-1 flex items-center gap-2 text-muted-foreground">
            <Truck size={15} />
            <span className="text-xs">{t("Delivery")}</span>
          </div>

          <p className="font-medium text-secondary-foreground">
            {deliveryLabels[order.deliveryMethod]}
          </p>
        </div>

        {/* Payment */}
        <div>
          <div className="mb-1 flex items-center gap-2 text-muted-foreground">
            <CreditCard size={15} />
            <span className="text-xs">{t("Payment")}</span>
          </div>

          <p className="font-medium text-secondary-foreground">
            {paymentMethodLabels[order.paymentMethod]}
          </p>
        </div>
      </div>

      {/* Payment status */}
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">
            {t("Payment status")}
          </p>

          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
              paymentStatusStyles[order.paymentStatus]
            }`}
          >
            {paymentLabels[order.paymentStatus]}
          </span>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            Total
          </p>

          <p className="text-lg font-bold text-secondary-foreground">
            {order.total.toLocaleString()} Ar
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div className="text-xs text-muted-foreground">
          {order.tracking.length > 0 ? (
            <>
              {t("Tracking updates")}: {order.tracking.length}
            </>
          ) : (
            t("No tracking number")
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate(`/admin/orders/${order.id}`)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-muted"
        >
          <Eye size={16} />
          {t("View details")}
        </button>
      </div>
    </div>
  );
}