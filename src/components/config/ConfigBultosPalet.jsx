import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Save } from "lucide-react";

function BultosRow({ item, onDelete, onUpdate }) {
  const [form, setForm] = useState({ tipo_palet: item.tipo_palet, tipo_envase: item.tipo_envase, cantidad_bultos: item.cantidad_bultos, tara_palet_kg: item.tara_palet_kg || "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.ConfigBultosPalet.update(item.id, { ...form, cantidad_bultos: Number(form.cantidad_bultos), tara_palet_kg: form.tara_palet_kg !== "" ? Number(form.tara_palet_kg) : null });
    setSaving(false);
    onUpdate();
  };

  const inputCls = "border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b] w-full";

  return (
    <tr className="border-b">
      <td className="px-3 py-2"><input value={form.tipo_palet} onChange={e => setForm(f => ({ ...f, tipo_palet: e.target.value }))} className={inputCls} /></td>
      <td className="px-3 py-2"><input value={form.tipo_envase} onChange={e => setForm(f => ({ ...f, tipo_envase: e.target.value }))} className={inputCls} /></td>
      <td className="px-3 py-2 w-28"><input type="number" value={form.cantidad_bultos} onChange={e => setForm(f => ({ ...f, cantidad_bultos: e.target.value }))} className={inputCls} /></td>
      <td className="px-3 py-2 w-28"><input type="number" step="0.1" value={form.tara_palet_kg} onChange={e => setForm(f => ({ ...f, tara_palet_kg: e.target.value }))} className={inputCls} placeholder="-" /></td>
      <td className="px-3 py-2 flex gap-1 justify-end">
        <button onClick={save} disabled={saving} className="p-1.5 bg-[#c0392b] text-white rounded-lg hover:bg-[#a93226]"><Save className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg border"><Trash2 className="w-3.5 h-3.5" /></button>
      </td>
    </tr>
  );
}

export default function ConfigBultosPaletSection() {
  const [items, setItems] = useState([]);
  const [newRow, setNewRow] = useState({ tipo_palet: "", tipo_envase: "", cantidad_bultos: "", tara_palet_kg: "" });
  const [adding, setAdding] = useState(false);

  const load = () => base44.entities.ConfigBultosPalet.list().then(setItems);
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newRow.tipo_palet || !newRow.tipo_envase || !newRow.cantidad_bultos) return;
    setAdding(true);
    await base44.entities.ConfigBultosPalet.create({ ...newRow, cantidad_bultos: Number(newRow.cantidad_bultos), tara_palet_kg: newRow.tara_palet_kg !== "" ? Number(newRow.tara_palet_kg) : null });
    setNewRow({ tipo_palet: "", tipo_envase: "", cantidad_bultos: "", tara_palet_kg: "" });
    setAdding(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    await base44.entities.ConfigBultosPalet.delete(id);
    load();
  };

  const inputCls = "border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b] w-full";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Bultos por Palet + Tara de Palet</h3>
        <p className="text-xs text-gray-500 mt-0.5">Define la cantidad de bultos según el tipo de palet y envase para el cálculo automático.</p>
      </div>
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">Tipo de palet</th>
              <th className="px-3 py-2 text-left">Tipo de envase</th>
              <th className="px-3 py-2 text-left">Bultos/palet</th>
              <th className="px-3 py-2 text-left">Tara palet (kg)</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => <BultosRow key={item.id} item={item} onDelete={handleDelete} onUpdate={load} />)}
            <tr className="border-t bg-gray-50">
              <td className="px-3 py-2"><input value={newRow.tipo_palet} onChange={e => setNewRow(f => ({ ...f, tipo_palet: e.target.value }))} className={inputCls} placeholder="Ej: Comun" /></td>
              <td className="px-3 py-2"><input value={newRow.tipo_envase} onChange={e => setNewRow(f => ({ ...f, tipo_envase: e.target.value }))} className={inputCls} placeholder="Ej: CAJA WENCO" /></td>
              <td className="px-3 py-2"><input type="number" value={newRow.cantidad_bultos} onChange={e => setNewRow(f => ({ ...f, cantidad_bultos: e.target.value }))} className={inputCls} placeholder="114" /></td>
              <td className="px-3 py-2"><input type="number" step="0.1" value={newRow.tara_palet_kg} onChange={e => setNewRow(f => ({ ...f, tara_palet_kg: e.target.value }))} className={inputCls} placeholder="kg" /></td>
              <td className="px-3 py-2">
                <button onClick={handleAdd} disabled={adding || !newRow.tipo_palet || !newRow.tipo_envase || !newRow.cantidad_bultos} className="flex items-center gap-1 px-3 py-1.5 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-50">
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