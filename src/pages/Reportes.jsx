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
      base44.entities.Cosecha.list("-fecha", 50000),
      base44.entities.Produccion.list("-fecha", 50000)
    ]).then(([c, p]) => { setCosechas(c); setProducciones(p); setLoading(false); });
  }, []);

  const fechas = [...new Set([...cosechas.map(c => c.fecha), ...producciones.map(p => p.fecha)])].sort().slice(-30);

  const dataDiaria = fechas.map(f => {
    const cKg = cosechas.filter(c => c.fecha === f).reduce((s, c) => s + (c.neto || 0), 0);
    const pKg = producciones.filter(p => p.fecha === f).reduce((s, p) => s + (p.kg_netos || 0), 0);
    const bultos = producciones.filter(p => p.fecha === f).reduce((s, p) => s + (p.cant_bultos || 0), 0);
    const rendimiento = cKg > 0 ? parseFloat(((pKg / cKg) * 100).toFixed(1)) : 0;
    return { label: f.slice(5), Cosecha: cKg, Producción: pKg, Bultos: bultos, Rendimiento: rendimiento };
  });

  const turnos = ["Mañana", "Tarde", "Noche"];
  const dataTurno = turnos.map(t => {
    const cKg = cosechas.filter(c => c.turno === t).reduce((s, c) => s + (c.neto || 0), 0);
    const pKg = producciones.filter(p => p.turno === t).reduce((s, p) => s + (p.kg_netos || 0), 0);
    const bultos = producciones.filter(p => p.turno === t).reduce((s, p) => s + (p.cant_bultos || 0), 0);
    const rendimiento = cKg > 0 ? parseFloat(((pKg / cKg) * 100).toFixed(1)) : 0;
    return { label: t, Cosecha: cKg, Producción: pKg, Bultos: bultos, Rendimiento: rendimiento };
  });

  // By variedad
  const variedades = [...new Set(cosechas.map(c => c.variedad))];
  const dataVariedad = variedades.map(v => ({
    variedad: v,
    "Cosecha (kg neto)": cosechas.filter(c => c.variedad === v).reduce((s, c) => s + (c.neto || 0), 0),
    "Producción (kg neto)": producciones.filter(p => p.variedad === v).reduce((s, p) => s + (p.kg_netos || 0), 0),
  })).sort((a, b) => b["Cosecha (kg neto)"] - a["Cosecha (kg neto)"]);

  const chartData = vista === "diario" ? dataDiaria : dataTurno;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5c1020]">Reportes</h1>
          <p className="text-sm text-gray-500">Análisis de cosecha, producción y rendimiento</p>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {["diario", "turno"].map(v => (
            <button key={v} onClick={() => setVista(v)} className={`px-4 py-2 text-xs font-semibold capitalize transition-all ${vista === v ? "bg-[#c0392b] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
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
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-[#5c1020] mb-4">Cosecha (neto) vs Producción (kg netos)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e6e8" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => v.toLocaleString() + " kg"} />
                <Legend />
                <Bar dataKey="Cosecha" fill="#c0392b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Producción" fill="#276749" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-[#5c1020] mb-4">Rendimiento productivo (Producción / Cosecha %)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e6e8" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={v => v + "%"} />
                <Line type="monotone" dataKey="Rendimiento" stroke="#b7791f" strokeWidth={2} dot={{ fill: "#b7791f" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-[#5c1020] mb-4">Bultos producidos</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e6e8" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Bultos" fill="#7a1a30" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {dataVariedad.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-[#5c1020] mb-4">Cosecha vs Producción por Variedad</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dataVariedad} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3e6e8" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="variedad" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={v => v.toLocaleString() + " kg"} />
                  <Legend />
                  <Bar dataKey="Cosecha (kg neto)" fill="#c0392b" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Producción (kg neto)" fill="#276749" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}