import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { base44 } from "@/api/base44Client";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

const NUM_FIELDS = {
  Cosecha: ["bruto","tara","neto","kgs_vuelco","stock_camara"],
  Produccion: ["cant_bultos","kg_bruto","tara","kg_netos"],
};

const NUM_REQUIRED = {
  Cosecha: ["bruto","tara","neto"],
  Produccion: ["cant_bultos","kg_bruto","kg_netos"],
};

const TEMPLATE_COLS = {
  Cosecha: ["fecha","turno","nro_bin","especie","propietario","tipo_cosecha","cuadrilla","procedencia","variedad","bruto","tara","neto","destino","tipo_proceso","fecha_vuelco","kgs_vuelco","stock_camara"],
  Produccion: ["fecha","turno","productor","especie","variedad","categoria","envase","calibre","cant_bultos","tipo_palet","kg_bruto","tipo_caja","tara","kg_netos","nro_romaneo"],
};

function parseCSV(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].replace(/^\uFEFF/, "").split(sep).map(h => normalizeKey(h));
  return lines.slice(1).map(line => {
    const vals = line.split(sep);
    const row = {};
    headers.forEach((h, i) => { if (h) row[h] = vals[i]?.trim() ?? ""; });
    return row;
  }).filter(r => Object.values(r).some(v => v !== ""));
}

// Maps normalized header variants → canonical field name
const FIELD_ALIASES = {
  // Cosecha
  "fecha": "fecha",
  "turno": "turno",
  "nro_bin": "nro_bin", "bin": "nro_bin", "numero_bin": "nro_bin", "nro._bin": "nro_bin",
  "especie": "especie",
  "propietario": "propietario", "productor": "productor",
  "tipo_cosecha": "tipo_cosecha", "tipo": "tipo_cosecha",
  "cuadrilla": "cuadrilla",
  "procedencia": "procedencia",
  "variedad": "variedad",
  "bruto": "bruto", "kg_bruto": "kg_bruto", "bruto_(kg)": "bruto", "bruto_kg": "bruto",
  "tara": "tara", "tara_(kg)": "tara", "tara_kg": "tara",
  "neto": "neto", "neto_(kg)": "neto", "neto_kg": "neto",
  "destino": "destino",
  "tipo_proceso": "tipo_proceso",
  "fecha_vuelco": "fecha_vuelco",
  "kgs_vuelco": "kgs_vuelco", "kg_vuelco": "kgs_vuelco",
  "stock_camara": "stock_camara", "stock_en_camara_(kg)": "stock_camara",
  // Produccion
  "cant_bultos": "cant_bultos", "cant._de_bultos": "cant_bultos", "cantidad_bultos": "cant_bultos", "bultos": "cant_bultos",
  "tipo_palet": "tipo_palet",
  "tipo_caja": "tipo_caja",
  "kg_netos": "kg_netos", "kg._netos": "kg_netos", "kg_neto": "kg_netos",
  "nro_romaneo": "nro_romaneo", "n_de_romaneo": "nro_romaneo", "romaneo": "nro_romaneo",
  "contenedor": "contenedor",
  "termografo_nro": "termografo_nro", "termografo": "termografo_nro",
  "nro_remito": "nro_remito", "nro._remito": "nro_remito",
  "fecha_remito": "fecha_remito",
  "envase": "envase",
  "calibre": "calibre",
  "categoria": "categoria",
};

function normalizeKey(k) {
  const normalized = String(k).trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
  return FIELD_ALIASES[normalized] || normalized;
}

function formatDateVal(v) {
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return v;
}

function parseXLSX(buffer) {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  // raw:false → SheetJS formats everything as strings (dates become "YYYY-MM-DD" automatically)
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
  return rows
    .map(row => {
      const clean = {};
      Object.entries(row).forEach(([k, v]) => {
        const key = normalizeKey(k);
        // If SheetJS returns a Date object (cellDates:true), format it
        clean[key] = v instanceof Date ? formatDateVal(v) : String(v === null || v === undefined ? "" : v).trim();
      });
      return clean;
    })
    .filter(r => Object.values(r).some(v => v !== ""));
}

function toNum(val) {
  if (val === "" || val == null) return null;
  const s = String(val).trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return isNaN(n) ? null : n;
}

function cleanRecords(records, entity) {
  const numFields = NUM_FIELDS[entity] || [];
  const required = NUM_REQUIRED[entity] || [];
  return records.map(r => {
    const row = { ...r };
    numFields.forEach(f => {
      const n = toNum(row[f]);
      if (n === null) {
        if (required.includes(f)) row[f] = 0;
        else delete row[f];
      } else {
        row[f] = n;
      }
    });
    // Remove empty strings except required date fields
    const dateRequired = ["fecha"];
    Object.keys(row).forEach(k => {
      if (row[k] === "" && !dateRequired.includes(k)) delete row[k];
    });
    return row;
  });
}

export default function ImportModal({ entity, onClose }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef();

  const downloadTemplate = () => {
    const cols = TEMPLATE_COLS[entity];
    const sep = ";";
    const content = "\uFEFF" + cols.join(sep);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `plantilla_${entity.toLowerCase()}.csv`; a.click();
  };

  const handleImport = async () => {
    if (!file) return;
    setStatus("loading");
    setMessage("");

    const isCSV = file.name.toLowerCase().endsWith(".csv");
    let records = [];

    if (isCSV) {
      const text = await file.text();
      records = parseCSV(text);
    } else {
      const buffer = await file.arrayBuffer();
      records = parseXLSX(buffer);
    }

    if (records.length === 0) {
      setStatus("error");
      setMessage("No se encontraron registros válidos. Verificá el formato del archivo.");
      return;
    }

    const cleaned = cleanRecords(records, entity);
    await base44.entities[entity].bulkCreate(cleaned);
    setStatus("success");
    setMessage(`Se importaron ${cleaned.length} registros correctamente.`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-[#5c1020] text-sm">Importar {entity === "Cosecha" ? "Cosecha" : "Producción"} desde Excel / CSV</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-gray-700" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">
            Subí un archivo <strong>.xlsx</strong> o <strong>.csv</strong>.{" "}
            <button onClick={downloadTemplate} className="text-[#c0392b] underline">Descargar plantilla CSV</button>
          </p>
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#c0392b] transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">{file ? file.name : "Clic para seleccionar archivo"}</p>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={e => setFile(e.target.files[0])} className="hidden" />
          </div>

          {status === "success" && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-lg px-3 py-2 text-xs">
              <CheckCircle className="w-4 h-4" /> {message}
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-xs">
              <AlertCircle className="w-4 h-4" /> {message}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t flex gap-2 justify-end" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">
            {status === "success" ? "Cerrar" : "Cancelar"}
          </button>
          {status !== "success" && (
            <button
              onClick={handleImport}
              disabled={!file || status === "loading"}
              className="px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60 flex items-center gap-1"
            >
              {status === "loading" ? (
                <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando...</>
              ) : (
                <><Upload className="w-3 h-3" /> Importar</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}