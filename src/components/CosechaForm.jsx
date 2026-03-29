import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const TURNOS = ["Mañana", "Tarde", "Noche"];
const TIPOS_COSECHA = ["BARRIDO", "SELECTIVA", "REPASO", "OTRO"];
const DESTINOS = ["VUELCO", "CAMARA", "PROCESO", "OTRO"];
const TIPOS_PROCESO = ["ARILO", "GRANO", "JUGO", "FRESCO", "OTRO"];

export default function CosechaForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    fecha: item?.fecha || format(new Date(), "yyyy-MM-dd"),
    turno: item?.turno || "Mañana",
    nro_bin: item?.nro_bin || "",
    especie: item?.especie || "GRANADAS",
    propietario: item?.propietario || "",
    tipo_cosecha: item?.tipo_cosecha || "BARRIDO",
    cuadrilla: item?.cuadrilla || "",
    procedencia: item?.procedencia || "",
    variedad: item?.variedad || "",
    bruto: item?.bruto || "",
    tara: item?.tara || "",
    neto: item?.neto || "",
    destino: item?.destino || "VUELCO",
    tipo_proceso: item?.tipo_proceso || "ARILO",
    fecha_vuelco: item?.fecha_vuelco || "",
    kgs_vuelco: item?.kgs_vuelco || "",
    stock_camara: item?.stock_camara || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calcNeto = (bruto, tara) => {
    const n = Number(bruto) - Number(tara);
    if (!isNaN(n) && n >= 0) set("neto", n);
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

  const F = ({ label, children, span = 1 }) => (
    <div className={`flex flex-col gap-1 ${span === 2 ? "col-span-2" : ""}`}>
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
        <F label="Turno"><select value={form.turno} onChange={e => set("turno", e.target.value)} className={inputCls}>{TURNOS.map(t => <option key={t}>{t}</option>)}</select></F>
        <F label="Nro de BIN *"><input type="number" required value={form.nro_bin} onChange={e => set("nro_bin", e.target.value)} className={inputCls} /></F>
        <F label="Especie *"><input required value={form.especie} onChange={e => set("especie", e.target.value)} className={inputCls} /></F>
        <F label="Propietario"><input value={form.propietario} onChange={e => set("propietario", e.target.value)} className={inputCls} placeholder="Ej: F500" /></F>
        <F label="Tipo de Cosecha"><select value={form.tipo_cosecha} onChange={e => set("tipo_cosecha", e.target.value)} className={inputCls}>{TIPOS_COSECHA.map(t => <option key={t}>{t}</option>)}</select></F>
        <F label="Cuadrilla"><input value={form.cuadrilla} onChange={e => set("cuadrilla", e.target.value)} className={inputCls} placeholder="Ej: GARCIA" /></F>
        <F label="Procedencia"><input value={form.procedencia} onChange={e => set("procedencia", e.target.value)} className={inputCls} placeholder="Ej: OP1SE" /></F>
        <F label="Variedad *"><input required value={form.variedad} onChange={e => set("variedad", e.target.value)} className={inputCls} placeholder="Ej: WONDERFUL" /></F>
        <F label="Bruto (kg) *">
          <input type="number" required min="0" value={form.bruto} onChange={e => { set("bruto", e.target.value); calcNeto(e.target.value, form.tara); }} className={inputCls} />
        </F>
        <F label="Tara (kg) *">
          <input type="number" required min="0" value={form.tara} onChange={e => { set("tara", e.target.value); calcNeto(form.bruto, e.target.value); }} className={inputCls} />
        </F>
        <F label="Neto (kg) *"><input type="number" required value={form.neto} onChange={e => set("neto", e.target.value)} className={inputCls} /></F>
        <F label="Destino"><select value={form.destino} onChange={e => set("destino", e.target.value)} className={inputCls}>{DESTINOS.map(d => <option key={d}>{d}</option>)}</select></F>
        <F label="Tipo de proceso"><select value={form.tipo_proceso} onChange={e => set("tipo_proceso", e.target.value)} className={inputCls}>{TIPOS_PROCESO.map(t => <option key={t}>{t}</option>)}</select></F>
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