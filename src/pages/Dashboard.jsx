import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { format, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Wheat, Package, Layers, TrendingUp, AlertTriangle, Thermometer, Trash2, Grape, Leaf } from "lucide-react";

const TURNOS = ["Mañana", "Tarde", "Noche"];
const TURNO_COLORS = { Mañana: "#c0392b", Tarde: "#7a1a30", Noche: "#2c0a12" };

function MetricCard({ label, value, unit, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 flex items-center gap-4" style={{ borderColor: color }}>
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

function TurnoCard({ turno, cosechaKg, produccionKg, bultos }) {
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
            <p className="text-[11px] text-gray-400">Vuelco / Cosecha (kg)</p>
            <p className="font-bold text-gray-800">{cosechaKg.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Producción (kg netos)</p>
            <p className="font-bold text-gray-800">{produccionKg.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Bultos</p>
            <p className="font-bold text-gray-800">{bultos.toLocaleString()}</p>
          </div>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 mb-1">Rendimiento (prod / cosecha)</p>
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
  const [fechaIniciada, setFechaIniciada] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    return Promise.all([
      base44.entities.Cosecha.list("-fecha", 50000),
      base44.entities.Produccion.list("-fecha", 50000)
    ]).then(([c, p]) => {
      setCosechas(c);
      setProducciones(p);
      setLoading(false);
      if (!fechaIniciada) {
        const todasFechas = [...new Set([...c.map(x => x.fecha_vuelco).filter(Boolean), ...p.map(x => x.fecha)])].filter(Boolean).sort();
        if (todasFechas.length > 0) setFecha(todasFechas[todasFechas.length - 1]);
        setFechaIniciada(true);
      }
    });
  }, [fechaIniciada]);

  useEffect(() => { loadData(); }, []);

  const { refreshing } = usePullToRefresh(loadData);

  // Cosecha: filtrar por fecha_vuelco (cuando el BIN fue volcado/procesado)
  const cosechasDia = cosechas.filter(c => c.fecha_vuelco === fecha);
  // Producción: filtrar por fecha de producción
  const produccionesDia = producciones.filter(p => p.fecha === fecha);

  // Cosecha = suma de netos del día
  const totalCosechaKg = cosechasDia.reduce((s, c) => s + (c.neto || 0), 0);
  // Producción = suma de kg_netos del día
  const totalProdKg = produccionesDia.reduce((s, p) => s + (p.kg_netos || 0), 0);
  // Bultos totales
  const totalBultos = produccionesDia.reduce((s, p) => s + (p.cant_bultos || 0), 0);
  // Rendimiento = producción / cosecha
  const rendimientoDia = totalCosechaKg > 0 ? (totalProdKg / totalCosechaKg) * 100 : 0;

  // % Arilos y % Fresco desde Producción (tipo_proceso en cosecha)
  const kgArilos = cosechasDia.filter(c => c.tipo_proceso === "ARILO").reduce((s, c) => s + (c.neto || 0), 0);
  const kgFresco = cosechasDia.filter(c => c.tipo_proceso === "FRESCO").reduce((s, c) => s + (c.neto || 0), 0);
  const pctArilos = totalCosechaKg > 0 ? (kgArilos / totalCosechaKg * 100) : 0;
  const pctFresco = totalCosechaKg > 0 ? (kgFresco / totalCosechaKg * 100) : 0;

  const turnosActivos = TURNOS.filter(t =>
    cosechasDia.some(c => c.turno === t) || produccionesDia.some(p => p.turno === t)
  );

  // Chart last 7 unique dates (cosecha por fecha_vuelco, producción por fecha)
  const fechas = [...new Set([...cosechas.map(c => c.fecha_vuelco).filter(Boolean), ...producciones.map(p => p.fecha)])].sort().slice(-7);
  const chartData = fechas.map(f => {
    const cKg = cosechas.filter(c => c.fecha_vuelco === f).reduce((s, c) => s + (c.neto || 0), 0);
    const pKg = producciones.filter(p => p.fecha === f).reduce((s, p) => s + (p.kg_netos || 0), 0);
    return {
      fecha: f.slice(5),
      "Cosecha (kg neto)": cKg,
      "Producción (kg neto)": pKg,
    };
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {refreshing && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-[#f8d7da] border-t-[#c0392b] rounded-full animate-spin" />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5c1020]">Dashboard</h1>
          <p className="text-sm text-gray-500">Balance por fecha de vuelco y fecha de producción</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Vuelco / Cosecha" value={totalCosechaKg.toLocaleString()} unit="kg" icon={Wheat} color="#c0392b" />
            <MetricCard label="Producción (kg netos)" value={totalProdKg.toLocaleString()} unit="kg" icon={Package} color="#7a1a30" />
            <MetricCard label="Bultos producidos" value={totalBultos.toLocaleString()} unit="blt" icon={Layers} color="#276749" />
            <MetricCard label="Rendimiento" value={rendimientoDia.toFixed(1)} unit="%" icon={TrendingUp} color="#b7791f" />
            <MetricCard label="Descarte" value={(totalCosechaKg - totalProdKg > 0 ? totalCosechaKg - totalProdKg : 0).toLocaleString()} unit="kg" icon={Trash2} color="#6b7280" />
            <MetricCard label="% Descarte" value={totalCosechaKg > 0 ? ((totalCosechaKg - totalProdKg) / totalCosechaKg * 100).toFixed(1) : "0.0"} unit="%" icon={Trash2} color="#6b7280" />
            <MetricCard label="% Arilos" value={pctArilos.toFixed(1)} unit="%" icon={Grape} color="#7c3aed" />
            <MetricCard label="% Fresco" value={pctFresco.toFixed(1)} unit="%" icon={Leaf} color="#276749" />
          </div>

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
                    cosechaKg={cosechasDia.filter(c => c.turno === turno).reduce((s, c) => s + (c.neto || 0), 0)}
                    produccionKg={produccionesDia.filter(p => p.turno === turno).reduce((s, p) => s + (p.kg_netos || 0), 0)}
                    bultos={produccionesDia.filter(p => p.turno === turno).reduce((s, p) => s + (p.cant_bultos || 0), 0)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Por Productor */}
          {(() => {
            const productores = [...new Set([
              ...cosechasDia.map(c => c.propietario || c.productor).filter(Boolean),
              ...produccionesDia.map(p => p.productor || p.propietario).filter(Boolean)
            ])];
            if (productores.length === 0) return null;
            return (
              <div>
                <h2 className="text-base font-semibold text-[#5c1020] mb-3">Vista por Productor</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#5c1020] text-white text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Productor</th>
                        <th className="px-4 py-3 text-right">Cosecha (kg neto)</th>
                        <th className="px-4 py-3 text-right">Producción (kg netos)</th>
                        <th className="px-4 py-3 text-right">Bultos</th>
                        <th className="px-4 py-3 text-right">Rendimiento</th>
                        <th className="px-4 py-3 text-right">Descarte (kg)</th>
                        <th className="px-4 py-3 text-right">% Descarte</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productores.map((prod, i) => {
                        const cKg = cosechasDia.filter(c => (c.propietario || c.productor) === prod).reduce((s, c) => s + (c.neto || 0), 0);
                        const pKg = produccionesDia.filter(p => (p.productor || p.propietario) === prod).reduce((s, p) => s + (p.kg_netos || 0), 0);
                        const blt = produccionesDia.filter(p => (p.productor || p.propietario) === prod).reduce((s, p) => s + (p.cant_bultos || 0), 0);
                        const rend = cKg > 0 ? (pKg / cKg * 100).toFixed(1) : "—";
                        const descarte = cKg - pKg;
                        const pctDescarte = cKg > 0 ? (descarte / cKg * 100).toFixed(1) : "—";
                        return (
                          <tr key={prod} className={i % 2 === 0 ? "bg-white" : "bg-[#fdf4f5]"}>
                            <td className="px-4 py-2.5 font-medium text-gray-800">{prod}</td>
                            <td className="px-4 py-2.5 text-right text-gray-700">{cKg.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right text-gray-700">{pKg.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right text-gray-700">{blt.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right font-semibold" style={{ color: rend !== "—" && Number(rend) >= 75 ? "#276749" : rend !== "—" && Number(rend) >= 50 ? "#b7791f" : "#c0392b" }}>{rend}{rend !== "—" ? "%" : ""}</td>
                            <td className="px-4 py-2.5 text-right text-gray-700">{descarte > 0 ? descarte.toLocaleString() : "0"}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-gray-600">{pctDescarte !== "—" ? pctDescarte + "%" : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* BINs en Cámara */}
          {(() => {
            const hoy = new Date();
            const binsEnCamara = cosechas
              .filter(c => c.destino === "CAMARA" && !c.fecha_vuelco && !c.kgs_vuelco)
              .map(c => ({
                ...c,
                diasEnCamara: c.fecha ? differenceInDays(hoy, parseISO(c.fecha)) : 0
              }))
              .sort((a, b) => b.diasEnCamara - a.diasEnCamara);

            if (binsEnCamara.length === 0) return null;

            return (
              <BinsCamaraSection bins={binsEnCamara} />
            );
          })()}

          {/* Gráfico % por Calibre (Producción Fresco) */}
          {(() => {
            const NO_CALIBRES = ["ARILO", "Arilo", "arilo", "AG", "AC"];
            const calibreMap = {};
            produccionesDia.forEach(p => {
              if (!p.calibre || NO_CALIBRES.includes(p.calibre)) return;
              calibreMap[p.calibre] = (calibreMap[p.calibre] || 0) + (p.kg_netos || 0);
            });
            const totalCalibre = Object.values(calibreMap).reduce((s, v) => s + v, 0);
            const calibreData = Object.entries(calibreMap)
              .map(([calibre, kg]) => ({ calibre, pct: totalCalibre > 0 ? parseFloat((kg / totalCalibre * 100).toFixed(1)) : 0, kg }))
              .sort((a, b) => b.pct - a.pct);
            if (calibreData.length === 0) return null;
            return (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-[#5c1020] mb-1">% por Calibre — Producción Fresco</h2>
                <p className="text-xs text-gray-400 mb-4">Distribución de kg netos por calibre en la fecha seleccionada</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={calibreData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3e6e8" />
                    <XAxis dataKey="calibre" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                    <Tooltip formatter={(v, _n, props) => [`${v}% (${props.payload.kg.toLocaleString()} kg)`, "Participación"]} />
                    <Bar dataKey="pct" fill="#276749" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, formatter: v => v + '%' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          {chartData.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-[#5c1020] mb-4">Últimos 7 días — Cosecha vs Producción (kg netos)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3e6e8" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => v.toLocaleString() + " kg"} />
                  <Bar dataKey="Cosecha (kg neto)" fill="#c0392b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Producción (kg neto)" fill="#276749" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BinsCamaraSection({ bins }) {
  const [umbral, setUmbral] = useState(7);
  const vencidos = bins.filter(b => b.diasEnCamara >= umbral);
  const ok = bins.filter(b => b.diasEnCamara < umbral);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[#5c1020]">BINs en Cámara sin procesar</h2>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{bins.length} BINs</span>
          {vencidos.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {vencidos.length} superan umbral
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500 text-xs">Alerta después de</label>
          <input
            type="number"
            min={1}
            value={umbral}
            onChange={e => setUmbral(Number(e.target.value))}
            className="w-16 border rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#c0392b]"
          />
          <span className="text-gray-500 text-xs">días</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1a4a6b] text-white text-xs">
              <tr>
                <th className="px-3 py-3 text-left">BIN</th>
                <th className="px-3 py-3 text-left">Fecha ingreso</th>
                <th className="px-3 py-3 text-left hidden sm:table-cell">Propietario</th>
                <th className="px-3 py-3 text-left hidden sm:table-cell">Variedad</th>
                <th className="px-3 py-3 text-right">Neto (kg)</th>
                <th className="px-3 py-3 text-center">Días en cámara</th>
              </tr>
            </thead>
            <tbody>
              {bins.map((b, i) => {
                const alerta = b.diasEnCamara >= umbral;
                return (
                  <tr key={b.id} className={alerta ? "bg-red-50 border-l-4 border-red-400" : i % 2 === 0 ? "bg-white" : "bg-blue-50/30"}>
                    <td className="px-3 py-2.5 font-mono font-bold text-[#1a4a6b]">{b.nro_bin}</td>
                    <td className="px-3 py-2.5 text-gray-700">{b.fecha}</td>
                    <td className="px-3 py-2.5 text-gray-600 hidden sm:table-cell">{b.propietario}</td>
                    <td className="px-3 py-2.5 text-gray-600 hidden sm:table-cell">{b.variedad}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{b.neto?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        alerta ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {alerta && <AlertTriangle className="w-3 h-3" />}
                        {b.diasEnCamara}d
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}