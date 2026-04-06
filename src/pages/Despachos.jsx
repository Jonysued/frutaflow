import { useState } from "react";
import { formatDate } from "@/utils/dateUtils";
import MobileSelect from "@/components/MobileSelect";
import DespachoDetalleModal from "@/components/DespachoDetalleModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Truck, X, CheckCircle, Package, ChevronDown, ChevronUp, Trash2, Pencil } from "lucide-react";

const ESTADO_COLORS = {
  Borrador: "bg-yellow-100 text-yellow-700",
  Despachado: "bg-green-100 text-green-700",
};

function NuevaCargaModal({ onClose, onCreated, producciones, assignedIds }) {
  const [form, setForm] = useState({ nro_carga: "", fecha: new Date().toISOString().slice(0,10), cliente: "", destino: "", cant_pallets_max: 21, contenedor: "", termografo: "", nro_remito: "" });
  const [selected, setSelected] = useState(new Set());
  const [filtro, setFiltro] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [sortDesc, setSortDesc] = useState(true);
  
  const handleStepChange = (newStep) => {
    setFiltro("");
    setStep(newStep);
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const max = form.cant_pallets_max;
  const count = selected.size;

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < max) next.add(id);
      return next;
    });
  };

  const matchFiltro = (p) => {
    if (!filtro) return true;
    const q = String(filtro).toLowerCase();
    const text = [
      String(p.nro_romaneo || ""),
      String(p.productor || ""),
      String(p.calibre || ""),
      String(p.variedad || ""),
      String(p.envase || ""),
      String(p.especie || "")
    ].join(" ").toLowerCase();
    return text.indexOf(q) !== -1;
  };

  const disponibles = producciones.filter(p => {
    if (assignedIds.has(p.id)) return false;
    return matchFiltro(p);
  }).sort((a, b) => {
    const parse = (s) => {
      const m = String(s || "").match(/^([A-Za-z]*)(\d*)(.*)$/);
      return [m[1].toUpperCase(), parseInt(m[2]) || 0, m[3]];
    };
    const [pa, na, sa] = parse(a.nro_romaneo);
    const [pb, nb, sb] = parse(b.nro_romaneo);
    const dir = sortDesc ? -1 : 1;
    if (pa !== pb) return pa < pb ? -dir : dir;
    if (na !== nb) return na < nb ? -dir : dir;
    if (sa !== sb) return sa < sb ? -dir : dir;
    return 0;
  });

  const handleSave = async () => {
    if (!form.nro_carga || !form.fecha) return;
    setSaving(true);
    const created = await base44.entities.Despacho.create({ ...form, pallet_ids: [...selected], estado: "Borrador" });
    setSelected(new Set());
    onCreated(created);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <div>
            <h2 className="font-semibold text-[#5c1020] text-sm">Nuevo Despacho</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${step === 1 ? "bg-[#c0392b] text-white" : "bg-gray-100 text-gray-500"}`}>1. Datos</span>
              <span className="text-gray-300 text-xs">→</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${step === 2 ? "bg-[#c0392b] text-white" : "bg-gray-100 text-gray-500"}`}>2. Pallets</span>
              <span className="text-gray-300 text-xs">→</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${step === 3 ? "bg-[#c0392b] text-white" : "bg-gray-100 text-gray-500"}`}>3. Envío</span>
            </div>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-gray-700" /></button>
        </div>

        {step === 1 ? (
          <div className="p-5 space-y-3 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Nro. de Carga *</label>
                <input value={form.nro_carga} onChange={e => set("nro_carga", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" placeholder="Ej: C-001" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Fecha *</label>
                <input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Capacidad de pallets *</label>
              <div className="flex gap-2">
                {[20, 21].map(n => (
                  <button key={n} onClick={() => set("cant_pallets_max", n)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${form.cant_pallets_max === n ? "bg-[#c0392b] text-white border-[#c0392b]" : "border-gray-200 text-gray-600 hover:border-[#c0392b]"}`}>
                    {n} pallets
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Cliente</label>
              <input value={form.cliente} onChange={e => set("cliente", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" placeholder="Nombre del cliente" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Destino</label>
              <input value={form.destino} onChange={e => set("destino", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" placeholder="País / puerto de destino" />
            </div>
          </div>
        ) : step === 2 ? (
          <>
            <div className="px-5 py-3 border-b flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Pallets seleccionados</span>
                <span className={`text-sm font-bold ${count === max ? "text-green-600" : "text-[#5c1020]"}`}>{count} / {max}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min((count / max) * 100, 100)}%`, backgroundColor: count === max ? "#276749" : "#c0392b" }} />
              </div>
            </div>
            <div className="px-5 py-3 border-b flex-shrink-0">
              <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Buscar por romaneo, productor, calibre, variedad..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left w-8"></th>
                    <th className="px-3 py-2 text-left cursor-pointer select-none" onClick={() => setSortDesc(d => !d)}>
                      Romaneo {sortDesc ? "↓" : "↑"}
                    </th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Productor</th>
                    <th className="px-3 py-2 text-left">Variedad</th>
                    <th className="px-3 py-2 text-left">Calibre</th>
                    <th className="px-3 py-2 text-right">Bultos</th>
                    <th className="px-3 py-2 text-right">Kg netos</th>
                  </tr>
                </thead>
                <tbody>
                  {disponibles.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No hay registros de producción disponibles</td></tr>
                  )}
                  {disponibles.map((p, i) => {
                    const sel = selected.has(p.id);
                    const disabled = !sel && count >= max;
                    return (
                      <tr key={p.id}
                        onClick={() => !disabled && toggle(p.id)}
                        className={`cursor-pointer transition-colors border-b ${sel ? "bg-green-50" : disabled ? "opacity-40 cursor-not-allowed" : i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-gray-100"}`}>
                        <td className="px-3 py-2.5">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${sel ? "bg-[#276749] border-[#276749]" : "border-gray-300"}`}>
                            {sel && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono font-semibold text-[#5c1020]">{p.nro_romaneo || "—"}</td>
                        <td className="px-3 py-2.5 text-gray-600">{formatDate(p.fecha)}</td>
                        <td className="px-3 py-2.5 text-gray-700">{p.productor}</td>
                        <td className="px-3 py-2.5 text-gray-700">{p.variedad}</td>
                        <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{p.calibre}</span></td>
                        <td className="px-3 py-2.5 text-right text-gray-700">{p.cant_bultos?.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-800">{p.kg_netos?.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-5 space-y-3 overflow-y-auto">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Contenedor</label>
              <input value={form.contenedor} onChange={e => set("contenedor", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" placeholder="Nro. de contenedor" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Termógrafo</label>
              <input value={form.termografo} onChange={e => set("termografo", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" placeholder="Nro. de termógrafo" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Número de Remito</label>
              <input value={form.nro_remito} onChange={e => set("nro_remito", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" placeholder="Nro. de remito" />
            </div>
          </div>
        )}

        <div className="px-5 py-4 border-t flex gap-2 justify-between flex-shrink-0">
          <button onClick={step === 1 ? onClose : () => handleStepChange(step - 1)} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">
            {step === 1 ? "Cancelar" : "← Volver"}
          </button>
          {step === 1 ? (
            <button onClick={() => handleStepChange(2)} disabled={!form.nro_carga || !form.fecha}
              className="px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60">
              Seleccionar pallets →
            </button>
          ) : step === 2 ? (
            <button onClick={() => handleStepChange(3)}
              className="px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226]">
              Datos de envío →
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-[#276749] text-white rounded-lg text-xs font-semibold hover:bg-[#1e5438] disabled:opacity-60 flex items-center gap-1">
              {saving ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Crear Carga ({count} pallets)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AsignarPalletModal({ despacho, producciones, onClose, onSaved, assignedIds }) {
  const asignados = despacho.pallet_ids || [];
  const [selected, setSelected] = useState(new Set(asignados));
  const [filtro, setFiltro] = useState("");
  const [saving, setSaving] = useState(false);

  const matchFiltroA = (p) => {
    if (!filtro) return true;
    const q = String(filtro).toLowerCase();
    const text = [
      String(p.nro_romaneo || ""),
      String(p.productor || ""),
      String(p.calibre || ""),
      String(p.variedad || ""),
      String(p.envase || ""),
      String(p.especie || "")
    ].join(" ").toLowerCase();
    return text.indexOf(q) !== -1;
  };

  const disponibles = producciones.filter(p => {
    if (assignedIds.has(p.id) && !asignados.includes(p.id)) return false;
    return matchFiltroA(p);
  });

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < despacho.cant_pallets_max) next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const updated = await base44.entities.Despacho.update(despacho.id, { pallet_ids: [...selected] });
    onSaved(updated);
  };

  const max = despacho.cant_pallets_max;
  const count = selected.size;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <div>
            <h2 className="font-semibold text-[#5c1020] text-sm">Asignar Pallets — Carga {despacho.nro_carga}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Seleccioná hasta {max} pallets</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-gray-700" /></button>
        </div>

        <div className="px-5 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Pallets seleccionados</span>
            <span className={`text-sm font-bold ${count === max ? "text-green-600" : count > max ? "text-red-600" : "text-[#5c1020]"}`}>{count} / {max}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min((count / max) * 100, 100)}%`, backgroundColor: count === max ? "#276749" : "#c0392b" }} />
          </div>
        </div>

        <div className="px-5 py-3 border-b flex-shrink-0">
          <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Buscar por romaneo, productor, calibre..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left w-8"></th>
                <th className="px-3 py-2 text-left">Romaneo</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Productor</th>
                <th className="px-3 py-2 text-left">Variedad</th>
                <th className="px-3 py-2 text-left">Calibre</th>
                <th className="px-3 py-2 text-right">Bultos</th>
                <th className="px-3 py-2 text-right">Kg netos</th>
              </tr>
            </thead>
            <tbody>
              {disponibles.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No hay registros de producción disponibles</td></tr>
              )}
              {disponibles.map((p, i) => {
                const sel = selected.has(p.id);
                const disabled = !sel && count >= max;
                return (
                  <tr key={p.id}
                    onClick={() => !disabled && toggle(p.id)}
                    className={`cursor-pointer transition-colors border-b ${sel ? "bg-green-50" : disabled ? "opacity-40 cursor-not-allowed" : i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-gray-100"}`}>
                    <td className="px-3 py-2.5">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${sel ? "bg-[#276749] border-[#276749]" : "border-gray-300"}`}>
                        {sel && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-[#5c1020]">{p.nro_romaneo || "—"}</td>
                    <td className="px-3 py-2.5 text-gray-600">{formatDate(p.fecha)}</td>
                    <td className="px-3 py-2.5 text-gray-700">{p.productor}</td>
                    <td className="px-3 py-2.5 text-gray-700">{p.variedad}</td>
                    <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{p.calibre}</span></td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{p.cant_bultos?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800">{p.kg_netos?.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t flex gap-2 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-[#276749] text-white rounded-lg text-xs font-semibold hover:bg-[#1e5438] disabled:opacity-60 flex items-center gap-1">
            {saving ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Guardar asignación
          </button>
        </div>
      </div>
    </div>
  );
}

function EditarDespachoModal({ despacho, onClose, onSaved }) {
  const [form, setForm] = useState({
    nro_carga: despacho.nro_carga || "",
    fecha: despacho.fecha || "",
    cliente: despacho.cliente || "",
    destino: despacho.destino || "",
    cant_pallets_max: despacho.cant_pallets_max || 21,
    contenedor: despacho.contenedor || "",
    termografo: despacho.termografo || "",
    nro_remito: despacho.nro_remito || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nro_carga || !form.fecha) return;
    setSaving(true);
    const updated = await base44.entities.Despacho.update(despacho.id, { ...despacho, ...form });
    onSaved(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <h2 className="font-semibold text-[#5c1020] text-sm">Editar Despacho — {despacho.nro_carga}</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-gray-700" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Nro. de Carga *</label>
              <input value={form.nro_carga} onChange={e => set("nro_carga", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Capacidad de pallets *</label>
            <div className="flex gap-2">
              {[20, 21].map(n => (
                <button key={n} onClick={() => set("cant_pallets_max", n)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${form.cant_pallets_max === n ? "bg-[#c0392b] text-white border-[#c0392b]" : "border-gray-200 text-gray-600 hover:border-[#c0392b]"}`}>
                  {n} pallets
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Cliente</label>
            <input value={form.cliente} onChange={e => set("cliente", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" placeholder="Nombre del cliente" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Destino</label>
            <input value={form.destino} onChange={e => set("destino", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" placeholder="País / puerto de destino" />
          </div>
          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos de envío</p>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Contenedor</label>
              <input value={form.contenedor} onChange={e => set("contenedor", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" placeholder="Nro. de contenedor" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Termógrafo</label>
              <input value={form.termografo} onChange={e => set("termografo", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" placeholder="Nro. de termógrafo" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Número de Remito</label>
              <input value={form.nro_remito} onChange={e => set("nro_remito", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" placeholder="Nro. de remito" />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t flex gap-2 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.nro_carga || !form.fecha}
            className="px-4 py-2 bg-[#276749] text-white rounded-lg text-xs font-semibold hover:bg-[#1e5438] disabled:opacity-60 flex items-center gap-1">
            {saving ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Despachos() {
  const queryClient = useQueryClient();
  const [showNueva, setShowNueva] = useState(false);
  const [asignando, setAsignando] = useState(null);
  const [editando, setEditando] = useState(null);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [detalleDespacho, setDetalleDespacho] = useState(null);

  const { data: cargas = [], isLoading: loadingCargas } = useQuery({
    queryKey: ["despachos"],
    queryFn: () => base44.entities.Despacho.list("fecha", 1000),
    staleTime: 0,
  });

  const { data: producciones = [], isLoading: loadingProd } = useQuery({
    queryKey: ["producciones"],
    queryFn: () => base44.entities.Produccion.list("-fecha", 100000),
    staleTime: 0,
  });

  const loading = loadingCargas || loadingProd;

  const handleCreated = (nueva) => {
    queryClient.setQueryData(["despachos"], old => [nueva, ...(old || [])]);
    setShowNueva(false);
    setFiltroCliente("");
  };

  const handleSaved = (updated) => {
    queryClient.setQueryData(["despachos"], old => (old || []).map(c => c.id === updated.id ? updated : c));
    setAsignando(null);
  };

  const handleEdited = (updated) => {
    queryClient.setQueryData(["despachos"], old => (old || []).map(c => c.id === updated.id ? updated : c));
    setEditando(null);
  };

  const handleDelete = async (carga) => {
    if (!confirm(`¿Eliminar el despacho ${carga.nro_carga}?`)) return;
    queryClient.setQueryData(["despachos"], old => (old || []).filter(c => c.id !== carga.id));
    await base44.entities.Despacho.delete(carga.id);
    queryClient.invalidateQueries({ queryKey: ["despachos"] });
  };

  const handleToggleEstado = async (carga) => {
    const nuevoEstado = carga.estado === "Despachado" ? "Borrador" : "Despachado";
    queryClient.setQueryData(["despachos"], old => (old || []).map(c => c.id === carga.id ? { ...c, estado: nuevoEstado } : c));
    await base44.entities.Despacho.update(carga.id, { estado: nuevoEstado });
  };

  const clientes = [...new Set(cargas.map(c => c.cliente).filter(Boolean))].sort();
  const cargasFiltradas = filtroCliente ? cargas.filter(c => c.cliente === filtroCliente) : cargas;

  const totalCargas = cargas.length;
  const despachadas = cargas.filter(c => c.estado === "Despachado").length;
  const asignadosIds = new Set(cargas.flatMap(c => c.pallet_ids || []));
  const totalPallets = asignadosIds.size;
  const palletsNoAsignados = producciones.filter(p => !asignadosIds.has(p.id)).length;

  // Despachos despachados separados por tipo (arilos vs fresco)
  const despachosDespachados = cargas.filter(c => c.estado === "Despachado");
  let contenedoresArilos = 0;
  let contenedoresFresco = 0;
  
  despachosDespachados.forEach(despacho => {
    const pallets = (despacho.pallet_ids || []).map(id => producciones.find(p => p.id === id)).filter(Boolean);
    const arilosCount = pallets.filter(p => !/^\d+$/.test(p.calibre || "")).length;
    const frescoCount = pallets.filter(p => /^\d+$/.test(p.calibre || "")).length;
    
    if (arilosCount > frescoCount) {
      contenedoresArilos++;
    } else if (frescoCount > arilosCount) {
      contenedoresFresco++;
    } else if (arilosCount > 0) {
      // Si son iguales pero hay ambos, contar como arilos
      contenedoresArilos++;
    }
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5c1020]">Despachos</h1>
          <p className="text-sm text-gray-500">Asignación de pallets a cargas de despacho</p>
        </div>
        <div className="flex items-center gap-2">
          <MobileSelect
            label="Cliente"
            value={filtroCliente}
            onChange={v => setFiltroCliente(v)}
            options={clientes.map(c => ({ value: c, label: c }))}
            placeholder="Todos los clientes"
          />

          <button onClick={() => setShowNueva(true)} className="flex items-center gap-1 px-4 py-2 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226]">
            <Plus className="w-3.5 h-3.5" /> Nuevo Despacho
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#c0392b] text-center">
          <p className="text-xs text-gray-400">Total Cargas</p>
          <p className="text-2xl font-bold text-gray-800">{totalCargas}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#276749] text-center">
          <p className="text-xs text-gray-400">Despachadas</p>
          <p className="text-2xl font-bold text-green-700">{despachadas}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#7a1a30] text-center">
          <p className="text-xs text-gray-400">Pallets asignados</p>
          <p className="text-2xl font-bold text-gray-800">{totalPallets}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#b7791f] text-center">
          <p className="text-xs text-gray-400">Pallets sin asignar</p>
          <p className="text-2xl font-bold text-[#b7791f]">{palletsNoAsignados}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500 text-center">
          <p className="text-xs text-gray-400">Contenedores Arilos</p>
          <p className="text-2xl font-bold text-purple-700">{contenedoresArilos}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-500 text-center">
          <p className="text-xs text-gray-400">Contenedores Fresco</p>
          <p className="text-2xl font-bold text-orange-700">{contenedoresFresco}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#f8d7da] border-t-[#c0392b] rounded-full animate-spin" />
        </div>
      ) : cargas.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <Truck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay cargas de despacho. Creá la primera con el botón "Nueva Carga".</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#5c1020] text-white">
                <tr>
                  <th className="px-3 py-3 text-left">Nro. Despacho</th>
                  <th className="px-3 py-3 text-left">Fecha</th>
                  <th className="px-3 py-3 text-left">Estado</th>
                  <th className="px-3 py-3 text-left">Cliente</th>
                  <th className="px-3 py-3 text-left">Destino</th>
                  <th className="px-3 py-3 text-left">Contenedor</th>
                  <th className="px-3 py-3 text-left">Nro. Remito</th>
                  <th className="px-3 py-3 text-left">Termógrafo</th>
                  <th className="px-3 py-3 text-center">Cap. Pallets</th>
                  <th className="px-3 py-3 text-right">Bultos</th>
                  <th className="px-3 py-3 text-right">Kg Netos</th>
                  <th className="px-3 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargasFiltradas.map((carga) => {
                   const numero = cargas.indexOf(carga) + 1;
                   const pallets = (carga.pallet_ids || []).map(id => producciones.find(p => p.id === id)).filter(Boolean);
                   const totalBultos = pallets.reduce((s, p) => s + (p.cant_bultos || 0), 0);
                   const totalKg = pallets.reduce((s, p) => s + (p.kg_netos || 0), 0);
                   const isOdd = numero % 2 === 0;
                   return (
                     <tr key={carga.id} className={isOdd ? "bg-[#fdf4f5]" : "bg-white"}>
                      <td className="px-3 py-2.5 font-bold text-gray-400">{numero}</td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{formatDate(carga.fecha)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${ESTADO_COLORS[carga.estado] || "bg-gray-100 text-gray-600"}`}>{carga.estado}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{carga.cliente || "—"}</td>
                      <td className="px-3 py-2.5 text-gray-700">{carga.destino || "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">{carga.contenedor || "—"}</td>
                      <td className="px-3 py-2.5 text-gray-600">{carga.nro_remito || "—"}</td>
                      <td className="px-3 py-2.5 text-gray-600">{carga.termografo || "—"}</td>
                      <td className="px-3 py-2.5 text-center text-gray-700">{carga.cant_pallets_max}</td>
                      <td className="px-3 py-2.5 text-right text-gray-700">{totalBultos.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-800">{totalKg.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap space-x-2">
                        <button onClick={() => setDetalleDespacho(carga)} className="text-gray-400 hover:text-blue-600" title="Ver detalle"><Package className="w-3.5 h-3.5 inline" /></button>
                        <button onClick={() => setEditando(carga)} className="text-gray-400 hover:text-[#c0392b]"><Pencil className="w-3.5 h-3.5 inline" /></button>
                        <button onClick={() => handleDelete(carga)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5 inline" /></button>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNueva && <NuevaCargaModal onClose={() => setShowNueva(false)} onCreated={handleCreated} producciones={producciones} assignedIds={asignadosIds} />}
      {editando && <EditarDespachoModal despacho={editando} onClose={() => setEditando(null)} onSaved={handleEdited} />}
      {detalleDespacho && <DespachoDetalleModal despacho={detalleDespacho} producciones={producciones} onClose={() => setDetalleDespacho(null)} onToggleEstado={(carga) => { handleToggleEstado(carga); setDetalleDespacho(null); }} />}
      {asignando && (
        <AsignarPalletModal
          despacho={asignando}
          producciones={producciones}
          onClose={() => setAsignando(null)}
          onSaved={handleSaved}
          assignedIds={asignadosIds}
        />
      )}
    </div>
  );
}