import { useEffect, useState, useRef } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { base44 } from "@/api/base44Client";
import { X, Save } from "lucide-react";
import { format } from "date-fns";

registerAllModules();

const TURNOS = ["Mañana", "Tarde", "Noche"];
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
  tipo_bin: "",
  bruto: "",
  tara: "",
  neto: "",
  destino: "VUELCO",
});

const NUM_ROWS = 20;

export default function CosechaGridModal({ onClose, onSaved }) {
  const hotRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [configTaras, setConfigTaras] = useState([]);
  const [propietarios, setPropietarios] = useState([]);
  const [procedencias, setProcedencias] = useState([]);
  const [variedades, setVariedades] = useState([]);
  const [tiposCosecha, setTiposCosecha] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [data, setData] = useState(() => Array.from({ length: NUM_ROWS }, EMPTY_ROW));
  const [ready, setReady] = useState(false);

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
      setDestinos(dests);
      setReady(true);
    });
  }, []);

  const calcTara = (bruto, tipo_bin, tarasArr) => {
    if (tipo_bin) {
      const cfg = tarasArr.find(t => t.tipo_bin === tipo_bin);
      if (cfg) return cfg.tara_kg;
    }
    const b = Number(bruto);
    if (!b) return "";
    return b > 300 ? 55 : 30;
  };

  const handleAfterChange = (changes, source) => {
    if (!changes || source === "loadData") return;
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    changes.forEach(([row, prop, , newVal]) => {
      if (prop === "bruto" || prop === "tipo_bin") {
        const bruto = prop === "bruto" ? newVal : hot.getDataAtRowProp(row, "bruto");
        const tipo_bin = prop === "tipo_bin" ? newVal : hot.getDataAtRowProp(row, "tipo_bin");
        const tara = calcTara(bruto, tipo_bin, configTaras);
        hot.setDataAtRowProp(row, "tara", tara, "auto");
        const neto = Number(bruto) && tara !== "" ? Number(bruto) - Number(tara) : "";
        hot.setDataAtRowProp(row, "neto", neto !== "" ? neto : "", "auto");
      }
      if (prop === "tara") {
        const bruto = hot.getDataAtRowProp(row, "bruto");
        const neto = Number(bruto) && newVal !== "" ? Number(bruto) - Number(newVal) : "";
        hot.setDataAtRowProp(row, "neto", neto !== "" ? neto : "", "auto");
      }
    });
  };

  const handleSave = async () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;
    const rows = hot.getData();
    const cols = ["fecha","turno","nro_bin","especie","propietario","variedad","tipo_cosecha","cuadrilla","procedencia","tipo_bin","bruto","tara","neto","destino"];
    const records = rows
      .map(r => {
        const obj = {};
        cols.forEach((c, i) => { obj[c] = r[i]; });
        return obj;
      })
      .filter(r => r.nro_bin !== "" && r.nro_bin !== null);

    if (records.length === 0) { onClose(); return; }
    setSaving(true);
    const cleaned = records.map(r => ({
      ...r,
      bruto: r.bruto !== "" && r.bruto !== null ? Number(r.bruto) : 0,
      tara: r.tara !== "" && r.tara !== null ? Number(r.tara) : 0,
      neto: r.neto !== "" && r.neto !== null ? Number(r.neto) : 0,
    }));
    await base44.entities.Cosecha.bulkCreate(cleaned);
    setSaving(false);
    onSaved();
  };

  if (!ready) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 flex items-center gap-3">
        <div className="w-6 h-6 border-4 border-gray-200 border-t-[#c0392b] rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Cargando configuración...</span>
      </div>
    </div>
  );

  const propNombres = propietarios.map(p => p.nombre);
  const procNombres = procedencias.map(p => p.nombre);
  const varNombres = variedades.map(v => v.nombre);
  const tcoNombres = tiposCosecha.map(t => t.nombre);
  const cuadNombres = cuadrillas.map(c => c.nombre);
  const destNombres = destinos.map(d => d.nombre);
  const binNombres = configTaras.map(t => t.tipo_bin);

  const columns = [
    { data: "fecha", title: "Fecha", type: "date", dateFormat: "YYYY-MM-DD", width: 110 },
    { data: "turno", title: "Turno", type: "dropdown", source: TURNOS, width: 90 },
    { data: "nro_bin", title: "BIN", type: "text", width: 70 },
    { data: "especie", title: "Especie", type: "text", width: 90 },
    { data: "propietario", title: "Propietario", type: "dropdown", source: propNombres, width: 110 },
    { data: "variedad", title: "Variedad", type: "dropdown", source: varNombres, width: 110 },
    { data: "tipo_cosecha", title: "Tipo Cosecha", type: "dropdown", source: tcoNombres, width: 110 },
    { data: "cuadrilla", title: "Cuadrilla", type: "dropdown", source: cuadNombres, width: 100 },
    { data: "procedencia", title: "Procedencia", type: "dropdown", source: procNombres, width: 110 },
    { data: "tipo_bin", title: "Tipo BIN", type: "dropdown", source: binNombres, width: 100 },
    { data: "bruto", title: "Bruto (kg)", type: "numeric", width: 90 },
    { data: "tara", title: "Tara (kg)", type: "numeric", width: 80 },
    { data: "neto", title: "Neto (kg)", type: "numeric", width: 80 },
    { data: "destino", title: "Destino", type: "dropdown", source: destNombres, width: 100 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[98vw] flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0">
          <div>
            <h2 className="font-bold text-[#5c1020] text-base">Carga Masiva de BINs</h2>
            <p className="text-xs text-gray-400">Completá las filas. La tara se calcula automáticamente por bruto (≥300 → 55kg, &lt;300 → 30kg) o por Tipo BIN. Podés copiar celdas con Ctrl+D / arrastre.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-700" /></button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <HotTable
            ref={hotRef}
            data={data}
            columns={columns}
            colHeaders={columns.map(c => c.title)}
            rowHeaders={true}
            width="100%"
            height="auto"
            stretchH="all"
            licenseKey="non-commercial-and-evaluation"
            contextMenu={true}
            fillHandle={true}
            copyPaste={true}
            manualColumnResize={true}
            afterChange={handleAfterChange}
            columnSorting={false}
            wordWrap={false}
          />
        </div>

        <div className="px-5 py-3 border-t flex justify-end gap-2 flex-shrink-0">
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