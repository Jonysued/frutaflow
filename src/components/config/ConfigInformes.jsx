import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send } from "lucide-react";

export default function ConfigInformes() {
  const [email, setEmail] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (fn) => fn;

  const handleSend = async () => {
    if (!email || !fechaDesde || !fechaHasta) {
      setMsg({ ok: false, text: "Completá todos los campos." });
      return;
    }
    setSending(true);
    setMsg(null);

    const [cosechas, producciones] = await Promise.all([
      base44.entities.Cosecha.list("-fecha", 50000),
      base44.entities.Produccion.list("-fecha", 50000),
    ]);

    const c = cosechas.filter(x => x.fecha >= fechaDesde && x.fecha <= fechaHasta);
    const p = producciones.filter(x => x.fecha >= fechaDesde && x.fecha <= fechaHasta);

    const totalCosecha = c.reduce((s, x) => s + (x.neto || 0), 0);
    const totalProd = p.reduce((s, x) => s + (x.kg_netos || 0), 0);
    const totalBultos = p.reduce((s, x) => s + (x.cant_bultos || 0), 0);
    const rendimiento = totalCosecha > 0 ? ((totalProd / totalCosecha) * 100).toFixed(1) : "—";

    const body = `
      <h2>Informe FrutaPack</h2>
      <p>Período: <strong>${fechaDesde}</strong> al <strong>${fechaHasta}</strong></p>
      <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:14px;">
        <tr><th>Cosecha (kg neto)</th><th>Producción (kg neto)</th><th>Bultos</th><th>Rendimiento</th></tr>
        <tr>
          <td>${totalCosecha.toLocaleString()}</td>
          <td>${totalProd.toLocaleString()}</td>
          <td>${totalBultos.toLocaleString()}</td>
          <td>${rendimiento}%</td>
        </tr>
      </table>
      <p style="color:#666;font-size:12px;margin-top:16px;">Generado automáticamente por FrutaPack</p>
    `;

    await base44.integrations.Core.SendEmail({
      to: email,
      subject: `Informe FrutaPack — ${fechaDesde} al ${fechaHasta}`,
      body,
    });

    setSending(false);
    setMsg({ ok: true, text: `Informe enviado a ${email}` });
  };

  const inputCls = "border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c0392b]";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Enviar Informe por Email</h3>
        <p className="text-xs text-gray-500 mt-0.5">Generá y enviá un resumen del período seleccionado.</p>
      </div>

      <div className="space-y-3 max-w-md">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Email destinatario</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className={inputCls} />
          </div>
        </div>

        {msg && <p className={`text-xs ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}

        <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 px-5 py-2.5 bg-[#c0392b] text-white rounded-lg text-xs font-semibold hover:bg-[#a93226] disabled:opacity-60">
          {sending ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</> : <><Send className="w-3.5 h-3.5" /> Enviar informe</>}
        </button>
      </div>
    </div>
  );
}