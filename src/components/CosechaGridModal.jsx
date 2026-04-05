import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, Save } from "lucide-react";
import { format } from "date-fns";

const EMPTY_ROW = () => ({
  fecha: format(new Date(), "yyyy-MM-dd"),
  turno: "Mañana",
  nro_bin: "",
  especie: "GRANADAS",
  propietario: "",
  variedad: "",
  tipo_cosecha: "",
  cuadrilla: "",
  procedencia: "",
  bruto: "",
  tara: "",
  neto: "",
  destino: "VUELCO",
  tipo_proceso: "",
});

const COLS = [
  { key: "fecha", label: "Fecha", type: "date", w: "120px" },
  { key: "turno", label: "Turno", type: "select", opts: ["Mañana", "Tarde", "Noche"], w: "90px" },
  { key: "nro_bin", label: "BIN", type: "text", w: "80px" },
  { key: "especie", label: "Especie", type: "text", w: "100px" },
  { key: "propietario", label: "Propietario", type: "text", w: "110px" },
  { key: "variedad", label: "Variedad", type: "text", w: "100px" },
  { key: "tipo_cosecha", label: "Tipo Cosecha", type: "text", w: "110px" },
  { key: "cuadrilla", label: "Cuadrilla", type: "text", w: "100px" },
  { key: "procedencia", label: "Procedencia", type: "text", w: "110px" },
  { key: "bruto", label: "Bruto", type: "number", w: "80px" },
  { key: "tara", label: "Tara", type: "number", w: "70px" },
  { key: "neto", label: "Neto", type: "number", w: "80px" },
  { key: "destino", label: "Destino", type: "select", opts: ["VUELCO", "CAMARA", "PROCESO", "OTRO"], w: "90px" },
  { key: "tipo_proceso", label: "Proceso", type: "text", w: "90px" },
];

export default function CosechaGridModal({ onClose, onSaved }) {
  const [rows, setRows] = useState([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);
  const [saving, setSaving] = useState(false);

  const setCell = (i, key, val) => {
    setRows(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: val };
      if (key === "bruto" || key === "tara") {
        const b = key === "bruto" ? Number(val) : Number(next[i].bruto);
        const t = key === "tara" ? Number(val) : Number(next[i].tara);
        if (!isNaN(b) && !isNaN(t)) next[i].neto = b - t;
      }
      return next;
    });
  };

  const addRow = () => setRows(prev => [...prev, EMPTY_ROW()]);
  const removeRow = (i) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    const valid = rows.filter(r => r.nro_bin && r.variedad && r.bruto !== "");
    if (valid.length === 0) return;
    setSaving(true);
    const data = valid.map(r => ({
      ...r,
      bruto: Number(r.bruto) || 0,
      tara: Number(r.tara) || 0,
      neto: Number(r.neto) || 0,
    }));
    await base44.entities.Cosecha.bulkCreate(data);
    setSaving(false);
    onSaved();
  };

  const inputCls = "border-0 bg-transparent px-1 py-1 text-xs w-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#c0392b] rounded";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-[#5c1020] text-sm">Carga masiva de BINs</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-gray-700" /></button>
        </div>
        <div className="overflow-auto flex-1 p-4">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr className="bg-[#5c1020] text-white">
                <th className="px-2 py-2 text-left w-8">#</th>
                {COLS.map(c => (
                  <th key={c.key} className="px-2 py-2 text-left whitespace-nowrap" style={{ minWidth: c.w }}>{c.label}</th>
                ))}
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-2 py-1 text-gray-400 text-center">{i + 1}</td>
                  {COLS.map(c => (
                    <td key={c.key} className="border border-gray-100 p-0">
                      {c.type === "select" ? (
                        <select value={row[c.key]} onChange={e => setCell(i, c.key, e.target.value)} className={inputCls}>
                          {c.opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={c.type}
                          value={row[c.key]}
                          onChange={e => setCell(i, c.key, e.target.value)}
                          className={inputCls}
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-1 text-center">
                    <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="mt-3 flex items-center gap-1 text-xs text-[#c0392b] hover:underline">
            <Plus className="w-3.5 h-3.5" /> Agregar fila
          </button>
        </div>
        <div className="px-5 py-4 border-t flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60"
          >
            {saving ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</> : <><Save className="w-3.5 h-3.5" /> Guardar filas</>}
          </button>
        </div>
      </div>
    </div>
  );
}