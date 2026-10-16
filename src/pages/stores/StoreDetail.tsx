import { StoreAdmin } from "@/type/admin/seller";
import { MapPin, Package, Star, Store, Users } from "lucide-react";
import {  VerifiedBadge } from "@/components/ui";
import { useState } from "react";
import SellerReviews from "./Reviews";
import Overview from "@/components/store/StoreOverView";
import Products from "@/components/store/StoreProduct";
import Orders from "@/components/store/StoreOrders";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { getAdminStoreById } from "@/api/admin/store.api";
import NotFound from "@/pages/NotFound";
import { useParams, useNavigate } from "react-router";
import { getApiErrorMessage } from "@/api/errorMessage";
import { useToast} from "@/contexts/ToastContext";

type Tab = "OVERVIEW" | "PRODUCTS" | "ORDERS" | "REVIEWS";

const StoreAdminDetail = () => {
  const { id: storeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast()
  const [ store, setStore] = useState<StoreAdmin>();
  const [activeTab, setActiveTab] = useState<Tab>("OVERVIEW");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      if(!storeId) return;
      try {
        setLoading(true);
        const response = await getAdminStoreById(storeId);
        setStore(response);
      } catch (error) {
        toast(getApiErrorMessage(error,"Error fetching store detail"), "error")
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [storeId]);

  const tabLabels: Record<Tab, string> = {
    OVERVIEW: t("OVERVIEW"),
    PRODUCTS: t("PRODUCTS"),
    ORDERS: t("ORDERS"),
    REVIEWS: t("REVIEWS"),
  };

  if(loading) {
    return <div>Loading...</div>;
  }
  if (!store ) {
    return <NotFound prop={"store"} />;
  }
  const sellerAvatar = store.owner?.avatarUrl;
   const tabs: Record<Tab, React.ReactNode> = {
    OVERVIEW: <Overview store={store} />,
    PRODUCTS: <Products />,
    ORDERS: <Orders />,
    REVIEWS: <SellerReviews id={store.id} />,
  };
  return (
    <div>
      <div className="bg-foreground rounded-2xl overflow-hidden mb-6 relative">
        <div className="relative h-48">
          {store.cover ? (
            <img
              src={store.cover}
              alt={store.name}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="h-full w-full bg-secondary" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-transparent" />

          <span className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-xs text-white/80 font-mono">
            ID: {store.id}
          </span>

          <button 
            onClick={() => navigate(`/admin/users/${store.owner?.id}`)}
            className="absolute top-4 right-4 flex items-center gap-2 hover:scale-105">
            <div className="w-15 h-15 rounded-full overflow-hidden border-2 border-white/70 bg-white">
             {sellerAvatar ? (<img
                src={sellerAvatar}
                alt="Seller"
                className="w-full h-full object-cover"
              />):
              ( 
                <div className="w-15 h-15 rounded-full overflow-hidden border-2 border-white/70 bg-white">
                  store.owner?.name[0]
                </div>
              )
              }
            </div>
          </button>
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 -mt-12">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-foreground bg-white flex-shrink-0 shadow-lg">
              {store.logo ? (
                <img
                  src={store.logo}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Store className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold font-display text-white">
                  {store.name}
                </h1>

                {store.verified && <VerifiedBadge />}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-white">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span className="text-white font-medium">
                    {store.rating.toFixed(1)}
                  </span>
                </div>

                <span>·</span>

                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {store.followersCount.toLocaleString()}
                  <span>{t("followers")}</span>
                </span>

                <span>·</span>

                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {store.location || t("No location")}
                </span>

                <span>·</span>

                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {store.productsCount.toLocaleString()}
                  <span>{t("products")}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200">
        {Object.keys(tabs).map((tab) => {
          const tabKey = tab as Tab;

          return (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === tabKey
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tabLabels[tabKey]}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tabs[activeTab]}
      </div>
    </div>
  );
};

export default StoreAdminDetail;
