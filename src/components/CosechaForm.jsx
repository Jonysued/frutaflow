import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const TURNOS = ["Mañana", "Tarde", "Noche"];
const TIPOS_BULTO = ["Bin", "Caja", "Malla", "Bolsa", "Otro"];

export default function CosechaForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    fecha: item?.fecha || format(new Date(), "yyyy-MM-dd"),
    turno: item?.turno || "Mañana",
    variedad: item?.variedad || "",
    cuartel: item?.cuartel || "",
    cuadrilla: item?.cuadrilla || "",
    tipo_bulto: item?.tipo_bulto || "Bin",
    cantidad_bultos: item?.cantidad_bultos || "",
    kilos_totales: item?.kilos_totales || "",
    notas: item?.notas || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, cantidad_bultos: Number(form.cantidad_bultos), kilos_totales: Number(form.kilos_totales) };
    if (item?.id) await base44.entities.Cosecha.update(item.id, data);
    else await base44.entities.Cosecha.create(data);
    setSaving(false);
    onSave();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#f8d7da] p-4">
      <h2 className="font-semibold text-[#5c1020] mb-4 text-sm">{item ? "Editar registro" : "Nuevo registro de cosecha"}</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Fecha *</label>
          <input type="date" required value={form.fecha} onChange={e => set("fecha", e.target.value)} className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Turno *</label>
          <select required value={form.turno} onChange={e => set("turno", e.target.value)} className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]">
            {TURNOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Variedad *</label>
          <input required value={form.variedad} onChange={e => set("variedad", e.target.value)} placeholder="Ej: Granada, Manzana..." className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Cuartel *</label>
          <input required value={form.cuartel} onChange={e => set("cuartel", e.target.value)} placeholder="Ej: Cuartel 1" className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Cuadrilla</label>
          <input value={form.cuadrilla} onChange={e => set("cuadrilla", e.target.value)} placeholder="Ej: Cuadrilla A" className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Tipo bulto *</label>
          <select required value={form.tipo_bulto} onChange={e => set("tipo_bulto", e.target.value)} className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]">
            {TIPOS_BULTO.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Cantidad bultos *</label>
          <input type="number" required min="0" value={form.cantidad_bultos} onChange={e => set("cantidad_bultos", e.target.value)} className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Kilos totales *</label>
          <input type="number" required min="0" step="0.1" value={form.kilos_totales} onChange={e => set("kilos_totales", e.target.value)} className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
        </div>
        <div className="flex flex-col gap-1 col-span-2 sm:col-span-3 md:col-span-4">
          <label className="text-xs text-gray-500">Notas</label>
          <input value={form.notas} onChange={e => set("notas", e.target.value)} className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
        </div>
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