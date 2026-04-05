import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { QrCode, Scale, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import QrScanner from "@/components/QrScanner";

const TURNOS = ["Mañana", "Tarde", "Noche"];

function F({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}

// ─── MODO REGISTRAR ───────────────────────────────────────────────────────────
function RegistrarBIN() {
  const [scanning, setScanning] = useState(false);
  const [form, setForm] = useState({
    fecha: format(new Date(), "yyyy-MM-dd"),
    turno: "Mañana",
    nro_bin: "",
    especie: "GRANADAS",
    propietario: "",
    variedad: "",
    tipo_cosecha: "",
    cuadrilla: "",
    procedencia: "",
  });
  const [propietarios, setPropietarios] = useState([]);
  const [variedades, setVariedades] = useState([]);
  const [tiposCosecha, setTiposCosecha] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [procedencias, setProcedencias] = useState([]);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState(null); // { ok, msg }

  useEffect(() => {
    Promise.all([
      base44.entities.Propietario.list(),
      base44.entities.Variedad.list(),
      base44.entities.TipoCosecha.list(),
      base44.entities.Cuadrilla.list(),
      base44.entities.Procedencia.list(),
    ]).then(([props, vars, tcos, cuads, procs]) => {
      setPropietarios(props);
      setVariedades(vars);
      setTiposCosecha(tcos);
      setCuadrillas(cuads);
      setProcedencias(procs);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleScan = (text) => {
    setScanning(false);
    // Intentar parsear JSON del QR
    try {
      const data = JSON.parse(text);
      setForm(f => ({ ...f, ...data }));
    } catch {
      // Si no es JSON, asumir que es el nro_bin
      setForm(f => ({ ...f, nro_bin: text.trim() }));
    }
  };

  const handleGuardar = async () => {
    if (!form.nro_bin || !form.variedad) {
      setResultado({ ok: false, msg: "Completá Nro BIN y Variedad como mínimo." });
      return;
    }
    setSaving(true);
    setResultado(null);
    await base44.entities.Cosecha.create({
      ...form,
      bruto: 0,
      tara: 0,
      neto: 0,
      destino: "VUELCO",
    });
    setResultado({ ok: true, msg: `BIN ${form.nro_bin} registrado correctamente.` });
    setForm(f => ({ ...f, nro_bin: "" }));
    setSaving(false);
  };

  const inputCls = "border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]";
  const procsFiltradas = form.propietario
    ? procedencias.filter(p => p.propietario === form.propietario)
    : procedencias;

  return (
    <div className="space-y-5">
      {/* Escáner QR */}
      <div className="bg-white rounded-xl border border-[#f8d7da] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#5c1020]">Escanear QR del BIN</p>
          <button
            onClick={() => setScanning(s => !s)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              scanning ? "bg-gray-200 text-gray-700" : "bg-[#c0392b] text-white hover:bg-[#a93226]"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            {scanning ? "Cancelar" : "Activar cámara"}
          </button>
        </div>
        <QrScanner active={scanning} onScan={handleScan} />
        {!scanning && (
          <p className="text-xs text-gray-400 text-center">
            Activá la cámara para escanear el QR del BIN, o completá el número manualmente.
          </p>
        )}
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-[#f8d7da] p-4">
        <p className="text-sm font-semibold text-[#5c1020] mb-3">Datos del BIN</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <F label="Fecha *"><input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} className={inputCls} /></F>
          <F label="Turno">
            <select value={form.turno} onChange={e => set("turno", e.target.value)} className={inputCls}>
              {TURNOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </F>
          <F label="Nro de BIN *">
            <input value={form.nro_bin} onChange={e => set("nro_bin", e.target.value)} className={inputCls} placeholder="Ej: 123" />
          </F>
          <F label="Especie *">
            <input value={form.especie} onChange={e => set("especie", e.target.value)} className={inputCls} />
          </F>
          <F label="Propietario">
            <select value={form.propietario} onChange={e => { set("propietario", e.target.value); set("procedencia", ""); }} className={inputCls}>
              <option value="">-- Seleccionar --</option>
              {propietarios.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
            </select>
          </F>
          <F label="Procedencia">
            <select value={form.procedencia} onChange={e => set("procedencia", e.target.value)} className={inputCls}>
              <option value="">-- Seleccionar --</option>
              {procsFiltradas.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
            </select>
          </F>
          <F label="Variedad *">
            <select value={form.variedad} onChange={e => set("variedad", e.target.value)} className={inputCls}>
              <option value="">-- Seleccionar --</option>
              {variedades.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
            </select>
          </F>
          <F label="Tipo Cosecha">
            <select value={form.tipo_cosecha} onChange={e => set("tipo_cosecha", e.target.value)} className={inputCls}>
              <option value="">-- Seleccionar --</option>
              {tiposCosecha.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
            </select>
          </F>
          <F label="Cuadrilla">
            <select value={form.cuadrilla} onChange={e => set("cuadrilla", e.target.value)} className={inputCls}>
              <option value="">-- Seleccionar --</option>
              {cuadrillas.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </F>
        </div>

        {resultado && (
          <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${resultado.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {resultado.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {resultado.msg}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60"
          >
            {saving ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</> : "Registrar BIN"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODO PESAR ───────────────────────────────────────────────────────────────
function PesarBIN() {
  const [scanning, setScanning] = useState(false);
  const [binsEscaneados, setBinsEscaneados] = useState([]); // lista de ids de bins
  const [registros, setRegistros] = useState([]); // registros Cosecha encontrados
  const [configTaras, setConfigTaras] = useState([]);
  const [brutoTotal, setBrutoTotal] = useState("");
  const [tipoBin, setTipoBin] = useState("");
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    base44.entities.ConfigTara.list().then(setConfigTaras);
  }, []);

  const handleScan = async (text) => {
    const nro = text.trim();
    if (binsEscaneados.includes(nro)) return; // ya escaneado
    // Buscar el BIN en la BD
    const results = await base44.entities.Cosecha.filter({ nro_bin: nro });
    // Tomar el más reciente sin peso asignado
    const sinPeso = results.find(r => !r.bruto || r.bruto === 0);
    if (sinPeso) {
      setBinsEscaneados(prev => [...prev, nro]);
      setRegistros(prev => [...prev, sinPeso]);
    } else {
      setResultado({ ok: false, msg: `BIN ${nro} no encontrado o ya tiene peso asignado.` });
    }
  };

  const limpiar = () => {
    setBinsEscaneados([]);
    setRegistros([]);
    setBrutoTotal("");
    setTipoBin("");
    setResultado(null);
  };

  const handlePesar = async () => {
    if (!brutoTotal || registros.length === 0) {
      setResultado({ ok: false, msg: "Escaneá al menos un BIN e ingresá el peso bruto." });
      return;
    }
    setSaving(true);
    setResultado(null);
    const brutoNum = Number(brutoTotal);
    const brutoPorBin = brutoNum / registros.length;
    const cfg = configTaras.find(c => c.tipo_bin === tipoBin);
    const taraPorBin = cfg ? cfg.tara_kg : (brutoPorBin > 300 ? 55 : 30);

    await Promise.all(registros.map(r =>
      base44.entities.Cosecha.update(r.id, {
        bruto: Math.round(brutoPorBin * 100) / 100,
        tara: taraPorBin,
        neto: Math.round((brutoPorBin - taraPorBin) * 100) / 100,
        tipo_bin: tipoBin || r.tipo_bin,
      })
    ));
    setResultado({ ok: true, msg: `Peso asignado a ${registros.length} BIN(s) correctamente.` });
    limpiar();
    setSaving(false);
  };

  const inputCls = "border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]";
  const binNombres = configTaras.map(t => t.tipo_bin);

  return (
    <div className="space-y-5">
      {/* Escáner */}
      <div className="bg-white rounded-xl border border-[#f8d7da] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#5c1020]">Escanear BINs a pesar</p>
          <div className="flex gap-2">
            {registros.length > 0 && (
              <button onClick={limpiar} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs text-gray-500 hover:bg-gray-50">
                <RefreshCw className="w-3 h-3" /> Limpiar
              </button>
            )}
            <button
              onClick={() => setScanning(s => !s)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                scanning ? "bg-gray-200 text-gray-700" : "bg-[#c0392b] text-white hover:bg-[#a93226]"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              {scanning ? "Cancelar" : "Activar cámara"}
            </button>
          </div>
        </div>
        <QrScanner active={scanning} onScan={handleScan} />
      </div>

      {/* BINs escaneados */}
      {registros.length > 0 && (
        <div className="bg-white rounded-xl border border-[#f8d7da] p-4 space-y-3">
          <p className="text-sm font-semibold text-[#5c1020]">{registros.length} BIN(s) escaneados</p>
          <div className="flex flex-wrap gap-2">
            {registros.map(r => (
              <span key={r.id} className="bg-[#f8d7da] text-[#5c1020] px-3 py-1 rounded-full text-xs font-bold font-mono">
                {r.nro_bin}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Peso */}
      <div className="bg-white rounded-xl border border-[#f8d7da] p-4 space-y-3">
        <p className="text-sm font-semibold text-[#5c1020]">Asignar peso</p>
        <div className="grid grid-cols-2 gap-3">
          <F label="Tipo de BIN (tara auto)">
            <select value={tipoBin} onChange={e => setTipoBin(e.target.value)} className={inputCls}>
              <option value="">-- Seleccionar --</option>
              {binNombres.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </F>
          <F label="Bruto total (kg) *">
            <input type="number" min="0" value={brutoTotal} onChange={e => setBrutoTotal(e.target.value)} className={inputCls} placeholder="Ej: 530" />
          </F>
        </div>
        {registros.length > 1 && brutoTotal && (
          <p className="text-xs text-gray-500">
            ≈ <strong>{(Number(brutoTotal) / registros.length).toFixed(1)} kg</strong> bruto por BIN
          </p>
        )}

        {resultado && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${resultado.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {resultado.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {resultado.msg}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handlePesar}
            disabled={saving || registros.length === 0 || !brutoTotal}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60"
          >
            {saving ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</> : <><Scale className="w-3.5 h-3.5" /> Guardar pesos</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function Registro() {
  const [modo, setModo] = useState("registrar");

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#5c1020]">Registro</h1>
        <p className="text-sm text-gray-500">Registro individual de BINs mediante escaneo QR</p>
      </div>

      {/* Toggle */}
      <div className="flex rounded-xl overflow-hidden border border-[#c0392b] w-fit">
        <button
          onClick={() => setModo("registrar")}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-all ${
            modo === "registrar" ? "bg-[#c0392b] text-white" : "bg-white text-[#c0392b] hover:bg-[#f8d7da]"
          }`}
        >
          <QrCode className="w-4 h-4" /> Registrar BIN
        </button>
        <button
          onClick={() => setModo("pesar")}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-all ${
            modo === "pesar" ? "bg-[#c0392b] text-white" : "bg-white text-[#c0392b] hover:bg-[#f8d7da]"
          }`}
        >
          <Scale className="w-4 h-4" /> Pesar BIN
        </button>
      </div>

      {modo === "registrar" ? <RegistrarBIN /> : <PesarBIN />}
    </div>
  );
}