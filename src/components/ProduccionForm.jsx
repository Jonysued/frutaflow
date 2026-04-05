import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const TURNOS = ["Mañana", "Tarde", "Noche"];

function F({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}

export default function ProduccionForm({ item, onSave, onCancel }) {
  const [envases, setEnvases] = useState([]);
  const [configPalets, setConfigPalets] = useState([]);
  const [tiposPalet, setTiposPalet] = useState([]);
  const [variedades, setVariedades] = useState([]);
  const [calibres, setCalibre] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productores, setProductores] = useState([]);

  const [form, setForm] = useState({
    fecha: item?.fecha || format(new Date(), "yyyy-MM-dd"),
    turno: item?.turno || "Mañana",
    productor: item?.productor || "",
    especie: item?.especie || "GRANADAS",
    variedad: item?.variedad || "",
    categoria: item?.categoria || "",
    envase: item?.envase || "",
    calibre: item?.calibre || "",
    cant_bultos: item?.cant_bultos || "",
    tipo_palet: item?.tipo_palet || "",
    kg_bruto: item?.kg_bruto || "",
    tipo_caja: item?.tipo_caja || "",
    tara: item?.tara || "",
    kg_netos: item?.kg_netos || "",
    nro_romaneo: item?.nro_romaneo || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.TipoEnvase.filter({ categoria: "Produccion" }),
      base44.entities.TipoEnvase.filter({ categoria: "Ambos" }),
      base44.entities.ConfigBultosPalet.list(),
      base44.entities.TipoPalet.list(),
      base44.entities.Variedad.list(),
      base44.entities.Calibre.list(),
      base44.entities.Categoria.list(),
      base44.entities.Propietario.list(),
    ]).then(([prod, ambos, palets, tpalets, vars, cals, cats, props]) => {
      setEnvases([...prod, ...ambos]);
      setConfigPalets(palets);
      setTiposPalet(tpalets);
      setVariedades(vars);
      setCalibre(cals);
      setCategorias(cats);
      setProductores(props);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calcTara = (cant_bultos, envaseNombre, tipoPaletNombre, envasesArr, tiposPaletArr) => {
    const envaseConfig = envasesArr.find(e => e.nombre === envaseNombre);
    const paletConfig = tiposPaletArr.find(p => p.nombre === tipoPaletNombre);
    const taraCajas = Number(cant_bultos || 0) * (envaseConfig?.tara_kg || 0);
    const taraPalet = paletConfig?.tara_kg || 0;
    return taraCajas + taraPalet;
  };

  const handleEnvase = (nombre) => {
    setForm(f => {
      const paletBultosConfig = configPalets.find(p => p.tipo_envase === nombre && p.tipo_palet === f.tipo_palet);
      const envaseConfig = envases.find(e => e.nombre === nombre);
      const cant_bultos = paletBultosConfig?.cantidad_bultos || envaseConfig?.bultos_por_palet || f.cant_bultos;
      const tara = calcTara(cant_bultos, nombre, f.tipo_palet, envases, tiposPalet);
      const kg_netos = f.kg_bruto !== "" ? Number(f.kg_bruto) - tara : f.kg_netos;
      return { ...f, envase: nombre, tipo_caja: nombre, cant_bultos: cant_bultos || f.cant_bultos, tara, kg_netos };
    });
  };

  const handlePalet = (tipo_palet) => {
    setForm(f => {
      const paletBultosConfig = configPalets.find(p => p.tipo_palet === tipo_palet && p.tipo_envase === f.envase);
      const cant_bultos = paletBultosConfig?.cantidad_bultos || f.cant_bultos;
      const tara = calcTara(cant_bultos, f.envase, tipo_palet, envases, tiposPalet);
      const kg_netos = f.kg_bruto !== "" ? Number(f.kg_bruto) - tara : f.kg_netos;
      return { ...f, tipo_palet, cant_bultos, tara, kg_netos };
    });
  };

  const handleBultos = (cant_bultos) => {
    setForm(f => {
      const tara = calcTara(cant_bultos, f.envase, f.tipo_palet, envases, tiposPalet);
      const kg_netos = f.kg_bruto !== "" ? Number(f.kg_bruto) - tara : f.kg_netos;
      return { ...f, cant_bultos, tara, kg_netos };
    });
  };

  const brutoTimer = useRef(null);
  const handleBruto = (kg_bruto) => {
    setForm(f => ({ ...f, kg_bruto }));
    if (brutoTimer.current) clearTimeout(brutoTimer.current);
    brutoTimer.current = setTimeout(() => {
      setForm(f => {
        const kg_netos = f.tara !== "" ? Number(kg_bruto) - Number(f.tara) : f.kg_netos;
        return { ...f, kg_netos };
      });
    }, 4000);
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
        <F label="Productor">
          <select value={form.productor} onChange={e => set("productor", e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {productores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>
        </F>
        <F label="Especie *"><input required value={form.especie} onChange={e => set("especie", e.target.value)} className={inputCls} /></F>
        <F label="Variedad *">
          <select required value={form.variedad} onChange={e => set("variedad", e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {variedades.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
          </select>
        </F>
        <F label="Categoría">
          <select value={form.categoria} onChange={e => set("categoria", e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </F>
        <F label="Envase">
          <select value={form.envase} onChange={e => handleEnvase(e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {envases.map(e => <option key={e.id} value={e.nombre}>{e.nombre} ({e.tara_kg} kg/u)</option>)}
          </select>
        </F>
        <F label="Calibre">
          <select value={form.calibre} onChange={e => set("calibre", e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {calibres.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </F>
        <F label="Tipo de palet">
          <select value={form.tipo_palet} onChange={e => handlePalet(e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {paletOpciones.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </F>
        <F label="Cant. de bultos *">
          <input type="number" required min="0" value={form.cant_bultos} onChange={e => handleBultos(e.target.value)} className={inputCls} />
        </F>
        <F label="Kg. Bruto *">
          <input type="number" required min="0" value={form.kg_bruto} onChange={e => handleBruto(e.target.value)} className={inputCls} />
        </F>
        <F label="Tipo de Caja">
          <input value={form.tipo_caja} onChange={e => set("tipo_caja", e.target.value)} className={inputCls} />
        </F>
        <F label="Tara auto (kg)">
          <input type="number" value={form.tara} onChange={e => set("tara", e.target.value)} className={`${inputCls} bg-gray-50`} />
        </F>
        <F label="Kg. Netos *">
          <input type="number" required value={form.kg_netos} onChange={e => set("kg_netos", e.target.value)} className={`${inputCls} bg-gray-50 font-semibold`} />
        </F>
        <F label="N° de Romaneo"><input value={form.nro_romaneo} onChange={e => set("nro_romaneo", e.target.value)} className={inputCls} /></F>
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