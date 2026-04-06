import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion';
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Cosecha from './pages/Cosecha';
import CosechaEdit from './pages/CosechaEdit';
import Produccion from './pages/Produccion';
import ProduccionEdit from './pages/ProduccionEdit';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import Despachos from './pages/Despachos';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
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
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/cosecha" element={<PageWrapper><Cosecha /></PageWrapper>} />
          <Route path="/cosecha/new" element={<PageWrapper><CosechaEdit /></PageWrapper>} />
          <Route path="/cosecha/edit/:id" element={<PageWrapper><CosechaEdit /></PageWrapper>} />
          <Route path="/produccion" element={<PageWrapper><Produccion /></PageWrapper>} />
          <Route path="/produccion/new" element={<PageWrapper><ProduccionEdit /></PageWrapper>} />
          <Route path="/produccion/edit/:id" element={<PageWrapper><ProduccionEdit /></PageWrapper>} />
          <Route path="/reportes" element={<PageWrapper><Reportes /></PageWrapper>} />
          <Route path="/despachos" element={<PageWrapper><Despachos /></PageWrapper>} />
          <Route path="/configuracion" element={<PageWrapper><Configuracion /></PageWrapper>} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}


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
  )
}

export default App