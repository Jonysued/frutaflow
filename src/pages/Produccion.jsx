import { useState } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Plus, Trash2 } from "lucide-react";

export default function Produccion() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filtros, setFiltros] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('prod_filtros')) || { fecha: "", productor: "", envase: "", romaneo: "" }; }
    catch { return { fecha: "", productor: "", envase: "", romaneo: "" }; }
  });
  const [showFiltros, setShowFiltros] = useState(false);

  const setFiltro = (k, v) => setFiltros(f => {
    const next = { ...f, [k]: v };
    sessionStorage.setItem('prod_filtros', JSON.stringify(next));
    return next;
  });
  const limpiarFiltros = () => {
    sessionStorage.removeItem('prod_filtros');
    setFiltros({ fecha: "", productor: "", envase: "", romaneo: "" });
  };
  const filtrosActivos = Object.values(filtros).some(v => v !== "");

  const { data: registros = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['producciones'],
    queryFn: () => base44.entities.Produccion.list('-fecha', 50000),
    staleTime: 1000 * 60 * 5,
  });

  const registrosFiltrados = registros.filter(r =>
    (!filtros.fecha || r.fecha === filtros.fecha) &&
    (!filtros.productor || (r.productor || "").toLowerCase().includes(filtros.productor.toLowerCase())) &&
    (!filtros.envase || (r.envase || "").toLowerCase().includes(filtros.envase.toLowerCase())) &&
    (!filtros.romaneo || (r.nro_romaneo || "").toLowerCase().includes(filtros.romaneo.toLowerCase()))
  );

  const { refreshing } = usePullToRefresh(refetch);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    queryClient.setQueryData(['producciones'], (old = []) => old.filter(r => r.id !== id));
    await base44.entities.Produccion.delete(id);
    queryClient.invalidateQueries({ queryKey: ['producciones'] });
  };



  return (
    <div className="p-4 md:p-6 space-y-4">
      {refreshing && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-[#f8d7da] border-t-[#c0392b] rounded-full animate-spin" />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5c1020]">Producción</h1>
          <p className="text-sm text-gray-500">Kilos procesados, bultos y romaneos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowFiltros(f => !f)}
            className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-xs font-semibold transition-all ${
              filtrosActivos ? "bg-[#276749] text-white border-[#276749]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            🔍 Filtros {filtrosActivos && `(activos)`}
          </button>
          <button onClick={() => navigate('/produccion/new')} className="flex items-center gap-1 px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226]">
            <Plus className="w-3.5 h-3.5" /> Nuevo registro
          </button>
        </div>
      </div>

      {showFiltros && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Fecha</label>
              <input type="date" value={filtros.fecha} onChange={e => setFiltro("fecha", e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#276749]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Productor</label>
              <input value={filtros.productor} onChange={e => setFiltro("productor", e.target.value)} placeholder="Buscar..." className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#276749]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Envase</label>
              <input value={filtros.envase} onChange={e => setFiltro("envase", e.target.value)} placeholder="Buscar..." className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#276749]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Romaneo</label>
              <input value={filtros.romaneo} onChange={e => setFiltro("romaneo", e.target.value)} placeholder="Buscar..." className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#276749]" />
            </div>
          </div>
          {filtrosActivos && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">{registrosFiltrados.length} registros encontrados</span>
              <button onClick={limpiarFiltros} className="text-xs text-red-600 hover:underline">Limpiar filtros</button>
            </div>
          )}
        </div>
      )}




      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#f8d7da] border-t-[#c0392b] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#5c1020] text-white text-xs">
                  <th className="px-3 py-3 text-left">Fecha</th>
                  <th className="px-3 py-3 text-left">Turno</th>
                  <th className="px-3 py-3 text-left hidden sm:table-cell">Productor</th>
                  <th className="px-3 py-3 text-left">Especie</th>
                  <th className="px-3 py-3 text-left hidden sm:table-cell">Variedad</th>
                  <th className="px-3 py-3 text-left hidden md:table-cell">Envase</th>
                  <th className="px-3 py-3 text-left hidden md:table-cell">Calibre</th>
                  <th className="px-3 py-3 text-left hidden md:table-cell">Categoría</th>
                  <th className="px-3 py-3 text-left hidden lg:table-cell">Romaneo</th>
                  <th className="px-3 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.length === 0 && (
                  <tr><td colSpan={13} className="text-center py-10 text-gray-400">No hay registros aún. Cargá manualmente con el botón "Nuevo registro".</td></tr>
                )}
                {registrosFiltrados.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-[#f4fbf7]"}>
                    <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">{r.fecha}</td>
                    <td className="px-3 py-2.5">
                      {r.turno && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#d5f0e1] text-[#276749]">{r.turno}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 hidden sm:table-cell">{r.productor}</td>
                    <td className="px-3 py-2.5 text-gray-700">{r.especie}</td>
                    <td className="px-3 py-2.5 text-gray-700 hidden sm:table-cell">{r.variedad}</td>
                    <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">{r.envase}</td>
                    <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">{r.calibre}</td>
                    <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">{r.categoria}</td>
                    <td className="px-3 py-2.5 text-gray-600 hidden lg:table-cell font-mono text-xs">{r.nro_romaneo}</td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <button onClick={() => navigate(`/produccion/edit/${r.id}`)} className="text-[#c0392b] hover:underline text-xs mr-2">Editar</button>
                      <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}