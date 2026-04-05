import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Save, Search } from "lucide-react";

export default function CosechaEdicionMasivaModal({ onClose, onSaved }) {
  const [registros, setRegistros] = useState([]);
  const [editMap, setEditMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState("");

  useEffect(() => {
    base44.entities.Cosecha.list("-fecha", 500).then(data => {
      setRegistros(data);
      const map = {};
      data.forEach(r => {
        map[r.id] = {
          destino: r.destino || "",
          tipo_proceso: r.tipo_proceso || "",
          fecha_vuelco: r.fecha_vuelco || "",
          kgs_vuelco: r.kgs_vuelco ?? "",
          stock_camara: r.stock_camara ?? "",
        };
      });
      setEditMap(map);
      setLoading(false);
    });
  }, []);

  const setCell = (id, key, val) => {
    setEditMap(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = registros.map(r =>
      base44.entities.Cosecha.update(r.id, {
        destino: editMap[r.id]?.destino,
        tipo_proceso: editMap[r.id]?.tipo_proceso,
        fecha_vuelco: editMap[r.id]?.fecha_vuelco || null,
        kgs_vuelco: editMap[r.id]?.kgs_vuelco !== "" ? Number(editMap[r.id]?.kgs_vuelco) : null,
        stock_camara: editMap[r.id]?.stock_camara !== "" ? Number(editMap[r.id]?.stock_camara) : null,
      })
    );
    await Promise.all(updates);
    setSaving(false);
    onSaved();
  };

  const filtrados = filtroFecha ? registros.filter(r => r.fecha === filtroFecha) : registros;
  const inputCls = "border-0 bg-transparent px-1 py-1 text-xs w-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#c0392b] rounded";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-[#5c1020] text-sm">Edición masiva — Destino, proceso y vuelco</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-gray-700" /></button>
        </div>

        <div className="px-5 py-3 border-b flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)}
            className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]"
          />
          <span className="text-xs text-gray-400">{filtrados.length} registros</span>
          {filtroFecha && (
            <button onClick={() => setFiltroFecha("")} className="text-xs text-red-600 hover:underline">Limpiar</button>
          )}
        </div>

        <div className="overflow-auto flex-1 p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-4 border-[#f8d7da] border-t-[#c0392b] rounded-full animate-spin" />
            </div>
          ) : (
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr className="bg-[#5c1020] text-white">
                  <th className="px-2 py-2 text-left">Fecha</th>
                  <th className="px-2 py-2 text-left">BIN</th>
                  <th className="px-2 py-2 text-left hidden sm:table-cell">Variedad</th>
                  <th className="px-2 py-2 text-right hidden sm:table-cell">Neto (kg)</th>
                  <th className="px-2 py-2 text-left" style={{ minWidth: "100px" }}>Destino</th>
                  <th className="px-2 py-2 text-left" style={{ minWidth: "100px" }}>Tipo Proceso</th>
                  <th className="px-2 py-2 text-left" style={{ minWidth: "110px" }}>Fecha Vuelco</th>
                  <th className="px-2 py-2 text-left" style={{ minWidth: "90px" }}>Kgs Vuelco</th>
                  <th className="px-2 py-2 text-left" style={{ minWidth: "90px" }}>Stock Cámara</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{r.fecha}</td>
                    <td className="px-2 py-1.5 font-mono font-bold text-[#5c1020]">{r.nro_bin}</td>
                    <td className="px-2 py-1.5 text-gray-600 hidden sm:table-cell">{r.variedad}</td>
                    <td className="px-2 py-1.5 text-right text-gray-700 hidden sm:table-cell">{r.neto?.toLocaleString()}</td>
                    <td className="border border-gray-100 p-0">
                      <select value={editMap[r.id]?.destino || ""} onChange={e => setCell(r.id, "destino", e.target.value)} className={inputCls}>
                        <option value="">--</option>
                        {["VUELCO","CAMARA","PROCESO","OTRO"].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="border border-gray-100 p-0">
                      <select value={editMap[r.id]?.tipo_proceso || ""} onChange={e => setCell(r.id, "tipo_proceso", e.target.value)} className={inputCls}>
                        <option value="">--</option>
                        {["ARILO","GRANO","JUGO","FRESCO","OTRO"].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="border border-gray-100 p-0">
                      <input type="date" value={editMap[r.id]?.fecha_vuelco || ""} onChange={e => setCell(r.id, "fecha_vuelco", e.target.value)} className={inputCls} />
                    </td>
                    <td className="border border-gray-100 p-0">
                      <input type="number" value={editMap[r.id]?.kgs_vuelco ?? ""} onChange={e => setCell(r.id, "kgs_vuelco", e.target.value)} className={inputCls} />
                    </td>
                    <td className="border border-gray-100 p-0">
                      <input type="number" value={editMap[r.id]?.stock_camara ?? ""} onChange={e => setCell(r.id, "stock_camara", e.target.value)} className={inputCls} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-5 py-4 border-t flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60"
          >
            {saving ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</> : <><Save className="w-3.5 h-3.5" /> Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  );
}