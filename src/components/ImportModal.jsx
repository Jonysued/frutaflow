import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

export default function ImportModal({ entity, onClose }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [message, setMessage] = useState("");
  const inputRef = useRef();

  const handleFile = (e) => setFile(e.target.files[0]);

  const NUM_FIELDS = {
    Cosecha: ["nro_bin","bruto","tara","neto","kgs_vuelco","stock_camara"],
    Produccion: ["cant_bultos","kg_bruto","tara","kg_netos"],
  };

  const SCHEMAS = {
    Cosecha: { fecha: {type:"string"}, turno: {type:"string"}, nro_bin: {type:"number"}, especie: {type:"string"}, propietario: {type:"string"}, tipo_cosecha: {type:"string"}, cuadrilla: {type:"string"}, procedencia: {type:"string"}, variedad: {type:"string"}, bruto: {type:"number"}, tara: {type:"number"}, neto: {type:"number"}, destino: {type:"string"}, tipo_proceso: {type:"string"}, fecha_vuelco: {type:"string"}, kgs_vuelco: {type:"number"}, stock_camara: {type:"number"} },
    Produccion: { fecha: {type:"string"}, turno: {type:"string"}, productor: {type:"string"}, especie: {type:"string"}, variedad: {type:"string"}, categoria: {type:"string"}, envase: {type:"string"}, calibre: {type:"string"}, cant_bultos: {type:"number"}, tipo_palet: {type:"string"}, kg_bruto: {type:"number"}, tipo_caja: {type:"string"}, tara: {type:"number"}, kg_netos: {type:"number"}, nro_romaneo: {type:"string"} },
  };

  const handleImport = async () => {
    if (!file) return;
    setStatus("loading");
    const schemaProps = SCHEMAS[entity] || {};
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: { type: "object", properties: { records: { type: "array", items: { type: "object", properties: schemaProps } } } }
    });
    if (result.status !== "success") {
      setStatus("error");
      setMessage("No se pudo procesar el archivo. Verificá que el formato sea correcto.");
      return;
    }
    const records = result.output?.records || (Array.isArray(result.output) ? result.output : []);
    if (records.length === 0) {
      setStatus("error");
      setMessage("No se encontraron registros válidos en el archivo.");
      return;
    }
    const numFields = NUM_FIELDS[entity] || [];
    const cleaned = records.map(r => {
      const row = { ...r };
      numFields.forEach(f => {
        if (row[f] === "" || row[f] === null || row[f] === undefined) delete row[f];
        else row[f] = Number(row[f]);
      });
      // remove empty string fields that are not required
      Object.keys(row).forEach(k => { if (row[k] === "") delete row[k]; });
      return row;
    });
    await base44.entities[entity].bulkCreate(cleaned);
    setStatus("success");
    setMessage(`Se importaron ${records.length} registros correctamente.`);
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