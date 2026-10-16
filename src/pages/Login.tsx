import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ShoppingBag,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button, Input } from "../components/ui";
import { useApp } from "../contexts/AppContext";
import { useTranslation } from "react-i18next";
import type { LoginRequest } from "../type/auth";
import { login, logout } from "../api/auth.api";
import { getApiErrorMessage } from "../api/errorMessage";
import { useToast } from "../contexts/ToastContext";
import Logo from "../assets/NovaLogo.png";
import GhostFibers from "../components/ui/GhostFibers";

export default function Login() {
  const navigate = useNavigate();
  const { setUserRole } = useApp();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [form, setForm] = useState<LoginRequest>({
    identifier: "",
    password: "",
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError(null);

    if (!form.identifier.trim() || !form.password.trim()) {
      const message =
        "Veuillez saisir votre identifiant et votre mot de passe.";

      setError(message);
      return;
    }

    setLoading(true);

    try {
      const data = await login(form);

      /**
       * Admin-only portal.
       *
       * Even if the API returns a valid user with another role,
       * this application must not create a session for that role.
       */
      if (data.role !== "admin") {
        await logout();
        const message =
          "Accès refusé. Ce portail est réservé aux administrateurs.";

        setError(message);
        toast(message, "error");

        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify(data)
      );

      setUserRole("admin");

      toast("Connexion réussie.");

      navigate("/admin");
    } catch (error) {
      console.error("Login failed:", error);

      const message = getApiErrorMessage(
        error,
        "Email ou mot de passe invalide."
      );

      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] p-3 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-2xl shadow-slate-900/10 sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_.95fr]">
        <aside className="relative hidden overflow-hidden bg-[#123b3d] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-80">
            <GhostFibers
              glowColor="#4fd1c5"
              lineColor="#dcfff8"
              speed={0.12}
              scale={2.2}
              rotationSpeed={0.12}
              layers={4}
              twist={0.08}
              threads={1}
              glow={1.8}
              brightness={1.1}
              vignette={0.72}
            />
          </div>
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10"/><div className="absolute -right-8 -top-8 h-48 w-48 rounded-full border border-white/10"/>
          <div className="relative flex items-center gap-3"><img src={Logo} alt="NovaMarket" className="h-11 w-11 rounded-xl bg-white p-1 object-contain"/><span className="font-display text-lg font-bold">NovaMarket</span></div>
          <div className="relative max-w-md"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium"><span className="h-2 w-2 rounded-full bg-emerald-300"/>{t('ADMIN WORKSPACE')}</div><h2 className="font-display text-4xl font-bold leading-tight">{t('A clearer view of your marketplace.')}</h2><p className="mt-4 text-sm leading-6 text-emerald-50/75">{t('Manage sellers, orders and platform activity from one secure workspace.')}</p></div>
          <div className="relative flex items-center gap-2 text-xs text-emerald-50/60"><ShoppingBag className="h-4 w-4"/>NovaMarket · {t('Administration')}</div>
        </aside>
        <div className="flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[390px]">
        <div className="mb-8 text-center lg:text-left">
          <div className="mb-7 flex items-center justify-center gap-2 lg:hidden"><img src={Logo} alt="NovaMarket" className="h-10 w-10 object-contain"/><span className="font-display text-lg font-bold text-secondary-foreground">NovaMarket</span></div>

          <h1 className="text-2xl font-bold font-display text-secondary-foreground mb-1">
            {t("Sign in")}
          </h1>

          <p className="text-sm text-muted-foreground">
            {t(
              "Welcome back! Please sign in to continue."
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-7">
            <div className="space-y-4">
              <Input
                label={t("Identifier")}
                type="text"
                name="identifier"
                placeholder="admin"
                value={form.identifier}
                onChange={handleChange}
                icon={
                  <Mail className="w-4 h-4" />
                }
              />

              <Input
                label={t("Password")}
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                icon={
                  <Lock className="w-4 h-4" />
                }
                iconRight={
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="text-muted-foreground hover:text-secondary-foreground"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />
            </div>

            <div className="flex items-center justify-between mt-3 mb-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={handleChange}
                  name="remember"
                  className="w-3.5 h-3.5 rounded border-border text-primary"
                />

                <span className="text-sm text-muted-foreground">
                  {t("Remember me")}
                </span>
              </label>

            <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                {t("Forgot password?")}
              </Link>
            </div>

            {error && (
              <p
                className="text-sm text-red-500 mt-3 mb-3"
                role="alert"
              >
                {error}
              </p>
            )}

            <Button
              className="w-full"
              size="lg"
              type="submit"
              loading={loading}
            >
              {t("Sign-in-Se-connecter")}
            </Button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {t('Protected administrator access')} · NovaMarket
        </p>
          </div>
        </div>
      </div>
    </div>
  );
}
