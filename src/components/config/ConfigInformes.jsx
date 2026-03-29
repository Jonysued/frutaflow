import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, FileText } from "lucide-react";
import { format } from "date-fns";

export default function ConfigInformes() {
  const [form, setForm] = useState({ email: "", tipo: "diario", fecha_desde: format(new Date(), "yyyy-MM-dd"), fecha_hasta: format(new Date(), "yyyy-MM-dd") });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async () => {
    if (!form.email) return;
    setSending(true);
    setMsg(null);

    // Fetch data
    const [cosechas, producciones] = await Promise.all([
      base44.entities.Cosecha.list("-fecha", 500),
      base44.entities.Produccion.list("-fecha", 500)
    ]);

    const cosechasFiltradas = cosechas.filter(c => c.fecha >= form.fecha_desde && c.fecha <= form.fecha_hasta);
    const produccionesFiltradas = producciones.filter(p => p.fecha >= form.fecha_desde && p.fecha <= form.fecha_hasta);

    const totalCosecha = cosechasFiltradas.reduce((s, c) => s + (c.neto || 0), 0);
    const totalProd = produccionesFiltradas.reduce((s, p) => s + (p.kg_netos || 0), 0);
    const totalBultos = produccionesFiltradas.reduce((s, p) => s + (p.cant_bultos || 0), 0);
    const rendimiento = totalCosecha > 0 ? ((totalProd / totalCosecha) * 100).toFixed(1) : "—";

    const periodo = form.fecha_desde === form.fecha_hasta ? form.fecha_desde : `${form.fecha_desde} al ${form.fecha_hasta}`;

    // Build HTML email body
    const body = `
<h2 style="color:#5c1020">Informe FrutaPack — ${periodo}</h2>
<table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
  <tr style="background:#5c1020;color:white">
    <th style="padding:8px 12px;text-align:left">Métrica</th>
    <th style="padding:8px 12px;text-align:right">Valor</th>
  </tr>
  <tr style="background:#fdf4f5">
    <td style="padding:8px 12px">Cosecha (kg neto)</td>
    <td style="padding:8px 12px;text-align:right;font-weight:bold">${totalCosecha.toLocaleString()} kg</td>
  </tr>
  <tr>
    <td style="padding:8px 12px">Producción (kg netos)</td>
    <td style="padding:8px 12px;text-align:right;font-weight:bold">${totalProd.toLocaleString()} kg</td>
  </tr>
  <tr style="background:#fdf4f5">
    <td style="padding:8px 12px">Bultos producidos</td>
    <td style="padding:8px 12px;text-align:right;font-weight:bold">${totalBultos.toLocaleString()}</td>
  </tr>
  <tr>
    <td style="padding:8px 12px">Rendimiento</td>
    <td style="padding:8px 12px;text-align:right;font-weight:bold;color:#b7791f">${rendimiento}%</td>
  </tr>
</table>
<br/>
<h3 style="color:#5c1020">Detalle por Variedad</h3>
<table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px">
  <tr style="background:#5c1020;color:white">
    <th style="padding:6px 10px;text-align:left">Variedad</th>
    <th style="padding:6px 10px;text-align:right">Cosecha (kg)</th>
    <th style="padding:6px 10px;text-align:right">Producción (kg)</th>
  </tr>
  ${[...new Set(cosechasFiltradas.map(c => c.variedad))].map((v, i) => {
    const ck = cosechasFiltradas.filter(c => c.variedad === v).reduce((s, c) => s + (c.neto || 0), 0);
    const pk = produccionesFiltradas.filter(p => p.variedad === v).reduce((s, p) => s + (p.kg_netos || 0), 0);
    return `<tr style="background:${i % 2 === 0 ? "#fdf4f5" : "white"}"><td style="padding:6px 10px">${v}</td><td style="padding:6px 10px;text-align:right">${ck.toLocaleString()}</td><td style="padding:6px 10px;text-align:right">${pk.toLocaleString()}</td></tr>`;
  }).join("")}
</table>
<br/><p style="font-size:12px;color:#999">Generado por FrutaPack Manager</p>
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: form.email,
      subject: `Informe FrutaPack — ${periodo}`,
      body,
    });

    setSending(false);
    setMsg("Informe enviado correctamente a " + form.email);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Enviar informe por email</h3>
        <p className="text-xs text-gray-500 mt-0.5">Se enviará un resumen de cosecha, producción y rendimiento para el período seleccionado.</p>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4 max-w-lg">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Email destinatario *</label>
          <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="gerencia@empresa.com" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Fecha desde</label>
            <input type="date" value={form.fecha_desde} onChange={e => set("fecha_desde", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Fecha hasta</label>
            <input type="date" value={form.fecha_hasta} onChange={e => set("fecha_hasta", e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]" />
          </div>
        </div>

        {msg && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{msg}</p>}

        <button onClick={handleSend} disabled={sending || !form.email} className="flex items-center gap-2 px-4 py-2 bg-[#c0392b] text-white rounded-lg text-sm font-semibold hover:bg-[#a93226] disabled:opacity-50">
          {sending ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Enviando..." : "Enviar informe"}
        </button>
      </div>
    </div>
  );
}