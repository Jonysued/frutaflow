import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const TURNOS = ["Mañana", "Tarde", "Noche"];

export default function ProduccionForm({ item, onSave, onCancel }) {
  const [envases, setEnvases] = useState([]);
  const [configPalets, setConfigPalets] = useState([]);
  const [tiposPalet, setTiposPalet] = useState([]);

  const [form, setForm] = useState({
    fecha: item?.fecha || format(new Date(), "yyyy-MM-dd"),
    turno: item?.turno || "Mañana",
    productor: item?.productor || "",
    especie: item?.especie || "GRANADAS",
    variedad: item?.variedad || "",
    envase: item?.envase || "",
    calibre: item?.calibre || "",
    cant_bultos: item?.cant_bultos || "",
    tipo_palet: item?.tipo_palet || "",
    kg_bruto: item?.kg_bruto || "",
    tipo_caja: item?.tipo_caja || "",
    tara: item?.tara || "",
    kg_netos: item?.kg_netos || "",
    nro_romaneo: item?.nro_romaneo || "",
    contenedor: item?.contenedor || "",
    termografo_nro: item?.termografo_nro || "",
    nro_remito: item?.nro_remito || "",
    fecha_remito: item?.fecha_remito || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.TipoEnvase.filter({ categoria: "Produccion" }),
      base44.entities.TipoEnvase.filter({ categoria: "Ambos" }),
      base44.entities.ConfigBultosPalet.list(),
      base44.entities.TipoPalet.list(),
    ]).then(([prod, ambos, palets, tpalets]) => {
      setEnvases([...prod, ...ambos]);
      setConfigPalets(palets);
      setTiposPalet(tpalets);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Al elegir envase, autocompletar tipo_caja y buscar bultos/palet
  const handleEnvase = (nombre) => {
    setForm(f => {
      const envaseConfig = envases.find(e => e.nombre === nombre);
      const paletConfig = configPalets.find(p => p.tipo_envase === nombre && p.tipo_palet === f.tipo_palet);
      const cant_bultos = paletConfig ? paletConfig.cantidad_bultos : (envaseConfig?.bultos_por_palet || f.cant_bultos);
      const tara = paletConfig?.tara_palet_kg !== undefined ? -(paletConfig.tara_palet_kg + (cant_bultos * (envaseConfig?.tara_kg || 0))) : f.tara;
      const kg_netos = f.kg_bruto !== "" ? Number(f.kg_bruto) + Number(tara) : f.kg_netos;
      return { ...f, envase: nombre, tipo_caja: nombre, cant_bultos: cant_bultos || f.cant_bultos, tara, kg_netos };
    });
  };

  // Al elegir tipo de palet, recalcular bultos si hay envase seleccionado
  const handlePalet = (tipo_palet) => {
    setForm(f => {
      const paletConfig = configPalets.find(p => p.tipo_palet === tipo_palet && p.tipo_envase === f.envase);
      const envaseConfig = envases.find(e => e.nombre === f.envase);
      if (!paletConfig) return { ...f, tipo_palet };
      const cant_bultos = paletConfig.cantidad_bultos;
      const tara_total = paletConfig.tara_palet_kg !== undefined
        ? -(paletConfig.tara_palet_kg + (cant_bultos * (envaseConfig?.tara_kg || 0)))
        : f.tara;
      const kg_netos = f.kg_bruto !== "" ? Number(f.kg_bruto) + Number(tara_total) : f.kg_netos;
      return { ...f, tipo_palet, cant_bultos, tara: tara_total, kg_netos };
    });
  };

  const calcNetos = (bruto, tara) => {
    const n = Number(bruto) + Number(tara);
    if (!isNaN(n)) set("kg_netos", n);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      cant_bultos: Number(form.cant_bultos),
      kg_bruto: Number(form.kg_bruto),
      tara: Number(form.tara),
      kg_netos: Number(form.kg_netos),
    };
    if (item?.id) await base44.entities.Produccion.update(item.id, data);
    else await base44.entities.Produccion.create(data);
    setSaving(false);
    onSave();
  };

  const inputCls = "border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#276749]";
  const F = ({ label, children }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );

  // Palets: usar TipoPalet si hay datos, sino extraer de ConfigBultosPalet
  const paletOpciones = tiposPalet.length > 0
    ? tiposPalet.map(p => p.nombre)
    : [...new Set(configPalets.map(p => p.tipo_palet))];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#d5f0e1] p-4">
      <h2 className="font-semibold text-[#5c1020] mb-4 text-sm">{item ? "Editar registro" : "Nuevo registro de producción"}</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <F label="Fecha *"><input type="date" required value={form.fecha} onChange={e => set("fecha", e.target.value)} className={inputCls} /></F>
        <F label="Turno">
          <select value={form.turno} onChange={e => set("turno", e.target.value)} className={inputCls}>
            {TURNOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </F>
        <F label="Productor"><input value={form.productor} onChange={e => set("productor", e.target.value)} placeholder="Ej: F500" className={inputCls} /></F>
        <F label="Especie *"><input required value={form.especie} onChange={e => set("especie", e.target.value)} className={inputCls} /></F>
        <F label="Variedad *"><input required value={form.variedad} onChange={e => set("variedad", e.target.value)} placeholder="Ej: WONDERFUL" className={inputCls} /></F>

        {/* Envase desde configuración */}
        <F label="Envase">
          <select value={form.envase} onChange={e => handleEnvase(e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {envases.map(e => <option key={e.id} value={e.nombre}>{e.nombre} (tara: {e.tara_kg} kg)</option>)}
          </select>
        </F>

        <F label="Calibre"><input value={form.calibre} onChange={e => set("calibre", e.target.value)} placeholder="Ej: 12" className={inputCls} /></F>

        {/* Tipo de palet desde configuración */}
        <F label="Tipo de palet">
          {paletOpciones.length > 0 ? (
            <select value={form.tipo_palet} onChange={e => handlePalet(e.target.value)} className={inputCls}>
              <option value="">-- Seleccionar --</option>
              {paletOpciones.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          ) : (
            <input value={form.tipo_palet} onChange={e => set("tipo_palet", e.target.value)} placeholder="Ej: Comun" className={inputCls} />
          )}
        </F>

        <F label="Cant. de bultos *">
          <input type="number" required min="0" value={form.cant_bultos} onChange={e => set("cant_bultos", e.target.value)} className={`${inputCls} bg-gray-50`} />
        </F>

        <F label="Kg. Bruto *">
          <input type="number" required min="0" value={form.kg_bruto}
            onChange={e => { set("kg_bruto", e.target.value); calcNetos(e.target.value, form.tara); }}
            className={inputCls} />
        </F>

        <F label="Tipo de Caja"><input value={form.tipo_caja} onChange={e => set("tipo_caja", e.target.value)} placeholder="Ej: wenco" className={inputCls} /></F>

        <F label="Tara">
          <input type="number" value={form.tara}
            onChange={e => { set("tara", e.target.value); calcNetos(form.kg_bruto, e.target.value); }}
            className={`${inputCls} bg-gray-50`} />
        </F>
        <F label="Kg. Netos *">
          <input type="number" required value={form.kg_netos} onChange={e => set("kg_netos", e.target.value)} className={`${inputCls} bg-gray-50 font-semibold`} />
        </F>

        <F label="N° de Romaneo"><input value={form.nro_romaneo} onChange={e => set("nro_romaneo", e.target.value)} placeholder="Ej: W1" className={inputCls} /></F>
        <F label="Contenedor"><input value={form.contenedor} onChange={e => set("contenedor", e.target.value)} className={inputCls} /></F>
        <F label="Termógrafo N°"><input value={form.termografo_nro} onChange={e => set("termografo_nro", e.target.value)} className={inputCls} /></F>
        <F label="Nro. Remito"><input value={form.nro_remito} onChange={e => set("nro_remito", e.target.value)} className={inputCls} /></F>
        <F label="Fecha Remito"><input type="date" value={form.fecha_remito} onChange={e => set("fecha_remito", e.target.value)} className={inputCls} /></F>

        <div className="col-span-2 sm:col-span-3 md:col-span-4 flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[#276749] text-white rounded-lg text-xs font-semibold hover:bg-[#1e5038] disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}