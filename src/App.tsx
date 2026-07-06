
import { Toaster as Sonner } from "@/ui/sonner";
import { TooltipProvider } from "@/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { useTranslation } from "react-i18next";
import { lazy, Suspense, useEffect } from "react";
import Home from "@/features/home/pages/Home";
import { ErrorBoundary } from "@/ui/error-boundary";
import { LoadingSpinner } from "@/ui/loading-spinner";

// Route-level code splitting: each area loads only when visited, keeping
// heavy dependencies (Mapbox GL in packages, Recharts in admin) out of the
// entry bundle. Home stays eager for the fastest first paint.
const AuthPage = lazy(() => import("@/features/auth/pages/AuthPage"));
const AdminAuth = lazy(() => import("@/features/auth/pages/AdminAuth"));
const Destinations = lazy(() => import("@/features/packages/pages/Destinations"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PaymentCallback = lazy(() => import("@/features/bookings/pages/PaymentCallback"));
const PackagesRoutes = lazy(() =>
  import("@/features/packages/routes").then((m) => ({ default: m.PackagesRoutes }))
);
const AdminRoutes = lazy(() =>
  import("@/features/admin/routes").then((m) => ({ default: m.AdminRoutes }))
);
const AgencyRoutes = lazy(() =>
  import("@/features/agency/routes").then((m) => ({ default: m.AgencyRoutes }))
);
const TravelerRoutes = lazy(() =>
  import("@/features/traveler/routes").then((m) => ({ default: m.TravelerRoutes }))
);

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

const App = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;

    // Add font family support for Arabic
    if (i18n.language === 'ar') {
      document.body.style.fontFamily = "var(--font-arabic)";
    } else {
      document.body.style.fontFamily = "var(--font-sans)";
    }
  }, [i18n.language]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
              >
                {t('ui.skipToContent', 'Skip to main content')}
              </a>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/packages/*" element={<PackagesRoutes />} />
                  <Route path="/destinations" element={<Destinations />} />
                  <Route path="/payment/callback" element={<PaymentCallback />} />

                  {/* Protected Traveler Routes */}
                  <Route path="/traveler/dashboard/*" element={<TravelerRoutes />} />

                  {/* Protected Travel Agency Routes */}
                  <Route path="/travel_agency/*" element={<AgencyRoutes />} />

                  {/* Admin Auth Route - No signup, sign-in only */}
                  <Route path="/admin/login" element={<AdminAuth />} />

                  {/* Protected Admin Routes */}
                  <Route path="/admin/*" element={<AdminRoutes />} />

                  {/* Redirect legacy routes */}
                  <Route path="/dashboard" element={<Navigate to="/travel_agency" replace />} />
                  <Route path="/dashboard/*" element={<Navigate to="/travel_agency" replace />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
