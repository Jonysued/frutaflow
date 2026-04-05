import { useEffect, useState, useRef, useCallback } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { base44 } from "@/api/base44Client";
import { Save, X, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

registerAllModules();

const TURNOS = ["Mañana", "Tarde", "Noche"];
const DESTINOS_DEFAULT = ["VUELCO", "CAMARA", "PROCESO", "OTRO"];
const TIPOS_COSECHA_DEFAULT = ["BARRIDO", "SELECTIVA", "REPASO", "OTRO"];
const TIPOS_PROCESO_DEFAULT = ["ARILO", "GRANO", "JUGO", "FRESCO", "OTRO"];

function emptyRow(defaults = {}) {
  return {
    fecha: defaults.fecha || format(new Date(), "yyyy-MM-dd"),
    turno: defaults.turno || "Mañana",
    nro_bin: "",
    especie: defaults.especie || "GRANADAS",
    propietario: defaults.propietario || "",
    tipo_cosecha: defaults.tipo_cosecha || "",
    cuadrilla: defaults.cuadrilla || "",
    procedencia: defaults.procedencia || "",
    variedad: defaults.variedad || "",
    bruto: "",
    tipo_bin: "",
    tara: "",
    neto: "",
    destino: defaults.destino || "VUELCO",
    tipo_proceso: defaults.tipo_proceso || "",
  };
}

export default function CosechaBulkEntry({ onClose, onSaved }) {
  const hotRef = useRef(null);
  const [rows, setRows] = useState(() => Array.from({ length: 20 }, () => emptyRow()));
  const [configTaras, setConfigTaras] = useState([]);
  const [propietarios, setPropietarios] = useState([]);
  const [procedencias, setProcedencias] = useState([]);
  const [variedades, setVariedades] = useState([]);
  const [tiposCosecha, setTiposCosecha] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [tiposProceso, setTiposProceso] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveCount, setSaveCount] = useState(null);

  // Track which rows had tipo_bin manually set
  const manualTipoBin = useRef({});

  useEffect(() => {
    Promise.all([
      base44.entities.ConfigTara.list(),
      base44.entities.Propietario.list(),
      base44.entities.Procedencia.list(),
      base44.entities.Variedad.list(),
      base44.entities.TipoCosecha.list(),
      base44.entities.Cuadrilla.list(),
      base44.entities.TipoProceso.list(),
      base44.entities.Destino.list(),
    ]).then(([taras, props, procs, vars, tcos, cuads, tproc, dests]) => {
      setConfigTaras(taras);
      setPropietarios(props);
      setProcedencias(procs);
      setVariedades(vars);
      setTiposCosecha(tcos);
      setCuadrillas(cuads);
      setTiposProceso(tproc);
      setDestinos(dests);
    });
  }, []);

  const getTaraFromBruto = (bruto) => {
    const b = Number(bruto);
    if (isNaN(b) || b === 0) return "";
    return b > 300 ? 55 : 30;
  };

  const getTaraFromTipoBin = useCallback((tipoBin) => {
    const config = configTaras.find(c => c.tipo_bin === tipoBin);
    return config ? config.tara_kg : "";
  }, [configTaras]);

  const propietarioOpts = propietarios.map(p => p.nombre);
  const variedadOpts = variedades.map(v => v.nombre);
  const cuadrillaOpts = cuadrillas.map(c => c.nombre);
  const tipoCosechaOpts = tiposCosecha.length > 0 ? tiposCosecha.map(t => t.nombre) : TIPOS_COSECHA_DEFAULT;
  const tipoProcesoOpts = tiposProceso.length > 0 ? tiposProceso.map(t => t.nombre) : TIPOS_PROCESO_DEFAULT;
  const destinoOpts = destinos.length > 0 ? destinos.map(d => d.nombre) : DESTINOS_DEFAULT;
  const tipoBinOpts = configTaras.map(c => c.tipo_bin);

  // Build procedencia options per propietario (for context in afterChange)
  const getProcedenciaOpts = useCallback((propietario) => {
    if (!propietario) return procedencias.map(p => p.nombre);
    return procedencias.filter(p => p.propietario === propietario).map(p => p.nombre);
  }, [procedencias]);

  const allProcedencias = procedencias.map(p => p.nombre);

  const columns = [
    { data: "fecha", title: "Fecha", type: "date", dateFormat: "YYYY-MM-DD", correctFormat: true, width: 110 },
    { data: "turno", title: "Turno", type: "dropdown", source: TURNOS, width: 90 },
    { data: "nro_bin", title: "N° BIN", type: "text", width: 70 },
    { data: "especie", title: "Especie", type: "text", width: 90 },
    { data: "propietario", title: "Propietario", type: "dropdown", source: propietarioOpts, width: 110 },
    { data: "tipo_cosecha", title: "Tipo Cosecha", type: "dropdown", source: tipoCosechaOpts, width: 110 },
    { data: "cuadrilla", title: "Cuadrilla", type: "dropdown", source: cuadrillaOpts, width: 100 },
    { data: "procedencia", title: "Procedencia", type: "dropdown", source: allProcedencias, width: 110 },
    { data: "variedad", title: "Variedad", type: "dropdown", source: variedadOpts, width: 100 },
    { data: "bruto", title: "Bruto (kg)", type: "numeric", numericFormat: { pattern: "0,0" }, width: 90 },
    { data: "tipo_bin", title: "Tipo BIN", type: "dropdown", source: tipoBinOpts, width: 100 },
    { data: "tara", title: "Tara (kg)", type: "numeric", numericFormat: { pattern: "0,0" }, width: 80 },
    { data: "neto", title: "Neto (kg)", type: "numeric", numericFormat: { pattern: "0,0" }, width: 80, readOnly: false },
    { data: "destino", title: "Destino", type: "dropdown", source: destinoOpts, width: 90 },
    { data: "tipo_proceso", title: "Tipo Proceso", type: "dropdown", source: tipoProcesoOpts, width: 110 },
  ];

  const colHeaders = columns.map(c => c.title);

  const handleAfterChange = useCallback((changes, source) => {
    if (!changes || source === "loadData") return;

    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const updates = {};

    changes.forEach(([row, prop, oldVal, newVal]) => {
      if (prop === "tipo_bin" && newVal !== oldVal) {
        // Manual tipo_bin change → use that tara
        manualTipoBin.current[row] = !!newVal;
        if (newVal) {
          const tara = getTaraFromTipoBin(newVal);
          if (tara !== "") {
            if (!updates[row]) updates[row] = {};
            updates[row].tara = tara;
          }
        }
      }
      if (prop === "bruto" && newVal !== oldVal) {
        // Only auto-calc tara if tipo_bin not manually set for this row
        if (!manualTipoBin.current[row]) {
          const tara = getTaraFromBruto(newVal);
          if (tara !== "") {
            if (!updates[row]) updates[row] = {};
            updates[row].tara = tara;
          }
        }
      }
    });

    // Apply tara updates and recalculate neto
    if (Object.keys(updates).length > 0) {
      hot.batch(() => {
        Object.entries(updates).forEach(([rowIdx, vals]) => {
          const r = Number(rowIdx);
          if (vals.tara !== undefined) {
            hot.setDataAtRowProp(r, "tara", vals.tara, "tara_auto");
            // recalculate neto
            const bruto = Number(hot.getDataAtRowProp(r, "bruto") || 0);
            const tara = Number(vals.tara || 0);
            if (bruto > 0 && tara >= 0) {
              hot.setDataAtRowProp(r, "neto", bruto - tara, "neto_auto");
            }
          }
        });
      });
    }

    // If tara changed manually → recalc neto
    changes.forEach(([row, prop, oldVal, newVal]) => {
      if (prop === "tara" && source !== "tara_auto" && source !== "neto_auto") {
        const bruto = Number(hot.getDataAtRowProp(row, "bruto") || 0);
        const tara = Number(newVal || 0);
        if (bruto > 0) {
          hot.setDataAtRowProp(row, "neto", bruto - tara, "neto_auto");
        }
      }
    });
  }, [getTaraFromTipoBin]);

  const addRows = (n = 10) => {
    setRows(prev => [...prev, ...Array.from({ length: n }, () => emptyRow())]);
  };

  const clearEmpty = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;
    const data = hot.getData();
    const kept = data.filter(row => row.some(cell => cell !== null && cell !== "" && cell !== undefined));
    if (kept.length === 0) {
      setRows(Array.from({ length: 20 }, () => emptyRow()));
    } else {
      // rebuild rows from kept
      const newRows = kept.map(row => {
        const obj = {};
        columns.forEach((col, i) => { obj[col.data] = row[i]; });
        return obj;
      });
      setRows(newRows);
    }
  };

  const handleSave = async () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;
    const data = hot.getData();
    const records = [];
    data.forEach((row) => {
      const obj = {};
      columns.forEach((col, i) => { obj[col.data] = row[i]; });
      // Must have at least nro_bin and bruto
      if (!obj.nro_bin && !obj.bruto) return;
      const cleaned = {
        ...obj,
        bruto: Number(obj.bruto) || 0,
        tara: Number(obj.tara) || 0,
        neto: Number(obj.neto) || 0,
        kgs_vuelco: obj.kgs_vuelco ? Number(obj.kgs_vuelco) : undefined,
      };
      // Remove undefined/empty fields
      Object.keys(cleaned).forEach(k => {
        if (cleaned[k] === "" || cleaned[k] === null || cleaned[k] === undefined) delete cleaned[k];
      });
      records.push(cleaned);
    });

    if (records.length === 0) {
      alert("No hay registros válidos para guardar. Completá al menos el N° BIN y el Bruto.");
      return;
    }

    setSaving(true);
    await base44.entities.Cosecha.bulkCreate(records);
    setSaving(false);
    setSaveCount(records.length);
    setTimeout(() => {
      onSaved();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col">
      <div className="bg-[#5c1020] text-white px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-bold text-sm">Carga Masiva de Cosecha</h2>
          <p className="text-xs text-red-200 opacity-80">Copia y pega desde Excel • Ctrl+C / Ctrl+V • Arrastrá celdas para replicar valores</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => addRows(10)} className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs">
            <Plus className="w-3.5 h-3.5" /> +10 filas
          </button>
          <button onClick={clearEmpty} className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs">
            <Trash2 className="w-3.5 h-3.5" /> Limpiar vacías
          </button>
          {saveCount !== null ? (
            <span className="px-3 py-1.5 bg-green-500 rounded-lg text-xs font-bold">✓ {saveCount} guardados</span>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-4 py-1.5 bg-[#276749] hover:bg-[#1e5038] rounded-lg text-xs font-bold disabled:opacity-60"
            >
              {saving ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</> : <><Save className="w-3.5 h-3.5" /> Guardar todo</>}
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white">
        {propietarios.length > 0 && (
          <HotTable
            ref={hotRef}
            data={rows}
            columns={columns}
            colHeaders={colHeaders}
            rowHeaders={true}
            height="100%"
            width="100%"
            licenseKey="non-commercial-and-evaluation"
            contextMenu={true}
            fillHandle={true}
            copyPaste={true}
            allowInsertRow={true}
            allowRemoveRow={true}
            manualColumnResize={true}
            stretchH="all"
            afterChange={handleAfterChange}
            cells={(row, col) => {
              const cellProp = {};
              // Highlight neto column
              if (columns[col]?.data === "neto") {
                cellProp.className = "htBold htRight";
              }
              return cellProp;
            }}
            columnSorting={false}
          />
        )}
      </div>
    </div>
  );
}