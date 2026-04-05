import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Save } from "lucide-react";

/**
 * Componente genérico para listas simples (nombre + descripción opcional).
 * entityName: nombre de la entidad en base44
 * title: título de la sección
 * subtitle: descripción
 * placeholder: placeholder del input nombre
 */
export default function ConfigListaSimple({ entityName, title, subtitle, placeholder }) {
  const [items, setItems] = useState([]);
  const [newNombre, setNewNombre] = useState("");
  const [adding, setAdding] = useState(false);
  const [editMap, setEditMap] = useState({});

  const inputCls = "border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b] w-full";

  const load = () => base44.entities[entityName].list().then(data => {
    setItems(data);
    const map = {};
    data.forEach(d => { map[d.id] = d.nombre; });
    setEditMap(map);
  });

  useEffect(() => { load(); }, [entityName]);

  const handleAdd = async () => {
    if (!newNombre.trim()) return;
    setAdding(true);
    await base44.entities[entityName].create({ nombre: newNombre.trim() });
    setNewNombre("");
    setAdding(false);
    load();
  };

  const handleSave = async (id) => {
    await base44.entities[entityName].update(id, { nombre: editMap[id] });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    await base44.entities[entityName].delete(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="px-3 py-2">
                  <input
                    value={editMap[item.id] ?? item.nombre}
                    onChange={e => setEditMap(m => ({ ...m, [item.id]: e.target.value }))}
                    className={inputCls}
                  />
                </td>
                <td className="px-3 py-2 flex gap-1 justify-end">
                  <button onClick={() => handleSave(item.id)} className="p-1.5 bg-[#c0392b] text-white rounded-lg hover:bg-[#a93226]"><Save className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg border"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
            <tr className="border-t bg-gray-50">
              <td className="px-3 py-2">
                <input value={newNombre} onChange={e => setNewNombre(e.target.value)} className={inputCls} placeholder={placeholder || "Nuevo..."} onKeyDown={e => e.key === "Enter" && handleAdd()} />
              </td>
              <td className="px-3 py-2">
                <button onClick={handleAdd} disabled={adding || !newNombre.trim()} className="flex items-center gap-1 px-3 py-1.5 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-50">
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