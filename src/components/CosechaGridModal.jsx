import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

const TURNOS = ["Mañana", "Tarde", "Noche"];
const DESTINOS_DEFAULT = ["VUELCO", "CAMARA", "PROCESO", "OTRO"];

function newRow(fecha) {
  return {
    _id: Math.random().toString(36).slice(2),
    fecha: fecha || format(new Date(), "yyyy-MM-dd"),
    turno: "Mañana",
    nro_bin: "",
    especie: "GRANADAS",
    propietario: "",
    variedad: "",
    tipo_cosecha: "",
    cuadrilla: "",
    procedencia: "",
    tipo_bin: "",
    bruto: "",
    tara: "",
    neto: "",
    destino: "VUELCO",
  };
}

export default function CosechaGridModal({ onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [configTaras, setConfigTaras] = useState([]);
  const [propietarios, setPropietarios] = useState([]);
  const [procedencias, setProcedencias] = useState([]);
  const [variedades, setVariedades] = useState([]);
  const [tiposCosecha, setTiposCosecha] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [rows, setRows] = useState(() => Array.from({ length: 10 }, () => newRow(format(new Date(), "yyyy-MM-dd"))));

  useEffect(() => {
    Promise.all([
      base44.entities.ConfigTara.list(),
      base44.entities.Propietario.list(),
      base44.entities.Procedencia.list(),
      base44.entities.Variedad.list(),
      base44.entities.TipoCosecha.list(),
      base44.entities.Cuadrilla.list(),
      base44.entities.Destino.list(),
    ]).then(([taras, props, procs, vars, tcos, cuads, dests]) => {
      setConfigTaras(taras);
      setPropietarios(props);
      setProcedencias(procs);
      setVariedades(vars);
      setTiposCosecha(tcos);
      setCuadrillas(cuads);
      setDestinos(dests.length ? dests : DESTINOS_DEFAULT.map(n => ({ nombre: n })));
    });
  }, []);

  const set = (id, field, value) => {
    setRows(prev => prev.map(r => {
      if (r._id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === "tipo_bin") {
        const cfg = configTaras.find(c => c.tipo_bin === value);
        if (cfg) {
          updated.tara = cfg.tara_kg;
          if (updated.bruto) updated.neto = Number(updated.bruto) - cfg.tara_kg;
        }
      }
      if (field === "bruto") {
        if (!updated.tipo_bin) {
          const tara = Number(value) > 300 ? 55 : 30;
          updated.tara = tara;
          updated.neto = Number(value) - tara;
        } else if (updated.tara) {
          updated.neto = Number(value) - Number(updated.tara);
        }
      }
      if (field === "tara" && updated.bruto) {
        updated.neto = Number(updated.bruto) - Number(value);
      }
      return updated;
    }));
  };

  const addRows = () => {
    const fecha = rows[0]?.fecha || format(new Date(), "yyyy-MM-dd");
    setRows(prev => [...prev, ...Array.from({ length: 5 }, () => newRow(fecha))]);
  };

  const removeRow = (id) => setRows(prev => prev.filter(r => r._id !== id));

  const handleSave = async () => {
    const valid = rows.filter(r => r.nro_bin.trim() !== "");
    if (valid.length === 0) { onClose(); return; }
    setSaving(true);
    const cleaned = valid.map(({ _id, ...r }) => ({
      ...r,
      bruto: Number(r.bruto) || 0,
      tara: Number(r.tara) || 0,
      neto: Number(r.neto) || 0,
    }));
    await base44.entities.Cosecha.bulkCreate(cleaned);
    setSaving(false);
    onSaved();
  };

  const inputCls = "w-full border-0 border-b border-gray-200 px-1 py-1 text-xs focus:outline-none focus:border-[#c0392b] bg-transparent";
  const selCls = "w-full border-0 border-b border-gray-200 px-1 py-1 text-xs focus:outline-none focus:border-[#c0392b] bg-transparent";

  const propNombres = propietarios.map(p => p.nombre);
  const procNombres = procedencias.map(p => p.nombre);
  const varNombres = variedades.map(v => v.nombre);
  const tcoNombres = tiposCosecha.map(t => t.nombre);
  const cuadNombres = cuadrillas.map(c => c.nombre);
  const destNombres = destinos.map(d => d.nombre || d);
  const binNombres = configTaras.map(t => t.tipo_bin);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center p-2">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[99vw] flex flex-col max-h-[97vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <div>
            <h2 className="font-bold text-[#5c1020] text-base">Carga Masiva de BINs</h2>
            <p className="text-xs text-gray-400">Completá las filas. La tara se calcula automáticamente. Solo se guardan filas con Nro BIN.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-700" /></button>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#5c1020] text-white text-[11px]">
                <th className="px-2 py-2 text-left w-8">#</th>
                <th className="px-2 py-2 text-left min-w-[110px]">Fecha</th>
                <th className="px-2 py-2 text-left min-w-[90px]">Turno</th>
                <th className="px-2 py-2 text-left min-w-[70px]">BIN *</th>
                <th className="px-2 py-2 text-left min-w-[90px]">Especie</th>
                <th className="px-2 py-2 text-left min-w-[100px]">Propietario</th>
                <th className="px-2 py-2 text-left min-w-[100px]">Variedad</th>
                <th className="px-2 py-2 text-left min-w-[100px]">Tipo Cosecha</th>
                <th className="px-2 py-2 text-left min-w-[90px]">Cuadrilla</th>
                <th className="px-2 py-2 text-left min-w-[100px]">Procedencia</th>
                <th className="px-2 py-2 text-left min-w-[90px]">Tipo BIN</th>
                <th className="px-2 py-2 text-right min-w-[75px]">Bruto</th>
                <th className="px-2 py-2 text-right min-w-[65px]">Tara</th>
                <th className="px-2 py-2 text-right min-w-[65px]">Neto</th>
                <th className="px-2 py-2 text-left min-w-[90px]">Destino</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r._id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-2 py-1 text-gray-400 text-center">{i + 1}</td>
                  <td className="px-1"><input type="date" value={r.fecha} onChange={e => set(r._id, "fecha", e.target.value)} className={inputCls} /></td>
                  <td className="px-1">
                    <select value={r.turno} onChange={e => set(r._id, "turno", e.target.value)} className={selCls}>
                      {TURNOS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="px-1"><input value={r.nro_bin} onChange={e => set(r._id, "nro_bin", e.target.value)} className={`${inputCls} font-bold`} placeholder="Ej: 123" /></td>
                  <td className="px-1"><input value={r.especie} onChange={e => set(r._id, "especie", e.target.value)} className={inputCls} /></td>
                  <td className="px-1">
                    <select value={r.propietario} onChange={e => set(r._id, "propietario", e.target.value)} className={selCls}>
                      <option value=""></option>
                      {propNombres.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-1">
                    <select value={r.variedad} onChange={e => set(r._id, "variedad", e.target.value)} className={selCls}>
                      <option value=""></option>
                      {varNombres.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-1">
                    <select value={r.tipo_cosecha} onChange={e => set(r._id, "tipo_cosecha", e.target.value)} className={selCls}>
                      <option value=""></option>
                      {tcoNombres.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-1">
                    <select value={r.cuadrilla} onChange={e => set(r._id, "cuadrilla", e.target.value)} className={selCls}>
                      <option value=""></option>
                      {cuadNombres.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-1">
                    <select value={r.procedencia} onChange={e => set(r._id, "procedencia", e.target.value)} className={selCls}>
                      <option value=""></option>
                      {procNombres.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-1">
                    <select value={r.tipo_bin} onChange={e => set(r._id, "tipo_bin", e.target.value)} className={selCls}>
                      <option value=""></option>
                      {binNombres.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-1"><input type="number" value={r.bruto} onChange={e => set(r._id, "bruto", e.target.value)} className={`${inputCls} text-right`} /></td>
                  <td className="px-1"><input type="number" value={r.tara} onChange={e => set(r._id, "tara", e.target.value)} className={`${inputCls} text-right bg-gray-50`} /></td>
                  <td className="px-1"><input type="number" value={r.neto} onChange={e => set(r._id, "neto", e.target.value)} className={`${inputCls} text-right font-semibold`} /></td>
                  <td className="px-1">
                    <select value={r.destino} onChange={e => set(r._id, "destino", e.target.value)} className={selCls}>
                      <option value=""></option>
                      {destNombres.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-1 text-center">
                    <button onClick={() => removeRow(r._id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRows} className="mt-2 flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:text-[#c0392b] hover:border-[#c0392b]">
            <Plus className="w-3.5 h-3.5" /> Agregar 5 filas
          </button>
        </div>

        <div className="px-4 py-3 border-t flex justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-5 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60"
          >
            {saving ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</> : <><Save className="w-3.5 h-3.5" /> Guardar BINs</>}
          </button>
        </div>
      </div>
    </div>
  );
}