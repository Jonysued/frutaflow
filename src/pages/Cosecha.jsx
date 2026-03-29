import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Upload, Trash2, Download } from "lucide-react";
import CosechaForm from "@/components/CosechaForm";
import ImportModal from "@/components/ImportModal";

export default function Cosecha() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.Cosecha.list("-fecha", 300).then(r => { setRegistros(r); setLoading(false); });
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este BIN?")) return;
    await base44.entities.Cosecha.delete(id);
    load();
  };

  const handleSave = () => { setShowForm(false); setEditItem(null); load(); };

  const downloadTemplate = () => {
    const header = "fecha,turno,nro_bin,especie,propietario,tipo_cosecha,cuadrilla,procedencia,variedad,bruto,tara,neto,destino,tipo_proceso,fecha_vuelco,kgs_vuelco,stock_camara";
    const example = "2026-02-24,Mañana,67,GRANADAS,F500,BARRIDO,GARCIA,OP1SE,WONDERFUL,265,30,235,VUELCO,ARILO,2026-02-25,-235,";
    const blob = new Blob([header + "\n" + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "plantilla_cosecha.csv"; a.click();
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5c1020]">Cosecha</h1>
          <p className="text-sm text-gray-500">Registro de BINs cosechados por fecha y turno</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" /> Plantilla CSV
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1 px-3 py-2 border border-[#7a1a30] rounded-lg text-xs text-[#7a1a30] hover:bg-red-50">
            <Upload className="w-3.5 h-3.5" /> Importar Excel
          </button>
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-1 px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226]">
            <Plus className="w-3.5 h-3.5" /> Nuevo BIN
          </button>
        </div>
      </div>

      {(showForm || editItem) && (
        <CosechaForm item={editItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null); }} />
      )}
      {showImport && <ImportModal entity="Cosecha" onClose={() => { setShowImport(false); load(); }} />}

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
                {registros.length === 0 && (
                  <tr><td colSpan={13} className="text-center py-10 text-gray-400">No hay registros aún. Importá tu planilla Excel o cargá manualmente.</td></tr>
                )}
                {registros.map((r, i) => (
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
                      <button onClick={() => { setEditItem(r); setShowForm(true); }} className="text-[#c0392b] hover:underline text-xs mr-2">Editar</button>
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