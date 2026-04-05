import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, Wheat, Package, BarChart2, Settings, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cosecha", label: "Cosecha", icon: Wheat },
  { to: "/produccion", label: "Producción", icon: Package },
  { to: "/reportes", label: "Reportes", icon: BarChart2 },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="h-screen flex bg-[#f8f0f1] overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-[#5c1020] text-white shadow-xl h-screen sticky top-0 flex-shrink-0">
        <div className="px-6 py-5 border-b border-[#7a1a30]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#c0392b] flex items-center justify-center text-xs font-bold">🍎</div>
            <div>
              <p className="font-bold text-sm leading-tight">FrutaPack</p>
              <p className="text-[10px] text-red-200 opacity-80">Gestión de Empaque</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
          <p className="text-[10px] text-red-300 opacity-60 text-center">FrutaPack v1.0</p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#5c1020] text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">🍎</span>
          <span className="font-bold text-sm">FrutaPack</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-[#5c1020] w-56 h-full pt-16 px-3 space-y-1" onClick={e => e.stopPropagation()}>
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  );
}