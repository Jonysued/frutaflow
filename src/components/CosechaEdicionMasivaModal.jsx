import { useEffect, useState, useRef } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { base44 } from "@/api/base44Client";
import { X, Save, Search } from "lucide-react";

registerAllModules();

export default function CosechaEdicionMasivaModal({ onClose, onSaved }) {
  const hotRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [procedencias, setProcedencias] = useState([]);
  const [filtros, setFiltros] = useState({ fecha: "", cuadrilla: "" });
  const [registros, setRegistros] = useState([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Cuadrilla.list(),
      base44.entities.Procedencia.list(),
    ]).then(([cuads, procs]) => {
      setCuadrillas(cuads);
      setProcedencias(procs);
    });
  }, []);

  const buscar = async () => {
    if (!filtros.fecha) return;
    setLoading(true);
    const filter = { fecha: filtros.fecha };
    if (filtros.cuadrilla) filter.cuadrilla = filtros.cuadrilla;
    const results = await base44.entities.Cosecha.filter(filter);
    // Solo los que no tienen procedencia
    const incompletos = results.filter(r => !r.procedencia);
    setRegistros(incompletos);
    setSearched(true);
    setLoading(false);
  };

  const handleSave = async () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;
    setSaving(true);
    const rows = hot.getData();
    const updates = registros.map((r, i) => ({
      id: r.id,
      procedencia: rows[i][0] || "",
    })).filter(u => u.procedencia);
    await Promise.all(updates.map(u => base44.entities.Cosecha.update(u.id, { procedencia: u.procedencia })));
    setSaving(false);
    onSaved();
  };

  const procNombres = procedencias.map(p => p.nombre);
  const cuadNombres = cuadrillas.map(c => c.nombre);

  const tableData = registros.map(r => [r.procedencia || ""]);

  const infoColumns = [
    { data: 0, title: "Procedencia", type: "dropdown", source: procNombres, width: 160 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0">
          <div>
            <h2 className="font-bold text-[#5c1020] text-base">Edición Masiva — Procedencia</h2>
            <p className="text-xs text-gray-400">Filtrá por fecha y cuadrilla para ver los BINs sin procedencia y completarla en masa.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-700" /></button>
        </div>

        {/* Filtros */}
        <div className="px-5 py-4 border-b flex flex-wrap gap-3 items-end flex-shrink-0">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Fecha *</label>
            <input
              type="date"
              value={filtros.fecha}
              onChange={e => setFiltros(f => ({ ...f, fecha: e.target.value }))}
              className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Cuadrilla (opcional)</label>
            <select
              value={filtros.cuadrilla}
              onChange={e => setFiltros(f => ({ ...f, cuadrilla: e.target.value }))}
              className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]"
            >
              <option value="">Todas</option>
              {cuadNombres.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={buscar}
            disabled={!filtros.fecha || loading}
            className="flex items-center gap-1 px-4 py-2 bg-[#5c1020] text-white rounded-lg text-xs font-semibold hover:bg-[#7a1a30] disabled:opacity-50"
          >
            {loading ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Buscar BINs sin procedencia
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!searched && (
            <div className="text-center text-gray-400 py-16 text-sm">
              Aplicá los filtros y presioná "Buscar" para ver los BINs sin procedencia.
            </div>
          )}
          {searched && registros.length === 0 && (
            <div className="text-center text-green-600 py-16 text-sm font-semibold">
              ✅ No hay BINs sin procedencia para los filtros seleccionados.
            </div>
          )}
          {searched && registros.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">{registros.length} BINs sin procedencia. Completá la columna "Procedencia" (podés copiar con Ctrl+D o arrastre).</p>
              {/* Info table (read-only) */}
              <div className="mb-3 overflow-x-auto border rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-[#5c1020] text-white">
                    <tr>
                      <th className="px-2 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left">BIN</th>
                      <th className="px-2 py-2 text-left">Fecha</th>
                      <th className="px-2 py-2 text-left">Turno</th>
                      <th className="px-2 py-2 text-left">Propietario</th>
                      <th className="px-2 py-2 text-left">Cuadrilla</th>
                      <th className="px-2 py-2 text-left">Variedad</th>
                      <th className="px-2 py-2 text-right">Neto (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((r, i) => (
                      <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                        <td className="px-2 py-1.5 font-mono font-bold text-[#5c1020]">{r.nro_bin}</td>
                        <td className="px-2 py-1.5">{r.fecha}</td>
                        <td className="px-2 py-1.5">{r.turno}</td>
                        <td className="px-2 py-1.5">{r.propietario}</td>
                        <td className="px-2 py-1.5">{r.cuadrilla}</td>
                        <td className="px-2 py-1.5">{r.variedad}</td>
                        <td className="px-2 py-1.5 text-right font-semibold">{r.neto?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Editable Handsontable */}
              <HotTable
                ref={hotRef}
                data={tableData}
                columns={infoColumns}
                colHeaders={["Procedencia"]}
                rowHeaders={true}
                width="100%"
                height="auto"
                stretchH="all"
                licenseKey="non-commercial-and-evaluation"
                contextMenu={true}
                fillHandle={true}
                copyPaste={true}
                manualColumnResize={true}
              />
            </div>
          )}
        </div>

        {searched && registros.length > 0 && (
          <div className="px-5 py-3 border-t flex justify-end gap-2 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-5 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60"
            >
              {saving ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</> : <><Save className="w-3.5 h-3.5" /> Guardar cambios</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}