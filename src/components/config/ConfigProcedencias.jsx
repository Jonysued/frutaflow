import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Save } from "lucide-react";
import MobileSelect from "@/components/MobileSelect";

export default function ConfigProcedencias() {
  const [items, setItems] = useState([]);
  const [propietarios, setPropietarios] = useState([]);
  const [newRow, setNewRow] = useState({ nombre: "", propietario: "", descripcion: "" });
  const [adding, setAdding] = useState(false);
  const [editMap, setEditMap] = useState({});

  const inputCls = "border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b] w-full";

  const load = async () => {
    const [procs, props] = await Promise.all([
      base44.entities.Procedencia.list(),
      base44.entities.Propietario.list(),
    ]);
    setItems(procs);
    setPropietarios(props);
    const map = {};
    procs.forEach(p => { map[p.id] = { nombre: p.nombre, propietario: p.propietario, descripcion: p.descripcion || "" }; });
    setEditMap(map);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newRow.nombre || !newRow.propietario) return;
    setAdding(true);
    await base44.entities.Procedencia.create(newRow);
    setNewRow({ nombre: "", propietario: "", descripcion: "" });
    setAdding(false);
    load();
  };

  const handleSave = async (id) => {
    await base44.entities.Procedencia.update(id, editMap[id]);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    await base44.entities.Procedencia.delete(id);
    load();
  };

  const setEdit = (id, k, v) => setEditMap(m => ({ ...m, [id]: { ...m[id], [k]: v } }));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Procedencias por Propietario</h3>
        <p className="text-xs text-gray-500 mt-0.5">Cada procedencia está asociada a un propietario. En cosecha, al elegir propietario se filtra la lista de procedencias.</p>
      </div>
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">Propietario</th>
              <th className="px-3 py-2 text-left">Procedencia</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="px-3 py-2 w-36">
                  <MobileSelect
                    label="Propietario"
                    value={editMap[item.id]?.propietario || ""}
                    onChange={v => setEdit(item.id, "propietario", v)}
                    options={propietarios.map(p => ({ value: p.nombre, label: p.nombre }))}
                    placeholder="--"
                  />
                </td>
                <td className="px-3 py-2">
                  <input value={editMap[item.id]?.nombre || ""} onChange={e => setEdit(item.id, "nombre", e.target.value)} className={inputCls} />
                </td>
                <td className="px-3 py-2">
                  <input value={editMap[item.id]?.descripcion || ""} onChange={e => setEdit(item.id, "descripcion", e.target.value)} className={inputCls} />
                </td>
                <td className="px-3 py-2 flex gap-1 justify-end">
                  <button onClick={() => handleSave(item.id)} className="p-1.5 bg-[#c0392b] text-white rounded-lg hover:bg-[#a93226]"><Save className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg border"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
            <tr className="border-t bg-gray-50">
              <td className="px-3 py-2">
                <MobileSelect
                  label="Propietario"
                  value={newRow.propietario}
                  onChange={v => setNewRow(f => ({ ...f, propietario: v }))}
                  options={propietarios.map(p => ({ value: p.nombre, label: p.nombre }))}
                  placeholder="-- Propietario --"
                />
              </td>
              <td className="px-3 py-2">
                <input value={newRow.nombre} onChange={e => setNewRow(f => ({ ...f, nombre: e.target.value }))} className={inputCls} placeholder="Ej: OP1SE" />
              </td>
              <td className="px-3 py-2">
                <input value={newRow.descripcion} onChange={e => setNewRow(f => ({ ...f, descripcion: e.target.value }))} className={inputCls} placeholder="Opcional" />
              </td>
              <td className="px-3 py-2">
                <button onClick={handleAdd} disabled={adding || !newRow.nombre || !newRow.propietario} className="flex items-center gap-1 px-3 py-1.5 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-50">
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