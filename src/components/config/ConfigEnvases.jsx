import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Save } from "lucide-react";

const CATEGORIAS = ["Cosecha", "Produccion", "Ambos"];

function EnvaseRow({ item, onDelete, onUpdate }) {
  const [form, setForm] = useState({ nombre: item.nombre, categoria: item.categoria, tara_kg: item.tara_kg, bultos_por_palet: item.bultos_por_palet || "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.TipoEnvase.update(item.id, { ...form, tara_kg: Number(form.tara_kg), bultos_por_palet: form.bultos_por_palet !== "" ? Number(form.bultos_por_palet) : null });
    setSaving(false);
    onUpdate();
  };

  const inputCls = "border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b] w-full";

  return (
    <tr className="border-b">
      <td className="px-3 py-2"><input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} /></td>
      <td className="px-3 py-2">
        <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className={inputCls}>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
      </td>
      <td className="px-3 py-2 w-24"><input type="number" step="0.01" value={form.tara_kg} onChange={e => setForm(f => ({ ...f, tara_kg: e.target.value }))} className={inputCls} /></td>
      <td className="px-3 py-2 w-24"><input type="number" value={form.bultos_por_palet} onChange={e => setForm(f => ({ ...f, bultos_por_palet: e.target.value }))} className={inputCls} placeholder="-" /></td>
      <td className="px-3 py-2 flex gap-1 justify-end">
        <button onClick={save} disabled={saving} className="p-1.5 bg-[#c0392b] text-white rounded-lg hover:bg-[#a93226]"><Save className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg border"><Trash2 className="w-3.5 h-3.5" /></button>
      </td>
    </tr>
  );
}

export default function ConfigEnvases() {
  const [items, setItems] = useState([]);
  const [newRow, setNewRow] = useState({ nombre: "", categoria: "Produccion", tara_kg: "", bultos_por_palet: "" });
  const [adding, setAdding] = useState(false);

  const load = () => base44.entities.TipoEnvase.list().then(setItems);
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newRow.nombre || !newRow.tara_kg) return;
    setAdding(true);
    await base44.entities.TipoEnvase.create({ ...newRow, tara_kg: Number(newRow.tara_kg), bultos_por_palet: newRow.bultos_por_palet !== "" ? Number(newRow.bultos_por_palet) : null });
    setNewRow({ nombre: "", categoria: "Produccion", tara_kg: "", bultos_por_palet: "" });
    setAdding(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    await base44.entities.TipoEnvase.delete(id);
    load();
  };

  const inputCls = "border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b] w-full";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Tipos de Envases</h3>
        <p className="text-xs text-gray-500 mt-0.5">Configurá los envases de cosecha y producción con su tara y bultos por palet por defecto.</p>
      </div>
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Categoría</th>
              <th className="px-3 py-2 text-left">Tara (kg)</th>
              <th className="px-3 py-2 text-left">Bultos/Palet</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => <EnvaseRow key={item.id} item={item} onDelete={handleDelete} onUpdate={load} />)}
            <tr className="border-t bg-gray-50">
              <td className="px-3 py-2"><input value={newRow.nombre} onChange={e => setNewRow(f => ({ ...f, nombre: e.target.value }))} className={inputCls} placeholder="Ej: CAJA WENCO" /></td>
              <td className="px-3 py-2">
                <select value={newRow.categoria} onChange={e => setNewRow(f => ({ ...f, categoria: e.target.value }))} className={inputCls}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </td>
              <td className="px-3 py-2"><input type="number" step="0.01" value={newRow.tara_kg} onChange={e => setNewRow(f => ({ ...f, tara_kg: e.target.value }))} className={inputCls} placeholder="kg" /></td>
              <td className="px-3 py-2"><input type="number" value={newRow.bultos_por_palet} onChange={e => setNewRow(f => ({ ...f, bultos_por_palet: e.target.value }))} className={inputCls} placeholder="-" /></td>
              <td className="px-3 py-2">
                <button onClick={handleAdd} disabled={adding || !newRow.nombre || !newRow.tara_kg} className="flex items-center gap-1 px-3 py-1.5 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-50">
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