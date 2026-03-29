import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Wheat, Package, Layers, TrendingUp } from "lucide-react";

const TURNOS = ["Mañana", "Tarde", "Noche"];
const TURNO_COLORS = { Mañana: "#c0392b", Tarde: "#7a1a30", Noche: "#2c0a12" };

function MetricCard({ label, value, unit, icon: Icon, color }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border-l-4 flex items-center gap-4`} style={{ borderColor: color }}>
      <div className="rounded-full p-3" style={{ backgroundColor: color + "22" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value} <span className="text-sm font-normal text-gray-400">{unit}</span></p>
      </div>
    </div>
  );
}

function RendimientoBar({ value }) {
  const color = value >= 75 ? "#276749" : value >= 50 ? "#b7791f" : "#c0392b";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className="h-2.5 rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold w-12 text-right" style={{ color }}>{value.toFixed(1)}%</span>
    </div>
  );
}

function TurnoCard({ turno, cosechaKg, produccionKg, palets }) {
  const rendimiento = cosechaKg > 0 ? (produccionKg / cosechaKg) * 100 : 0;
  const color = TURNO_COLORS[turno] || "#c0392b";
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="px-4 py-3 text-white font-semibold text-sm" style={{ backgroundColor: color }}>
        Turno {turno}
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[11px] text-gray-400">Cosecha (kg)</p>
            <p className="font-bold text-gray-800">{cosechaKg.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Producción (kg)</p>
            <p className="font-bold text-gray-800">{produccionKg.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Palets</p>
            <p className="font-bold text-gray-800">{palets}</p>
          </div>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 mb-1">Rendimiento</p>
          <RendimientoBar value={rendimiento} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [cosechas, setCosechas] = useState([]);
  const [producciones, setProducciones] = useState([]);
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.Cosecha.list("-fecha", 500),
      base44.entities.Produccion.list("-fecha", 500)
    ]).then(([c, p]) => {
      setCosechas(c);
      setProducciones(p);
      setLoading(false);
    });
  }, []);

  const cosechasDia = cosechas.filter(c => c.fecha === fecha);
  const produccionesDia = producciones.filter(p => p.fecha === fecha);

  const totalCosechaKg = cosechasDia.reduce((s, c) => s + (c.kilos_totales || 0), 0);
  const totalProdKg = produccionesDia.reduce((s, p) => s + (p.kilos_totales || 0), 0);
  const totalPalets = produccionesDia.reduce((s, p) => s + (p.cantidad_palets || 0), 0);
  const rendimientoDia = totalCosechaKg > 0 ? (totalProdKg / totalCosechaKg) * 100 : 0;

  const turnosActivos = TURNOS.filter(t =>
    cosechasDia.some(c => c.turno === t) || produccionesDia.some(p => p.turno === t)
  );

  // Chart data last 7 unique dates
  const fechas = [...new Set(cosechas.map(c => c.fecha))].sort().slice(-7);
  const chartData = fechas.map(f => {
    const cKg = cosechas.filter(c => c.fecha === f).reduce((s, c) => s + (c.kilos_totales || 0), 0);
    const pKg = producciones.filter(p => p.fecha === f).reduce((s, p) => s + (p.kilos_totales || 0), 0);
    return {
      fecha: format(new Date(f + "T00:00:00"), "dd/MM", { locale: es }),
      Cosecha: cKg,
      Producción: pKg,
    };
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5c1020]">Dashboard</h1>
          <p className="text-sm text-gray-500">Resumen operativo del día</p>
        </div>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c0392b]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#f8d7da] border-t-[#c0392b] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Cosecha del día" value={totalCosechaKg.toLocaleString()} unit="kg" icon={Wheat} color="#c0392b" />
            <MetricCard label="Producción del día" value={totalProdKg.toLocaleString()} unit="kg" icon={Package} color="#7a1a30" />
            <MetricCard label="Palets despachados" value={totalPalets} unit="pal" icon={Layers} color="#276749" />
            <MetricCard label="Rendimiento" value={rendimientoDia.toFixed(1)} unit="%" icon={TrendingUp} color="#b7791f" />
          </div>

          {/* Kanban por turno */}
          <div>
            <h2 className="text-base font-semibold text-[#5c1020] mb-3">Vista por Turno</h2>
            {turnosActivos.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
                No hay registros para esta fecha. Cargá datos en Cosecha o Producción.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {turnosActivos.map(turno => (
                  <TurnoCard
                    key={turno}
                    turno={turno}
                    cosechaKg={cosechasDia.filter(c => c.turno === turno).reduce((s, c) => s + (c.kilos_totales || 0), 0)}
                    produccionKg={produccionesDia.filter(p => p.turno === turno).reduce((s, p) => s + (p.kilos_totales || 0), 0)}
                    palets={produccionesDia.filter(p => p.turno === turno).reduce((s, p) => s + (p.cantidad_palets || 0), 0)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-[#5c1020] mb-4">Últimos 7 días — Cosecha vs Producción (kg)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3e6e8" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => v.toLocaleString() + " kg"} />
                  <Bar dataKey="Cosecha" fill="#c0392b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Producción" fill="#276749" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}