import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wheat, Package, BarChart2, Settings, Menu, X, ArrowLeft, Truck } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Dashboard from "@/pages/Dashboard";
import Cosecha from "@/pages/Cosecha";
import Produccion from "@/pages/Produccion";
import Despachos from "@/pages/Despachos";
import Reportes from "@/pages/Reportes";
import Configuracion from "@/pages/Configuracion";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, Component: Dashboard },
  { to: "/cosecha", label: "Cosecha", icon: Wheat, Component: Cosecha },
  { to: "/produccion", label: "Producción", icon: Package, Component: Produccion },
  { to: "/despachos", label: "Despachos", icon: Truck, Component: Despachos },
  { to: "/reportes", label: "Reportes", icon: BarChart2, Component: Reportes },
  { to: "/configuracion", label: "Configuración", icon: Settings, Component: Configuracion },
];

// Determine if a path corresponds to a primary tab
const primaryPaths = navItems.map(n => n.to);

function isSubRoute(pathname) {
  return !primaryPaths.includes(pathname);
}

function getActiveTab(pathname) {
  if (pathname === "/") return "/";
  const match = navItems.find(n => n.to !== "/" && pathname.startsWith(n.to));
  return match ? match.to : "/";
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const showSubRoute = isSubRoute(location.pathname);
  const activeTab = getActiveTab(location.pathname);
  const canGoBack = showSubRoute;

  // Keep track of which tabs have been visited so we only mount them once they're needed
  const [visited, setVisited] = useState(() => new Set([activeTab]));

  useMemo(() => {
    if (!showSubRoute) {
      setVisited(prev => {
        if (prev.has(activeTab)) return prev;
        const next = new Set(prev);
        next.add(activeTab);
        return next;
      });
    }
  }, [activeTab, showSubRoute]);

  return (
    <div className="h-screen flex bg-[#f8f0f1] overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-[#5c1020] text-white shadow-xl h-screen sticky top-0 flex-shrink-0">
        <div className="px-6 py-5 border-b border-[#7a1a30]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#c0392b] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 32 32" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="18" r="11" fill="#e74c3c" />
                <path d="M13 7 Q16 2 19 7" stroke="#c0392b" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M16 7 Q18 4 21 5" stroke="#27ae60" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M16 8 Q14 4 11 5" stroke="#27ae60" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <ellipse cx="16" cy="7.5" rx="3" ry="1.5" fill="#c0392b" />
                <circle cx="12" cy="16" r="1.5" fill="#fff" opacity="0.3" />
                <circle cx="18" cy="14" r="1" fill="#fff" opacity="0.3" />
                <circle cx="14" cy="20" r="1.2" fill="#fff" opacity="0.3" />
                <circle cx="20" cy="19" r="1" fill="#fff" opacity="0.3" />
                <circle cx="11" cy="22" r="0.8" fill="#fff" opacity="0.3" />
                <circle cx="17" cy="23" r="1" fill="#fff" opacity="0.3" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Rimonim</p>
              <p className="text-[10px] text-red-200 opacity-80">Gestión de Empaque</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                location.pathname === to
                  ? "bg-[#c0392b] text-white shadow-md"
                  : "text-red-100 hover:bg-[#7a1a30] hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-[#7a1a30]">
          <p className="text-[10px] text-red-300 opacity-60 text-center">Rimonim v1.0</p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#5c1020] text-white px-4 flex items-center justify-between shadow-lg" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))', paddingBottom: '12px', minHeight: '44px' }}>
        <div className="flex items-center gap-2">
          {canGoBack ? (
            <button onClick={() => navigate(-1)} className="p-1 mr-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}
          <svg viewBox="0 0 32 32" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="18" r="11" fill="#e74c3c" />
            <path d="M13 7 Q16 2 19 7" stroke="#c0392b" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M16 7 Q18 4 21 5" stroke="#27ae60" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <path d="M16 8 Q14 4 11 5" stroke="#27ae60" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <ellipse cx="16" cy="7.5" rx="3" ry="1.5" fill="#c0392b" />
            <circle cx="12" cy="16" r="1.5" fill="#fff" opacity="0.3" />
            <circle cx="18" cy="14" r="1" fill="#fff" opacity="0.3" />
            <circle cx="14" cy="20" r="1.2" fill="#fff" opacity="0.3" />
          </svg>
          <span className="font-bold text-sm">Rimonim</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-[#5c1020] w-56 h-full pt-16 px-3 space-y-1" onClick={e => e.stopPropagation()}>
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                  location.pathname === to
                    ? "bg-[#c0392b] text-white"
                    : "text-red-100 hover:bg-[#7a1a30]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14 md:pb-0 pb-16">
        {/* Sub-routes (e.g. edit pages) rendered via Outlet */}
        {showSubRoute && (
          <div className="h-full">
            <Outlet />
          </div>
        )}

        {/* Primary tab views — always mounted once visited, hidden when inactive */}
        <AnimatePresence mode="wait">
        {navItems.map(({ to, Component }) => {
          if (!visited.has(to)) return null;
          const isActive = !showSubRoute && activeTab === to;
          if (!isActive) return <div key={to} style={{ display: "none" }}><Component /></div>;
          return (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <Component />
            </motion.div>
          );
        })}
        </AnimatePresence>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#5c1020] text-white flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = activeTab === to && !showSubRoute;
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-semibold transition-all min-h-[44px] ${
                isActive ? 'text-white' : 'text-red-300 opacity-70'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}