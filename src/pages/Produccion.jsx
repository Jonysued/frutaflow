import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Upload, Trash2, Download } from "lucide-react";
import ProduccionForm from "@/components/ProduccionForm.jsx";
import ImportModal from "@/components/ImportModal";

export default function Produccion() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.Produccion.list("-fecha", 50000).then(r => { setRegistros(r); setLoading(false); });
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    await base44.entities.Produccion.delete(id);
    load();
  };

  const handleSave = () => { setShowForm(false); setEditItem(null); load(); };

  const downloadTemplate = () => {
    const sep = ";";
    const cols = ["fecha","turno","productor","especie","variedad","categoria","envase","calibre","cant_bultos","tipo_palet","kg_bruto","tipo_caja","tara","kg_netos","nro_romaneo"];
    const example = ["2026-02-25","Mañana","F500","GRANADAS","ACCO","Cat 1","CAJA WENCO","12","114","Comun","940","wenco","60","880","W1"];
    const content = "\uFEFF" + cols.join(sep) + "\n" + example.join(sep);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "plantilla_produccion.csv"; a.click();
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5c1020]">Producción</h1>
          <p className="text-sm text-gray-500">Kilos procesados, bultos y romaneos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" /> Plantilla CSV
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1 px-3 py-2 border border-[#7a1a30] rounded-lg text-xs text-[#7a1a30] hover:bg-red-50">
            <Upload className="w-3.5 h-3.5" /> Importar Excel
          </button>
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-1 px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226]">
            <Plus className="w-3.5 h-3.5" /> Nuevo registro
          </button>
        </div>
      </div>

      {(showForm || editItem) && (
        <ProduccionForm item={editItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null); }} />
      )}
      {showImport && <ImportModal entity="Produccion" onClose={() => { setShowImport(false); load(); }} />}

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
                {registros.length === 0 && (
                  <tr><td colSpan={13} className="text-center py-10 text-gray-400">No hay registros aún. Importá tu planilla Excel o cargá manualmente.</td></tr>
                )}
                {registros.map((r, i) => (
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