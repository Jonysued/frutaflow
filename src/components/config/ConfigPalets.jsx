import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Save } from "lucide-react";

function PaletRow({ item, onDelete, onUpdate }) {
  const [form, setForm] = useState({ nombre: item.nombre, tara_kg: item.tara_kg || "", descripcion: item.descripcion || "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.TipoPalet.update(item.id, { ...form, tara_kg: form.tara_kg !== "" ? Number(form.tara_kg) : null });
    setSaving(false);
    onUpdate();
  };

  const inputCls = "border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b] w-full";

  return (
    <tr className="border-b">
      <td className="px-3 py-2"><input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} /></td>
      <td className="px-3 py-2 w-28"><input type="number" step="0.1" value={form.tara_kg} onChange={e => setForm(f => ({ ...f, tara_kg: e.target.value }))} className={inputCls} placeholder="-" /></td>
      <td className="px-3 py-2"><input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={inputCls} /></td>
      <td className="px-3 py-2 flex gap-1 justify-end">
        <button onClick={save} disabled={saving} className="p-1.5 bg-[#c0392b] text-white rounded-lg hover:bg-[#a93226]"><Save className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg border"><Trash2 className="w-3.5 h-3.5" /></button>
      </td>
    </tr>
  );
}

export default function ConfigPalets() {
  const [items, setItems] = useState([]);
  const [newRow, setNewRow] = useState({ nombre: "", tara_kg: "", descripcion: "" });
  const [adding, setAdding] = useState(false);

  const load = () => base44.entities.TipoPalet.list().then(setItems);
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newRow.nombre) return;
    setAdding(true);
    await base44.entities.TipoPalet.create({ ...newRow, tara_kg: newRow.tara_kg !== "" ? Number(newRow.tara_kg) : null });
    setNewRow({ nombre: "", tara_kg: "", descripcion: "" });
    setAdding(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    await base44.entities.TipoPalet.delete(id);
    load();
  };

  const inputCls = "border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b] w-full";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Tipos de Palet</h3>
        <p className="text-xs text-gray-500 mt-0.5">Definí los tipos de palet disponibles para seleccionar en producción.</p>
      </div>
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Tara (kg)</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => <PaletRow key={item.id} item={item} onDelete={handleDelete} onUpdate={load} />)}
            <tr className="border-t bg-gray-50">
              <td className="px-3 py-2"><input value={newRow.nombre} onChange={e => setNewRow(f => ({ ...f, nombre: e.target.value }))} className={inputCls} placeholder="Ej: Comun, Euro, CHEP" /></td>
              <td className="px-3 py-2"><input type="number" step="0.1" value={newRow.tara_kg} onChange={e => setNewRow(f => ({ ...f, tara_kg: e.target.value }))} className={inputCls} placeholder="kg" /></td>
              <td className="px-3 py-2"><input value={newRow.descripcion} onChange={e => setNewRow(f => ({ ...f, descripcion: e.target.value }))} className={inputCls} placeholder="Opcional" /></td>
              <td className="px-3 py-2">
                <button onClick={handleAdd} disabled={adding || !newRow.nombre} className="flex items-center gap-1 px-3 py-1.5 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-50">
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}