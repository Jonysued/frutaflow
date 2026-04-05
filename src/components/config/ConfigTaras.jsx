import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Save } from "lucide-react";

function TaraRow({ item, onDelete, onUpdate }) {
  const [form, setForm] = useState({ tipo_bin: item.tipo_bin, tara_kg: item.tara_kg, descripcion: item.descripcion || "" });
  const [saving, setSaving] = useState(false);
  const changed = form.tipo_bin !== item.tipo_bin || form.tara_kg !== item.tara_kg || form.descripcion !== (item.descripcion || "");

  const save = async () => {
    setSaving(true);
    await base44.entities.ConfigTara.update(item.id, { ...form, tara_kg: Number(form.tara_kg) });
    setSaving(false);
    onUpdate();
  };

  const inputCls = "border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b] w-full";

  return (
    <tr className="border-b">
      <td className="px-3 py-2"><input value={form.tipo_bin} onChange={e => setForm(f => ({ ...f, tipo_bin: e.target.value }))} className={inputCls} /></td>
      <td className="px-3 py-2 w-28"><input type="number" step="0.1" value={form.tara_kg} onChange={e => setForm(f => ({ ...f, tara_kg: e.target.value }))} className={inputCls} /></td>
      <td className="px-3 py-2"><input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={inputCls} /></td>
      <td className="px-3 py-2 flex gap-1 justify-end">
        {changed && <button onClick={save} disabled={saving} className="p-1.5 bg-[#c0392b] text-white rounded-lg hover:bg-[#a93226]"><Save className="w-3.5 h-3.5" /></button>}
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg border"><Trash2 className="w-3.5 h-3.5" /></button>
      </td>
    </tr>
  );
}

export default function ConfigTaras() {
  const [items, setItems] = useState([]);
  const [newRow, setNewRow] = useState({ tipo_bin: "", tara_kg: "", descripcion: "" });
  const [adding, setAdding] = useState(false);

  const load = () => base44.entities.ConfigTara.list().then(setItems);
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newRow.tipo_bin || !newRow.tara_kg) return;
    setAdding(true);
    await base44.entities.ConfigTara.create({ ...newRow, tara_kg: Number(newRow.tara_kg) });
    setNewRow({ tipo_bin: "", tara_kg: "", descripcion: "" });
    setAdding(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    await base44.entities.ConfigTara.delete(id);
    load();
  };

  const inputCls = "border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b] w-full";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Tara de BINs por tipo</h3>
        <p className="text-xs text-gray-500 mt-0.5">Se descontará automáticamente al registrar la cosecha según el tipo de BIN.</p>
      </div>
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">Tipo de BIN</th>
              <th className="px-3 py-2 text-left">Tara (kg)</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => <TaraRow key={item.id} item={item} onDelete={handleDelete} onUpdate={load} />)}
            <tr className="border-t bg-gray-50">
              <td className="px-3 py-2"><input value={newRow.tipo_bin} onChange={e => setNewRow(f => ({ ...f, tipo_bin: e.target.value }))} className={inputCls} placeholder="Nuevo tipo..." /></td>
              <td className="px-3 py-2"><input type="number" step="0.1" value={newRow.tara_kg} onChange={e => setNewRow(f => ({ ...f, tara_kg: e.target.value }))} className={inputCls} placeholder="kg" /></td>
              <td className="px-3 py-2"><input value={newRow.descripcion} onChange={e => setNewRow(f => ({ ...f, descripcion: e.target.value }))} className={inputCls} placeholder="Opcional" /></td>
              <td className="px-3 py-2">
                <button onClick={handleAdd} disabled={adding || !newRow.tipo_bin || !newRow.tara_kg} className="flex items-center gap-1 px-3 py-1.5 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-50">
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