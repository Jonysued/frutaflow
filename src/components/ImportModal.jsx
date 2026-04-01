import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

const NUM_FIELDS = {
  Cosecha: ["bruto","tara","neto","kgs_vuelco","stock_camara"],
  Produccion: ["cant_bultos","kg_bruto","tara","kg_netos"],
};

// Required numeric fields — default to 0 if empty instead of deleting
const NUM_REQUIRED = {
  Cosecha: ["bruto","tara","neto"],
  Produccion: ["cant_bultos","kg_bruto","kg_netos"],
};

const XLSX_SCHEMAS = {
  Cosecha: { fecha:{type:"string"}, turno:{type:"string"}, nro_bin:{type:"number"}, especie:{type:"string"}, propietario:{type:"string"}, tipo_cosecha:{type:"string"}, cuadrilla:{type:"string"}, procedencia:{type:"string"}, variedad:{type:"string"}, bruto:{type:"number"}, tara:{type:"number"}, neto:{type:"number"}, destino:{type:"string"}, tipo_proceso:{type:"string"}, fecha_vuelco:{type:"string"}, kgs_vuelco:{type:"number"}, stock_camara:{type:"number"} },
  Produccion: { fecha:{type:"string"}, turno:{type:"string"}, productor:{type:"string"}, especie:{type:"string"}, variedad:{type:"string"}, categoria:{type:"string"}, envase:{type:"string"}, calibre:{type:"string"}, cant_bultos:{type:"number"}, tipo_palet:{type:"string"}, kg_bruto:{type:"number"}, tipo_caja:{type:"string"}, tara:{type:"number"}, kg_netos:{type:"number"}, nro_romaneo:{type:"string"} },
};

function parseCSV(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].replace(/^\uFEFF/, "").split(sep).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(sep);
    const row = {};
    headers.forEach((h, i) => { if (h) row[h] = vals[i]?.trim() ?? ""; });
    return row;
  }).filter(r => Object.values(r).some(v => v !== ""));
}

function toNum(val) {
  if (val === "" || val == null) return null;
  // Handle Spanish decimal comma: "1.234,56" → 1234.56
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
    Object.keys(row).forEach(k => { if (row[k] === "") delete row[k]; });
    return row;
  });
}

export default function ImportModal({ entity, onClose }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef();

  const handleFile = (e) => setFile(e.target.files[0]);

  const handleImport = async () => {
    if (!file) return;
    setStatus("loading");
    const isCSV = file.name.toLowerCase().endsWith(".csv");
    let records = [];

    if (isCSV) {
      const text = await file.text();
      records = parseCSV(text);
    } else {
      // Excel: use AI extraction
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: { type: "object", properties: { records: { type: "array", items: { type: "object", properties: XLSX_SCHEMAS[entity] } } } }
      });
      if (result.status !== "success") {
        setStatus("error");
        setMessage("No se pudo procesar el archivo Excel. Verificá el formato o usá un CSV.");
        return;
      }
      records = result.output?.records || (Array.isArray(result.output) ? result.output : []);
    }

    if (records.length === 0) {
      setStatus("error");
      setMessage("No se encontraron registros válidos. Verificá que el archivo tenga el formato correcto.");
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
            Subí un archivo <strong>.xlsx</strong> o <strong>.csv</strong> con los datos. Descargá la plantilla desde la página para ver el formato correcto.
          </p>
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#c0392b] transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">{file ? file.name : "Clic para seleccionar archivo"}</p>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
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
        <div className="px-5 py-4 border-t flex gap-2 justify-end">
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