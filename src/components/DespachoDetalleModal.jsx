import { X, CheckCircle, Package, Download } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";
import { base44 } from "@/api/base44Client";

export default function DespachoDetalleModal({ despacho, producciones, onClose, onToggleEstado }) {
  const pallets = (despacho.pallet_ids || []).map(id => producciones.find(p => p.id === id)).filter(Boolean);
  const totalBultos = pallets.reduce((s, p) => s + (p.cant_bultos || 0), 0);
  const totalKg = pallets.reduce((s, p) => s + (p.kg_netos || 0), 0);

  const handleExportPDF = async () => {
    try {
      const response = await base44.functions.invoke('exportDespacho', {
        despacho: despacho
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Despacho_${despacho.nro_carga}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <div>
            <h2 className="font-semibold text-[#5c1020] text-sm">Detalles del Despacho</h2>
            <p className="text-xs text-gray-400 mt-0.5">Carga {despacho.nro_carga}</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-gray-700" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Info general */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Nro. Carga</p>
              <p className="font-bold text-gray-800">{despacho.nro_carga}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Fecha</p>
              <p className="font-bold text-gray-800">{formatDate(despacho.fecha)}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Estado</p>
              <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${despacho.estado === "Despachado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {despacho.estado}
              </span>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Cliente</p>
              <p className="font-bold text-gray-800">{despacho.cliente || "—"}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Destino</p>
              <p className="font-bold text-gray-800">{despacho.destino || "—"}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Contenedor</p>
              <p className="font-bold text-gray-800">{despacho.contenedor || "—"}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Termógrafo</p>
              <p className="font-bold text-gray-800">{despacho.termografo || "—"}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Nro. Remito</p>
              <p className="font-bold text-gray-800">{despacho.nro_remito || "—"}</p>
            </div>
          </div>

          {/* Pallets */}
          <div>
            <p className="font-semibold text-[#5c1020] mb-2 text-sm flex items-center gap-2">
              <Package className="w-4 h-4" /> Pallets ({pallets.length}/{despacho.cant_pallets_max})
            </p>
            {pallets.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No hay pallets asignados</p>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Romaneo</th>
                      <th className="px-3 py-2 text-left">Productor</th>
                      <th className="px-3 py-2 text-left">Variedad</th>
                      <th className="px-3 py-2 text-left">Calibre</th>
                      <th className="px-3 py-2 text-right">Bultos</th>
                      <th className="px-3 py-2 text-right">Kg netos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pallets.map((p, i) => (
                      <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-2 font-mono font-semibold text-[#5c1020]">{p.nro_romaneo || "—"}</td>
                        <td className="px-3 py-2 text-gray-700">{p.productor}</td>
                        <td className="px-3 py-2 text-gray-700">{p.variedad}</td>
                        <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-gray-100 rounded">{p.calibre}</span></td>
                        <td className="px-3 py-2 text-right text-gray-700">{p.cant_bultos?.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-800">{p.kg_netos?.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={4} className="px-3 py-2 text-gray-600">Totales</td>
                      <td className="px-3 py-2 text-right text-gray-800">{totalBultos.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-[#276749]">{totalKg.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t flex gap-2 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cerrar</button>
          <button onClick={handleExportPDF} className="px-4 py-2 border border-blue-400 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-50 flex items-center gap-1"><Download className="w-3 h-3" /> Exportar PDF</button>
          <button
            onClick={() => onToggleEstado(despacho)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              despacho.estado === "Despachado"
                ? "border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                : "bg-[#276749] text-white hover:bg-[#1e5438]"
            }`}
          >
            {despacho.estado === "Despachado" ? "↩ Volver a Borrador" : <><CheckCircle className="w-3 h-3" /> Despachar</>}
          </button>
        </div>
      </div>
    </div>
  );
}