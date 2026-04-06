import { useState } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Plus, Upload, Trash2 } from "lucide-react";
import ImportModal from "@/components/ImportModal";

export default function Cosecha() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showImport, setShowImport] = useState(false);
  const [filtros, setFiltros] = useState({ fecha: "", cuadrilla: "", procedencia: "" });
  const [showFiltros, setShowFiltros] = useState(false);

  const setFiltro = (k, v) => setFiltros(f => ({ ...f, [k]: v }));
  const limpiarFiltros = () => setFiltros({ fecha: "", cuadrilla: "", procedencia: "" });
  const filtrosActivos = Object.values(filtros).some(v => v !== "");

  const { data: registros = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['cosechas'],
    queryFn: () => base44.entities.Cosecha.list('-fecha'),
    staleTime: 1000 * 60 * 5,
  });

  const registrosFiltrados = registros.filter(r =>
    (!filtros.fecha || r.fecha === filtros.fecha) &&
    (!filtros.cuadrilla || (r.cuadrilla || "").toLowerCase().includes(filtros.cuadrilla.toLowerCase())) &&
    (!filtros.procedencia || (r.procedencia || "").toLowerCase().includes(filtros.procedencia.toLowerCase()))
  );

  const { refreshing } = usePullToRefresh(refetch);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este BIN?")) return;
    queryClient.setQueryData(['cosechas'], (old = []) => old.filter(r => r.id !== id));
    await base44.entities.Cosecha.delete(id);
    queryClient.invalidateQueries({ queryKey: ['cosechas'] });
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
          <h1 className="text-2xl font-bold text-[#5c1020]">Cosecha</h1>
          <p className="text-sm text-gray-500">Registro de BINs cosechados por fecha y turno</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowFiltros(f => !f)}
            className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-xs font-semibold transition-all ${
              filtrosActivos ? "bg-[#c0392b] text-white border-[#c0392b]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            🔍 Filtros {filtrosActivos && `(activos)`}
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1 px-3 py-2 border border-[#7a1a30] rounded-lg text-xs text-[#7a1a30] hover:bg-red-50">
            <Upload className="w-3.5 h-3.5" /> Importar
          </button>
          <button onClick={() => navigate('/cosecha/new')} className="flex items-center gap-1 px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226]">
            <Plus className="w-3.5 h-3.5" /> Nuevo BIN
          </button>
        </div>
      </div>




      {showFiltros && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Fecha</label>
              <input type="date" value={filtros.fecha} onChange={e => setFiltro("fecha", e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Cuadrilla</label>
              <input value={filtros.cuadrilla} onChange={e => setFiltro("cuadrilla", e.target.value)} placeholder="Buscar..." className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Procedencia</label>
              <input value={filtros.procedencia} onChange={e => setFiltro("procedencia", e.target.value)} placeholder="Buscar..." className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
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

      {showImport && <ImportModal entity="Cosecha" onClose={() => { setShowImport(false); refetch(); }} />}

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
                  <th className="px-3 py-3 text-left">BIN</th>
                  <th className="px-3 py-3 text-left">Especie</th>
                  <th className="px-3 py-3 text-left hidden sm:table-cell">Variedad</th>
                  <th className="px-3 py-3 text-left hidden md:table-cell">Cuadrilla</th>
                  <th className="px-3 py-3 text-left hidden md:table-cell">Procedencia</th>
                  <th className="px-3 py-3 text-right">Bruto</th>
                  <th className="px-3 py-3 text-right">Tara</th>
                  <th className="px-3 py-3 text-right font-bold">Neto</th>
                  <th className="px-3 py-3 text-left hidden lg:table-cell">Destino</th>
                  <th className="px-3 py-3 text-left hidden lg:table-cell">Proceso</th>
                  <th className="px-3 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.length === 0 && (
                  <tr><td colSpan={13} className="text-center py-10 text-gray-400">No hay registros aún. Cargá manualmente con el botón "Nuevo BIN".</td></tr>
                )}
                {registrosFiltrados.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-[#fdf4f5]"}>
                    <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">{r.fecha}</td>
                    <td className="px-3 py-2.5">
                      {r.turno && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f8d7da] text-[#7a1a30]">{r.turno}</span>}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-[#5c1020]">{r.nro_bin}</td>
                    <td className="px-3 py-2.5 text-gray-700">{r.especie}</td>
                    <td className="px-3 py-2.5 text-gray-700 hidden sm:table-cell">{r.variedad}</td>
                    <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">{r.cuadrilla}</td>
                    <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">{r.procedencia}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{r.bruto?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{r.tara?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-[#5c1020]">{r.neto?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-600">{r.destino}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs hidden lg:table-cell">{r.tipo_proceso}</td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <button onClick={() => navigate(`/cosecha/edit/${r.id}`)} className="text-[#c0392b] hover:underline text-xs mr-2">Editar</button>
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