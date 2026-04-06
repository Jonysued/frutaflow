import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';

// Only sub-route pages need lazy loading; primary tabs are managed by Layout
const CosechaEdit = lazy(() => import('./pages/CosechaEdit'));
const ProduccionEdit = lazy(() => import('./pages/ProduccionEdit'));

function LoadingPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingPage />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Primary tabs: Layout handles rendering these persistently */}
        <Route path="/" />
        <Route path="/cosecha" />
        <Route path="/produccion" />
        <Route path="/despachos" />
        <Route path="/reportes" />
        <Route path="/configuracion" />
        {/* Sub-routes: rendered via Outlet with lazy loading */}
        <Route path="/cosecha/new" element={<Suspense fallback={<LoadingPage />}><CosechaEdit /></Suspense>} />
        <Route path="/cosecha/edit/:id" element={<Suspense fallback={<LoadingPage />}><CosechaEdit /></Suspense>} />
        <Route path="/produccion/new" element={<Suspense fallback={<LoadingPage />}><ProduccionEdit /></Suspense>} />
        <Route path="/produccion/edit/:id" element={<Suspense fallback={<LoadingPage />}><ProduccionEdit /></Suspense>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;