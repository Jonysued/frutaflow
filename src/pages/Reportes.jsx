import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from "recharts";

export default function Reportes() {
  const [cosechas, setCosechas] = useState([]);
  const [producciones, setProducciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("diario");

  useEffect(() => {
    Promise.all([
      base44.entities.Cosecha.list("-fecha", 500),
      base44.entities.Produccion.list("-fecha", 500)
    ]).then(([c, p]) => { setCosechas(c); setProducciones(p); setLoading(false); });
  }, []);

  // Group by date
  const fechas = [...new Set([...cosechas.map(c => c.fecha), ...producciones.map(p => p.fecha)])].sort().slice(-30);

  const dataDiaria = fechas.map(f => {
    const cKg = cosechas.filter(c => c.fecha === f).reduce((s, c) => s + (c.kilos_totales || 0), 0);
    const pKg = producciones.filter(p => p.fecha === f).reduce((s, p) => s + (p.kilos_totales || 0), 0);
    const palets = producciones.filter(p => p.fecha === f).reduce((s, p) => s + (p.cantidad_palets || 0), 0);
    const rendimiento = cKg > 0 ? parseFloat(((pKg / cKg) * 100).toFixed(1)) : 0;
    return { fecha: f.slice(5), Cosecha: cKg, Producción: pKg, Palets: palets, Rendimiento: rendimiento };
  });

  // Group by turno
  const turnos = ["Mañana", "Tarde", "Noche"];
  const dataTurno = turnos.map(t => {
    const cKg = cosechas.filter(c => c.turno === t).reduce((s, c) => s + (c.kilos_totales || 0), 0);
    const pKg = producciones.filter(p => p.turno === t).reduce((s, p) => s + (p.kilos_totales || 0), 0);
    const palets = producciones.filter(p => p.turno === t).reduce((s, p) => s + (p.cantidad_palets || 0), 0);
    const rendimiento = cKg > 0 ? parseFloat(((pKg / cKg) * 100).toFixed(1)) : 0;
    return { turno: t, Cosecha: cKg, Producción: pKg, Palets: palets, Rendimiento: rendimiento };
  });

  // By variedad
  const variedades = [...new Set(producciones.map(p => p.variedad))];
  const dataVariedad = variedades.map(v => {
    const kg = producciones.filter(p => p.variedad === v).reduce((s, p) => s + (p.kilos_totales || 0), 0);
    const palets = producciones.filter(p => p.variedad === v).reduce((s, p) => s + (p.cantidad_palets || 0), 0);
    return { variedad: v, Kilos: kg, Palets: palets };
  }).sort((a, b) => b.Kilos - a.Kilos);

  const chartData = vista === "diario" ? dataDiaria : dataTurno;
  const xKey = vista === "diario" ? "fecha" : "turno";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5c1020]">Reportes</h1>
          <p className="text-sm text-gray-500">Análisis de cosecha, producción y rendimiento</p>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {["diario", "turno"].map(v => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-4 py-2 text-xs font-semibold capitalize transition-all ${vista === v ? "bg-[#c0392b] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              Por {v}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#f8d7da] border-t-[#c0392b] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Cosecha vs Producción */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-[#5c1020] mb-4">Cosecha vs Producción (kg)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e6e8" />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => v.toLocaleString() + " kg"} />
                <Legend />
                <Bar dataKey="Cosecha" fill="#c0392b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Producción" fill="#276749" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rendimiento */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-[#5c1020] mb-4">Rendimiento productivo (%)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e6e8" />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={v => v + "%"} />
                <Line type="monotone" dataKey="Rendimiento" stroke="#b7791f" strokeWidth={2} dot={{ fill: "#b7791f" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Palets */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-[#5c1020] mb-4">Palets producidos</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e6e8" />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Palets" fill="#7a1a30" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Por variedad */}
          {dataVariedad.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-[#5c1020] mb-4">Producción por variedad (kg)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dataVariedad} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3e6e8" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="variedad" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={v => v.toLocaleString() + " kg"} />
                  <Bar dataKey="Kilos" fill="#c0392b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}