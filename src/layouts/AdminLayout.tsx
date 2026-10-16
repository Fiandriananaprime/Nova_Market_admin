import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Users, Package, Store, ShoppingCart, CreditCard, Tag, BarChart3, Settings, Bell, Menu, Sun, Moon, Globe, LogOut, UserCheck } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { logout } from '@/api/auth.api';
import { useToast } from '../contexts/ToastContext';
import Logo from '../assets/NovaLogo.png';
import i18n from '../i18n';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';


export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { setUserRole } = useApp();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { icon: <LayoutDashboard className="w-4.5 h-4.5" />, label: t("Dashboard"), to: '/admin' },
    { icon: <Users className="w-4.5 h-4.5" />, label: t("Users"), to: '/admin/users' },
    { icon: <UserCheck className="w-4.5 h-4.5" />, label: t("Seller Applications"), to: '/admin/sellers/applications' },
    { icon: <Package className="w-4.5 h-4.5" />, label: t("Products"), to: '/admin/products' },
    { icon: <Store className="w-4.5 h-4.5" />, label: t("Stores"), to: '/admin/sellers' },
    { icon: <ShoppingCart className="w-4.5 h-4.5" />, label: t("Orders"), to: '/admin/orders' },
    { icon: <CreditCard className="w-4.5 h-4.5" />, label: t("Payments"), to: '/admin/payments' },
    { icon: <Tag className="w-4.5 h-4.5" />, label: t("Promotions"), to: '/admin/promotions' },
    { icon: <BarChart3 className="w-4.5 h-4.5" />, label: t("Reports"), to: '/admin/reports' },
    { icon: <Settings className="w-4.5 h-4.5" />, label: t("Settings"), to: '/admin/settings' },
  ];
  const isNavItemActive = (to: string) => {
    if (to === '/admin' || to === '/admin/sellers') return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };
  const handleLogout = async () => {
    setUserRole(null);
    await logout();
    toast('You have been signed out.');
    navigate('/');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-[#16262E] text-[#F5EFFF] ${mobile ? '' : 'w-56'}`}>
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center overflow-hidden">
          <img src={Logo} alt="Nova Market" />
        </div>
        <div>
          <div className="font-bold text-sm font-display">Nova Market</div>
          <div className="text-[10px] text-[#8da8b5]">{t("Admin Panel")}</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = isNavItemActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => mobile && setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-[#5ABCB9] text-[#16262E]' : 'text-[#8da8b5] hover:bg-white/8 hover:text-white'}`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-[#0077B6] flex items-center justify-center text-white text-sm font-bold">A</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{t("Administrator")}</div>
            <div className="text-xs text-[#8da8b5]">Super Admin</div>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#8da8b5] hover:bg-white/8 hover:text-red-400 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" />
          {t("Logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-[252px] shrink-0 border-r border-white/10 md:flex md:flex-col">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-60 flex flex-col">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="z-20 flex h-[68px] shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <button aria-label={t('Open navigation')} className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-sm font-display text-secondary-foreground hidden sm:block">
              {navItems.find(i => isNavItemActive(i.to))?.label || t('Admin Dashboard')}
            </h1>
            <p className="hidden text-[10px] text-muted-foreground sm:block">{t('NovaMarket operations')}</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative hidden sm:block">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary transition-colors">
                <Globe className="w-4 h-4 text-muted-foreground" />

                <select
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                  className="appearance-none bg-transparent pr-5 text-sm font-medium text-foreground outline-none cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>

                <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 pointer-events-none text-muted-foreground" />
              </div>
            </div>
            <button aria-label={t(resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')} onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary">
              {resolvedTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <button className="relative p-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-[#0077B6] flex items-center justify-center text-white text-sm font-bold">A</div>
              <span className="hidden sm:block text-sm font-medium text-secondary-foreground">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 xl:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
