import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";



export default function CosechaForm({ item, onSave, onCancel }) {
  const [configTaras, setConfigTaras] = useState([]);
  const [propietarios, setPropietarios] = useState([]);
  const [todasProcedencias, setTodasProcedencias] = useState([]);
  const [variedades, setVariedades] = useState([]);
  const [tiposCosecha, setTiposCosecha] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [tiposProceso, setTiposProceso] = useState([]);
  const [destinos, setDestinos] = useState([]);

  const [form, setForm] = useState({
    fecha: item?.fecha || format(new Date(), "yyyy-MM-dd"),
    turno: item?.turno || "Mañana",
    nro_bin: item?.nro_bin || "",
    especie: item?.especie || "GRANADAS",
    propietario: item?.propietario || "",
    tipo_cosecha: item?.tipo_cosecha || "",
    cuadrilla: item?.cuadrilla || "",
    procedencia: item?.procedencia || "",
    variedad: item?.variedad || "",
    bruto: item?.bruto || "",
    tara: item?.tara || "",
    neto: item?.neto || "",
    destino: item?.destino || "VUELCO",
    tipo_proceso: item?.tipo_proceso || "",
    fecha_vuelco: item?.fecha_vuelco || "",
    kgs_vuelco: item?.kgs_vuelco || "",
    stock_camara: item?.stock_camara || "",
    tipo_bin: item?.tipo_bin || "",
  });
  const [saving, setSaving] = useState(false);

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
      setTodasProcedencias(procs);
      setVariedades(vars);
      setTiposCosecha(tcos);
      setCuadrillas(cuads);
      setTiposProceso(tproc);
      setDestinos(dests);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Procedencias filtradas por propietario seleccionado
  const procedenciasFiltradas = form.propietario
    ? todasProcedencias.filter(p => p.propietario === form.propietario)
    : todasProcedencias;

  // Al cambiar propietario, resetear procedencia si no corresponde
  const handlePropietario = (propietario) => {
    setForm(f => {
      const procs = todasProcedencias.filter(p => p.propietario === propietario);
      const procedencia = procs.some(p => p.nombre === f.procedencia) ? f.procedencia : "";
      return { ...f, propietario, procedencia };
    });
  };

  const handleTipoBin = (tipo_bin) => {
    const config = configTaras.find(c => c.tipo_bin === tipo_bin);
    const tara = config ? config.tara_kg : "";
    setForm(f => {
      const neto = f.bruto !== "" && tara !== "" ? Number(f.bruto) - Number(tara) : f.neto;
      return { ...f, tipo_bin, tara, neto };
    });
  };

  const brutoTimer = useRef(null);
  const handleBruto = (bruto) => {
    setForm(f => ({ ...f, bruto }));
    if (brutoTimer.current) clearTimeout(brutoTimer.current);
    brutoTimer.current = setTimeout(() => {
      setForm(f => {
        const neto = bruto !== "" && f.tara !== "" ? Number(bruto) - Number(f.tara) : f.neto;
        return { ...f, neto };
      });
    }, 4000);
  };

  const handleTara = (tara) => {
    setForm(f => {
      const neto = f.bruto !== "" && tara !== "" ? Number(f.bruto) - Number(tara) : f.neto;
      return { ...f, tara, neto };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      nro_bin: Number(form.nro_bin),
      bruto: Number(form.bruto),
      tara: Number(form.tara),
      neto: Number(form.neto),
      kgs_vuelco: form.kgs_vuelco !== "" ? Number(form.kgs_vuelco) : null,
      stock_camara: form.stock_camara !== "" ? Number(form.stock_camara) : null,
    };
    if (item?.id) await base44.entities.Cosecha.update(item.id, data);
    else await base44.entities.Cosecha.create(data);
    setSaving(false);
    onSave();
  };

  const F = ({ label, children }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
  const inputCls = "border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#f8d7da] p-4">
      <h2 className="font-semibold text-[#5c1020] mb-4 text-sm">{item ? "Editar BIN" : "Registrar BIN de cosecha"}</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">

        <F label="Fecha *"><input type="date" required value={form.fecha} onChange={e => set("fecha", e.target.value)} className={inputCls} /></F>
        <F label="Turno">
          <select value={form.turno} onChange={e => set("turno", e.target.value)} className={inputCls}>
            {["Mañana", "Tarde", "Noche"].map(t => <option key={t}>{t}</option>)}
          </select>
        </F>
        <F label="Nro de BIN *"><input type="number" required value={form.nro_bin} onChange={e => set("nro_bin", e.target.value)} className={inputCls} /></F>
        <F label="Especie *"><input required value={form.especie} onChange={e => set("especie", e.target.value)} className={inputCls} /></F>

        <F label="Propietario">
          <select value={form.propietario} onChange={e => handlePropietario(e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {propietarios.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>
        </F>

        <F label="Procedencia">
          <select value={form.procedencia} onChange={e => set("procedencia", e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {procedenciasFiltradas.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>
        </F>

        <F label="Variedad *">
          <select required value={form.variedad} onChange={e => set("variedad", e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {variedades.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
          </select>
        </F>

        <F label="Tipo de Cosecha">
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

        <F label="Tipo de BIN (tara auto)">
          <select value={form.tipo_bin} onChange={e => handleTipoBin(e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {configTaras.map(c => <option key={c.id} value={c.tipo_bin}>{c.tipo_bin} — {c.tara_kg} kg</option>)}
          </select>
        </F>

        <F label="Bruto (kg) *">
          <input type="number" required min="0" value={form.bruto} onChange={e => handleBruto(e.target.value)} className={inputCls} />
        </F>
        <F label="Tara BIN (kg)">
          <input type="number" min="0" value={form.tara} onChange={e => handleTara(e.target.value)} className={`${inputCls} bg-gray-50`} />
        </F>
        <F label="Neto (kg) = Bruto − Tara">
          <input type="number" required value={form.neto} onChange={e => set("neto", e.target.value)} className={`${inputCls} bg-gray-50 font-semibold`} />
        </F>

        <F label="Destino">
          <select value={form.destino} onChange={e => set("destino", e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {destinos.map(d => <option key={d.id} value={d.nombre}>{d.nombre}</option>)}
          </select>
        </F>

        <F label="Tipo de proceso">
          <select value={form.tipo_proceso} onChange={e => set("tipo_proceso", e.target.value)} className={inputCls}>
            <option value="">-- Seleccionar --</option>
            {tiposProceso.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
          </select>
        </F>

        <F label="Fecha Vuelco"><input type="date" value={form.fecha_vuelco} onChange={e => set("fecha_vuelco", e.target.value)} className={inputCls} /></F>
        <F label="Kgs Vuelco"><input type="number" value={form.kgs_vuelco} onChange={e => set("kgs_vuelco", e.target.value)} className={inputCls} /></F>
        <F label="Stock en Cámara (kg)"><input type="number" value={form.stock_camara} onChange={e => set("stock_camara", e.target.value)} className={inputCls} /></F>

        <div className="col-span-2 sm:col-span-3 md:col-span-4 flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}